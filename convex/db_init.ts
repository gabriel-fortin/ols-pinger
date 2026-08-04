/*
 * functions to initialise an empty DB
 */

import { internalMutation, type MutationCtx } from "./_generated/server"


const BUCKET_TIME_SLICES_SECONDS = [5, 20, 60, 5 * 60, 20 * 60, 60 * 60, 24 * 60 * 60]

const SCHEDULE_INTERVALS_SECONDS = [5, 20, 60, 5 * 60, 20 * 60, 60 * 60, 24 * 60 * 60]

/** Create aggregations sets for a newly created URL */
export const createAggregationSets = internalMutation({
  handler: async (ctx: MutationCtx) => {
    const allSets = await ctx.db.query("aggregationSet").collect()

    for (const timeSliceSeconds of BUCKET_TIME_SLICES_SECONDS) {
      if (allSets.find(x => x.timeSliceSeconds === timeSliceSeconds)) continue

      await ctx.db.insert("aggregationSet", {
        label: helpers.secondsToLabel(timeSliceSeconds),
        timeSliceSeconds,
        isAvailableInUi: true,
      })
    }
  }
})

export const createScheduleIntervals = internalMutation({
  handler: async (ctx: MutationCtx) => {
    const existingIntervals = await ctx.db.query("intervals").collect()

    for (const interval of SCHEDULE_INTERVALS_SECONDS) {
      if (existingIntervals.find(x => x.seconds === interval)) continue

      await ctx.db.insert("intervals", {
        label: helpers.secondsToLabel(interval),
        seconds: interval,
      })
    }
  }
})


const helpers = {
  secondsToLabel: (seconds: number) => {
    if (seconds < 60) return `${seconds}s`
    if (seconds < 3600) return `${seconds / 60}m`
    if (seconds < 86400) return `${seconds / 3600}h`
    return `${seconds / 86400}d`
  }
}