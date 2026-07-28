import { useRef, useState } from "react"
import type { ReactElement } from "react"
import { useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"
import type { Doc, Id } from "../../convex/_generated/dataModel"

const CHART_HEIGHT = 80
/* number of time slices shown at once */
const BAR_COUNT = 40

/** One chart column: a bucket, or a placeholder for a slice that holds no pings. */
interface ChartSlot {
  slotStart: number
  bucket?: Doc<"aggregationBuckets">
}

interface AggregationChartProps {
  selectedUrlId?: Id<"urls">
}

interface Range {
  from: number
  to: number
}

interface BoundaryBucketsStartMs {
  first: number
  last: number
}

interface UseAggregationChartResult {
  sets: Doc<"aggregationSet">[]
  selectedSetId: Id<"aggregationSet"> | undefined
  selectSet: (value: string) => void
  chartSlots: ChartSlot[]
  maxPingMs: number
  paging: PagingResult
  window: Range | undefined
}

function useAggregationChart(selectedUrlId?: Id<"urls">): UseAggregationChartResult {
  const [selectedSetId, setSelectedSetId] = useState<Id<"aggregationSet"> | undefined>(undefined)
  const lastSelectedUrl = useRef<string>(undefined)

  const sets = useQuery(
    api.aggregations.listSets,
    selectedUrlId ? { urlId: selectedUrlId } : "skip",
  ) ?? []

  const bounds: BoundaryBucketsStartMs = useQuery(
    api.aggregations.bucketBounds,
    selectedSetId ? { setId: selectedSetId } : "skip",
  )

  const slotMs = (sets.find((s) => s._id === selectedSetId)?.timeSliceSeconds ?? 0) * 1000

  /* the displayed time window (a right-opened range);
     either set the end of the range or make it follow live data */
  const { window, setWindowEnd, setWindowTracksLive }
    = useWindow(bounds?.first, bounds?.last + slotMs, BAR_COUNT * slotMs)

  const paging = usePaging(window, bounds, setWindowEnd, slotMs)

  const buckets = useQuery(
    api.aggregations.listBuckets,
    selectedSetId && window ? { setId: selectedSetId, ...window } : "skip",
  ) ?? []

  // if URL was switched and aggregation sets for the new URL have loaded
  if (lastSelectedUrl.current !== selectedUrlId && sets.length > 0) {
    lastSelectedUrl.current = selectedUrlId
    setSelectedSetId(sets.at(-1)._id)
    setWindowTracksLive()
  }

  const maxPingMs = Math.max(...buckets.map((b) => b.pingDurationMsMax), 100)
  const bucketsBySliceStart = new Map(buckets.map((b) => [b.sliceStart, b]))
  const chartSlots: ChartSlot[] = !window
    ? []
    : Array.from({ length: BAR_COUNT }, (_, i) => {
      const slotStart = window.from + i * slotMs
      return { slotStart, bucket: bucketsBySliceStart.get(slotStart) }
    })

  function selectSet(value: string) {
    setSelectedSetId(value ? (value as Id<"aggregationSet">) : undefined)
    setWindowTracksLive()
  }

  return {
    sets,
    selectedSetId,
    selectSet,
    chartSlots,
    maxPingMs,
    paging,
    window,
  }
}

interface PagingResult {
  canPageBack: boolean
  canPageForward: boolean
  pageBack: () => void
  pageForward: () => void
}

function usePaging(
  window: Range | undefined, // [from, to)  // right-opened range
  bounds: { first: number, last: number },
  setWindowEnd: (_: number) => void,
  slotMs: number,
): PagingResult {

  if (!bounds || !window || !slotMs) {
    return {
      canPageBack: false,
      canPageForward: false,
      pageBack: () => { },
      pageForward: () => { },
    }
  }

  const canPageBack = window.from > bounds.first
  const canPageForward = window.to < bounds.last + slotMs

  function pageBack() {
    setWindowEnd(window.from)
  }

  function pageForward() {
    const next = window.to + BAR_COUNT * slotMs
    setWindowEnd(next)
  }

  return {
    canPageBack,
    canPageForward,
    pageBack,
    pageForward,
  }
}

interface WindowResult {
  /** Current window; undefined if no data to window */
  window: Range | undefined
  /** Set the right end of the window; same as `setWindowLive` if exceeds the right bound */
  setWindowEnd: (_: number) => void
  /** The window follows live data as they're being added */
  setWindowTracksLive: () => void
}

function useWindow(min: number, max: number, windowSize: number): WindowResult {
  const [currentEnd, setCurrentEnd] = useState<number | 'LIVE'>('LIVE')

  if (!min || !max || windowSize <= 0) {
    return {
      window: undefined,
      setWindowEnd: () => { },
      setWindowTracksLive: () => { },
    }
  }

  const windowEnd = (currentEnd === 'LIVE') ? max : currentEnd
  const window = {
    from: windowEnd - windowSize,
    to: windowEnd,
  }

  return {
    window,
    setWindowEnd: (newEnd) => setCurrentEnd(newEnd >= max ? 'LIVE' : newEnd),
    setWindowTracksLive: () => setCurrentEnd('LIVE'),
  }
}

function AggregationChart({ selectedUrlId }: AggregationChartProps) {
  const {
    sets,
    selectedSetId,
    selectSet,
    chartSlots,
    maxPingMs,
    paging,
    window,
  } = useAggregationChart(selectedUrlId)

  if (!selectedUrlId) return null

  return (
    <div className="agg">
      <style>{`
        .agg {
          --bar-good: #0ca30c;
          --bar-critical: #d03b3b;
          --bar-mix: #d99a0b;
          --bar-empty: #b5b4a8;
          --whisker: #6b6a63;
          --baseline: #c3c2b7;
          --muted: #6b6a63;
        }
        @media (prefers-color-scheme: dark) {
          .agg {
            --bar-empty: #4a4a46;
            --baseline: #383835;
            --whisker: #c7c6b3;
            --muted: #9a9990;
          }
        }
        .agg-chart-scroll {
          overflow-x: auto;
          max-width: 100%;
        }
        .agg-chart {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 2px;
          height: ${CHART_HEIGHT}px;
          width: 100%;
          border-bottom: 1px solid var(--baseline);
          margin-bottom: 0.7em;
        }
        .agg-bar-col {
          position: relative;
          flex: 1 1 0;
          min-width: 9px;
          height: 100%;
          display: flex;
          align-items: flex-end;
        }
        .agg-bar {
          width: 100%;
          border-radius: 4px 4px 0 0;
        }
        .agg-bar-empty {
          height: 3px;
          background: var(--bar-empty);
        }
        .agg-whisker {
          position: absolute;
          left: calc(50% - 1px);
          width: 2px;
          background: var(--whisker);
        }
        .agg-range {
          font-size: 0.75em;
          color: var(--muted);
        }
      `}</style>

      <SlotSizeControls selectedSetId={selectedSetId} selectSet={selectSet} aggregationSets={sets} />

      <ChartContainer>
        <BackButton canPageBack={paging.canPageBack} pageBack={paging.pageBack} />
        <Chart maxPingMs={maxPingMs} chartSlots={chartSlots} />
        <ForwardButton canPageForward={paging.canPageForward} pageForward={paging.pageForward} />
      </ChartContainer>

      <RangeAnnotation bucketsRange={window} />
    </div>
  )
}

interface SlotSizeControlsProps {
  selectedSetId: string,
  selectSet: (string) => void,
  aggregationSets: Doc<"aggregationSet">[]
}

function SlotSizeControls(
  { selectedSetId, selectSet, aggregationSets }: SlotSizeControlsProps
): ReactElement {
  return (
    <div>
      <span style={{ marginRight: "0.5em" }}>
        Each bar represents:
      </span>
      <select value={selectedSetId ?? ""} onChange={(e) => selectSet(e.target.value)}>
        <option value="" disabled>
          Aggregation
        </option>
        {aggregationSets.map(s => (
          <option key={s._id} value={s._id}>
            {s.label}
          </option>
        ))}
      </select>
    </div>
  )
}

function ChartContainer({ children }
  : { children?: ReactElement[] }
): ReactElement {
  return (
    <div className="agg-chart-scroll">
      <div className="agg-chart">
        {children}
      </div>
    </div>
  )
}

function Chart({ maxPingMs, chartSlots }
  : { maxPingMs: number, chartSlots: ChartSlot[] }
): ReactElement[] {
  return chartSlots.map(
    ({ slotStart, bucket }) => !bucket ? EmptyBar(slotStart) : NormalBar(slotStart, maxPingMs, bucket)
  )
}

function EmptyBar(slotStart: number) {
  const prettyTime = new Date(slotStart).toLocaleString("en-GB")

  return (
    <div
      key={slotStart}
      className="agg-bar-col"
      title={`${prettyTime} — no pings`}
    >
      <div className="agg-bar agg-bar-empty" />
    </div>
  )
}

function NormalBar(slotStart: number, maxPingMs: number, bucket: Doc<"aggregationBuckets">) {
  const prettyTime = new Date(bucket.sliceStart).toLocaleString("en-GB")

  const averagePing = bucket.pingDurationMsSum / bucket.pingCount
  const avgText = averagePing.toFixed(0)
  const minText = bucket.pingDurationMsMin.toFixed(0)
  const maxText = bucket.pingDurationMsMax.toFixed(0)

  const avgHeight = Math.max((averagePing / maxPingMs) * CHART_HEIGHT, 2)
  const whiskerMinHeight = (bucket.pingDurationMsMin / maxPingMs) * CHART_HEIGHT
  const whiskerMaxHeight = (bucket.pingDurationMsMax / maxPingMs) * CHART_HEIGHT

  return (
    <div
      key={slotStart}
      // key={bucket.sliceStart}
      className="agg-bar-col"
      title={
        `${prettyTime}` +
        ` — ${bucket.status}` +
        ` — avg[min/max]: ${avgText}[${minText}/${maxText}]ms` +
        ` — ${bucket.pingCount} pings`
      }
    >
      <div
        className="agg-whisker"
        style={{
          bottom: `${whiskerMinHeight}px`,
          height: `${Math.max(whiskerMaxHeight - whiskerMinHeight, 1)}px`,
        }}
      />
      <div
        className="agg-bar"
        style={{
          height: `${avgHeight}px`,
          background: barColor(bucket.status),
        }}
      />
    </div>
  )
}

function BackButton({ canPageBack, pageBack }
  : { canPageBack: boolean, pageBack: () => void }
): ReactElement {
  return (
    <button type="button" onClick={pageBack} disabled={!canPageBack} title="Earlier">
      ◀
    </button>
  )
}

function ForwardButton({ canPageForward, pageForward }
  : { canPageForward: boolean, pageForward: () => void }
): ReactElement {

  return (
    <button type="button" onClick={pageForward} disabled={!canPageForward} title="Later">
      {canPageForward ? "▶" : "live"}
    </button>
  )
}

function RangeAnnotation({ bucketsRange }: { bucketsRange: Range | undefined }) {
  if (!bucketsRange) return null

  return (
    <div className="agg-range">
      <span>Data range: &nbsp;</span>
      {new Date(bucketsRange.from).toLocaleString("en-GB")}
      {" → "}
      {new Date(bucketsRange.to).toLocaleString("en-GB")}
    </div>
  )
}

function barColor(status: "success" | "failure" | "mix" | "empty"): string {
  switch (status) {
    case "success":
      return "var(--bar-good)"
    case "failure":
      return "var(--bar-critical)"
    case "empty":
      return "var(--bar-empty)"
    default:
      return "var(--bar-mix)"
  }
}

export default AggregationChart
