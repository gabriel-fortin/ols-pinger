import { useAction } from "convex/react"
import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"

interface PingOnceButtonProps {
  selectedUrlId?: Id<"urls">
}

function PingOnceButton({ selectedUrlId }: PingOnceButtonProps) {
  const pingUrl = useAction(api.pings.pingUrl)

  const handlePingOnce = () => {
    if (!selectedUrlId) return
    pingUrl({ urlId: selectedUrlId })
  }

  return (
    <button type="button" className="btn" onClick={handlePingOnce}>
      Ping once
    </button>
  )
}

export default PingOnceButton
