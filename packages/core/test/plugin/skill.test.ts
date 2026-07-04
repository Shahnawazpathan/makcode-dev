import { describe, expect } from "bun:test"
import { Effect, Layer } from "effect"
import { AgentV2 } from "@makcode-ai/core/agent"
import { FSUtil } from "@makcode-ai/core/fs-util"
import { SkillPlugin } from "@makcode-ai/core/plugin/skill"
import { SkillV2 } from "@makcode-ai/core/skill"
import { SkillDiscovery } from "@makcode-ai/core/skill/discovery"
import { testEffect } from "../lib/effect"
import { host } from "./host"

const it = testEffect(
  SkillV2.layer.pipe(
    Layer.provide(FSUtil.defaultLayer),
    Layer.provide(SkillDiscovery.defaultLayer),
    Layer.provideMerge(AgentV2.locationLayer),
  ),
)

describe("SkillPlugin.Plugin", () => {
  it.effect("registers the built-in customize-makcode skill", () =>
    Effect.gen(function* () {
      const skill = yield* SkillV2.Service
      yield* SkillPlugin.Plugin.effect(host({ skill: { ...skill, reload: skill.reload } }))

      expect(yield* skill.list()).toContainEqual(
        expect.objectContaining({
          name: "customize-makcode",
          description: expect.stringContaining("makcode's own configuration"),
        }),
      )
    }),
  )
})
