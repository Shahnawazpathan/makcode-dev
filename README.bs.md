<p align="center">
  <a href="https://opencode.ai">
    <picture>
      <source srcset="packages/console/app/src/asset/logo-ornate-dark.svg" media="(prefers-color-scheme: dark)">
      <source srcset="packages/console/app/src/asset/logo-ornate-light.svg" media="(prefers-color-scheme: light)">
      <img src="packages/console/app/src/asset/logo-ornate-light.svg" alt="MakCode logo">
    </picture>
  </a>
</p>
<p align="center">MakCode je open source AI agent za programiranje.</p>
<p align="center">
  <a href="https://opencode.ai/discord"><img alt="Discord" src="https://img.shields.io/discord/1391832426048651334?style=flat-square&label=discord" /></a>
  <a href="https://www.npmjs.com/package/makcode-ai"><img alt="npm" src="https://img.shields.io/npm/v/makcode-ai?style=flat-square" /></a>
  <a href="https://github.com/Shahnawazpathan/makcode-dev/actions/workflows/publish.yml"><img alt="Build status" src="https://img.shields.io/github/actions/workflow/status/shahnawaz-pathan/makcode/publish.yml?style=flat-square&branch=dev" /></a>
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

[![MakCode Terminal UI](packages/web/src/assets/lander/screenshot.png)](https://opencode.ai)

---

### Instalacija

```bash
# YOLO
curl -fsSL https://opencode.ai/install | bash

# Package manageri
npm i -g makcode-ai@latest        # ili bun/pnpm/yarn
scoop install makcode             # Windows
choco install makcode             # Windows
brew install shahnawaz-pathan/tap/makcode # macOS i Linux (preporučeno, uvijek ažurno)
brew install makcode              # macOS i Linux (zvanična brew formula, rjeđe se ažurira)
sudo pacman -S makcode            # Arch Linux (Stable)
paru -S makcode-bin               # Arch Linux (Latest from AUR)
mise use -g makcode               # Bilo koji OS
nix run nixpkgs#makcode           # ili github:shahnawaz-pathan/makcode za najnoviji dev branch
```

> [!TIP]
> Ukloni verzije starije od 0.1.x prije instalacije.

### Desktop aplikacija (BETA)

MakCode je dostupan i kao desktop aplikacija. Preuzmi je direktno sa [stranice izdanja](https://github.com/Shahnawazpathan/makcode-dev/releases) ili sa [opencode.ai/download](https://opencode.ai/download).

| Platforma             | Preuzimanje                        |
| --------------------- | ---------------------------------- |
| macOS (Apple Silicon) | `makcode-desktop-mac-arm64.dmg`   |
| macOS (Intel)         | `makcode-desktop-mac-x64.dmg`     |
| Windows               | `makcode-desktop-windows-x64.exe` |
| Linux                 | `.deb`, `.rpm`, ili AppImage       |

```bash
# macOS (Homebrew)
brew install --cask makcode-desktop
# Windows (Scoop)
scoop bucket add extras; scoop install extras/makcode-desktop
```

#### Instalacijski direktorij

Instalacijska skripta koristi sljedeći redoslijed prioriteta za putanju instalacije:

1. `$OPENCODE_INSTALL_DIR` - Prilagođeni instalacijski direktorij
2. `$XDG_BIN_DIR` - Putanja usklađena sa XDG Base Directory specifikacijom
3. `$HOME/bin` - Standardni korisnički bin direktorij (ako postoji ili se može kreirati)
4. `$HOME/.makcode/bin` - Podrazumijevana rezervna lokacija

```bash
# Primjeri
OPENCODE_INSTALL_DIR=/usr/local/bin curl -fsSL https://opencode.ai/install | bash
XDG_BIN_DIR=$HOME/.local/bin curl -fsSL https://opencode.ai/install | bash
```

### Agenti

MakCode uključuje dva ugrađena agenta između kojih možeš prebacivati tasterom `Tab`.

- **build** - Podrazumijevani agent sa punim pristupom za razvoj
- **plan** - Agent samo za čitanje za analizu i istraživanje koda
  - Podrazumijevano zabranjuje izmjene datoteka
  - Traži dozvolu prije pokretanja bash komandi
  - Idealan za istraživanje nepoznatih codebase-ova ili planiranje izmjena

Uključen je i **general** pod-agent za složene pretrage i višekoračne zadatke.
Koristi se interno i može se pozvati pomoću `@general` u porukama.

Saznaj više o [agentima](https://opencode.ai/docs/agents).

### Dokumentacija

Za više informacija o konfiguraciji MakCode-a, [**pogledaj dokumentaciju**](https://opencode.ai/docs).

### Doprinosi

Ako želiš doprinositi MakCode-u, pročitaj [upute za doprinošenje](./CONTRIBUTING.md) prije slanja pull requesta.

### Gradnja na MakCode-u

Ako radiš na projektu koji je povezan s MakCode-om i koristi "makcode" kao dio naziva, npr. "makcode-dashboard" ili "makcode-mobile", dodaj napomenu u svoj README da projekat nije napravio MakCode tim i da nije povezan s nama.

---

**Pridruži se našoj zajednici** [Discord](https://discord.gg/makcode) | [X.com](https://x.com/makcode)
