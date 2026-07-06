import type { Argv } from "yargs"
import path from "path"
import readline from "readline"
import { existsSync } from "fs"
import { stdin as input, stdout as output } from "process"
import { cmd } from "./cmd"
import { UI } from "../ui"
import { allowedPaths, commonRoot, context, create, discover, save, validateDirectory, type Config } from "@/workspace/config"
import { context as projectMapContext, loadProjectMap, scan, type ProjectScan } from "@/workspace/scanner"
import { RunCommand } from "./run"

type TaskArgs = {
  message: string
  dryRun?: boolean
  preview?: boolean
  diff?: boolean
}

type VerifyArgs = {
  build?: boolean
}

export const InitCommand = cmd({
  command: "init",
  describe: "run MakCode setup wizard",
  handler: async () => {
    await runWizard()
  },
})

export const RelinkCommand = cmd({
  command: "relink",
  describe: "run MakCode setup wizard again",
  handler: async () => {
    const current = await discover()
    if (current) {
      UI.println(
        UI.Style.TEXT_WARNING_BOLD + "!",
        UI.Style.TEXT_NORMAL + ` updating workspace configuration at ${current.file}`,
      )
    }
    await runWizard(current?.config)
  },
})

export const StatusCommand = cmd({
  command: "status",
  describe: "show MakCode workspace configuration",
  handler: async () => {
    const current = await discover()
    if (!current) {
      UI.println("No MakCode workspace configuration found.")
      UI.println("Run `makcode init` to link this workspace.")
      return
    }

    UI.println("MakCode workspace")
    UI.println(`Config: ${current.file}`)
    UI.println(`Type: ${current.config.projectType}`)
    UI.println(`Root: ${current.config.rootPath}`)
    if (current.config.frontendPath) UI.println(`Frontend: ${current.config.frontendPath}`)
    if (current.config.backendPath) UI.println(`Backend: ${current.config.backendPath}`)
    UI.println(`Updated: ${current.config.updatedAt}`)
  },
})

export const ScanCommand = cmd({
  command: "scan",
  describe: "scan configured MakCode projects",
  handler: async () => {
    const current = await discover()
    if (!current) {
      UI.error("No MakCode workspace configuration found. Run `makcode init` first.")
      process.exitCode = 1
      return
    }

    const map = await scan(current.config)
    UI.println(`Scanned ${map.projects.length} project${map.projects.length === 1 ? "" : "s"}.`)
    UI.println(`Saved: ${path.join(current.config.rootPath, ".makcode", "project-map.json")}`)
  },
})

export const DoctorCommand = cmd({
  command: "doctor",
  describe: "check MakCode workspace health",
  handler: async () => {
    const current = await discover()
    if (!current) {
      UI.error("No MakCode workspace configuration found. Run `makcode init` first.")
      process.exitCode = 1
      return
    }

    const map = await scan(current.config)
    const checks = [
      {
        ok: existsSync(current.file),
        label: "Workspace config",
        detail: current.file,
      },
      {
        ok: allowedPaths(current.config).every((item) => existsSync(item)),
        label: "Linked project paths",
        detail: allowedPaths(current.config).join(", "),
      },
      {
        ok: current.config.projectType === "single" || Boolean(current.config.frontendPath && current.config.backendPath),
        label: "Full-stack linkage",
        detail:
          current.config.projectType === "single"
            ? "single project"
            : `frontend ${current.config.frontendPath}, backend ${current.config.backendPath}`,
      },
      ...map.projects.flatMap((project) => projectChecks(project)),
    ]

    UI.println("MakCode doctor")
    UI.println(`Workspace: ${current.config.rootPath}`)
    checks.forEach((check) => {
      UI.println(
        `${check.ok ? UI.Style.TEXT_SUCCESS_BOLD + "[ok]" : UI.Style.TEXT_DANGER_BOLD + "[x]"}${UI.Style.TEXT_NORMAL} ${check.label}: ${check.detail}`,
      )
    })

    const failed = checks.filter((check) => !check.ok)
    if (failed.length === 0) {
      UI.println("")
      UI.println(UI.Style.TEXT_SUCCESS_BOLD + "Ready" + UI.Style.TEXT_NORMAL + " - workspace looks healthy.")
      return
    }

    process.exitCode = 1
    UI.println("")
    UI.println(UI.Style.TEXT_WARNING_BOLD + "Fix recommended" + UI.Style.TEXT_NORMAL + ` - ${failed.length} check${failed.length === 1 ? "" : "s"} failed.`)
  },
})

export const VerifyCommand = cmd<{}, VerifyArgs>({
  command: "verify",
  describe: "run detected project verification scripts",
  builder: (yargs: Argv) =>
    yargs.option("build", {
      describe: "also run build scripts",
      type: "boolean",
    }),
  handler: async (args) => {
    const current = await discover()
    if (!current) {
      UI.error("No MakCode workspace configuration found. Run `makcode init` first.")
      process.exitCode = 1
      return
    }

    const map = await scan(current.config)
    const jobs = (
      await Promise.all(
        map.projects.map(async (project) => ({
          project,
          scripts: await verificationScripts(project.path, Boolean(args.build)),
        })),
      )
    ).filter((job) => job.scripts.length > 0)

    if (jobs.length === 0) {
      UI.println("No verification scripts found.")
      UI.println("Add package scripts such as typecheck, lint, test, or run `makcode verify --build` when build scripts exist.")
      return
    }

    UI.println("MakCode verify")
    const results = await jobs.reduce(
      async (previous, job) => [
        ...(await previous),
        ...(await job.scripts.reduce(
          async (innerPrevious, script) => [
            ...(await innerPrevious),
            await runVerification(job.project, script),
          ],
          Promise.resolve([] as Array<{ ok: boolean }>),
        )),
      ],
      Promise.resolve([] as Array<{ ok: boolean }>),
    )

    if (results.every((result) => result.ok)) {
      UI.println("")
      UI.println(UI.Style.TEXT_SUCCESS_BOLD + "Verified" + UI.Style.TEXT_NORMAL + " - all detected checks passed.")
      return
    }

    process.exitCode = 1
    UI.println("")
    UI.println(UI.Style.TEXT_DANGER_BOLD + "Failed" + UI.Style.TEXT_NORMAL + " - fix failing checks and run again.")
  },
})

export const TaskCommand = cmd<{}, TaskArgs>({
  command: "task <message>",
  describe: "execute an AI task using MakCode workspace configuration",
  builder: (yargs: Argv) =>
    yargs
      .positional("message", {
        describe: "task to execute",
        type: "string",
        demandOption: true,
      })
      .option("dry-run", {
        describe: "show the workspace-aware task prompt without executing it",
        type: "boolean",
      })
      .option("preview", {
        describe: "require an implementation plan and affected files before edits",
        type: "boolean",
      })
      .option("diff", {
        describe: "request diff-oriented output and rely on edit permission previews",
        type: "boolean",
      }),
  handler: async (args) => {
    const current = await discover()
    if (!current) {
      UI.error("No MakCode workspace configuration found. Run `makcode init` first.")
      process.exitCode = 1
      return
    }

    const map = await loadProjectMap(current.config)
    const prompt = [
      context(current.config),
      map ? projectMapContext(map) : undefined,
      "",
      "Before editing, show an implementation plan, affected files, and reasoning.",
      "Only generate test code when an existing test framework is detected.",
      args.preview ? "Preview mode is enabled: wait for explicit confirmation before applying edits." : undefined,
      args.diff ? "Diff mode is enabled: summarize intended diffs and use patch/edit previews for changes." : undefined,
      "",
      "Task:",
      args.message,
    ]
      .filter((line): line is string => line !== undefined)
      .join("\n")

    if (args.dryRun) {
      UI.println(prompt)
      return
    }

    await RunCommand.handler?.({
      $0: "makcode",
      _: ["run"],
      message: [prompt],
      format: "default",
      mini: false,
      replay: true,
      "dangerously-skip-permissions": false,
      dangerouslySkipPermissions: false,
    } as never)
  },
})

function projectChecks(project: ProjectScan) {
  return [
    {
      ok: Boolean(project.packageManager),
      label: `${project.name} package manager`,
      detail: project.packageManager ?? "not detected",
    },
    {
      ok: true,
      label: `${project.name} framework`,
      detail: project.frameworks.join(", ") || "not detected",
    },
    {
      ok: project.importantFolders.length > 0,
      label: `${project.name} structure`,
      detail: project.importantFolders.join(", ") || "no common source folders detected",
    },
    {
      ok: true,
      label: `${project.name} environment files`,
      detail: project.environmentFiles.map((file) => file.filename).join(", ") || "none detected",
    },
  ]
}

async function verificationScripts(projectPath: string, includeBuild: boolean) {
  const packageJson = await readPackageJson(projectPath)
  const scripts = packageJson?.scripts
  if (!scripts) return []
  return ["typecheck", "lint", "test", includeBuild ? "build" : undefined].filter(
    (script): script is string => script !== undefined && scripts[script] !== undefined,
  )
}

async function readPackageJson(projectPath: string) {
  const file = path.join(projectPath, "package.json")
  if (!existsSync(file)) return
  try {
    return (await Bun.file(file).json()) as { scripts?: Record<string, string> }
  } catch {
    return
  }
}

async function runVerification(project: ProjectScan, script: string) {
  const command = verifyCommand(project.packageManager, script)
  if (!command) {
    UI.println(
      `${UI.Style.TEXT_WARNING_BOLD}!${UI.Style.TEXT_NORMAL} ${project.name} ${script}: package manager not detected`,
    )
    return { ok: false }
  }

  UI.println(`${UI.Style.TEXT_INFO_BOLD}>${UI.Style.TEXT_NORMAL} ${project.name}: ${command.join(" ")}`)
  const proc = Bun.spawn(command, {
    cwd: project.path,
    stdout: "inherit",
    stderr: "inherit",
    stdin: "inherit",
  })
  const ok = (await proc.exited) === 0
  UI.println(
    `${ok ? UI.Style.TEXT_SUCCESS_BOLD + "[ok]" : UI.Style.TEXT_DANGER_BOLD + "[x]"}${UI.Style.TEXT_NORMAL} ${project.name}: ${script}`,
  )
  return { ok }
}

function verifyCommand(packageManager: string | null, script: string) {
  if (!packageManager) return
  return [packageManager, "run", script]
}

export async function ensureWorkspaceOrWizard(project?: string) {
  // Only offer the interactive wizard on a real terminal; piped/scripted
  // invocations must keep upstream behavior and start the TUI directly.
  if (!process.stdin.isTTY || !process.stdout.isTTY) return false
  if (project || (await discover())) return false
  await runWizard()
  return true
}

type LineReader = {
  question: (prompt: string) => Promise<string>
  close: () => void
}

// rl.question loses lines that arrive between questions (piped stdin delivers
// them in one chunk), so buffer every line and hand them out in order.
function createLineReader(): LineReader {
  const rl = readline.createInterface({ input, output })
  const pending: string[] = []
  const waiting: Array<(value: string) => void> = []
  let closed = false
  rl.on("line", (line) => {
    const next = waiting.shift()
    if (next) next(line)
    else pending.push(line)
  })
  rl.on("close", () => {
    closed = true
    while (waiting.length) waiting.shift()!("")
  })
  return {
    question(prompt) {
      output.write(prompt)
      const buffered = pending.shift()
      if (buffered !== undefined) return Promise.resolve(buffered)
      if (closed) return Promise.resolve("")
      return new Promise((resolve) => waiting.push(resolve))
    },
    close() {
      rl.close()
    },
  }
}

export async function runWizard(existing?: Config) {
  const rl = createLineReader()
  try {
    UI.println("--------------------------------")
    UI.println("Welcome to MakCode")
    UI.println("--------------------------------")
    UI.println("Choose your project structure:")
    UI.println("1. Single Project")
    UI.println("2. Separate Frontend + Backend")
    const choice = await ask(rl, "Selection [1]: ", "1")
    const next = choice.trim() === "2" ? await separate(rl, existing) : await single(rl, existing)
    if (existing) {
      const confirmed = (await ask(rl, "Overwrite existing MakCode configuration? [y/N]: ", "n")).toLowerCase()
      if (confirmed !== "y" && confirmed !== "yes") {
        UI.println("MakCode configuration unchanged.")
        return
      }
    }
    await save(next)
    await scan(next)
    UI.println(`MakCode configuration saved to ${path.join(next.rootPath, ".makcode", "config.json")}`)
    UI.println(`Project map saved to ${path.join(next.rootPath, ".makcode", "project-map.json")}`)
  } finally {
    rl.close()
  }
}

async function single(rl: LineReader, existing?: Config) {
  const projectPath = await validateDirectory(await ask(rl, "Project path [current directory]: ", process.cwd()))
  return create({
    projectType: "single",
    rootPath: projectPath,
    frontendPath: null,
    backendPath: null,
    existing,
  })
}

async function separate(rl: LineReader, existing?: Config) {
  UI.println("Which directory are you currently inside?")
  UI.println("1. Frontend")
  UI.println("2. Backend")
  UI.println("3. Neither")
  const current = await ask(rl, "Selection [3]: ", "3")
  const cwd = process.cwd()
  const frontendPath =
    current.trim() === "1"
      ? await validateDirectory(cwd)
      : await askDirectory(rl, "Frontend path", existing?.frontendPath)
  const backendPath =
    current.trim() === "2"
      ? await validateDirectory(cwd)
      : await askDirectory(rl, "Backend path", existing?.backendPath)
  return create({
    projectType: "separate",
    rootPath: commonRoot([frontendPath, backendPath]),
    frontendPath,
    backendPath,
    existing,
  })
}

async function ask(rl: LineReader, prompt: string, fallback: string) {
  const answer = (await rl.question(prompt)).trim()
  return answer || fallback
}

async function askDirectory(rl: LineReader, label: string, fallback?: string | null): Promise<string> {
  const prompt = fallback ? `${label} [${fallback}]: ` : `${label}: `
  const answer = (await rl.question(prompt)).trim()
  const value = answer || fallback
  if (!value) {
    UI.error("A directory path is required.")
    return askDirectory(rl, label, fallback)
  }
  return validateDirectory(value)
}
