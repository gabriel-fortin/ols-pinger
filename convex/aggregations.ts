import { mutation, query, type MutationCtx } from "./_generated/server"
import type { Doc, Id } from "./_generated/dataModel"
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

// TODO: probably this type should be shared with functions in 'pings.ts'
type PingType = {
  urlId: Id<"urls">
  timestamp: number
  status: number
  durationMs: number
}

export async function addPingToAggregates(ctx: MutationCtx, ping: PingType) {
  const sets = await ctx.db
    .query("aggregationSet")
    .collect()

  for (const aggSet of sets) {
    await addPingToAggregate(ctx, ping, aggSet)
  }
}

export async function addPingToAggregate(ctx: MutationCtx, ping: PingType,
  aggSet: Doc<"aggregationSet">) {

  const sliceMs = aggSet.timeSliceSeconds * 1000
  const sliceStart = Math.floor(ping.timestamp / sliceMs) * sliceMs

  const bucket = await ctx.db
    .query("aggregationBuckets")
    .withIndex("by_set_url_sliceStart", (q) => q
      .eq("set", aggSet._id)
      .eq("urlId", ping.urlId)
      .eq("sliceStart", sliceStart),
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
      urlId: ping.urlId,
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
  args: {
    url: v.string(),
    bucketSizes: v.optional(v.array(v.string())),
  },
  handler: async (ctx, { url, bucketSizes }) => {
    const urlId = await ctx.db
      .query("urls")
      .filter(q => q.eq(q.field("url"), url))
      .first()
      .then(x => x?._id)
    if (!urlId) throw new Error("Invalid URL")

    // Get all pings for this URL
    const allPings = await ctx.db
      .query("pings")
      .withIndex("by_urlId", (q) => q.eq("urlId", urlId))
      .collect()
    if (allPings.length === 0) return

    // Get all aggregation sets
    let sets = await ctx.db
      .query("aggregationSet")
      .collect()
    if (bucketSizes)
      sets = sets.filter(x => bucketSizes.includes(x.label))

    // Find the minimum timestamp to determine which buckets can be rebuilt
    const minTimestamp = allPings.length > 0
      ? Math.min(...allPings.map(p => p.timestamp))
      : Infinity

    for (const aggSet of sets) {
      const sliceMs = aggSet.timeSliceSeconds * 1000

      // find the list of buckets to remove
      const deletableBuckets = await ctx.db
        .query("aggregationBuckets")
        .withIndex("by_set_url_sliceStart", (q) => q
          .eq("set", aggSet._id)
          .eq("urlId", urlId)
          // Skip older buckets (which represent deleted pings), because we can't rebuild them
          .gt("sliceStart", minTimestamp - sliceMs))
        .collect()

      if (deletableBuckets.length > 0) {
        const pingsFittingFirstBucket = allPings.filter(p =>
          p.timestamp >= deletableBuckets[0].sliceStart
          && p.timestamp < deletableBuckets[0].sliceStart + sliceMs)

        // if we have less pings than were originally used to create the bucket
        if (pingsFittingFirstBucket.length < deletableBuckets[0].pingCount) {
          // we assume those pings were removed
          // so we don't rebuild the bucket (because that would mean data loss)
          deletableBuckets.shift() // remove first element
        }

        for (const bucket of deletableBuckets) {
          await ctx.db.delete(bucket._id)
        }
      }

      // Re-aggregate all pings
      for (const ping of allPings) {
        // ignore pings for a bucket that we don't rebuild
        if (ping.timestamp < (deletableBuckets[0]?.sliceStart ?? -Infinity) + sliceMs) continue

        const p: PingType = {
          urlId: ping.urlId,
          status: ping.status,
          timestamp: ping.timestamp,
          durationMs: ping.durationMs,
        }
        await addPingToAggregate(ctx, p, aggSet)
      }
    }

  }
})

/** Aggregation sets for a URL, ordered from finest to coarsest time slice. */
export const listSets = query({
  handler: async (ctx) => {
    const sets = await ctx.db
      .query("aggregationSet")
      .filter(q => q.eq(q.field("isAvailableInUi"), true))
      .collect()
    return sets.sort((a, b) => a.timeSliceSeconds - b.timeSliceSeconds)
  },
})

/**
 * Buckets of an aggregation set whose slice start falls in [from, to),
 * ordered chronologically by slice start.
 */
export const listBuckets = query({
  args: {
    setId: v.id("aggregationSet"),
    urlId: v.id("urls"),
    from: v.number(),
    to: v.number(),
  },
  handler: async (ctx, { setId, urlId, from, to }) => {
    return await ctx.db
      .query("aggregationBuckets")
      .withIndex("by_set_url_sliceStart", (q) => q
        .eq("set", setId)
        .eq("urlId", urlId)
        .gte("sliceStart", from)
        .lt("sliceStart", to),
      )
      .collect()
  },
})

/** Oldest and newest slice starts held by a set, or null when it has no buckets. */
export const bucketBounds = query({
  args: {
    setId: v.id("aggregationSet"),
    urlId: v.id("urls"),
  },
  handler: async (ctx, { setId, urlId }) => {
    const oldest = await ctx.db
      .query("aggregationBuckets")
      .withIndex("by_set_url_sliceStart", (q) => q.eq("set", setId).eq("urlId", urlId))
      .first()
    if (!oldest) return null

    const newest = await ctx.db
      .query("aggregationBuckets")
      .withIndex("by_set_url_sliceStart", (q) => q.eq("set", setId).eq("urlId", urlId))
      .order("desc")
      .first()

    return { first: oldest.sliceStart, last: newest?.sliceStart ?? oldest.sliceStart }
  },
})
