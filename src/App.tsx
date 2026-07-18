import { useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "../convex/_generated/api"
import PingChart from "./PingChart"
import PingList from "./PingList"

function App() {
  const [url, setUrl] = useState("")
  const [selectedUrl, setSelectedUrl] = useState("")
  const urls = useQuery(api.urls.list) ?? []
  const selectedUrlId = urls.find((u) => u.url === selectedUrl)?._id
  const results = useQuery(api.pings.list, selectedUrlId ? { urlId: selectedUrlId } : "skip") ?? []
  const addUrl = useMutation(api.urls.add)
  const addPing = useMutation(api.pings.add)

  const handleAddUrl = () => {
    if (!url.trim()) return
    addUrl({ url })
  }

  const handleCall = async () => {
    if (!selectedUrl) return
    const timestamp = Date.now()
    const start = performance.now()
    let status = 0
    try {
      const response = await fetch(selectedUrl)
      status = response.status
    } catch {
      status = 0
    }
    const duration = performance.now() - start
    const urlId = await addUrl({ url: selectedUrl })
    addPing({ urlId, timestamp, status, duration })
  }

  return (
    <div>
      <input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="Enter a URL"
      />
      <button type="button" onClick={handleAddUrl}>
        Add URL
      </button>
      <select value={selectedUrl} onChange={(e) => setSelectedUrl(e.target.value)}>
        <option value="" disabled>
          Select a URL
        </option>
        {urls.map((u) => (
          <option key={u._id} value={u.url}>
            {u.url}
          </option>
        ))}
      </select>
      <button type="button" onClick={handleCall}>
        Call
      </button>
      <PingChart results={results} />
      <PingList results={results} />
    </div>
  )
}

export default App
