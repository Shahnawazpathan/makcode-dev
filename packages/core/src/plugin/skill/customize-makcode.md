# Customizing MakCode

Use this built-in skill only when editing MakCode's own configuration,
commands, agents, skills, plugins, MCP servers, or permission rules.

MakCode config is strict. Prefer the published schema at
https://opencode.ai/config.json when confirming exact field names or shapes.

Project files commonly live in:

- `./makcode.json`
- `./makcode.jsonc`
- `.makcode/makcode.json`
- `.makcode/agent/<name>.md`
- `.makcode/command/<name>.md`
- `.makcode/skills/<name>/SKILL.md`

Global files commonly live in:

- `~/.config/makcode/makcode.json`
- `~/.config/makcode/agent/<name>.md`
- `~/.config/makcode/command/<name>.md`
- `~/.config/makcode/skills/<name>/SKILL.md`

After changing MakCode config-time files, tell the user to restart MakCode so
the new configuration is loaded.
