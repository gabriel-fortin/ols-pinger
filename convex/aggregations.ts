import type { MutationCtx } from "./_generated/server"
import type { Id } from "./_generated/dataModel"


// TODO: probably this type should be shared with functions in 'pings.ts'
type PingType = {
  id: Id<"pings">
  urlId: Id<"urls">
  timestamp: number
  status: number
  durationMs: number
}

export async function update(ctx: MutationCtx, ping: PingType) {
  const sets = await ctx.db
    .query("aggregationSet")
    .withIndex("by_urlId", (q) => q.eq("urlId", ping.urlId))
    .collect()

  for (const set of sets) {
    const sliceMs = set.timeSliceSeconds * 1000
    const sliceStart = Math.floor(ping.timestamp / sliceMs) * sliceMs

    const bucket = await ctx.db
      .query("aggregationBuckets")
      .withIndex("by_set_and_sliceStart", (q) =>
        q.eq("set", set._id).eq("sliceStart", sliceStart),
      )
      .unique()

    if (bucket) {
      await ctx.db.patch("aggregationBuckets", bucket._id, {
        pingDurationMsMin: Math.min(bucket.pingDurationMsMin, ping.durationMs),
        pingDurationMsMax: Math.max(bucket.pingDurationMsMax, ping.durationMs),
        pingDurationMsSum: bucket.pingDurationMsSum + ping.durationMs,
        pingCount: bucket.pingCount + 1,
      })
    } else {
      await ctx.db.insert("aggregationBuckets", {
        set: set._id,
        sliceStart,
        pingDurationMsMin: ping.durationMs,
        pingDurationMsMax: ping.durationMs,
        pingDurationMsSum: ping.durationMs,
        pingCount: 1,
      })
    }
  }
}
