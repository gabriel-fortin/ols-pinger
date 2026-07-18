import { useState } from 'react'

interface PingResult {
  timestamp: number
  status: number
  duration: number
}

const CHART_HEIGHT = 80

function App() {
  const [url, setUrl] = useState('')
  const [results, setResults] = useState<PingResult[]>([])

  const handleCall = async () => {
    const timestamp = Date.now()
    const start = performance.now()
    let status = 0
    try {
      const response = await fetch(url)
      status = response.status
    } catch {
      status = 0
    }
    const duration = performance.now() - start
    setResults((prev) => [...prev, { timestamp, status, duration }])
  }

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
      <input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="Enter a URL"
      />
      <button type="button" onClick={handleCall}>
        Call
      </button>
      <div className="ping-chart">
        {results.map((result, i) => (
          <div
            key={i}
            className="ping-bar"
            title={`status ${result.status} - ${result.duration.toFixed(0)}ms`}
            style={{
              height: `${Math.max((result.duration / maxDuration) * CHART_HEIGHT, 2)}px`,
              background:
                result.status >= 200 && result.status < 300
                  ? 'var(--bar-good)'
                  : 'var(--bar-critical)',
            }}
          />
        ))}
      </div>
      <ul>
        {results.map((result, i) => (
          <li key={i}>
            {new Date(result.timestamp).toLocaleTimeString()} - status:{' '}
            {result.status} - {result.duration.toFixed(0)}ms
          </li>
        ))}
      </ul>
    </div>
  )
}

export default App
