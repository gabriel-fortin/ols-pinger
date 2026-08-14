import type { Doc, Id } from "../../../../convex/_generated/dataModel"
import ChevronDownIcon from "../../ChevronDownIcon"

interface SlotSizeControlsProps {
  sets: Doc<"aggregationSet">[]
  selectedSetId: Id<"aggregationSet"> | undefined
  selectSet: (value: string) => void
}

function SlotSizeControls({ sets, selectedSetId, selectSet }: SlotSizeControlsProps) {
  const selectedSet = sets.find((s) => s._id === selectedSetId)

  const handleSelect = (setId: Id<"aggregationSet">) => {
    selectSet(setId)
    ;(document.activeElement as HTMLElement | null)?.blur()
  }

  return (
    <div className="mb-2 flex items-center gap-2">
      <span>Each bar represents:</span>
      <div className="dropdown">
        <div tabIndex={0} role="button" className="btn">
          {selectedSet ? selectedSet.label : "Aggregation"}
          <ChevronDownIcon />
        </div>
        <ul
          tabIndex={0}
          className="dropdown-content menu bg-base-300 rounded-box p-2 shadow-sm"
        >
          {sets.map((s) => (
            <li key={s._id}>
              <a onClick={() => handleSelect(s._id)}>{s.label}</a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default SlotSizeControls
