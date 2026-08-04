import type { Doc, Id } from "../../../../convex/_generated/dataModel"

interface SlotSizeControlsProps {
  sets: Doc<"aggregationSet">[]
  selectedSetId: Id<"aggregationSet"> | undefined
  selectSet: (value: string) => void
}

function SlotSizeControls({ sets, selectedSetId, selectSet }: SlotSizeControlsProps) {
  return (
    <>
      <span style={{ marginRight: "0.5em" }}>
        Each bar represents:
      </span>
      <select value={selectedSetId ?? ""} onChange={(e) => selectSet(e.target.value)}>
        <option value="" disabled>
          Aggregation
        </option>
        {sets.map((s) => (
          <option key={s._id} value={s._id}>
            {s.label}
          </option>
        ))}
      </select>
    </>
  )
}

export default SlotSizeControls
