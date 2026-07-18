import { useMutation, useQuery } from "convex/react"
import { api } from "../convex/_generated/api"
import type { Id } from "../convex/_generated/dataModel"

interface PingFormProps {
  selectedUrlId?: Id<"urls">
  onSelectedUrlIdChange: (urlId: Id<"urls"> | undefined) => void
}

function PingForm({ selectedUrlId, onSelectedUrlIdChange }: PingFormProps) {
  const urls = useQuery(api.urls.list) ?? []
  const addPing = useMutation(api.pings.add)

  const handleCall = async () => {
    if (!selectedUrlId) return
    const url = urls.find((u) => u._id === selectedUrlId)?.url
    if (!url) return
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
    addPing({ urlId: selectedUrlId, timestamp, status, duration })
  }

  return (
    <>
      <select
        value={selectedUrlId ?? ""}
        onChange={(e) =>
          onSelectedUrlIdChange(
            e.target.value ? (e.target.value as Id<"urls">) : undefined,
          )
        }
      >
        <option value="" disabled>
          Select a URL
        </option>
        {urls.map((u) => (
          <option key={u._id} value={u._id}>
            {u.url}
          </option>
        ))}
      </select>
      <button type="button" onClick={handleCall}>
        Call
      </button>
    </>
  )
}

export default PingForm
