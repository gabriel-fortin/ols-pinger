import { useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "../convex/_generated/api"
import PingChart from "./PingChart"
import PingList from "./PingList"

function App() {
  const [url, setUrl] = useState('')
  const results = useQuery(api.pings.list) ?? []
  const addPing = useMutation(api.pings.add)

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
    addPing({ url, timestamp, status, duration })
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
