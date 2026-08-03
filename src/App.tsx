import { useState } from "react"
import type { Id } from "../convex/_generated/dataModel"
import AddUrlForm from "./components/AddUrlForm"
import AggregationChart from "./components/AggregationChart"
import PingChart from "./components/PingChart"
import PingOnceButton from "./components/PingOnceButton"
import ScheduleControls from "./components/ScheduleControls"
import UrlSelector from "./components/UrlSelector"

function App() {
  const [selectedUrlId, setSelectedUrlId] = useState<Id<"urls"> | undefined>(undefined)

  return (
    <div>
      {/* top panel */}
      <div style={{ display: "flex", gap: "2em" }}>
        <AddUrlForm />
        <UrlSelector
          selectedUrlId={selectedUrlId}
          onSelectedUrlIdChange={setSelectedUrlId}
        />
        <PingOnceButton selectedUrlId={selectedUrlId} />
        <ScheduleControls selectedUrlId={selectedUrlId} />
      </div>

      {/* chart */}
      <PingChart selectedUrlId={selectedUrlId} />

      {/* aggregated chart */}
      <AggregationChart selectedUrlId={selectedUrlId} />
    </div>
  )
}

export default App
