import type { ReactElement } from "react"
import type { Doc } from "../../../../convex/_generated/dataModel"
import type { ChartSlot } from "../logic/useAggregationChart"

const CHART_HEIGHT = 80

interface SlotVisualisationProps {
  slots: ChartSlot[]
  canPageBack: boolean
  canPageForward: boolean
  pageBack: () => void
  pageForward: () => void
}

function SlotVisualisation({
  slots,
  canPageBack,
  canPageForward,
  pageBack,
  pageForward,
}: SlotVisualisationProps) {
  return (
    <div className="agg-chart-scroll">
      <style>{`
        .agg-chart-scroll {
          overflow-x: auto;
          max-width: 100%;
        }
        .agg-chart {
          display: flex;
          align-items: flex-end;
          gap: 2px;
          height: ${CHART_HEIGHT}px;
          width: 100%;
          border-bottom: 1px solid var(--baseline);
          margin-bottom: 0.7em;
          padding-top:1em;
        }
        .agg-bar-col {
          position: relative;
          flex: 1 1 0;
          min-width: 3px;
          height: 100%;
          display: flex;
          align-items: flex-end;
        }
          .agg-bar-col:has(.ott):after {
            content: '⚠️';
            position: absolute;
            top:-1em;
            left:50%;
            transform: translateX(-50%);
          }
        .agg-bar {
          width: 100%;
          border-radius: 6px 6px 0 0;
        }
        .agg-bar-empty {
          height: 3px;
          background: var(--bar-empty);
        }
        .agg-whisker {
          position: absolute;
          left: calc(50% - 1px);
          width: 2px;
          background: var(--whisker);
        }
      `}</style>
      <div className="agg-chart">
        <BackButton canPageBack={canPageBack} pageBack={pageBack} />
        <Chart chartSlots={slots} />
        <ForwardButton canPageForward={canPageForward} pageForward={pageForward} />
      </div>
    </div>
  )
}

function Chart({ chartSlots }: {
  chartSlots: ChartSlot[],
}): ReactElement[] {
  const maxPingMs = Math.max(...chartSlots.map(x => x.bucket?.pingDurationMsMax ?? 0))
  const restrictedMaxPingMs = Math.min(1000, maxPingMs)
  return chartSlots.map(
    ({ slotStart, bucket }) => {
      const time = new Date(slotStart).toLocaleString("en-GB")
      return !bucket ? EmptyBar(time) : NormalBar(time, restrictedMaxPingMs, bucket)
    }
  )
}

function EmptyBar(time: string) {
  return (
    <div key={time} className="agg-bar-col" title={`${time} — no pings`}>
      <div className="agg-bar agg-bar-empty" />
    </div>
  )
}

function NormalBar(time: string, maxDuration: number, bucket: Doc<"aggregationBuckets">) {
  const min = bucket.pingDurationMsMin
  const max = bucket.pingDurationMsMax
  const avg = bucket.pingDurationMsSum / bucket.pingCount
  const minHeight = (min / maxDuration) * CHART_HEIGHT
  const maxHeight = (max / maxDuration) * CHART_HEIGHT
  let avgHeight = (avg / maxDuration) * CHART_HEIGHT
  const exceedsScale = avgHeight > maxDuration
  if (avgHeight < 3) avgHeight = 3
  if (avgHeight > maxDuration) avgHeight = maxDuration

  return (
    <div
      key={time}
      className="agg-bar-col"
      title={
        `${time}` +
        ` — ${bucket.status}` +
        ` — avg[min/max]: ${avg.toFixed(0)}[${min.toFixed(0)}/${max.toFixed(0)}]ms` +
        ` — ${bucket.pingCount} pings`
      }
    >
      <div
        className="agg-whisker"
        style={{
          bottom: `${minHeight}px`,
          height: `${Math.max(maxHeight - minHeight, 1)}px`,
        }}
      />
      <div
        className={`agg-bar ${exceedsScale && "ott"}`}
        style={{
          height: `${avgHeight}px`,
          background: barColor(bucket.status),
        }}
      />
    </div>
  )
}

function BackButton({ canPageBack, pageBack }: {
  canPageBack: boolean,
  pageBack: () => void,
}): ReactElement {
  return (
    <button type="button" onClick={pageBack} disabled={!canPageBack} title="Earlier"
      style={{ marginRight: "1em" }}>
      ◀
    </button>
  )
}

function ForwardButton({ canPageForward, pageForward }: {
  canPageForward: boolean,
  pageForward: () => void,
}): ReactElement {
  return (
    <button type="button" onClick={pageForward} disabled={!canPageForward} title="Later"
      style={{ marginLeft: "1em" }}>
      {canPageForward ? "▶" : "live"}
    </button>
  )
}

function barColor(status: "success" | "failure" | "mix" | "empty"): string {
  switch (status) {
    case "success":
      return "var(--bar-good)"
    case "failure":
      return "var(--bar-critical)"
    case "empty":
      return "var(--bar-empty)"
    default:
      return "var(--bar-mix)"
  }
}

export default SlotVisualisation
