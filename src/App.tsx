import { useState } from "react"
import type { Id } from "../convex/_generated/dataModel"
import AggregationChart from "./components/AggregationChart"
import PingOnceButton from "./components/PingOnceButton"
import ScheduleControls from "./components/ScheduleControls"
import UrlSelector from "./components/UrlSelector"

function App() {
  const [selectedUrlId, setSelectedUrlId] = useState<Id<"urls"> | undefined>(undefined)

  return (
    <div className="p-4">
      {/* top panel */}
      <div className="mb-8 flex flex-wrap gap-8">
        <fieldset className="fieldset border-base-300 rounded-box border p-4">
          <legend>First, choose a URL</legend>
          <UrlSelector
            selectedUrlId={selectedUrlId}
            onSelectedUrlIdChange={setSelectedUrlId}
          />
        </fieldset>
        <fieldset className="fieldset border-base-300 rounded-box border p-4 flex gap-10">
          <legend>Second, ping it just once or set up a scheduled ping</legend>
          <PingOnceButton selectedUrlId={selectedUrlId} />
          <ScheduleControls selectedUrlId={selectedUrlId} />
        </fieldset>
      </div>

      {/* aggregated chart */}
      <AggregationChart selectedUrlId={selectedUrlId} />
    </div>
  )
}

export default App
