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
    .index("by_url", ["url"])
})
