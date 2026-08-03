import { action, internalAction, mutation, query } from "./_generated/server"
import type { ActionCtx } from "./_generated/server"
import { v } from "convex/values"
import { api, internal } from "./_generated/api"
import type { Id } from "./_generated/dataModel"
import * as aggregations from "./aggregations"


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

export const saveResult = mutation({
  args: {
    urlId: v.id("urls"),
    timestamp: v.number(),
    status: v.number(),
    duration: v.number(),
  },
  handler: async (ctx, { urlId, timestamp, status, duration }) => {
    await ctx.db.insert("pings", { urlId, timestamp, status, duration })
    await aggregations.addPingToAggregates(ctx, {
      urlId,
      timestamp,
      status,
      durationMs: duration,
    })
  },
})

export const pingUrl = action({
  args: { urlId: v.id("urls") },
  handler: async (ctx, { urlId }) => {
    await makeAndSavePingCall(ctx, urlId)
  },
})

export const schedulePing = action({
  args: {
    urlId: v.id("urls"),
    intervalId: v.id("intervals"),
  },
  handler: async (ctx, { urlId, intervalId }) => {
    await ctx.runAction(internal.pings.schedulePingInternal, {
      urlId,
      intervalId,
      isInitial: true,
    })
  },
})

export const unschdulePing = action({
  args: { urlId: v.id("urls") },
  handler: async (ctx, { urlId }) => {
    await ctx.runMutation(internal.schedules.unregister, { urlId })

    const existing = await ctx.runQuery(api.schedules.get, { urlId })
    // a schedule could have ben removed manually from the dashboard
    if (!existing) return

    await ctx.scheduler.cancel(existing.scheduledFunctionId)
  }
})

// ------ helpers

async function makeAndSavePingCall(ctx: ActionCtx, urlId: Id<"urls">) {
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

  await ctx.runMutation(api.pings.saveResult, { urlId, timestamp, status, duration })
}

export const schedulePingInternal = internalAction({
  args: {
    urlId: v.id("urls"),
    intervalId: v.id("intervals"),
    isInitial: v.boolean(),
  },
  handler: async (ctx, { urlId, intervalId, isInitial }) => {
    if (!isInitial) {
      const existing = await ctx.runQuery(api.schedules.get, { urlId })
      // has it been cancelled?
      if (!existing) return
    }

    const interval = await ctx.runQuery(api.intervals.get, { intervalId })
    if (!interval) {
      throw new Error("Ah, the interval was not found, can't schedule pings :(")
    }

    await makeAndSavePingCall(ctx, urlId)
    const scheduledFunctionId = await ctx.scheduler.runAfter(
      interval.seconds * 1000,
      internal.pings.schedulePingInternal,
      { urlId, intervalId, isInitial: false },
    )
    await ctx.runMutation(internal.schedules.register, {
      urlId,
      intervalId,
      scheduledFunctionId,
    })
  },
})