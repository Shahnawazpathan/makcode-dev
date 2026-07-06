/** @jsxImportSource @opentui/solid */
import { TextAttributes } from "@opentui/core"
import { For, Show, createMemo } from "solid-js"
import { RunEntryContent } from "./scrollback.writer"
import type { FooterSubagentDetail, FooterSubagentTab, RunPrompt, StreamCommit } from "./types"
import type { RunFooterTheme, RunTheme } from "./theme"

export const COORDINATOR_BOARD_ROWS = 22

const FILE_TOOLS = new Set(["write", "edit", "patch", "multiedit"])

function roleTab(tabs: FooterSubagentTab[], role: string) {
  return tabs.find((item) => item.label.toLowerCase() === role)
}

function roleStatus(tab: FooterSubagentTab | undefined) {
  if (!tab) {
    return "Waiting"
  }

  if (tab.status === "completed") {
    return "Done"
  }

  if (tab.status === "cancelled") {
    return "Cancelled"
  }

  if (tab.status === "error") {
    return "Needs Review"
  }

  return "In Progress"
}

function roleColor(theme: RunFooterTheme, tab: FooterSubagentTab | undefined) {
  if (!tab || tab.status === "cancelled") {
    return theme.muted
  }

  if (tab.status === "error") {
    return theme.error
  }

  return theme.success
}

/** @internal Exported for focused tests. */
export function laneProgress(tab: FooterSubagentTab | undefined) {
  if (!tab) {
    return 0
  }

  if (tab.status === "completed") {
    return 100
  }

  const calls = tab.toolCalls ?? 0
  return Math.min(90, 10 + calls * 5)
}

function progressBar(percent: number, width: number) {
  const cells = Math.max(8, width)
  const filled = Math.round((percent / 100) * cells)
  return "█".repeat(filled) + "─".repeat(cells - filled)
}

/** @internal Exported for focused tests. */
export function laneFiles(detail: FooterSubagentDetail | undefined) {
  if (!detail) {
    return []
  }

  const out: string[] = []
  for (const commit of detail.commits) {
    const part = commit.part
    if (!part || !FILE_TOOLS.has(part.tool)) {
      continue
    }

    const input: Record<string, unknown> = "input" in part.state ? (part.state.input ?? {}) : {}
    const raw = input.filePath ?? input.filepath ?? input.path
    if (typeof raw !== "string" || !raw.trim()) {
      continue
    }

    const name = raw.trim().split(/[\\/]/).pop()!
    const index = out.indexOf(name)
    if (index !== -1) {
      out.splice(index, 1)
    }

    out.push(name)
  }

  return out.slice(-3)
}

function logTime(at: number) {
  const date = new Date(at)
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`
}

function logText(tab: FooterSubagentTab) {
  if (tab.status === "completed") {
    return `${tab.label} completed assigned work`
  }

  if (tab.status === "error") {
    return `${tab.label} needs revision feedback`
  }

  if (tab.status === "cancelled") {
    return `${tab.label} was cancelled`
  }

  return `${tab.label} progress ${laneProgress(tab)}%`
}

/** @internal Exported for focused tests. */
export function communicationLog(tabs: FooterSubagentTab[]) {
  return tabs
    .slice()
    .sort((a, b) => a.lastUpdatedAt - b.lastUpdatedAt)
    .map((tab) => ({ at: tab.lastUpdatedAt, text: logText(tab) }))
    .slice(-3)
}

function firstRequirement(history: RunPrompt[] | undefined, tabs: FooterSubagentTab[]) {
  return (
    history?.find((item) => item.text.trim().length > 0)?.text.trim() ??
    tabs.find((item) => item.description.trim().length > 0)?.description ??
    "Coordinate frontend and backend implementation"
  )
}

function recent(detail: FooterSubagentDetail | undefined) {
  return detail?.commits.filter((item) => item.kind !== "reasoning").slice(-2) ?? []
}

function AgentPanel(props: {
  role: "frontend" | "backend"
  title: string
  icon: string
  tab: FooterSubagentTab | undefined
  detail: FooterSubagentDetail | undefined
  theme: RunTheme
  width: number
}) {
  const footer = createMemo(() => props.theme.footer)
  const commits = createMemo(() => recent(props.detail))
  const files = createMemo(() => laneFiles(props.detail))
  const percent = createMemo(() => laneProgress(props.tab))

  return (
    <box width="100%" height="100%" flexDirection="column" gap={1} paddingLeft={1} paddingRight={1}>
      <box width="100%" height={2} flexDirection="row" gap={1} flexShrink={0}>
        <text fg={footer().highlight} wrapMode="none" flexShrink={0}>
          {props.icon}
        </text>
        <box flexDirection="column" flexGrow={1} flexShrink={1}>
          <text fg={footer().text} attributes={TextAttributes.BOLD} wrapMode="none" truncate>
            {props.title}
          </text>
          <text fg={roleColor(footer(), props.tab)} wrapMode="none" truncate>
            {roleStatus(props.tab)}
          </text>
        </box>
      </box>

      <box width="100%" flexDirection="column" gap={0} flexShrink={0}>
        <text fg={footer().muted} wrapMode="none" truncate>
          TASK ASSIGNED
        </text>
        <box width="100%" height={2} paddingLeft={1} paddingRight={1} backgroundColor={footer().shade}>
          <text fg={footer().text} wrapMode="word">
            {props.tab?.description || `Waiting for ${props.role} task`}
          </text>
        </box>
        <box width="100%" height={1} flexDirection="row">
          <text fg={footer().muted} wrapMode="none" truncate>
            Status: {roleStatus(props.tab)}
          </text>
          <box flexGrow={1} />
          <text fg={roleColor(footer(), props.tab)} wrapMode="none" flexShrink={0}>
            {percent()}%
          </text>
        </box>
        <text fg={footer().highlight} wrapMode="none" truncate>
          {progressBar(percent(), Math.min(24, Math.max(8, props.width - 6)))}
        </text>
      </box>

      <box width="100%" flexDirection="column" gap={0} flexShrink={0}>
        <text fg={footer().muted} wrapMode="none" truncate>
          FILES
        </text>
        <Show
          when={files().length > 0}
          fallback={
            <text fg={footer().muted} wrapMode="none" truncate>
              No files yet
            </text>
          }
        >
          <For each={files()}>
            {(file) => (
              <text fg={footer().text} wrapMode="none" truncate>
                {file}
              </text>
            )}
          </For>
        </Show>
      </box>

      <box width="100%" flexDirection="column" gap={0} flexGrow={1} flexShrink={1}>
        <text fg={footer().muted} wrapMode="none" truncate>
          ACTIVITY
        </text>
        <Show
          when={commits().length > 0}
          fallback={
            <text fg={footer().muted} wrapMode="word">
              No output yet
            </text>
          }
        >
          <For each={commits()}>
            {(commit: StreamCommit) => (
              <RunEntryContent
                commit={commit}
                theme={props.theme}
                opts={{ suppressBackgrounds: true }}
                width={Math.max(16, props.width)}
              />
            )}
          </For>
        </Show>
      </box>

      <box width="100%" height={1} flexDirection="row" flexShrink={0}>
        <text fg={roleColor(footer(), props.tab)} wrapMode="none" truncate>
          {props.tab?.status === "running" ? "Running" : roleStatus(props.tab)}
        </text>
        <box flexGrow={1} />
        <text fg={footer().muted} wrapMode="none" truncate>
          {props.tab?.toolCalls ? `${props.tab.toolCalls} calls` : props.role}
        </text>
      </box>
    </box>
  )
}

export function RunFooterCoordinatorBoard(props: {
  subagent: () => { tabs: FooterSubagentTab[]; details: Record<string, FooterSubagentDetail> }
  history?: RunPrompt[]
  theme: () => RunTheme
  width: () => number
}) {
  const theme = createMemo(() => props.theme())
  const footer = createMemo(() => theme().footer)
  const frontend = createMemo(() => roleTab(props.subagent().tabs, "frontend"))
  const backend = createMemo(() => roleTab(props.subagent().tabs, "backend"))
  const reviewer = createMemo(() => roleTab(props.subagent().tabs, "reviewer"))
  const tester = createMemo(() => roleTab(props.subagent().tabs, "tester"))
  const active = createMemo(() => props.subagent().tabs.filter((item) => item.status === "running"))
  const requirement = createMemo(() => firstRequirement(props.history, props.subagent().tabs))
  const column = createMemo(() => Math.max(20, Math.floor((props.width() - 4) / 3)))
  const log = createMemo(() => communicationLog(props.subagent().tabs))
  const stepState = createMemo(() => {
    const lanes = [frontend(), backend()].filter((item): item is FooterSubagentTab => Boolean(item))
    return {
      assigned: lanes.length > 0,
      reviewing: active().length > 0 || Boolean(reviewer() || tester()),
      done: lanes.length > 0 && lanes.every((item) => item.status === "completed") && active().length === 0,
    }
  })

  return (
    <box width="100%" height={COORDINATOR_BOARD_ROWS} flexDirection="row" gap={1} paddingLeft={1} paddingRight={1}>
      <box width="33%" height="100%" border={true} borderColor={footer().border} backgroundColor={footer().surface}>
        <AgentPanel
          role="frontend"
          title="FRONTEND-AGENT"
          icon="UI"
          tab={frontend()}
          detail={frontend() ? props.subagent().details[frontend()!.sessionID] : undefined}
          theme={theme()}
          width={column()}
        />
      </box>

      <box width="34%" height="100%" border={true} borderColor={footer().highlight} backgroundColor={footer().surface}>
        <box width="100%" height="100%" flexDirection="column" gap={1} paddingLeft={1} paddingRight={1}>
          <box width="100%" alignItems="center" flexDirection="column" flexShrink={0}>
            <text fg={footer().text} attributes={TextAttributes.BOLD} wrapMode="none">
              makcode
            </text>
            <text fg={footer().highlight} wrapMode="none">
              MAIN AGENT
            </text>
          </box>

          <box width="100%" flexDirection="column" gap={0} flexShrink={0}>
            <text fg={footer().muted} wrapMode="none">
              REQUIREMENT
            </text>
            <box width="100%" height={2} paddingLeft={1} paddingRight={1} backgroundColor={footer().shade}>
              <text fg={footer().text} wrapMode="word">
                {requirement()}
              </text>
            </box>
          </box>

          <box width="100%" flexDirection="column" gap={0} flexShrink={0}>
            <text fg={footer().muted} wrapMode="none">
              PLAN & COORDINATION
            </text>
            <text fg={footer().success} wrapMode="none" truncate>
              1. Analyze & break down done
            </text>
            <text fg={stepState().assigned ? footer().success : footer().muted} wrapMode="none" truncate>
              2. Assign to side agents {stepState().assigned ? "done" : "..."}
            </text>
            <text fg={stepState().reviewing ? footer().highlight : footer().muted} wrapMode="none" truncate>
              3. Monitor, review, and test {stepState().reviewing ? "active" : "..."}
            </text>
            <text fg={stepState().done ? footer().success : footer().muted} wrapMode="none" truncate>
              4. Integrate & finalize {stepState().done ? "done" : "..."}
            </text>
          </box>

          <box width="100%" flexDirection="column" gap={0} flexShrink={0}>
            <text fg={reviewer() ? roleColor(footer(), reviewer()) : footer().muted} wrapMode="none" truncate>
              Review: {reviewer() ? roleStatus(reviewer()) : "Pending"}
            </text>
            <text fg={tester() ? roleColor(footer(), tester()) : footer().muted} wrapMode="none" truncate>
              Test: {tester() ? roleStatus(tester()) : "Pending"}
            </text>
          </box>

          <box width="100%" flexDirection="column" gap={0} flexGrow={1} flexShrink={1}>
            <text fg={footer().muted} wrapMode="none">
              COMMUNICATION LOG
            </text>
            <Show
              when={log().length > 0}
              fallback={
                <text fg={footer().text} wrapMode="none" truncate>
                  MakCode analyzing requirement...
                </text>
              }
            >
              <For each={log()}>
                {(entry) => (
                  <text fg={footer().text} wrapMode="none" truncate>
                    {logTime(entry.at)} {entry.text}
                  </text>
                )}
              </For>
            </Show>
          </box>
        </box>
      </box>

      <box width="33%" height="100%" border={true} borderColor={footer().border} backgroundColor={footer().surface}>
        <AgentPanel
          role="backend"
          title="BACKEND-AGENT"
          icon="API"
          tab={backend()}
          detail={backend() ? props.subagent().details[backend()!.sessionID] : undefined}
          theme={theme()}
          width={column()}
        />
      </box>
    </box>
  )
}
