import { action, mutation, query } from "./_generated/server"
import { v } from "convex/values"
import { api } from "./_generated/api"

export const list = query({
  args: { urlId: v.optional(v.id("urls")) },
  handler: async (ctx, { urlId }) => {
    if (!urlId) return null

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

export const addResult = mutation({
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

export const callUrl = action({
  args: { urlId: v.id("urls") },
  handler: async (ctx, { urlId }) => {
    const urlDoc = await ctx.runQuery(api.urls.get, { urlId })
    if (!urlDoc) {
      throw new Error("Ah, the URL was not found, can't make the call :(")
    }

    const timestamp = Date.now()
    let status = 0
    try {
      const response = await fetch(urlDoc.url)
      status = response.status
    } catch {
      status = 0
    }
    const duration = Date.now() - timestamp

    await ctx.runMutation(api.pings.addResult, { urlId, timestamp, status, duration })
  },
})
