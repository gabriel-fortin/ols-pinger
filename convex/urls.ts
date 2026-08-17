import { mutation, query } from "./_generated/server"
import { v } from "convex/values"

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
  args: {
    url: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, { url, description }) => {
    const urlId = await ctx.db.insert("urls", { url, description })
    return urlId
  },
})

export const update = mutation({
  args: {
    urlId: v.id("urls"),
    url: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, { urlId, url, description }) => {
    await ctx.db.patch("urls", urlId, { url, description })
  },
})
