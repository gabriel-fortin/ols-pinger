import { useMemo, useState } from "react"
import { useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"
import type { PingResult } from "../PingResult"

const CHART_HEIGHT = 80

const SLICE_OPTIONS = [
  { label: "10s", ms: 10_000 },
  { label: "30s", ms: 30_000 },
  { label: "1m", ms: 60_000 },
  { label: "5m", ms: 300_000 },
  { label: "15m", ms: 900_000 },
  { label: "1h", ms: 3_600_000 },
] as const

interface Slice {
  startMs: number
  count: number
  avgDuration: number
  successCount: number
  failCount: number
}

const isSuccess = (status: number) => status >= 200 && status < 300

/**
 * Groups pings into contiguous, equal-length time slices. Each slice's height is
 * driven by the average `duration` of the pings whose `timestamp` falls in it.
 * Slices with no pings are included as empty entries so the timeline stays a
 * continuous, equal-length axis (rendered as gaps).
 */
function buildSlices(pings: PingResult[], sliceMs: number): Slice[] {
  if (pings.length === 0) return []

  const buckets = new Map<
    number,
    { sum: number; count: number; successCount: number; failCount: number }
  >()
  let firstBucket = Infinity
  let lastBucket = -Infinity

  for (const ping of pings) {
    const bucket = Math.floor(ping.timestamp / sliceMs)
    firstBucket = Math.min(firstBucket, bucket)
    lastBucket = Math.max(lastBucket, bucket)

    const entry = buckets.get(bucket) ?? {
      sum: 0,
      count: 0,
      successCount: 0,
      failCount: 0,
    }
    entry.sum += ping.duration
    entry.count += 1
    if (isSuccess(ping.status)) entry.successCount += 1
    else entry.failCount += 1
    buckets.set(bucket, entry)
  }

  const slices: Slice[] = []
  for (let bucket = firstBucket; bucket <= lastBucket; bucket++) {
    const entry = buckets.get(bucket)
    slices.push({
      startMs: bucket * sliceMs,
      count: entry?.count ?? 0,
      avgDuration: entry ? entry.sum / entry.count : 0,
      successCount: entry?.successCount ?? 0,
      failCount: entry?.failCount ?? 0,
    })
  }
  return slices
}

function sliceColor(successCount: number, failCount: number): string {
  if (failCount === 0) return "var(--bar-good)"
  if (successCount === 0) return "var(--bar-critical)"
  return "var(--bar-mixed)"
}

function sliceTitle(slice: Slice, sliceMs: number): string {
  const start = new Date(slice.startMs).toLocaleString()
  const end = new Date(slice.startMs + sliceMs).toLocaleString()
  if (slice.count === 0) return `${start} – ${end}\nno pings`
  return (
    `${start} – ${end}\n` +
    `${slice.count} ping${slice.count === 1 ? "" : "s"} · avg ${slice.avgDuration.toFixed(0)}ms\n` +
    `${slice.successCount} ok · ${slice.failCount} failed`
  )
}

interface PingChartProps {
  selectedUrlId?: Id<"urls">
}

function PingChart({ selectedUrlId }: PingChartProps) {
  const [sliceMs, setSliceMs] = useState<number>(60_000)

  const results = useQuery(
    api.pings.list,
    selectedUrlId ? { urlId: selectedUrlId } : "skip",
  )

  const slices = useMemo(
    () => buildSlices(results ?? [], sliceMs),
    [results, sliceMs],
  )
  const maxAvg = Math.max(...slices.map((s) => s.avgDuration), 1)

  if (!selectedUrlId) return null

  return (
    <div>
      <style>{`
        .ping-chart-slice {
          margin-bottom: 0.5em;
        }
        .ping-chart-scroll {
          overflow-x: auto;
          max-width: 100%;
        }
        .ping-chart {
          --bar-good: #0ca30c;
          --bar-critical: #d03b3b;
          --bar-mixed: #e08a1e;
          --baseline: #c3c2b7;
          display: flex;
          align-items: flex-end;
          gap: 2px;
          height: ${CHART_HEIGHT}px;
          width: max-content;
          border-bottom: 1px solid var(--baseline);
          margin-right: 1em;
        }
        @media (prefers-color-scheme: dark) {
          .ping-chart {
            --baseline: #383835;
          }
        }
        .ping-bar {
          width: 8px;
          border-radius: 4px 4px 0 0;
          flex-shrink: 0;
        }
      `}</style>
      <div className="ping-chart-slice">
        <span style={{ marginRight: "0.3em" }}>
          Each bar accumulates data worth of
        </span>
        <select
          value={sliceMs}
          onChange={(e) => setSliceMs(Number(e.target.value))}
        >
          {SLICE_OPTIONS.map((option) => (
            <option key={option.ms} value={option.ms}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <div className="ping-chart-scroll">
        <div className="ping-chart">
          {slices.map((slice) => (
            <div
              key={slice.startMs}
              className="ping-bar"
              title={sliceTitle(slice, sliceMs)}
              style={{
                height:
                  slice.count === 0
                    ? 0
                    : `${Math.max((slice.avgDuration / maxAvg) * CHART_HEIGHT, 2)}px`,
                background:
                  slice.count === 0
                    ? "transparent"
                    : sliceColor(slice.successCount, slice.failCount),
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default PingChart
