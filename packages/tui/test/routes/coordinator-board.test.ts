import { expect, test } from "bun:test"
import type { ToolPart } from "@makcode-ai/sdk/v2"
import { laneFromTaskPart, laneProgress } from "../../src/routes/session/coordinator-board"

function taskPart(input: {
  subagent_type?: string
  description?: string
  status?: "running" | "completed" | "error"
  metadata?: Record<string, unknown>
}): ToolPart {
  return {
    id: "part-1",
    type: "tool",
    sessionID: "parent",
    messageID: "msg-1",
    callID: "call-1",
    tool: "task",
    state: {
      status: input.status ?? "running",
      input: {
        subagent_type: input.subagent_type,
        description: input.description,
      },
      metadata: input.metadata ?? { sessionId: "child-1" },
      time: { start: 1000, end: input.status === "running" ? undefined : 2000 },
      ...(input.status === "completed" ? { output: "", title: "" } : {}),
      ...(input.status === "error" ? { error: "failed" } : {}),
    },
  } as unknown as ToolPart
}

test("laneFromTaskPart maps frontend and backend task parts to lanes", () => {
  const lane = laneFromTaskPart(taskPart({ subagent_type: "frontend", description: "Build dashboard UI" }))

  expect(lane).toMatchObject({
    role: "frontend",
    description: "Build dashboard UI",
    status: "running",
    sessionID: "child-1",
  })
})

test("laneFromTaskPart ignores non-lane subagents and non-task tools", () => {
  expect(laneFromTaskPart(taskPart({ subagent_type: "explore" }))).toBeUndefined()

  const bash = { ...taskPart({ subagent_type: "frontend" }), tool: "bash" } as ToolPart
  expect(laneFromTaskPart(bash)).toBeUndefined()
})

test("laneFromTaskPart marks interrupted errors as cancelled", () => {
  const cancelled = laneFromTaskPart(
    taskPart({ subagent_type: "backend", status: "error", metadata: { sessionId: "child-1", interrupted: true } }),
  )
  const failed = laneFromTaskPart(taskPart({ subagent_type: "backend", status: "error" }))

  expect(cancelled?.status).toBe("cancelled")
  expect(failed?.status).toBe("error")
})

test("laneProgress scales with calls and completes at 100", () => {
  const running = laneFromTaskPart(taskPart({ subagent_type: "frontend" }))!
  const done = laneFromTaskPart(taskPart({ subagent_type: "frontend", status: "completed" }))!

  expect(laneProgress(undefined, 5)).toBe(0)
  expect(laneProgress(running, 0)).toBe(10)
  expect(laneProgress(running, 10)).toBe(60)
  expect(laneProgress(running, 100)).toBe(90)
  expect(laneProgress(done, 0)).toBe(100)
})
