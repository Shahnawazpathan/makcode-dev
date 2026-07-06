import { expect, test } from "bun:test"
import type { ToolPart } from "@makcode-ai/sdk/v2"
import { inferLaneRole, laneFromTaskPart, laneProgress } from "../../src/routes/session/coordinator-board"

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

test("laneFromTaskPart ignores unscoped subagents and non-task tools", () => {
  expect(laneFromTaskPart(taskPart({ subagent_type: "explore", description: "Explore app architecture" }))).toBeUndefined()

  const bash = { ...taskPart({ subagent_type: "frontend" }), tool: "bash" } as ToolPart
  expect(laneFromTaskPart(bash)).toBeUndefined()
})

test("inferLaneRole detects lanes from generic agent descriptions", () => {
  expect(inferLaneRole("explore", "Explore mobile frontend module")).toBe("frontend")
  expect(inferLaneRole("explore", "Explore backend mobile endpoints")).toBe("backend")
  expect(inferLaneRole("general", "Check API response times in the server")).toBe("backend")
  expect(inferLaneRole("explore", "Explore app architecture")).toBeUndefined()
  expect(inferLaneRole("explore", "Compare frontend and backend performance")).toBeUndefined()
  expect(inferLaneRole("backend", "anything")).toBe("backend")
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
