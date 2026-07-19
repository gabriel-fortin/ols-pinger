import { useAction, useQuery } from "convex/react"
import { api } from "../convex/_generated/api"
import type { Id } from "../convex/_generated/dataModel"

interface PingFormProps {
  selectedUrlId?: Id<"urls">
  onSelectedUrlIdChange: (urlId: Id<"urls"> | undefined) => void
}

function PingForm({ selectedUrlId, onSelectedUrlIdChange }: PingFormProps) {
  const urls = useQuery(api.urls.list) ?? []
  const scheduleExists = !!useQuery(
    api.schedules.get,
    selectedUrlId ? { urlId: selectedUrlId } : "skip",
  )
  const pingUrl = useAction(api.pings.pingUrl)
  const scheduleUrlPinging = useAction(api.pings.schedulePing)
  const unscheduleUrlPinging = useAction(api.pings.unschdulePing)

  const handlePingOnce = () => {
    if (!selectedUrlId) return
    pingUrl({ urlId: selectedUrlId })
  }

  const handleSchedulePings = () => {
    if (!selectedUrlId) return
    scheduleUrlPinging({ urlId: selectedUrlId })
  }

  const handleUnschedulePings = () => {
    if (!selectedUrlId) return
    unscheduleUrlPinging({ urlId: selectedUrlId })
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
      <button type="button" onClick={handlePingOnce}>
        Ping once
      </button>
      {!scheduleExists && (
        <button type="button" onClick={handleSchedulePings}>
          Schedule
        </button>
      )}
      {scheduleExists && (
        <button type="button" onClick={handleUnschedulePings}>
          Unschedule
        </button>
      )}
    </>
  )
}

export default PingForm
