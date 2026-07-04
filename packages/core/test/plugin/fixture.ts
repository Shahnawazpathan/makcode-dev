import { Credential } from "@makcode-ai/core/credential"
import { EventV2 } from "@makcode-ai/core/event"
import { FileSystem } from "@makcode-ai/core/filesystem"
import { FSUtil } from "@makcode-ai/core/fs-util"
import { Global } from "@makcode-ai/core/global"
import { Npm } from "@makcode-ai/core/npm"
import { PluginV2 } from "@makcode-ai/core/plugin"
import { RepositoryCache } from "@makcode-ai/core/repository-cache"
import { Ripgrep } from "@makcode-ai/core/ripgrep"
import { SkillDiscovery } from "@makcode-ai/core/skill/discovery"
import { Effect, Layer } from "effect"
import { tempLocationLayer } from "../fixture/location"

export const PluginTestLayer = Layer.mergeAll(FileSystem.locationLayer, PluginV2.locationLayer).pipe(
  Layer.provideMerge(
    Layer.mergeAll(
      Credential.defaultLayer,
      EventV2.defaultLayer,
      FSUtil.defaultLayer,
      Global.defaultLayer,
      Layer.succeed(
        Npm.Service,
        Npm.Service.of({
          add: () => Effect.succeed({ directory: "", entrypoint: undefined }),
          install: () => Effect.void,
          which: () => Effect.succeed(undefined),
        }),
      ),
      RepositoryCache.defaultLayer,
      SkillDiscovery.defaultLayer,
      Ripgrep.defaultLayer,
      tempLocationLayer,
    ),
  ),
)
