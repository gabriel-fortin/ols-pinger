import { useState } from "react"


export interface PagedWindowResult {
  /** Current page; undefined if no data available */
  page: Range | undefined
  canPageBack: boolean
  canPageForward: boolean
  pageBack: () => void
  pageForward: () => void
  /** Make the current page follow the newest data */
  resetPage: () => void
}

interface Range {
  from: number
  to: number
}

export function usePaging(pageSize: number, min?: number, max?: number): PagedWindowResult {
  const [currentEnd, setCurrentEnd] = useState<number | 'LIVE'>('LIVE')

  if (!min || !max || pageSize <= 0) {
    return {
      page: undefined,
      canPageBack: false,
      canPageForward: false,
      pageBack: () => { },
      pageForward: () => { },
      resetPage: () => { },
    }
  }

  const pageEnd = (currentEnd === 'LIVE') ? max : currentEnd
  const pageStart = pageEnd - pageSize

  return {
    page: { from: pageStart, to: pageEnd },
    canPageBack: pageStart > min,
    canPageForward: currentEnd !== 'LIVE',
    pageBack: () => setCurrentEnd(pageEnd - pageSize),
    pageForward: () => {
      if (currentEnd === 'LIVE') return
      if (currentEnd + pageSize > max) setCurrentEnd('LIVE')
      else setCurrentEnd(currentEnd + pageSize)
    },
    resetPage: () => setCurrentEnd('LIVE'),
  }
}