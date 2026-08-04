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
    <div className="agg">
      <style>{`
        .agg {
          --bar-good: #0ca30c;
          --bar-critical: #d03b3b;
          --bar-mix: #d99a0b;
          --bar-empty: #b5b4a8;
          --whisker: #6b6a63;
          --baseline: #c3c2b7;
          --muted: #6b6a63;
        }
        @media (prefers-color-scheme: dark) {
          .agg {
            --bar-empty: #4a4a46;
            --baseline: #383835;
            --whisker: #c7c6b3;
            --muted: #9a9990;
          }
        }
      `}</style>

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
