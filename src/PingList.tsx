import { useQuery } from "convex/react"
import { api } from "../convex/_generated/api"
import type { Id } from "../convex/_generated/dataModel"

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
          {new Date(result.timestamp).toLocaleTimeString()} - status:{" "}
          {result.status} - {result.duration.toFixed(0)}ms
        </li>
      ))}
    </ul>
  )
}

export default PingList
