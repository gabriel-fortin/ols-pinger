import { useState } from "react"
import { useAction, useQuery } from "convex/react"
import { api } from "../convex/_generated/api"
import type { Id } from "../convex/_generated/dataModel"

interface PingFormProps {
  selectedUrlId?: Id<"urls">
  onSelectedUrlIdChange: (urlId: Id<"urls"> | undefined) => void
}

function PingForm({ selectedUrlId, onSelectedUrlIdChange }: PingFormProps) {
  const urls = useQuery(api.urls.list) ?? []
  const intervals = useQuery(api.intervals.list) ?? []
  const [selectedIntervalId, setSelectedIntervalId] = useState<
    Id<"intervals"> | undefined
  >(undefined)
  const schedule = useQuery(
    api.schedules.get,
    selectedUrlId ? { urlId: selectedUrlId } : "skip",
  )
  const scheduleExists = !!schedule
  const scheduledInterval = schedule
    ? intervals.find((i) => i._id === schedule.intervalId)
    : undefined
  const pingUrl = useAction(api.pings.pingUrl)
  const scheduleUrlPinging = useAction(api.pings.schedulePing)
  const unscheduleUrlPinging = useAction(api.pings.unschdulePing)

  const handlePingOnce = () => {
    if (!selectedUrlId) return
    pingUrl({ urlId: selectedUrlId })
  }

  const handleSchedulePings = () => {
    if (!selectedUrlId || !selectedIntervalId) return
    scheduleUrlPinging({ urlId: selectedUrlId, intervalId: selectedIntervalId })
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
        <>
          <select
            value={selectedIntervalId ?? ""}
            onChange={(e) =>
              setSelectedIntervalId(
                e.target.value ? (e.target.value as Id<"intervals">) : undefined,
              )
            }
          >
            <option value="" disabled>
              Select an interval
            </option>
            {intervals.map((i) => (
              <option key={i._id} value={i._id}>
                {i.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleSchedulePings}
            disabled={!selectedIntervalId}
          >
            Schedule
          </button>
        </>
      )}
      {scheduleExists && (
        <>
          <span>{scheduledInterval?.label ?? "Unknown interval"}</span>
          <button type="button" onClick={handleUnschedulePings}>
            Unschedule
          </button>
        </>
      )}
    </>
  )
}

export default PingForm
