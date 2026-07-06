import { createMemo, For, Show } from "solid-js"
import type { ToolPart } from "@makcode-ai/sdk/v2"
import { useSync } from "../../context/sync"
import { useTheme } from "../../context/theme"

const FILE_TOOLS = new Set(["write", "edit", "patch", "multiedit"])
const LANE_ROLES = new Set(["frontend", "backend", "reviewer", "tester"])

export type CoordinatorLane = {
  role: string
  description: string
  status: "running" | "completed" | "error" | "cancelled"
  sessionID?: string
  updatedAt: number
}

function stringValue(value: unknown) {
  if (typeof value !== "string") return undefined
  const out = value.trim()
  return out || undefined
}

function partInput(part: ToolPart): Record<string, unknown> {
  return "input" in part.state ? ((part.state.input as Record<string, unknown>) ?? {}) : {}
}

function partMetadata(part: ToolPart): Record<string, unknown> {
  const state = "metadata" in part.state ? (part.state.metadata as Record<string, unknown> | undefined) : undefined
  return state ?? (part.metadata as Record<string, unknown> | undefined) ?? {}
}

function partUpdatedAt(part: ToolPart) {
  if (!("time" in part.state) || !part.state.time) return 0
  const time = part.state.time as { start?: number; end?: number }
  return time.end ?? time.start ?? 0
}

/** @internal Exported for focused tests. */
export function laneFromTaskPart(part: ToolPart): CoordinatorLane | undefined {
  if (part.tool !== "task") return undefined
  const role = stringValue(partInput(part).subagent_type)?.toLowerCase()
  if (!role || !LANE_ROLES.has(role)) return undefined

  const metadata = partMetadata(part)
  const status =
    part.state.status === "completed"
      ? ("completed" as const)
      : part.state.status === "error"
        ? metadata.interrupted === true
          ? ("cancelled" as const)
          : ("error" as const)
        : ("running" as const)

  return {
    role,
    description: stringValue(partInput(part).description) ?? "",
    status,
    sessionID: stringValue(metadata.sessionId) ?? stringValue(metadata.sessionID),
    updatedAt: partUpdatedAt(part),
  }
}

/** @internal Exported for focused tests. */
export function laneProgress(lane: CoordinatorLane | undefined, calls: number) {
  if (!lane) return 0
  if (lane.status === "completed") return 100
  return Math.min(90, 10 + calls * 5)
}

function progressBar(percent: number, cells: number) {
  const filled = Math.round((percent / 100) * cells)
  return "█".repeat(filled) + "─".repeat(cells - filled)
}

function statusLabel(lane: CoordinatorLane | undefined) {
  if (!lane) return "Waiting"
  if (lane.status === "completed") return "Done"
  if (lane.status === "cancelled") return "Cancelled"
  if (lane.status === "error") return "Needs Review"
  return "In Progress"
}

function logTime(at: number) {
  if (!at) return "--:--"
  const date = new Date(at)
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`
}

function laneLog(lane: CoordinatorLane, calls: number) {
  const name = lane.role.charAt(0).toUpperCase() + lane.role.slice(1)
  if (lane.status === "completed") return `${name} completed assigned work`
  if (lane.status === "error") return `${name} needs revision feedback`
  if (lane.status === "cancelled") return `${name} was cancelled`
  return `${name} progress ${laneProgress(lane, calls)}%`
}

export function CoordinatorBoard(props: { sessionID: string }) {
  const sync = useSync()
  const { theme } = useTheme()

  const lanes = createMemo(() => {
    const out = new Map<string, CoordinatorLane>()
    for (const message of sync.data.message[props.sessionID] ?? []) {
      for (const part of sync.data.part[message.id] ?? []) {
        if (part.type !== "tool") continue
        const lane = laneFromTaskPart(part)
        if (!lane) continue
        const current = out.get(lane.role)
        if (!current || lane.updatedAt >= current.updatedAt) out.set(lane.role, lane)
      }
    }
    return out
  })

  const stats = createMemo(() => {
    const out: Record<string, { calls: number; files: string[] }> = {}
    for (const lane of lanes().values()) {
      if (!lane.sessionID) continue
      let calls = 0
      const files: string[] = []
      for (const message of sync.data.message[lane.sessionID] ?? []) {
        for (const part of sync.data.part[message.id] ?? []) {
          if (part.type !== "tool") continue
          calls++
          if (!FILE_TOOLS.has(part.tool)) continue
          const input = partInput(part)
          const raw = stringValue(input.filePath) ?? stringValue(input.filepath) ?? stringValue(input.path)
          if (!raw) continue
          const name = raw.split(/[\\/]/).pop()!
          const index = files.indexOf(name)
          if (index !== -1) files.splice(index, 1)
          files.push(name)
        }
      }
      out[lane.role] = { calls, files: files.slice(-3) }
    }
    return out
  })

  const frontend = createMemo(() => lanes().get("frontend"))
  const backend = createMemo(() => lanes().get("backend"))
  const reviewer = createMemo(() => lanes().get("reviewer"))
  const tester = createMemo(() => lanes().get("tester"))
  const show = createMemo(() => Boolean(frontend() && backend()))

  const requirement = createMemo(() => {
    for (const message of sync.data.message[props.sessionID] ?? []) {
      if (message.role !== "user") continue
      for (const part of sync.data.part[message.id] ?? []) {
        if (part.type === "text" && stringValue(part.text)) return part.text.trim()
      }
    }
    return "Coordinate frontend and backend implementation"
  })

  const log = createMemo(() =>
    [...lanes().values()]
      .toSorted((a, b) => a.updatedAt - b.updatedAt)
      .map((lane) => ({ at: lane.updatedAt, text: laneLog(lane, stats()[lane.role]?.calls ?? 0) }))
      .slice(-3),
  )

  const steps = createMemo(() => {
    const sides = [frontend(), backend()].filter((lane): lane is CoordinatorLane => Boolean(lane))
    const running = [...lanes().values()].some((lane) => lane.status === "running")
    return {
      assigned: sides.length > 0,
      reviewing: running || Boolean(reviewer() || tester()),
      done: sides.length > 0 && sides.every((lane) => lane.status === "completed") && !running,
    }
  })

  function laneColor(lane: CoordinatorLane | undefined) {
    if (!lane || lane.status === "cancelled") return theme.textMuted
    if (lane.status === "error") return theme.error
    return theme.success
  }

  function LanePanel(panel: { role: "frontend" | "backend"; title: string }) {
    const lane = createMemo(() => lanes().get(panel.role))
    const stat = createMemo(() => stats()[panel.role] ?? { calls: 0, files: [] })
    const percent = createMemo(() => laneProgress(lane(), stat().calls))

    return (
      <box width="33%" border={true} borderColor={theme.border} backgroundColor={theme.backgroundPanel}>
        <box paddingLeft={1} paddingRight={1} gap={1} flexGrow={1}>
          <box flexShrink={0}>
            <text fg={theme.text} wrapMode="none" truncate>
              <b>{panel.title}</b>
            </text>
            <text fg={laneColor(lane())} wrapMode="none" truncate>
              {statusLabel(lane())}
            </text>
          </box>

          <box flexShrink={0}>
            <text fg={theme.textMuted} wrapMode="none" truncate>
              TASK ASSIGNED
            </text>
            <box height={2} paddingLeft={1} backgroundColor={theme.backgroundElement}>
              <text fg={theme.text} wrapMode="word">
                {lane()?.description || `Waiting for ${panel.role} task`}
              </text>
            </box>
            <box flexDirection="row">
              <text fg={theme.textMuted} wrapMode="none" truncate>
                Status: {statusLabel(lane())}
              </text>
              <box flexGrow={1} />
              <text fg={laneColor(lane())} wrapMode="none" flexShrink={0}>
                {percent()}%
              </text>
            </box>
            <text fg={theme.accent} wrapMode="none" truncate>
              {progressBar(percent(), 20)}
            </text>
          </box>

          <box flexShrink={0}>
            <text fg={theme.textMuted} wrapMode="none" truncate>
              FILES
            </text>
            <Show
              when={stat().files.length > 0}
              fallback={
                <text fg={theme.textMuted} wrapMode="none" truncate>
                  No files yet
                </text>
              }
            >
              <For each={stat().files}>
                {(file) => (
                  <text fg={theme.text} wrapMode="none" truncate>
                    {file}
                  </text>
                )}
              </For>
            </Show>
          </box>

          <box flexGrow={1} />
          <box flexDirection="row" flexShrink={0}>
            <text fg={laneColor(lane())} wrapMode="none" truncate>
              {lane()?.status === "running" ? "Running" : statusLabel(lane())}
            </text>
            <box flexGrow={1} />
            <text fg={theme.textMuted} wrapMode="none" flexShrink={0}>
              {stat().calls > 0 ? `${stat().calls} calls` : panel.role}
            </text>
          </box>
        </box>
      </box>
    )
  }

  return (
    <Show when={show()}>
      <box flexDirection="row" gap={1} height={18} flexShrink={0} marginBottom={1}>
        <LanePanel role="frontend" title="FRONTEND-AGENT" />

        <box width="34%" border={true} borderColor={theme.accent} backgroundColor={theme.backgroundPanel}>
          <box paddingLeft={1} paddingRight={1} gap={1} flexGrow={1}>
            <box alignItems="center" flexShrink={0}>
              <text fg={theme.text} wrapMode="none">
                <b>makcode</b>
              </text>
              <text fg={theme.accent} wrapMode="none">
                MAIN AGENT
              </text>
            </box>

            <box flexShrink={0}>
              <text fg={theme.textMuted} wrapMode="none">
                REQUIREMENT
              </text>
              <box height={2} paddingLeft={1} backgroundColor={theme.backgroundElement}>
                <text fg={theme.text} wrapMode="word">
                  {requirement()}
                </text>
              </box>
            </box>

            <box flexShrink={0}>
              <text fg={theme.textMuted} wrapMode="none">
                PLAN & COORDINATION
              </text>
              <text fg={theme.success} wrapMode="none" truncate>
                1. Analyze & break down done
              </text>
              <text fg={steps().assigned ? theme.success : theme.textMuted} wrapMode="none" truncate>
                2. Assign to side agents {steps().assigned ? "done" : "..."}
              </text>
              <text fg={steps().reviewing ? theme.accent : theme.textMuted} wrapMode="none" truncate>
                3. Monitor, review, and test {steps().reviewing ? "active" : "..."}
              </text>
              <text fg={steps().done ? theme.success : theme.textMuted} wrapMode="none" truncate>
                4. Integrate & finalize {steps().done ? "done" : "..."}
              </text>
            </box>

            <box flexShrink={0}>
              <text fg={reviewer() ? laneColor(reviewer()) : theme.textMuted} wrapMode="none" truncate>
                Review: {reviewer() ? statusLabel(reviewer()) : "Pending"}
              </text>
              <text fg={tester() ? laneColor(tester()) : theme.textMuted} wrapMode="none" truncate>
                Test: {tester() ? statusLabel(tester()) : "Pending"}
              </text>
            </box>

            <box flexGrow={1}>
              <text fg={theme.textMuted} wrapMode="none">
                COMMUNICATION LOG
              </text>
              <For each={log()}>
                {(entry) => (
                  <text fg={theme.text} wrapMode="none" truncate>
                    {logTime(entry.at)} {entry.text}
                  </text>
                )}
              </For>
            </box>
          </box>
        </box>

        <LanePanel role="backend" title="BACKEND-AGENT" />
      </box>
    </Show>
  )
}
