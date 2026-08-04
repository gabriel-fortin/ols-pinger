import { useRef, useState } from "react"
import { useQuery } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import type { Doc, Id } from "../../../../convex/_generated/dataModel"
import { usePaging } from "./usePaging"


/* number of time slices shown at once */
export const BAR_COUNT = 40

/** One chart column: a bucket, or a placeholder for a slice that holds no pings. */
export interface ChartSlot {
  slotStart: number
  bucket?: Doc<"aggregationBuckets">
}

export function useAggregationChart(selectedUrlId: Id<"urls"> | undefined) {
  const [selectedSetId, setSelectedSetId] = useState<Id<"aggregationSet"> | undefined>(undefined)
  const lastSelectedUrl = useRef<string>(undefined)

  const sets = useQuery(api.aggregations.listSets,) ?? []
  /* first and last bucket */
  const bounds = useQuery(
    api.aggregations.bucketBounds,
    (selectedSetId && selectedUrlId)
      ? { setId: selectedSetId, urlId: selectedUrlId }
      : "skip",
  )

  const aggregationSet = sets.find((s) => s._id === selectedSetId)
  const slotMs = (aggregationSet?.timeSliceSeconds ?? 0) * 1000

  /* the displayed time window (a right-opened range) */
  const { page, canPageBack, canPageForward, pageBack, pageForward, resetPage }
    = usePaging(BAR_COUNT * slotMs, bounds?.first, (bounds?.last ?? NaN) + slotMs)

  const buckets = useQuery(
    api.aggregations.listBuckets,
    (selectedSetId && selectedUrlId && page)
      ? { setId: selectedSetId, urlId: selectedUrlId, ...page }
      : "skip",
  ) ?? []

  // if URL was switched and aggregation sets for the new URL have loaded
  if (lastSelectedUrl.current !== selectedUrlId && sets.length > 0) {
    lastSelectedUrl.current = selectedUrlId
    setSelectedSetId(sets.at(-1)!._id)
    resetPage()
  }

  const bucketsBySliceStart = new Map(buckets.map((b) => [b.sliceStart, b]))
  const chartSlots: ChartSlot[] = !page
    ? []
    : Array.from({ length: BAR_COUNT }, (_, i) => {
      const slotStart = page.from + i * slotMs
      return { slotStart, bucket: bucketsBySliceStart.get(slotStart) }
    })

  function selectSet(value: string) {
    setSelectedSetId(value ? (value as Id<"aggregationSet">) : undefined)
    // when changing slot sizes, revert to following newest data
    resetPage()
  }

  return {
    sets,
    selectedSetId,
    selectSet,
    chartSlots,
    page,
    canPageBack,
    canPageForward,
    pageBack,
    pageForward,
  }
}
