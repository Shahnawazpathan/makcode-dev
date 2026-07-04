# MakCode CLI

MakCode is an AI coding CLI that runs from your terminal.

## Install

```bash
curl -fsSL https://raw.githubusercontent.com/Shahnawazpathan/makcode-dev/main/install | bash
```

Then run:

```bash
makcode
```

The installer downloads a release binary and installs it to
`~/.local/bin/makcode` by default. Set `MAKCODE_INSTALL_DIR` to choose another
location:

```bash
MAKCODE_INSTALL_DIR=/usr/local/bin curl -fsSL https://raw.githubusercontent.com/Shahnawazpathan/makcode-dev/main/install | bash
```

## Build Locally

```bash
cd packages/makcode
bun run script/build.ts --single --skip-embed-web-ui
./dist/makcode-darwin-arm64/bin/makcode --version
```

## Package a Release Asset

```bash
cd packages/makcode
rm -f dist/makcode-darwin-arm64.zip
(cd dist/makcode-darwin-arm64/bin && zip -q ../../makcode-darwin-arm64.zip makcode)
```
