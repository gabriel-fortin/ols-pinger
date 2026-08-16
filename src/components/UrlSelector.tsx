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
      ; (document.activeElement as HTMLElement | null)?.blur()
  }

  return (
    <div className="dropdown">
      <div tabIndex={0} role="button" className="btn w-64 justify-between">
        {selectedUrl ? selectedUrl.description || selectedUrl.url : "Select a URL"}
        <ChevronDownIcon />
      </div>
      <div
        tabIndex={0}
        className="dropdown-content menu bg-base-300 rounded-box w-64 p-2 shadow-sm"
      >
        <ul>
          <li onClick={() => alert('TODO: adding a URL entry')}>
            <div className="text-primary rounded-none">
              <span className="text-4xl">+</span>
              <span className="italic">Add a URL</span>
            </div>
          </li>
          {urls.map((u) => (
            <li key={u._id} onClick={() => handleSelect(u._id)} className="border-t border-t-base-200">
              <div className="flex flex-row rounded-none pr-0">
                <div className="flex flex-col grow">
                  <div className="font-bold">{u.description}</div>
                  <div className="italic text-xs">{u.url}</div>
                </div>
                <div className="self-stretch my-auto">
                  <EditButton onClick={() => alert('TODO: edit URL entry')} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function EditButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="btn btn-square btn-primary text-primary btn-ghost hover:text-primary-content"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
        viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      >
        {/* Square with rounded edges */}
        <path d="M10 4 h-4 a2 2 0 0 0 -2 2
                        v12 a2 2 0 0 0 2 2
                        h11 a2 2 0 0 0 2 -2
                        v-4" />
        {/* Pencil (moved up/right) */}
        <path d="M19 1l4 4" /> {/* pencil tip connection */}
        <path d="M17 3l-8 8v4h4l8-8z" /> {/* pencil body */}
        <path d="M16 4l4 4" /> {/* pencil highlight line */}
      </svg>
    </button>
  )
}

export default UrlSelector
