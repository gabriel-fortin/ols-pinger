import { mutation, query, type MutationCtx } from "./_generated/server"
import type { Id, DataModel } from "./_generated/dataModel"
import { v } from "convex/values"


type BucketStatus = "success" | "failure" | "mix" | "empty"

/** Classify a single ping's HTTP status as success (2xx) or failure. */
function pingOutcome(status: number): "success" | "failure" {
  return status >= 200 && status < 300 ? "success" : "failure"
}

/** Fold a ping into a bucket's running status. */
function nextBucketStatus(current: BucketStatus, ping: PingType): BucketStatus {
  const outcome = pingOutcome(ping.status)
  if (current === "empty") return outcome
  if (current === outcome) return current
  return "mix"
}


const TIME_SLICES_SECONDS = [5 * 60, 20 * 60, 60 * 60, 24 * 60 * 60]

function secondsToLabel(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${seconds / 60}m`
  if (seconds < 86400) return `${seconds / 3600}h`
  return `${seconds / 86400}d`
}

/** Create aggregations sets for a newly created URL */
export async function createAggregationSets(ctx: MutationCtx, urlId: Id<"urls">) {
  for (const timeSliceSeconds of TIME_SLICES_SECONDS) {
    await ctx.db.insert("aggregationSet", {
      label: secondsToLabel(timeSliceSeconds),
      timeSliceSeconds,
      urlId,
    })
  }
}

export const createAggregationsSetsForUrl = mutation({
  args: { urlId: v.id("urls") },
  handler: async (ctx, { urlId }) => {
    await createAggregationSets(ctx, urlId)
  }
})

// TODO: probably this type should be shared with functions in 'pings.ts'
type PingType = {
  id: Id<"pings">
  urlId: Id<"urls">
  timestamp: number
  status: number
  durationMs: number
}

export async function addPingToAggregates(ctx: MutationCtx, ping: PingType) {
  const sets = await ctx.db
    .query("aggregationSet")
    .withIndex("by_urlId", (q) => q.eq("urlId", ping.urlId))
    .collect()

  for (const aggSet of sets) {
    await addPingToAggregate(ctx, ping, aggSet)
  }
}

export async function addPingToAggregate(ctx: MutationCtx, ping: PingType,
  aggSet: DataModel["aggregationSet"]["document"]) {

  const sliceMs = aggSet.timeSliceSeconds * 1000
  const sliceStart = Math.floor(ping.timestamp / sliceMs) * sliceMs

  const bucket = await ctx.db
    .query("aggregationBuckets")
    .withIndex("by_set_and_sliceStart",
      (q) => q.eq("set", aggSet._id).eq("sliceStart", sliceStart),
    )
    .unique()

  if (bucket) {
    await ctx.db.patch("aggregationBuckets", bucket._id, {
      pingDurationMsMin: Math.min(bucket.pingDurationMsMin, ping.durationMs),
      pingDurationMsMax: Math.max(bucket.pingDurationMsMax, ping.durationMs),
      pingDurationMsSum: bucket.pingDurationMsSum + ping.durationMs,
      pingCount: bucket.pingCount + 1,
      status: nextBucketStatus(bucket.status, ping),
    })
  } else {
    await ctx.db.insert("aggregationBuckets", {
      set: aggSet._id,
      sliceStart,
      pingDurationMsMin: ping.durationMs,
      pingDurationMsMax: ping.durationMs,
      pingDurationMsSum: ping.durationMs,
      pingCount: 1,
      status: nextBucketStatus("empty", ping),
    })
  }
}

export const reAggregatePings = mutation({
  args: { urlId: v.id("urls") },
  handler: async (ctx, { urlId }) => {
    // Get all pings for this URL
    const allPings = await ctx.db
      .query("pings")
      .withIndex("by_urlId", (q) => q.eq("urlId", urlId))
      .collect()

    // Get all aggregation sets for this URL
    const sets = await ctx.db
      .query("aggregationSet")
      .withIndex("by_urlId", (q) => q.eq("urlId", urlId))
      .collect()

    // Find the minimum timestamp to determine which buckets can be rebuilt
    const minTimestamp = allPings.length > 0
      ? Math.min(...allPings.map(p => p.timestamp))
      : Infinity

    // Delete buckets that can be rebuilt (those >= earliest bucket for min timestamp)
    for (const aggSet of sets) {
      const sliceMs = aggSet.timeSliceSeconds * 1000
      const firstDeletableBucketStart = Math.ceil(minTimestamp / sliceMs) * sliceMs

      const buckets = await ctx.db
        .query("aggregationBuckets")
        .withIndex("by_set_and_sliceStart", (q) => q
          .eq("set", aggSet._id)
          // Keep older buckets (they represent deleted pings)
          .gte("sliceStart", firstDeletableBucketStart))
        .collect()

      for (const bucket of buckets) {
        await ctx.db.delete(bucket._id)
      }

      // Re-aggregate all pings
      for (const ping of allPings) {
        // but ignore pings for a bucket that we keep
        if (ping.timestamp < firstDeletableBucketStart) continue

        await addPingToAggregate(ctx, {
          id: ping._id,
          urlId: ping.urlId,
          timestamp: ping.timestamp,
          status: ping.status,
          durationMs: ping.duration,
        }, aggSet)
      }
    }

  }
})

/** Aggregation sets for a URL, ordered from finest to coarsest time slice. */
export const listSets = query({
  args: { urlId: v.id("urls") },
  handler: async (ctx, { urlId }) => {
    const sets = await ctx.db
      .query("aggregationSet")
      .withIndex("by_urlId", (q) => q.eq("urlId", urlId))
      .collect()
    return sets.sort((a, b) => a.timeSliceSeconds - b.timeSliceSeconds)
  },
})

/** Buckets for an aggregation set, ordered chronologically by slice start. */
export const listBuckets = query({
  args: { setId: v.id("aggregationSet") },
  handler: async (ctx, { setId }) => {
    const buckets = await ctx.db
      .query("aggregationBuckets")
      .withIndex("by_set_and_sliceStart", (q) => q.eq("set", setId))
      .collect()
    return buckets.sort((a, b) => a.sliceStart - b.sliceStart)
  },
})
