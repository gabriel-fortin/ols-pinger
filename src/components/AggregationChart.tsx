import { useRef, useState } from "react"
import { useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"
import type { Doc, Id } from "../../convex/_generated/dataModel"

const CHART_HEIGHT = 80
/* number of time slices shown at once */
const BAR_COUNT = 40

/** One chart column: a bucket, or a placeholder for a slice that holds no pings. */
interface Slot {
  sliceStart: number
  bucket?: Doc<"aggregationBuckets">
}

interface AggregationChartProps {
  selectedUrlId?: Id<"urls">
}

function AggregationChart({ selectedUrlId }: AggregationChartProps) {
  const [selectedSetId, setSelectedSetId] = useState<Id<"aggregationSet"> | undefined>(undefined)
  /* slice start of the rightmost bucket; undefined follows the newest bucket */
  const [anchor, setAnchor] = useState<number | undefined>(undefined)
  const lastSelectedUrl = useRef<string>(undefined)

  const sets = useQuery(
    api.aggregations.listSets,
    selectedUrlId ? { urlId: selectedUrlId } : "skip",
  ) ?? []

  const bounds = useQuery(
    api.aggregations.bucketBounds,
    selectedSetId ? { setId: selectedSetId } : "skip",
  )

  const selectedSet = sets.find((s) => s._id === selectedSetId)
  const sliceMs = (selectedSet?.timeSliceSeconds ?? 0) * 1000

  const windowEnd = anchor ?? bounds?.last
  /* the half-open slice range covered by the visible columns */
  const range =
    windowEnd !== undefined && sliceMs > 0
      ? { from: windowEnd - (BAR_COUNT - 1) * sliceMs, to: windowEnd + sliceMs }
      : undefined

  const buckets = useQuery(
    api.aggregations.listBuckets,
    selectedSetId && range ? { setId: selectedSetId, ...range } : "skip",
  ) ?? []

  // if URL was switched and aggregation sets for the new URL have loaded
  if (lastSelectedUrl.current !== selectedUrlId && sets.length > 0) {
    lastSelectedUrl.current = selectedUrlId
    setSelectedSetId(sets.at(-1)._id)
    setAnchor(undefined)
  }

  const bucketsBySliceStart = new Map(buckets.map((b) => [b.sliceStart, b]))
  const slots: Slot[] = !range
    ? []
    : Array.from({ length: BAR_COUNT }, (_, i) => {
      const sliceStart = range.from + i * sliceMs
      return { sliceStart, bucket: bucketsBySliceStart.get(sliceStart) }
    })

  const maxDuration = Math.max(...buckets.map((b) => b.pingDurationMsMax), 100)

  const canPageBack = !!bounds && !!range && range.from > bounds.first
  const canPageForward = anchor !== undefined

  function pageBack() {
    if (windowEnd === undefined) return
    setAnchor(windowEnd - BAR_COUNT * sliceMs)
  }

  function pageForward() {
    if (windowEnd === undefined || !bounds) return
    const next = windowEnd + BAR_COUNT * sliceMs
    // back to following the newest bucket once we catch up with it
    setAnchor(next >= bounds.last ? undefined : next)
  }

  function selectSet(value: string) {
    setSelectedSetId(value ? (value as Id<"aggregationSet">) : undefined)
    // a slice start from the previous set means nothing at the new slice size
    setAnchor(undefined)
  }

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
          gap: 2px;
          height: ${CHART_HEIGHT}px;
          width: 100%;
          border-bottom: 1px solid var(--baseline);
          margin-right: 1em;
          margin-bottom: 0.7em;
        }
        .agg-bar-col {
          position: relative;
          flex: 1 1 0;
          min-width: 3px;
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

      <span style={{ marginRight: "0.5em" }}>
        Each bar represents:
      </span>
      <select value={selectedSetId ?? ""} onChange={(e) => selectSet(e.target.value)}>
        <option value="" disabled>
          Aggregation
        </option>
        {sets.map((s) => (
          <option key={s._id} value={s._id}>
            {s.label}
          </option>
        ))}
      </select>

      <div className="agg-chart-scroll">
        <div className="agg-chart">
          <button type="button" onClick={pageBack} disabled={!canPageBack} title="Earlier">
            ◀
          </button>
          {slots.map(({ sliceStart, bucket }) => {
            const time = new Date(sliceStart).toLocaleString("en-GB")

            if (!bucket) {
              return (
                <div
                  key={sliceStart}
                  className="agg-bar-col"
                  title={`${time} — no pings`}
                >
                  <div className="agg-bar agg-bar-empty" />
                </div>
              )
            }

            const min = bucket.pingDurationMsMin
            const max = bucket.pingDurationMsMax
            const avg = bucket.pingDurationMsSum / bucket.pingCount
            const avgHeight = Math.max((avg / maxDuration) * CHART_HEIGHT, 2)
            const minHeight = (min / maxDuration) * CHART_HEIGHT
            const maxHeight = (max / maxDuration) * CHART_HEIGHT

            return (
              <div
                key={sliceStart}
                className="agg-bar-col"
                title={
                  `${time}` +
                  ` — ${bucket.status}` +
                  ` — avg[min/max]: ${avg.toFixed(0)}[${min.toFixed(0)}/${max.toFixed(0)}]ms` +
                  ` — ${bucket.pingCount} pings`
                }
              >
                <div
                  className="agg-whisker"
                  style={{
                    bottom: `${minHeight}px`,
                    height: `${Math.max(maxHeight - minHeight, 1)}px`,
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
          })}
          <button type="button" onClick={pageForward} disabled={!canPageForward} title="Later">
            {canPageForward ? "▶" : "live"}
          </button>
        </div>
      </div>

      {range && (
        <div className="agg-range">
          <span>Data range: &nbsp;</span>
          {new Date(range.from).toLocaleString("en-GB")}
          {" → "}
          {new Date(range.to).toLocaleString("en-GB")}
        </div>
      )}
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
