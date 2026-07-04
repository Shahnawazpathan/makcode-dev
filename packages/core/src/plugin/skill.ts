/// <reference path="../markdown.d.ts" />

export * as SkillPlugin from "./skill"

import { define } from "./internal"
import { Effect } from "effect"
import { AbsolutePath } from "../schema"
import { SkillV2 } from "../skill"
import customizeOpencodeContent from "./skill/customize-makcode.md" with { type: "text" }

export const CustomizeOpencodeContent = customizeOpencodeContent

export const Plugin = define({
  id: "skill",
  effect: Effect.fn(function* (ctx) {
    yield* ctx.skill.transform((draft) => {
      draft.source(
        SkillV2.EmbeddedSource.make({
          type: "embedded",
          skill: SkillV2.Info.make({
            name: "customize-makcode",
            description:
              "Use ONLY when the user is editing or creating makcode's own configuration: makcode.json, makcode.jsonc, files under .makcode/, or files under ~/.config/makcode/. Also use when creating or fixing makcode agents, subagents, commands, skills, plugins, MCP servers, or permission rules. Do not use for the user's own application code, or for any project that is not configuring makcode itself.",
            location: AbsolutePath.make("/builtin/customize-makcode.md"),
            content: CustomizeOpencodeContent,
          }),
        }),
      )
    })
  }),
})
