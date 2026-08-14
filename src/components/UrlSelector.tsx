import { useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"

interface UrlSelectorProps {
  selectedUrlId?: Id<"urls">
  onSelectedUrlIdChange: (urlId: Id<"urls"> | undefined) => void
}

function UrlSelector({ selectedUrlId, onSelectedUrlIdChange }: UrlSelectorProps) {
  const urls = useQuery(api.urls.list) ?? []

  return (
    <select
      className="select select-bordered"
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
  )
}

export default UrlSelector
