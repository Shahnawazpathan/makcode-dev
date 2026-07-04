import path from "path"
import { access, mkdir } from "fs/promises"
import { constants, existsSync, statSync } from "fs"
import { parse as parseJsonc } from "jsonc-parser"

export type ProjectType = "single" | "separate"

export type Config = {
  version: 1
  projectType: ProjectType
  rootPath: string
  frontendPath: string | null
  backendPath: string | null
  createdAt: string
  updatedAt: string
}

export type Discovery = {
  directory: string
  file: string
  config: Config
}

export const DIR = ".makcode"
export const CONFIG_FILE = "config.json"

export function configPath(rootPath: string) {
  return path.join(rootPath, DIR, CONFIG_FILE)
}

export function projectMapPath(rootPath: string) {
  return path.join(rootPath, DIR, "project-map.json")
}

export async function validateDirectory(input: string) {
  const resolved = path.resolve(input)
  const info = statSync(resolved)
  if (!info.isDirectory()) throw new Error(`${resolved} is not a directory`)
  await access(resolved, constants.R_OK)
  return resolved
}

export async function create(input: {
  projectType: ProjectType
  rootPath: string
  frontendPath?: string | null
  backendPath?: string | null
  existing?: Config
}) {
  const now = new Date().toISOString()
  const config: Config = {
    version: 1,
    projectType: input.projectType,
    rootPath: await validateDirectory(input.rootPath),
    frontendPath: input.frontendPath ? await validateDirectory(input.frontendPath) : null,
    backendPath: input.backendPath ? await validateDirectory(input.backendPath) : null,
    createdAt: input.existing?.createdAt ?? now,
    updatedAt: now,
  }
  validate(config)
  return config
}

export function validate(config: Config) {
  if (config.version !== 1) throw new Error(`Unsupported MakCode config version: ${config.version}`)
  if (config.projectType !== "single" && config.projectType !== "separate") {
    throw new Error(`Invalid projectType: ${String(config.projectType)}`)
  }
  if (!path.isAbsolute(config.rootPath)) throw new Error("rootPath must be absolute")
  if (config.projectType === "single") {
    if (config.frontendPath !== null || config.backendPath !== null) {
      throw new Error("single project config must not set frontendPath or backendPath")
    }
    return
  }
  if (!config.frontendPath || !path.isAbsolute(config.frontendPath)) {
    throw new Error("separate project config requires an absolute frontendPath")
  }
  if (!config.backendPath || !path.isAbsolute(config.backendPath)) {
    throw new Error("separate project config requires an absolute backendPath")
  }
}

export async function save(config: Config) {
  validate(config)
  await mkdir(path.join(config.rootPath, DIR), { recursive: true })
  await Bun.file(configPath(config.rootPath)).write(JSON.stringify(config, null, 2) + "\n")
}

export async function load(file: string) {
  const data = parseJsonc(await Bun.file(file).text()) as Config
  validate(data)
  await validateDirectory(data.rootPath)
  if (data.frontendPath) await validateDirectory(data.frontendPath)
  if (data.backendPath) await validateDirectory(data.backendPath)
  return data
}

export async function discover(start = process.cwd()): Promise<Discovery | undefined> {
  let current = path.resolve(start)
  for (;;) {
    const file = configPath(current)
    if (existsSync(file)) return { directory: path.join(current, DIR), file, config: await load(file) }
    const parent = path.dirname(current)
    if (parent === current) return
    current = parent
  }
}

export function allowedPaths(config: Config) {
  if (config.projectType === "single") return [config.rootPath]
  return [config.frontendPath, config.backendPath].filter((item): item is string => item !== null)
}

export function contains(config: Config, filepath: string) {
  const resolved = path.resolve(filepath)
  return allowedPaths(config).some((item) => {
    const relative = path.relative(item, resolved)
    return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative))
  })
}

export function commonRoot(paths: string[]) {
  const parts = paths.map((item) => path.resolve(item).split(path.sep).filter(Boolean))
  const prefix: string[] = []
  for (const segment of parts[0] ?? []) {
    if (parts.every((item) => item[prefix.length] === segment)) {
      prefix.push(segment)
      continue
    }
    break
  }
  const root = path.parse(path.resolve(paths[0] ?? process.cwd())).root
  return path.join(root, ...prefix)
}

export function context(config: Config) {
  if (config.projectType === "single") {
    return [
      "This is a single full-stack project.",
      "All backend, frontend, API, database and shared code exist inside:",
      config.rootPath,
      "Perform all work inside this project.",
      "Maintain existing coding conventions.",
      "Reuse existing architecture.",
    ].join("\n")
  }

  return [
    "This is a linked full-stack workspace.",
    "",
    "Frontend:",
    config.frontendPath ?? "",
    "",
    "Backend:",
    config.backendPath ?? "",
    "",
    "These are separate repositories.",
    "Never assume shared filesystem imports.",
    "When implementing features:",
    "1. Create database changes",
    "2. Create backend models",
    "3. Create services",
    "4. Create controllers",
    "5. Create routes",
    "6. Create validation",
    "7. Create frontend pages",
    "8. Create frontend components",
    "9. Create API client integration",
    "10. Update types if needed",
    "11. Reuse existing architecture",
    "12. Follow existing conventions",
    "13. Maintain environment consistency",
  ].join("\n")
}
