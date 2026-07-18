import type { PingResult } from "./PingResult"

const CHART_HEIGHT = 80

interface PingChartProps {
  results: PingResult[]
}

function PingChart({ results }: PingChartProps) {
  const maxDuration = Math.max(...results.map((r) => r.duration), 1)

  return (
    <div>
      <style>{`
        .ping-chart {
          --bar-good: #0ca30c;
          --bar-critical: #d03b3b;
          --baseline: #c3c2b7;
          display: flex;
          align-items: flex-end;
          gap: 2px;
          height: ${CHART_HEIGHT}px;
          border-bottom: 1px solid var(--baseline);
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
      <div className="ping-chart">
        {results.map((result) => (
          <div
            key={result._id}
            className="ping-bar"
            title={`status ${result.status} - ${result.duration.toFixed(0)}ms`}
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
  )
}

export default PingChart
