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

  intervals: defineTable({
    label: v.string(),
    seconds: v.number(),
  })
    .index("by_seconds", ["seconds"]),

  schedules: defineTable({
    urlId: v.id("urls"),
    intervalId: v.id("intervals"),
    scheduledFunctionId: v.id("_scheduled_functions"),
  })
    .index("by_urlId", ["urlId"])
})
