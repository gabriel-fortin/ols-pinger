import { useRef, useState } from "react"
import { useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"

const CHART_HEIGHT = 80

interface AggregationChartProps {
  selectedUrlId?: Id<"urls">
}

function AggregationChart({ selectedUrlId }: AggregationChartProps) {
  const [selectedSetId, setSelectedSetId] = useState<Id<"aggregationSet"> | undefined>(undefined)
  const lastSelectedUrl = useRef<string>(undefined)

  const sets =
    useQuery(
      api.aggregations.listSets,
      selectedUrlId ? { urlId: selectedUrlId } : "skip",
    ) ?? []

  const buckets =
    useQuery(
      api.aggregations.listBuckets,
      selectedSetId ? { setId: selectedSetId } : "skip",
    ) ?? []

  // if URL was switched and aggregation sets for the new URL have loaded
  if (lastSelectedUrl.current !== selectedUrlId && sets.length > 0) {
    lastSelectedUrl.current = selectedUrlId
    setSelectedSetId(sets.at(-1)._id)
  }

  const maxDuration = Math.max(...buckets.map((b) => b.pingDurationMsMax), 100)

  if (!selectedUrlId) return null

  return (
    <div>
      <style>{`
        .agg-chart-scroll {
          overflow-x: auto;
          max-width: 100%;
        }
        .agg-chart {
          --bar-good: #0ca30c;
          --bar-critical: #d03b3b;
          --bar-mix: #d99a0b;
          --whisker: #6b6a63;
          --baseline: #c3c2b7;
          display: flex;
          align-items: flex-end;
          gap: 2px;
          height: ${CHART_HEIGHT}px;
          width: max-content;
          border-bottom: 1px solid var(--baseline);
          margin-right: 1em;
          margin-bottom: 0.7em;
        }
        @media (prefers-color-scheme: dark) {
          .agg-chart {
            --baseline: #383835;
            --whisker: #c7c6b3;
          }
        }
        .agg-bar-col {
          position: relative;
          width: 10px;
          height: 100%;
          flex-shrink: 0;
          display: flex;
          align-items: flex-end;
        }
        .agg-bar {
          width: 100%;
          border-radius: 4px 4px 0 0;
          /* border-radius: 4px; */
        }
        .agg-whisker {
          position: absolute;
          /* left: 50%; */
          left: calc(50% - 1px);
          width: 2px;
          /* transform: translateX(-50%); */
          background: var(--whisker);
        }
      `}</style>

      <select
        value={selectedSetId ?? ""}
        onChange={(e) =>
          setSelectedSetId(
            e.target.value ? (e.target.value as Id<"aggregationSet">) : undefined,
          )
        }
      >
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
          {buckets.map((bucket) => {
            const min = bucket.pingDurationMsMin
            const max = bucket.pingDurationMsMax
            const avg = bucket.pingDurationMsSum / bucket.pingCount
            const avgHeight = Math.max((avg / maxDuration) * CHART_HEIGHT, 2)
            const minHeight = (bucket.pingDurationMsMin / maxDuration) * CHART_HEIGHT
            const maxHeight = (bucket.pingDurationMsMax / maxDuration) * CHART_HEIGHT

            return (
              <div
                key={bucket._id}
                className="agg-bar-col"
                title={
                  `${new Date(bucket.sliceStart).toLocaleString("en-GB")}` +
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
        </div>
      </div>
    </div>
  )
}

function barColor(status: "success" | "failure" | "mix" | "empty"): string {
  switch (status) {
    case "success":
      return "var(--bar-good)"
    case "failure":
      return "var(--bar-critical)"
    default:
      return "var(--bar-mix)"
  }
}

export default AggregationChart
