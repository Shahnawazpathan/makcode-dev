interface ImportMetaEnv {
  readonly OPENCODE_CHANNEL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module "virtual:makcode-server" {
  export namespace Server {
    export const listen: typeof import("../../../makcode/dist/types/src/node").Server.listen
    export type Listener = import("../../../makcode/dist/types/src/node").Server.Listener
  }
  export namespace Config {
    export const get: typeof import("../../../makcode/dist/types/src/node").Config.get
    export type Info = import("../../../makcode/dist/types/src/node").Config.Info
  }
  export const bootstrap: typeof import("../../../makcode/dist/types/src/node").bootstrap
}
