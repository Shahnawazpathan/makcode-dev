export * as File from "./file"

import { Revert } from "@makcode-ai/schema/revert"

export const Diff = Revert.FileDiff
export type Diff = typeof Diff.Type
