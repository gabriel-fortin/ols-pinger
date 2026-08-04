import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

export default defineSchema({
  pings: defineTable({
    urlId: v.id("urls"),
    timestamp: v.number(),
    status: v.number(),
    duration: v.number(),
  })
    .index("by_urlId", ["urlId"]),

  urls: defineTable({
    url: v.string(),
  })
    .index("by_url", ["url"]),

  scheduleIntervals: defineTable({
    label: v.string(),
    seconds: v.number(),
  })
    .index("by_seconds", ["seconds"]),

  schedules: defineTable({
    urlId: v.id("urls"),
    intervalId: v.id("scheduleIntervals"),
    scheduledFunctionId: v.id("_scheduled_functions"),
  })
    .index("by_urlId", ["urlId"]),

  /* configuration for aggregated ping results */
  aggregationSet: defineTable({
    label: v.string(),
    timeSliceSeconds: v.number(),
    isAvailableInUi: v.boolean(),
  }),

  /* aggregated ping results */
  aggregationBuckets: defineTable({
    set: v.id("aggregationSet"),
    urlId: v.id("urls"),
    sliceStart: v.number(),
    pingDurationMsMin: v.number(),
    pingDurationMsMax: v.number(),
    /* total of all durations in this bucket; the average is pingSum / pingCount */
    pingDurationMsSum: v.number(),
    pingCount: v.number(),
    status: v.union(
      v.literal("success"),
      v.literal("failure"),
      v.literal("mix"),
      v.literal("empty"),
    ),
  })
    .index("by_set_url_sliceStart", ["set", "urlId", "sliceStart"]),

})
