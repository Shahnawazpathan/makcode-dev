<h1 align="center">MakCode</h1>

<p align="center">
  The open source AI coding agent for single full-stack projects and linked frontend/backend workspaces.
</p>

---

### Installation

```bash
curl -fsSL https://raw.githubusercontent.com/Shahnawazpathan/makcode-dev/main/install | bash
```

The installer downloads the correct MakCode release binary for your platform
and places it in `~/.local/bin/makcode` by default.

After installing, run:

```sh
makcode
```

#### Installation Directory

Set `MAKCODE_INSTALL_DIR` to choose a different install location:

```bash
MAKCODE_INSTALL_DIR=/usr/local/bin curl -fsSL https://raw.githubusercontent.com/Shahnawazpathan/makcode-dev/main/install | bash
```

Make sure the install directory is in your `PATH`.

### Publishing a Release

Build the current machine's binary:

```bash
cd packages/makcode
bun run script/build.ts --single --skip-embed-web-ui
```

Package the macOS Apple Silicon binary:

```bash
cd packages/makcode
rm -f dist/makcode-darwin-arm64.zip
(cd dist/makcode-darwin-arm64/bin && zip -q ../../makcode-darwin-arm64.zip makcode)
```

Create a GitHub release:

```bash
gh release create v1.0.0 \
  packages/makcode/dist/makcode-darwin-arm64.zip \
  --repo Shahnawazpathan/makcode-dev \
  --title "MakCode v1.0.0"
```

The installer expects release assets named like:

- `makcode-darwin-arm64.zip`
- `makcode-darwin-x64.zip`
- `makcode-linux-arm64.tar.gz`
- `makcode-linux-x64.tar.gz`

### Agents

MakCode includes two built-in agents you can switch between with the `Tab` key.

- **build** - Default, full-access agent for development work
- **plan** - Read-only agent for analysis and code exploration
  - Denies file edits by default
  - Asks permission before running bash commands
  - Ideal for exploring unfamiliar codebases or planning changes

Also included is a **general** subagent for complex searches and multistep tasks.
This is used internally and can be invoked using `@general` in messages.

Learn more about [agents](https://opencode.ai/docs/agents).

### Documentation

For more info on how to configure MakCode, [**head over to our docs**](https://opencode.ai/docs).

---

**Developed by Shahnawaz Pathan**
