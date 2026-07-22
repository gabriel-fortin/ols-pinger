import { useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"

const CHART_HEIGHT = 80

interface PingChartProps {
  selectedUrlId?: Id<"urls">
}

function PingChart({ selectedUrlId }: PingChartProps) {
  if (!selectedUrlId) return null
  
  const results = useQuery(api.pings.list, { urlId: selectedUrlId }) ?? []
  const maxDuration = Math.max(...results.map((r) => r.duration), 1)

  return (
    <div>
      <style>{`
        .ping-chart-scroll {
          overflow-x: auto;
          max-width: 100%;
        }
        .ping-chart {
          --bar-good: #0ca30c;
          --bar-critical: #d03b3b;
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
          .ping-chart {
            --baseline: #383835;
          }
        }
        .ping-bar {
          width: 8px;
          border-radius: 4px 4px 0 0;
          flex-shrink: 0;
        }
      `}</style>
      <div className="ping-chart-scroll">
        <div className="ping-chart">
          {results.map((result) => (
            <div
              key={result._id}
              className="ping-bar"
              title={`${new Date(result.timestamp).toLocaleString()} - status ${result.status} - ${result.duration.toFixed(0)}ms`}
              style={{
                height: `${Math.max((result.duration / maxDuration) * CHART_HEIGHT, 2)}px`,
                background:
                  result.status >= 200 && result.status < 300
                    ? "var(--bar-good)"
                    : "var(--bar-critical)",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default PingChart
