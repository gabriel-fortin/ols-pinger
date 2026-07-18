import type { PingResult } from './PingResult'

interface PingListProps {
  results: PingResult[]
}

function PingList({ results }: PingListProps) {
  return (
    <ul>
      {results.map((result, i) => (
        <li key={i}>
          {new Date(result.timestamp).toLocaleTimeString()} - status:{' '}
          {result.status} - {result.duration.toFixed(0)}ms
        </li>
      ))}
    </ul>
  )
}

export default PingList
