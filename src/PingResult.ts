import type { Id } from "../convex/_generated/dataModel"

export interface PingResult {
  _id: Id<"pings">
  url: string
  timestamp: number
  status: number
  duration: number
}
