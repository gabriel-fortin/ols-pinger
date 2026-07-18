import { mutation, query } from "./_generated/server"
import { v } from "convex/values"

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("pings").collect()
  },
})

export const add = mutation({
  args: {
    url: v.string(),
    timestamp: v.number(),
    status: v.number(),
    duration: v.number(),
  },
  handler: async (ctx, { url, timestamp, status, duration }) => {
    await ctx.db.insert("pings", { url, timestamp, status, duration })
  },
})
