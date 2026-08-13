import { useRef } from "react"
import { useQuery } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import type { Doc, Id } from "../../../../convex/_generated/dataModel"
import type { PageRange } from "./PageRange"


interface Cache {
  setId: Id<"aggregationSet">
  urlId: Id<"urls">
  from: number
  to: number
  buckets: Doc<"aggregationBuckets">[]
}

/**
 * Wraps listBuckets so that once a window's buckets are cached, only the newest
 * two slices are re-queried on subsequent calls instead of the whole page -
 * aggregationBuckets rows are patched in place until their slice closes, so
 * everything before the last slice or two is already known to be unchanged.
 * Falls back to a full-range query whenever the cache can't cover the rest of
 * the requested range (first load, set/URL switch, paging jump, or a gap
 * bigger than 2 slices).
 */
export function useStableBuckets(
  setId: Id<"aggregationSet"> | undefined,
  urlId: Id<"urls"> | undefined,
  page: PageRange | undefined,
  slotMs: number,
): Doc<"aggregationBuckets">[] {
  const cacheData = useRef<Cache | undefined>(undefined)
  
  const cached = cacheData.current
  const cacheBoundary = page ? page.to - 2 * slotMs : Infinity

  const canOptimise = !!(cached && page
    && cached.setId === setId && cached.urlId === urlId
    && page.from >= cached.from
    && cacheBoundary <= cached.to)

  const queryFrom = canOptimise ? cacheBoundary : page?.from
  const query = (setId && urlId && page && queryFrom)
    ? { setId, urlId, from: queryFrom, to: page.to }
    : "skip"
  const fresh = useQuery(api.aggregations.listBuckets, query) ?? []
  
  // late guard because of rule of hooks
  if (!setId || !urlId || !page) return []

  const buckets = (canOptimise && cached)
    ? [...cached.buckets.filter((b) => b.sliceStart >= page.from && b.sliceStart < queryFrom), ...fresh]
    : fresh

  cacheData.current = { setId, urlId, ...page, buckets }

  return buckets
}
