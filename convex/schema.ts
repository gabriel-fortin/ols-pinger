import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

export default defineSchema({
  pings: defineTable({
    url: v.string(),
    timestamp: v.number(),
    status: v.number(),
    duration: v.number(),
  }),
})
