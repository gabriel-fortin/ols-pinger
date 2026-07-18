import { useState } from 'react'
import type { PingResult } from './PingResult'
import PingChart from './PingChart'
import PingList from './PingList'

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

  return (
    <div>
      <input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="Enter a URL"
      />
      <button type="button" onClick={handleCall}>
        Call
      </button>
      <PingChart results={results} />
      <PingList results={results} />
    </div>
  )
}

export default App
