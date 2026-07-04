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

### Agents

MakCode includes two built-in agents you can switch between with the `Tab` key.

- **build** - Default, full-access agent for development work
- **plan** - Read-only agent for analysis and code exploration
  - Denies file edits by default
  - Asks permission before running bash commands
  - Ideal for exploring unfamiliar codebases or planning changes

Also included is a **general** subagent for complex searches and multistep tasks.
This is used internally and can be invoked using `@general` in messages.

Learn more about agents in the MakCode documentation.

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
