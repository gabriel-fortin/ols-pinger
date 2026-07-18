import { useState } from "react"
import type { Id } from "../convex/_generated/dataModel"
import AddUrlForm from "./AddUrlForm"
import PingForm from "./PingForm"
import PingChart from "./PingChart"
import PingList from "./PingList"

function App() {
  const [selectedUrlId, setSelectedUrlId] = useState<Id<"urls"> | undefined>(undefined)

  return (
    <div>
      <AddUrlForm />
      <PingForm
        selectedUrlId={selectedUrlId}
        onSelectedUrlIdChange={setSelectedUrlId}
      />
      <PingChart selectedUrlId={selectedUrlId} />
      <PingList selectedUrlId={selectedUrlId} />
    </div>
  )
}

export default App
