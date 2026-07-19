import { useAction, useQuery } from "convex/react"
import { api } from "../convex/_generated/api"
import type { Id } from "../convex/_generated/dataModel"

interface PingFormProps {
  selectedUrlId?: Id<"urls">
  onSelectedUrlIdChange: (urlId: Id<"urls"> | undefined) => void
}

function PingForm({ selectedUrlId, onSelectedUrlIdChange }: PingFormProps) {
  const urls = useQuery(api.urls.list) ?? []
  const callUrl = useAction(api.pings.callUrl)

  const handleCall = () => {
    if (!selectedUrlId) return
    callUrl({ urlId: selectedUrlId })
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
