import type { Doc, Id } from "../../../../convex/_generated/dataModel"

interface SlotSizeControlsProps {
  sets: Doc<"aggregationSet">[]
  selectedSetId: Id<"aggregationSet"> | undefined
  selectSet: (value: string) => void
}

function SlotSizeControls({ sets, selectedSetId, selectSet }: SlotSizeControlsProps) {
  return (
    <div className="mb-2 flex items-center gap-2">
      <span>Each bar represents:</span>
      <select
        className="select select-bordered select-sm"
        value={selectedSetId ?? ""}
        onChange={(e) => selectSet(e.target.value)}
      >
        <option value="" disabled>
          Aggregation
        </option>
        {sets.map((s) => (
          <option key={s._id} value={s._id}>
            {s.label}
          </option>
        ))}
      </select>
    </div>
  )
}

export default SlotSizeControls
