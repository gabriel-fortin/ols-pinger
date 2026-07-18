import type { PingResult } from "./PingResult"

interface PingListProps {
  results: PingResult[]
}

function PingList({ results }: PingListProps) {
  return (
    <ul>
      {results.map((result) => (
        <li key={result._id}>
          {new Date(result.timestamp).toLocaleTimeString()} - status:{' '}
          {result.status} - {result.duration.toFixed(0)}ms
        </li>
      ))}
    </ul>
  )
}

export default PingList
