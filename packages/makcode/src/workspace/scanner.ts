import path from "path"
import { existsSync, readdirSync, statSync } from "fs"
import { projectMapPath, type Config } from "./config"

type ProjectScan = {
  name: "root" | "frontend" | "backend"
  path: string
  packageManager: string | null
  frameworks: string[]
  database: string[]
  apiStyle: string[]
  importantFolders: string[]
  environmentFiles: Array<{
    filename: string
    location: string
    variables: string[]
  }>
}

export type ProjectMap = {
  version: 1
  generatedAt: string
  projectType: Config["projectType"]
  rootPath: string
  projects: ProjectScan[]
}

const importantFolders = [
  "app",
  "pages",
  "src",
  "components",
  "controllers",
  "routes",
  "services",
  "models",
  "migrations",
  "entities",
  "schemas",
  "hooks",
  "stores",
  "middleware",
  "config",
  "public",
  "assets",
  "tests",
]

const envFiles = [".env", ".env.local", ".env.development", ".env.production"]

export async function scan(config: Config) {
  const map: ProjectMap = {
    version: 1,
    generatedAt: new Date().toISOString(),
    projectType: config.projectType,
    rootPath: config.rootPath,
    projects:
      config.projectType === "single"
        ? [await scanProject("root", config.rootPath)]
        : [await scanProject("frontend", config.frontendPath!), await scanProject("backend", config.backendPath!)],
  }
  await Bun.file(projectMapPath(config.rootPath)).write(JSON.stringify(map, null, 2) + "\n")
  return map
}

export async function loadProjectMap(config: Config) {
  const file = projectMapPath(config.rootPath)
  if (!existsSync(file)) return
  return (await Bun.file(file).json()) as ProjectMap
}

export function context(map: ProjectMap) {
  return [
    "MakCode project map:",
    JSON.stringify(
      {
        projectType: map.projectType,
        projects: map.projects.map((project) => ({
          name: project.name,
          path: project.path,
          packageManager: project.packageManager,
          frameworks: project.frameworks,
          database: project.database,
          apiStyle: project.apiStyle,
          importantFolders: project.importantFolders,
          environmentFiles: project.environmentFiles.map((file) => ({
            filename: file.filename,
            location: file.location,
            variables: file.variables,
          })),
        })),
      },
      null,
      2,
    ),
  ].join("\n")
}

async function scanProject(name: ProjectScan["name"], projectPath: string): Promise<ProjectScan> {
  const packageJson = await readPackageJson(projectPath)
  const text = await gatherText(projectPath)
  const dependencyNames = Object.keys({
    ...(packageJson?.dependencies ?? {}),
    ...(packageJson?.devDependencies ?? {}),
  })

  return {
    name,
    path: projectPath,
    packageManager: packageManager(projectPath),
    frameworks: detectFrameworks(dependencyNames, text),
    database: detectDatabase(dependencyNames, text, projectPath),
    apiStyle: detectApiStyle(dependencyNames, text),
    importantFolders: importantFolders.filter((folder) => existsSync(path.join(projectPath, folder))),
    environmentFiles: (
      await Promise.all(
        envFiles.map(async (file) => {
          const location = path.join(projectPath, file)
          if (!existsSync(location)) return
          return {
            filename: file,
            location,
            variables: await readEnvVariables(location),
          }
        }),
      )
    ).filter((item): item is ProjectScan["environmentFiles"][number] => item !== undefined),
  }
}

function packageManager(projectPath: string) {
  if (existsSync(path.join(projectPath, "bun.lock"))) return "bun"
  if (existsSync(path.join(projectPath, "pnpm-lock.yaml"))) return "pnpm"
  if (existsSync(path.join(projectPath, "yarn.lock"))) return "yarn"
  if (existsSync(path.join(projectPath, "package-lock.json"))) return "npm"
  if (existsSync(path.join(projectPath, "package.json"))) return "npm"
  return null
}

async function readPackageJson(projectPath: string) {
  const file = path.join(projectPath, "package.json")
  if (!existsSync(file)) return
  try {
    return JSON.parse(await Bun.file(file).text()) as {
      dependencies?: Record<string, string>
      devDependencies?: Record<string, string>
    }
  } catch {
    return
  }
}

function detectFrameworks(dependencies: string[], text: string) {
  return unique([
    dependencies.includes("next") ? "Next.js" : undefined,
    dependencies.includes("react") ? "React" : undefined,
    dependencies.includes("vue") ? "Vue" : undefined,
    dependencies.includes("@angular/core") ? "Angular" : undefined,
    dependencies.includes("express") ? "Express" : undefined,
    dependencies.includes("@nestjs/core") ? "NestJS" : undefined,
    existsText(text, "laravel/framework", "artisan") ? "Laravel" : undefined,
    existsText(text, "django", "manage.py") ? "Django" : undefined,
    existsText(text, "fastapi") ? "FastAPI" : undefined,
  ])
}

function detectDatabase(dependencies: string[], text: string, projectPath: string) {
  return unique([
    dependencies.includes("prisma") ||
    dependencies.includes("@prisma/client") ||
    existsSync(path.join(projectPath, "prisma"))
      ? "Prisma"
      : undefined,
    dependencies.includes("sequelize") ? "Sequelize" : undefined,
    dependencies.includes("typeorm") ? "TypeORM" : undefined,
    dependencies.includes("drizzle-orm") ? "Drizzle" : undefined,
    existsText(text, "database/migrations") ? "Laravel Migrations" : undefined,
    existsText(text, "sqlalchemy") ? "SQLAlchemy" : undefined,
    existsText(text, "Microsoft.EntityFrameworkCore") ? "Entity Framework" : undefined,
  ])
}

function detectApiStyle(dependencies: string[], text: string) {
  return unique([
    existsText(text, "router.", "app.get(", "app.post(", "@Controller", "Route::") ? "REST" : undefined,
    dependencies.includes("graphql") || existsText(text, "GraphQL", "gql`", ".graphql") ? "GraphQL" : undefined,
    dependencies.includes("@trpc/server") || existsText(text, "t.procedure", "createTRPCRouter") ? "RPC" : undefined,
  ])
}

async function gatherText(projectPath: string) {
  const files = [
    "package.json",
    "composer.json",
    "requirements.txt",
    "pyproject.toml",
    "Pipfile",
    "manage.py",
    "artisan",
    "Gemfile",
    "go.mod",
    "pom.xml",
    "build.gradle",
    "csproj",
  ]
  return (
    await Promise.all(
      files
        .flatMap((file) => findFiles(projectPath, file, 2))
        .map(async (file) => {
          try {
            return await Bun.file(file).text()
          } catch {
            return ""
          }
        }),
    )
  ).join("\n")
}

function findFiles(dir: string, filename: string, depth: number): string[] {
  if (depth < 0 || !existsSync(dir)) return []
  const entries = safeReaddir(dir)
  return entries.flatMap((entry) => {
    if (entry === "node_modules" || entry === ".git" || entry === ".makcode") return []
    const full = path.join(dir, entry)
    const stat = safeStat(full)
    if (!stat) return []
    if (stat.isFile() && (entry === filename || entry.endsWith(filename))) return [full]
    if (!stat.isDirectory()) return []
    return findFiles(full, filename, depth - 1)
  })
}

async function readEnvVariables(file: string) {
  try {
    return (await Bun.file(file).text())
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => line.slice(0, line.indexOf("=")).trim())
      .filter((key) => /^[A-Za-z_][A-Za-z0-9_]*$/.test(key))
  } catch {
    return []
  }
}

function existsText(text: string, ...needles: string[]) {
  const lower = text.toLowerCase()
  return needles.some((needle) => lower.includes(needle.toLowerCase()))
}

function unique(items: Array<string | undefined>) {
  return Array.from(new Set(items.filter((item): item is string => item !== undefined)))
}

function safeReaddir(dir: string) {
  try {
    return readdirSync(dir)
  } catch {
    return []
  }
}

function safeStat(file: string) {
  try {
    return statSync(file)
  } catch {
    return
  }
}
