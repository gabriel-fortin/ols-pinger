import { useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"
import ChevronDownIcon from "./ChevronDownIcon"

interface UrlSelectorProps {
  selectedUrlId?: Id<"urls">
  onSelectedUrlIdChange: (urlId: Id<"urls"> | undefined) => void
}

function UrlSelector({ selectedUrlId, onSelectedUrlIdChange }: UrlSelectorProps) {
  const urls = useQuery(api.urls.list) ?? []
  const selectedUrl = urls.find((u) => u._id === selectedUrlId)

  const handleSelect = (urlId: Id<"urls">) => {
    onSelectedUrlIdChange(urlId)
    ;(document.activeElement as HTMLElement | null)?.blur()
  }

  return (
    <div className="dropdown">
      <div tabIndex={0} role="button" className="btn w-64 justify-between">
        {selectedUrl ? selectedUrl.description || selectedUrl.url : "Select a URL"}
        <ChevronDownIcon />
      </div>
      <ul
        tabIndex={0}
        className="dropdown-content menu bg-base-300 rounded-box w-64 p-2 shadow-sm"
      >
        {urls.map((u) => (
          <li key={u._id}>
            <a onClick={() => handleSelect(u._id)}>{u.description || u.url}</a>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default UrlSelector
