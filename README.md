<p align="center">
  <a href="https://makcode.ai">
    <picture>
      <source srcset="packages/console/app/src/asset/logo-ornate-dark.svg" media="(prefers-color-scheme: dark)">
      <source srcset="packages/console/app/src/asset/logo-ornate-light.svg" media="(prefers-color-scheme: light)">
      <img src="packages/console/app/src/asset/logo-ornate-light.svg" alt="MakCode logo">
    </picture>
  </a>
</p>
<p align="center">The open source AI coding agent.</p>
<p align="center">
  <a href="https://makcode.ai/discord"><img alt="Discord" src="https://img.shields.io/discord/1391832426048651334?style=flat-square&label=discord" /></a>
  <a href="https://www.npmjs.com/package/makcode-ai"><img alt="npm" src="https://img.shields.io/npm/v/makcode-ai?style=flat-square" /></a>
  <a href="https://github.com/shahnawaz-pathan/makcode/actions/workflows/publish.yml"><img alt="Build status" src="https://img.shields.io/github/actions/workflow/status/shahnawaz-pathan/makcode/publish.yml?style=flat-square&branch=dev" /></a>
</p>

<p align="center">
  <a href="README.md">English</a> |
  <a href="README.zh.md">简体中文</a> |
  <a href="README.zht.md">繁體中文</a> |
  <a href="README.ko.md">한국어</a> |
  <a href="README.de.md">Deutsch</a> |
  <a href="README.es.md">Español</a> |
  <a href="README.fr.md">Français</a> |
  <a href="README.it.md">Italiano</a> |
  <a href="README.da.md">Dansk</a> |
  <a href="README.ja.md">日本語</a> |
  <a href="README.pl.md">Polski</a> |
  <a href="README.ru.md">Русский</a> |
  <a href="README.bs.md">Bosanski</a> |
  <a href="README.ar.md">العربية</a> |
  <a href="README.no.md">Norsk</a> |
  <a href="README.br.md">Português (Brasil)</a> |
  <a href="README.th.md">ไทย</a> |
  <a href="README.tr.md">Türkçe</a> |
  <a href="README.uk.md">Українська</a> |
  <a href="README.bn.md">বাংলা</a> |
  <a href="README.gr.md">Ελληνικά</a> |
  <a href="README.vi.md">Tiếng Việt</a>
</p>

[![MakCode Terminal UI](packages/web/src/assets/lander/screenshot.png)](https://makcode.ai)

---

### Installation

```bash
curl -fsSL https://raw.githubusercontent.com/Shahnawazpathan/opencode-dev/main/install | bash
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
MAKCODE_INSTALL_DIR=/usr/local/bin curl -fsSL https://raw.githubusercontent.com/Shahnawazpathan/opencode-dev/main/install | bash
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
  --repo Shahnawazpathan/opencode-dev \
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

Learn more about [agents](https://makcode.ai/docs/agents).

### Documentation

For more info on how to configure MakCode, [**head over to our docs**](https://makcode.ai/docs).

### Contributing

If you're interested in contributing to MakCode, please read our [contributing docs](./CONTRIBUTING.md) before submitting a pull request.

### Building on MakCode

If you are working on a project that's related to MakCode and is using "makcode" as part of its name, for example "makcode-dashboard" or "makcode-mobile", please add a note to your README to clarify that it is not built by the MakCode team and is not affiliated with us in any way.

---

**Developed by Shahnawaz Pathan** | **Join our community** [Discord](https://discord.gg/makcode) | [X.com](https://x.com/makcode)
