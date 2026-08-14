import type { Id } from "../../../../convex/_generated/dataModel"
import { useAggregationChart } from "../logic/useAggregationChart"
import SlotSizeControls from "./SlotSizeControls"
import SlotVisualisation from "./SlotVisualisation"
import RangeAnnotation from "./RangeAnnotation"

interface AggregationChartProps {
  selectedUrlId?: Id<"urls">
}

function AggregationChart({ selectedUrlId }: AggregationChartProps) {
  const {
    sets,
    selectedSetId,
    selectSet,
    page,
    chartSlots,
    canPageBack,
    canPageForward,
    pageBack,
    pageForward,
  } = useAggregationChart(selectedUrlId)

  if (!selectedUrlId) return null

  return (
    <div>
      <SlotSizeControls sets={sets} selectedSetId={selectedSetId} selectSet={selectSet} />

      <SlotVisualisation
        slots={chartSlots}
        canPageBack={canPageBack}
        canPageForward={canPageForward}
        pageBack={pageBack}
        pageForward={pageForward}
      />

      <RangeAnnotation range={page} />
    </div>
  )
}

export default AggregationChart
