<h1 align="center">MakCode</h1>

<p align="center">
  The open source AI coding agent for single full-stack projects and linked frontend/backend workspaces.
</p>

---

### Installation

#### macOS and Linux

```bash
curl -fsSL https://raw.githubusercontent.com/Shahnawazpathan/makcode-dev/main/install | bash
```

> **Note:** the one-line installer requires this repository to be **public** and at
> least one published release. The installer downloads the correct MakCode release
> binary for your platform and places it in `~/.local/bin/makcode` by default.

#### Windows

```powershell
irm https://raw.githubusercontent.com/Shahnawazpathan/makcode-dev/main/install.ps1 | iex
```

Open a new terminal after installing so the updated `PATH` is available.

After installing, run:

```sh
makcode
```

If `makcode` is not found, make sure `~/.local/bin` is in your `PATH`:

```bash
export PATH="$HOME/.local/bin:$PATH"
```

#### Installation Directory

Set `MAKCODE_INSTALL_DIR` to choose a different install location:

```bash
MAKCODE_INSTALL_DIR=/usr/local/bin curl -fsSL https://raw.githubusercontent.com/Shahnawazpathan/makcode-dev/main/install | bash
```

On Windows:

```powershell
$env:MAKCODE_INSTALL_DIR="$env:LOCALAPPDATA\Programs\MakCode"; irm https://raw.githubusercontent.com/Shahnawazpathan/makcode-dev/main/install.ps1 | iex
```

#### Install from source

```bash
git clone https://github.com/Shahnawazpathan/makcode-dev.git
cd makcode-dev
bun install
cd packages/makcode
bun run build --single
install -m 755 dist/makcode-*/bin/makcode ~/.local/bin/makcode
```

### Workspace Setup

MakCode understands your project structure before every AI task. Running `makcode`
in a new directory on an interactive terminal launches the setup wizard, or run it
directly:

```sh
makcode init      # run the setup wizard (single project, or separate frontend + backend)
makcode status    # show the current workspace configuration
makcode scan      # re-scan configured projects into .makcode/project-map.json
makcode relink    # run the setup wizard again
makcode task "create staff evaluation module"   # run an AI task with workspace context
```

The wizard writes `.makcode/config.json` and `.makcode/project-map.json`. The
project map records the package manager, framework, database/ORM, API style,
important folders, and env file variable names (never values) for each project.

In **separate frontend + backend** mode, MakCode injects both project paths into
the AI context and plans work across both repositories, while blocking edits
outside the configured paths.

### Connect Path (`/connectpath`)

Link a separate frontend and backend project into one full-stack workspace
directly from the TUI — no config editing needed:

1. Open MakCode in either project (e.g. your backend repo) and type `/connectpath`.
2. Paste the path of the other project (e.g. `~/Documents/GitHub/my-frontend`).
3. Choose whether the pasted path is the **frontend** or the **backend**.

MakCode saves the linked workspace and shows a "Full-stack workspace connected"
confirmation with both paths. From then on, every AI task sees both projects as
one product: it plans changes across both sides, keeps API contracts in sync,
and blocks edits outside the configured paths. Use `makcode status` to see the
current link and `makcode relink` to change it.

### Loop Engineering Prompt (automatic)

Every prompt you type is automatically wrapped in a **Loop Engineering Prompt**
before it reaches the model. Instead of treating your message as a casual chat,
the agent treats it as an outcome to achieve and works like a senior engineer:

1. Understand the request and restate the target outcome.
2. Inspect the codebase before editing.
3. Identify affected modules across backend, frontend, database, shared types, tests, config, and docs.
4. Implement the smallest complete change.
5. Add or update focused tests when a test framework exists.
6. Run the most relevant verification commands.
7. If verification fails, read the failure, fix it, and loop until it passes.
8. Stop only when the request is complete or genuinely blocked.

You write `add discount codes to checkout` — MakCode turns it into a full
engineering loop with verification. No special syntax required.

To turn it off and send prompts unchanged, add this to your config:

```json
{
  "loop_engineering": false
}
```

### Multi-Agent Coordination

For full-stack requests, MakCode works as a coordinated team of agents:

- **Main Agent** — analyzes your requirement, breaks it into frontend and
  backend subtasks, assigns them, monitors progress, reviews the results
  against your original request, and integrates the final outcome.
- **frontend** agent — owns UI work: components, state, styling, responsive
  behavior, accessibility, and frontend tests.
- **backend** agent — owns server work: APIs, data models, validation, auth,
  persistence, and integration tests.
- **reviewer** agent — read-only independent code review before finalizing.
- **tester** agent — adds focused tests and runs verification, reporting
  exactly what passed and failed.

If a subagent's work falls short of the requirement, the Main Agent sends it
concrete revision feedback and the subagent reworks it — the loop repeats until
the result is acceptable. This also applies to analysis requests: ask MakCode to
"check my frontend and backend and tell me how to make it fast" and it assigns
each side to its own agent in parallel.

#### Coordinator Board

When frontend and backend lanes are active, a live three-pane board appears
automatically above the prompt — no keypress needed:

```
┌─ FRONTEND-AGENT ─────┐ ┌─ makcode MAIN AGENT ─┐ ┌─ BACKEND-AGENT ──────┐
│ In Progress          │ │ REQUIREMENT          │ │ In Progress          │
│ TASK ASSIGNED        │ │ PLAN & COORDINATION  │ │ TASK ASSIGNED        │
│ Status: 60% ████──   │ │ 1. Analyze      done │ │ Status: 45% ███───   │
│ FILES                │ │ 2. Assign       done │ │ FILES                │
│  Dashboard.tsx       │ │ 3. Review     active │ │  dashboard.service.ts│
│  ChartCard.tsx       │ │ 4. Integrate     ... │ │  routes.ts           │
│                      │ │ Review / Test status │ │                      │
│ Running     12 calls │ │ COMMUNICATION LOG    │ │ Running      8 calls │
└──────────────────────┘ └──────────────────────┘ └──────────────────────┘
```

Each side panel shows the assigned task, live progress percentage, files being
written, and tool-call activity. The center panel tracks the Main Agent's plan
steps, review/test status, and a timestamped communication log. The board stays
on screen with final status after both lanes complete.

### Slash Commands

- `/goal <outcome>` — Goal Mode: drives the full plan → implement → test →
  verify loop for a stated outcome, e.g. `/goal add role-based access to the admin panel`.
- `/audit [module]` — Audit Mode: a real-world architecture, security, and
  product-flow audit across frontend, backend, database, and API contracts —
  for the named module, or the whole workspace if none is given.
- `/connectpath` — link a separate frontend/backend project (see above).
- `/models` — switch model, `/connect` — connect a provider.

### Agents

MakCode includes two top-level agents you can switch between with the `Tab` key.

- **build** - Default, full-access agent for development work
- **plan** - Read-only agent for analysis and code exploration
  - Denies file edits by default
  - Asks permission before running bash commands
  - Ideal for exploring unfamiliar codebases or planning changes

Subagents can also be invoked directly in messages: `@frontend`, `@backend`,
`@reviewer`, `@tester`, and `@general` for complex searches and multistep tasks.

### Auto-Update

MakCode checks GitHub releases on launch and updates itself automatically for
patch releases (set `"autoupdate": "notify"` in your config to only be
notified, or `false` to disable). To update manually at any time, re-run the
install command above — it always installs the latest release.

### Publishing a Release

Releases are built automatically by [GitHub Actions](.github/workflows/release.yml).
Push a version tag and the workflow builds macOS, Linux, and Windows
binaries and attaches them to a GitHub release:

```bash
git tag v2.0.1
git push origin v2.0.1
```

The installer expects release assets named:

- `makcode-darwin-arm64.zip`
- `makcode-darwin-x64.zip`
- `makcode-linux-arm64.tar.gz`
- `makcode-linux-x64.tar.gz`
- `makcode-windows-arm64.zip`
- `makcode-windows-x64.zip`
- `makcode-windows-x64-baseline.zip`

### Documentation

For configuration options and project documentation, see this repository.

---

**Developed by Shahnawaz Pathan**
