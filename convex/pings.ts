import { mutation, query } from "./_generated/server"
import { v } from "convex/values"

export const list = query({
  args: { urlId: v.id("urls") },
  handler: async (ctx, { urlId }) => {
    const urlDoc = await ctx.db.get(urlId)
    if (!urlDoc) {
      throw new Error("Ah, the URL was not found, can't add a ping :(")
    }
    return await ctx.db
      .query("pings")
      .withIndex("by_urlId", (q) => q.eq("urlId", urlId))
      .collect()
  },
})

export const add = mutation({
  args: {
    urlId: v.id("urls"),
    timestamp: v.number(),
    status: v.number(),
    duration: v.number(),
  },
  handler: async (ctx, { urlId, timestamp, status, duration }) => {
    await ctx.db.insert("pings", { urlId, timestamp, status, duration })
  },
})
