import { internalMutation, query } from "./_generated/server"
import { v } from "convex/values"

export const get = query({
  args: { urlId: v.id("urls") },
  handler: async (ctx, { urlId }) => {
    return await ctx.db
      .query("schedules")
      .withIndex("by_urlId", (q) => q.eq("urlId", urlId))
      .first()
  },
})

export const register = internalMutation({
  args: {
    urlId: v.id("urls"),
    intervalId: v.id("scheduleIntervals"),
    scheduledFunctionId: v.id("_scheduled_functions"),
  },
  handler: async (ctx, { urlId, intervalId, scheduledFunctionId }) => {
    const existing = await ctx.db
      .query("schedules")
      .withIndex("by_urlId", (q) => q.eq("urlId", urlId))
      .first()

    if (existing) {
      await ctx.db.patch("schedules", existing._id, { urlId, intervalId, scheduledFunctionId })
    } else {
      await ctx.db.insert("schedules", { urlId, intervalId, scheduledFunctionId })
    }
  },
})

export const unregister = internalMutation({
  args: { urlId: v.id("urls") },
  handler: async (ctx, { urlId }) => {
    const existing = await ctx.db
      .query("schedules")
      .withIndex("by_urlId", (q) => q.eq("urlId", urlId))
      .first()
    if (!existing) return

    await ctx.db.delete(existing._id)
  },
})
