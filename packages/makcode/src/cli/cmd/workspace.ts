import type { Argv } from "yargs"
import path from "path"
import readline from "readline/promises"
import { stdin as input, stdout as output } from "process"
import { cmd } from "./cmd"
import { UI } from "../ui"
import { commonRoot, context, create, discover, save, validateDirectory, type Config } from "@/workspace/config"
import { scan } from "@/workspace/scanner"
import { RunCommand } from "./run"

type TaskArgs = {
  message: string
  dryRun?: boolean
  preview?: boolean
  diff?: boolean
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

    const prompt = [
      context(current.config),
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

export async function ensureWorkspaceOrWizard(project?: string) {
  if (project || (await discover())) return false
  await runWizard()
  return true
}

export async function runWizard(existing?: Config) {
  const rl = readline.createInterface({ input, output })
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

async function single(rl: readline.Interface, existing?: Config) {
  const projectPath = await validateDirectory(await ask(rl, "Project path [current directory]: ", process.cwd()))
  return create({
    projectType: "single",
    rootPath: projectPath,
    frontendPath: null,
    backendPath: null,
    existing,
  })
}

async function separate(rl: readline.Interface, existing?: Config) {
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

async function ask(rl: readline.Interface, prompt: string, fallback: string) {
  const answer = (await rl.question(prompt)).trim()
  return answer || fallback
}

async function askDirectory(rl: readline.Interface, label: string, fallback?: string | null): Promise<string> {
  const prompt = fallback ? `${label} [${fallback}]: ` : `${label}: `
  const answer = (await rl.question(prompt)).trim()
  const value = answer || fallback
  if (!value) {
    UI.error("A directory path is required.")
    return askDirectory(rl, label, fallback)
  }
  return validateDirectory(value)
}
