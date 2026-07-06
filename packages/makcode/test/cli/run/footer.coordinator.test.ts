import { expect, test } from "bun:test"
import type { ToolPart } from "@makcode-ai/sdk/v2"
import { communicationLog, laneFiles, laneProgress } from "@/cli/cmd/run/footer.coordinator"
import type { FooterSubagentDetail, FooterSubagentTab, StreamCommit } from "@/cli/cmd/run/types"

function tab(input: Partial<FooterSubagentTab> & { sessionID: string }): FooterSubagentTab {
  return {
    partID: `part-${input.sessionID}`,
    callID: `call-${input.sessionID}`,
    label: "Frontend",
    description: "Build dashboard",
    status: "running",
    lastUpdatedAt: 1,
    ...input,
  }
}

function toolCommit(toolName: string, filePath: string): StreamCommit {
  const part = {
    id: `part-${toolName}-${filePath}`,
    type: "tool",
    sessionID: "s-1",
    messageID: "m-1",
    callID: `call-${filePath}`,
    tool: toolName,
    state: {
      status: "completed",
      input: { filePath },
      output: "",
      title: filePath,
      metadata: {},
      time: { start: 1, end: 2 },
    },
  } as ToolPart

  return {
    kind: "tool",
    text: filePath,
    phase: "final",
    source: "tool",
    messageID: "m-1",
    partID: part.id,
    tool: toolName,
    part,
  }
}

test("laneProgress scales with tool calls and completes at 100", () => {
  expect(laneProgress(undefined)).toBe(0)
  expect(laneProgress(tab({ sessionID: "s-1" }))).toBe(10)
  expect(laneProgress(tab({ sessionID: "s-1", toolCalls: 10 }))).toBe(60)
  expect(laneProgress(tab({ sessionID: "s-1", toolCalls: 40 }))).toBe(90)
  expect(laneProgress(tab({ sessionID: "s-1", status: "completed" }))).toBe(100)
})

test("laneFiles lists recent written files without duplicates", () => {
  const detail: FooterSubagentDetail = {
    sessionID: "s-1",
    commits: [
      toolCommit("read", "/repo/src/ignored.ts"),
      toolCommit("write", "/repo/src/Dashboard.jsx"),
      toolCommit("edit", "/repo/src/ChartCard.jsx"),
      toolCommit("write", "/repo/src/Dashboard.jsx"),
      toolCommit("edit", "/repo/src/ActivityList.jsx"),
    ],
  }

  expect(laneFiles(undefined)).toEqual([])
  expect(laneFiles(detail)).toEqual(["ChartCard.jsx", "Dashboard.jsx", "ActivityList.jsx"])
})

test("communicationLog reports lane status ordered by recency", () => {
  const log = communicationLog([
    tab({ sessionID: "s-1", label: "Frontend", lastUpdatedAt: 3, toolCalls: 10 }),
    tab({ sessionID: "s-2", label: "Backend", status: "completed", lastUpdatedAt: 2 }),
    tab({ sessionID: "s-3", label: "Reviewer", status: "error", lastUpdatedAt: 4 }),
    tab({ sessionID: "s-4", label: "Tester", status: "cancelled", lastUpdatedAt: 1 }),
  ])

  expect(log.map((entry) => entry.text)).toEqual([
    "Backend completed assigned work",
    "Frontend progress 60%",
    "Reviewer needs revision feedback",
  ])
})
