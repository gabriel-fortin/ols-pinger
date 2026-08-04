import { query } from "./_generated/server"
import { v } from "convex/values"

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("scheduleIntervals")
      .withIndex("by_seconds")
      .order("asc")
      .collect()
  },
})

export const get = query({
  args: { intervalId: v.id("scheduleIntervals") },
  handler: async (ctx, { intervalId }) => {
    return await ctx.db.get("scheduleIntervals", intervalId)
  },
})
