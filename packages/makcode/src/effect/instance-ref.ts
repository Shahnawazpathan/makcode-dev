import { Context } from "effect"
import type { InstanceContext } from "@/project/instance-context"
import type { WorkspaceV2 } from "@makcode-ai/core/workspace"

export const InstanceRef = Context.Reference<InstanceContext | undefined>("~makcode/InstanceRef", {
  defaultValue: () => undefined,
})

export const WorkspaceRef = Context.Reference<WorkspaceV2.ID | undefined>("~makcode/WorkspaceRef", {
  defaultValue: () => undefined,
})
