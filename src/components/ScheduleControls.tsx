import { useState } from "react"
import { useAction, useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"

interface ScheduleControlsProps {
  selectedUrlId?: Id<"urls">
}

function ScheduleControls({ selectedUrlId }: ScheduleControlsProps) {
  const [selectedIntervalId, setSelectedIntervalId] = useState<Id<"intervals"> | undefined>(undefined)
  
  const intervals = useQuery(api.intervals.list) ?? []
  const schedule = useQuery(api.schedules.get, selectedUrlId ? { urlId: selectedUrlId } : "skip")
  const scheduleUrlPinging = useAction(api.pings.schedulePing)
  const unscheduleUrlPinging = useAction(api.pings.unschdulePing)

  const scheduleExists = !!schedule
  const scheduledInterval = schedule
    ? intervals.find((i) => i._id === schedule.intervalId)
    : undefined

  const handleSchedulePings = () => {
    if (!selectedUrlId || !selectedIntervalId) return
    scheduleUrlPinging({ urlId: selectedUrlId, intervalId: selectedIntervalId })
  }

  const handleUnschedulePings = () => {
    if (!selectedUrlId) return
    unscheduleUrlPinging({ urlId: selectedUrlId })
  }

  return (
    <div>
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
              Interval
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
        <button type="button" onClick={handleUnschedulePings}>
          Unschedule (pinging every {scheduledInterval.label})
        </button>
      )}
    </div>
  )
}

export default ScheduleControls
