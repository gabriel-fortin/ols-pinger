import { useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"

interface PingListProps {
  selectedUrlId?: Id<"urls">
}

function PingList({ selectedUrlId }: PingListProps) {
  if (!selectedUrlId) return null

  const results = useQuery(api.pings.list, { urlId: selectedUrlId }) ?? []
  return (
    <ul>
      {results.map((result) => (
        <li key={result._id}>
          <div style={{ minWidth: "4.8em", display: "inline-block" }}>
            {new Date(result.timestamp).toLocaleTimeString()}
          </div>
          <div style={{ display: "inline-block", minWidth: "3em" }}>
            <span
              style={{
                backgroundColor: boxColor(result.status),
                padding: "1px 6px",
                borderRadius: "4px",
                fontWeight: "500",
                width: "3em",
              }}
            >
              {result.status}
            </span>
          </div>
          <span style={{ display: "inline-block", width: "3.2em", textAlign: "right" }}>
            {result.duration.toFixed(0)}ms
          </span>
        </li>
      ))}
    </ul>
  )
}

function boxColor(status: number): string {
  return status >= 200 && status < 300
    ? "rgba(34, 197, 94, 0.4)"
    : "rgba(239, 68, 68, 0.4)"
}

export default PingList
