/** @jsxImportSource @opentui/solid */
import { TextAttributes } from "@opentui/core"
import { For, Show, createMemo } from "solid-js"
import { RunEntryContent } from "./scrollback.writer"
import type { FooterSubagentDetail, FooterSubagentTab, RunPrompt, StreamCommit } from "./types"
import type { RunFooterTheme, RunTheme } from "./theme"

export const COORDINATOR_BOARD_ROWS = 20

function roleTab(tabs: FooterSubagentTab[], role: "frontend" | "backend") {
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

  return "Active"
}

function roleColor(theme: RunFooterTheme, tab: FooterSubagentTab | undefined) {
  if (!tab || tab.status === "cancelled") {
    return theme.muted
  }

  if (tab.status === "error") {
    return theme.error
  }

  if (tab.status === "completed") {
    return theme.success
  }

  return theme.success
}

function firstRequirement(history: RunPrompt[] | undefined, tabs: FooterSubagentTab[]) {
  return (
    history?.find((item) => item.text.trim().length > 0)?.text.trim() ??
    tabs.find((item) => item.description.trim().length > 0)?.description ??
    "Coordinate frontend and backend implementation"
  )
}

function recent(detail: FooterSubagentDetail | undefined) {
  return detail?.commits.filter((item) => item.kind !== "reasoning").slice(-3) ?? []
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

  return (
    <box width="100%" height="100%" flexDirection="column" gap={1} paddingLeft={1} paddingRight={1}>
      <box width="100%" height={3} flexDirection="row" gap={1} flexShrink={0}>
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
        <box width="100%" paddingTop={1} paddingBottom={1} paddingLeft={1} paddingRight={1} backgroundColor={footer().shade}>
          <text fg={footer().text} wrapMode="word">
            {props.tab?.description || `Waiting for ${props.role} task`}
          </text>
        </box>
      </box>

      <box width="100%" flexDirection="column" gap={0} flexGrow={1} flexShrink={1}>
        <text fg={footer().muted} wrapMode="none" truncate>
          ACTIVITY
        </text>
        <box width="100%" flexDirection="column" gap={0} paddingTop={1}>
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
  const active = createMemo(() => props.subagent().tabs.filter((item) => item.status === "running"))
  const requirement = createMemo(() => firstRequirement(props.history, props.subagent().tabs))
  const column = createMemo(() => Math.max(20, Math.floor((props.width() - 4) / 3)))
  const stepState = createMemo(() => ({
    assigned: Boolean(frontend() || backend()),
    reviewing: active().length > 0,
    done: props.subagent().tabs.length > 0 && active().length === 0,
  }))

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
            <box width="100%" paddingTop={1} paddingBottom={1} paddingLeft={1} paddingRight={1} backgroundColor={footer().shade}>
              <text fg={footer().text} wrapMode="word">
                {requirement()}
              </text>
            </box>
          </box>

          <box width="100%" flexDirection="column" gap={0} flexGrow={1} flexShrink={1}>
            <text fg={footer().muted} wrapMode="none">
              PLAN & COORDINATION
            </text>
            <text fg={footer().success} wrapMode="none" truncate>
              1. Analyze & break down done
            </text>
            <text fg={stepState().assigned ? footer().success : footer().muted} wrapMode="none" truncate>
              2. Assign frontend/backend {stepState().assigned ? "done" : "..."}
            </text>
            <text fg={stepState().reviewing ? footer().highlight : footer().muted} wrapMode="none" truncate>
              3. Monitor, review, and test {stepState().reviewing ? "active" : "..."}
            </text>
            <text fg={stepState().done ? footer().success : footer().muted} wrapMode="none" truncate>
              4. Integrate & finalize {stepState().done ? "done" : "..."}
            </text>
          </box>

          <box width="100%" height={3} flexDirection="column" flexShrink={0}>
            <text fg={footer().muted} wrapMode="none">
              COMMUNICATION LOG
            </text>
            <text fg={footer().text} wrapMode="none" truncate>
              MakCode assigned {frontend()?.label ?? "frontend"} and {backend()?.label ?? "backend"} work
            </text>
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
