import { useState } from "react"
import type { Id } from "../convex/_generated/dataModel"
import AddUrlForm from "./components/AddUrlForm"
import AggregationChart from "./components/AggregationChart"
import PingOnceButton from "./components/PingOnceButton"
import ScheduleControls from "./components/ScheduleControls"
import UrlSelector from "./components/UrlSelector"

function App() {
  const [selectedUrlId, setSelectedUrlId] = useState<Id<"urls"> | undefined>(undefined)

  return (
    <div className="p-4">
      {/* top panel */}
      <div className="mb-6 flex flex-wrap items-end gap-8">
        <AddUrlForm />
        <UrlSelector
          selectedUrlId={selectedUrlId}
          onSelectedUrlIdChange={setSelectedUrlId}
        />
        <PingOnceButton selectedUrlId={selectedUrlId} />
        <ScheduleControls selectedUrlId={selectedUrlId} />
      </div>

      {/* aggregated chart */}
      <AggregationChart selectedUrlId={selectedUrlId} />
    </div>
  )
}

export default App
