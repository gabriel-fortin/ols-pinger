import { useState } from "react"
import { useAction, useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"
import ChevronDownIcon from "./ChevronDownIcon"

interface ScheduleControlsProps {
  selectedUrlId?: Id<"urls">
}

function ScheduleControls({ selectedUrlId }: ScheduleControlsProps) {
  const [selectedIntervalId, setSelectedIntervalId] = useState<Id<"scheduleIntervals"> | undefined>(undefined)
  
  const intervals = useQuery(api.scheduleIntervals.list) ?? []
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

  const handleSelectInterval = (intervalId: Id<"scheduleIntervals">) => {
    setSelectedIntervalId(intervalId)
    ;(document.activeElement as HTMLElement | null)?.blur()
  }

  const selectedInterval = intervals.find((i) => i._id === selectedIntervalId)

  return (
    <div className="flex items-center gap-2">
      {!scheduleExists && (
        <>
          <div className="dropdown">
            <div tabIndex={0} role="button" className="btn">
              {selectedInterval ? selectedInterval.label : "Interval"}
              <ChevronDownIcon />
            </div>
            <ul
              tabIndex={0}
              className="dropdown-content menu bg-base-300 rounded-box p-2 shadow-sm"
            >
              {intervals.map((i) => (
                <li key={i._id}>
                  <a onClick={() => handleSelectInterval(i._id)}>{i.label}</a>
                </li>
              ))}
            </ul>
          </div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSchedulePings}
            disabled={!selectedIntervalId}
          >
            Schedule
          </button>
        </>
      )}
      {scheduleExists && (
        <button type="button" className="btn btn-secondary" onClick={handleUnschedulePings}>
          Unschedule (pinging every {scheduledInterval?.label ?? "?"})
        </button>
      )}
    </div>
  )
}

export default ScheduleControls
