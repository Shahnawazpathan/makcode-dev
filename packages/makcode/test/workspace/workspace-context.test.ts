import { describe, expect, test } from "bun:test"
import { mkdir } from "fs/promises"
import path from "path"
import { allowedPaths, commonRoot, contains, context, create, save } from "../../src/workspace/config"
import { context as projectMapContext, loadProjectMap, scan } from "../../src/workspace/scanner"
import { tmpdir } from "../fixture/fixture"

describe("MakCode linked workspace context", () => {
  test("treats configured frontend and backend paths as one full-stack module", async () => {
    await using tmp = await tmpdir({
      init: async (dir) => {
        await Promise.all([
          mkdir(path.join(dir, "frontend"), { recursive: true }),
          mkdir(path.join(dir, "backend"), { recursive: true }),
        ])
        await Promise.all([
          Bun.write(
            path.join(dir, "frontend", "package.json"),
            JSON.stringify({ dependencies: { react: "latest" } }),
          ),
          Bun.write(
            path.join(dir, "backend", "package.json"),
            JSON.stringify({ dependencies: { express: "latest", prisma: "latest" } }),
          ),
        ])
      },
    })

    const config = await create({
      projectType: "separate",
      rootPath: tmp.path,
      frontendPath: path.join(tmp.path, "frontend"),
      backendPath: path.join(tmp.path, "backend"),
    })

    await save(config)
    const map = await scan(config)
    const loaded = await loadProjectMap(config)

    expect(allowedPaths(config)).toEqual([path.join(tmp.path, "frontend"), path.join(tmp.path, "backend")])
    expect(contains(config, path.join(tmp.path, "frontend", "src", "App.tsx"))).toBe(true)
    expect(contains(config, path.join(tmp.path, "backend", "src", "routes.ts"))).toBe(true)
    expect(context(config)).toContain("Treat the frontend and backend as one product module.")
    expect(context(config)).toContain("without waiting for separate frontend instructions")
    expect(map.projects.map((project) => project.name)).toEqual(["frontend", "backend"])
    expect(loaded?.projects.map((project) => project.name)).toEqual(["frontend", "backend"])
    expect(projectMapContext(map)).toContain('"frameworks":')
    expect(projectMapContext(map)).toContain("React")
    expect(projectMapContext(map)).toContain("Express")
    expect(projectMapContext(map)).toContain("Prisma")
  })

  test("computes a shared Windows root without duplicating the drive segment", () => {
    if (process.platform !== "win32") return

    expect(
      commonRoot([
        "C:\\Users\\shahn\\Documents\\Github\\marina-app",
        "C:\\Users\\shahn\\Documents\\Github\\marina",
      ]),
    ).toBe("C:\\Users\\shahn\\Documents\\Github")
  })
})
