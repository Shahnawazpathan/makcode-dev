import { run as runTui, type TuiInput } from "@makcode-ai/tui"
import { Global } from "@makcode-ai/core/global"
import { Effect } from "effect"

export function run(input: TuiInput) {
  return runTui(input).pipe(Effect.provide(Global.defaultLayer))
}
