import { mutation, query } from "./_generated/server"
import { v } from "convex/values"
import * as aggregations from "./aggregations"

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("urls").collect()
  },
})

export const get = query({
  args: { urlId: v.id("urls") },
  handler: async (ctx, { urlId }) => {
    return await ctx.db.get(urlId)
  },
})

export const add = mutation({
  args: { url: v.string() },
  handler: async (ctx, { url }) => {
    const existing = await ctx.db
      .query("urls")
      .withIndex("by_url", (q) => q.eq("url", url))
      .first()
    if (existing) return existing._id
    const urlId = await ctx.db.insert("urls", { url })
    await aggregations.createAggregationSets(ctx, urlId)
    return urlId
  },
})
