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
    <div className="max-w-full overflow-x-auto">
      <div
        className="mb-3 flex w-full items-end gap-0.5 border-b border-base-300 pt-4"
        style={{ height: `${CHART_HEIGHT}px` }}
      >
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
    <div key={time} className="relative flex h-full min-w-[3px] flex-1 items-end" title={`${time} — no pings`}>
      <div className="h-[3px] w-full rounded-t-md bg-neutral" />
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
      className="relative flex h-full min-w-[3px] flex-1 items-end"
      title={
        `${time}` +
        ` — ${bucket.status}` +
        ` — avg[min/max]: ${avg.toFixed(0)}[${min.toFixed(0)}/${max.toFixed(0)}]ms` +
        ` — ${bucket.pingCount} pings`
      }
    >
      {exceedsScale && (
        <span className="absolute -top-4 left-1/2 -translate-x-1/2">⚠️</span>
      )}
      {/* whisker */}
      <div
        className="absolute left-1/2 w-0.5 -translate-x-1/2 bg-base-content/50"
        style={{
          bottom: `${minHeight}px`,
          height: `${Math.max(maxHeight - minHeight, 1)}px`,
        }}
      />
      {/* bar */}
      <div
        className={`w-full rounded-t-md ${barColor(bucket.status)}`}
        style={{ height: `${avgHeight}px` }}
      />
    </div>
  )
}

function BackButton({ canPageBack, pageBack }: {
  canPageBack: boolean,
  pageBack: () => void,
}): ReactElement {
  return (
    <button
      type="button"
      className="btn btn-sm mr-4"
      onClick={pageBack}
      disabled={!canPageBack}
      title="Earlier"
    >
      ◀
    </button>
  )
}

function ForwardButton({ canPageForward, pageForward }: {
  canPageForward: boolean,
  pageForward: () => void,
}): ReactElement {
  return (
    <button
      type="button"
      className="btn btn-sm ml-4"
      onClick={pageForward}
      disabled={!canPageForward}
      title="Later"
    >
      {canPageForward ? "▶" : "live"}
    </button>
  )
}

function barColor(status: "success" | "failure" | "mix" | "empty"): string {
  switch (status) {
    case "success":
      return "bg-success"
    case "failure":
      return "bg-error"
    case "empty":
      return "bg-neutral"
    default:
      return "bg-warning"
  }
}

export default SlotVisualisation
