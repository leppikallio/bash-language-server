# Claude Code scaffold for bash-language-server

This repository includes a Claude Code plugin marketplace scaffold for `bash-language-server`, plus a small Bash-agent workflow layer built from ShellCheck, shfmt, and syntax checks.

## What was added

```text
.claude-plugin/marketplace.json
claude-code-bash-language-server/
  .claude-plugin/plugin.json
  .lsp.json
  plugin.json
  hooks/hooks.json
  bin/bash-agent-post-edit
  bin/bash-agent-verify
  skills/bash-safe-edit/SKILL.md
scripts/validate-claude-code-lsp.mjs
```

The plugin does not bundle or build the language server. It tells Claude Code how to start an already-installed `bash-language-server` binary and adds deterministic post-edit verification for shell files.

## Install prerequisites

Install Node.js 20+ and the language server binary:

```bash
npm i -g bash-language-server
which bash-language-server
bash-language-server --help
```

Recommended companion tools:

```bash
# macOS
brew install shellcheck shfmt

# Debian/Ubuntu example
sudo apt-get install shellcheck shfmt
```

`shellcheck` enables stronger diagnostics. `shfmt` enables formatting. The LSP will still start without them, but those features are degraded or unavailable.

## Install in Claude Code from a local checkout

From Claude Code, add this repository as a local marketplace:

```text
/plugin marketplace add /absolute/path/to/bash-language-server-claude-code
/plugin install bash-language-server@bash-language-server-claude-code
/reload-plugins
```

For direct development testing with newer Claude Code versions, you can also point Claude Code directly at the plugin directory or ZIP:

```bash
claude --plugin-dir ./claude-code-bash-language-server
claude --plugin-dir ./claude-code-bash-language-server.zip
```

## Files activated by the scaffold

The default extension map covers:

- `.sh`
- `.bash`
- `.bats`
- `.command`
- `.inc`
- `.zsh`

The language ID is set to `shellscript`, matching the usual VS Code shell-script language ID.

## Agent workflow hooks

The plugin includes a `PostToolUse` hook for `Edit`, `Write`, and `MultiEdit`. When Claude edits a shell-looking file, the hook runs:

1. `shfmt -w` when `shfmt` is installed and the file is not zsh
2. `bash -n` for Bash/sh/Bats-style files, or `zsh -n` for zsh files when zsh is available
3. `shellcheck` when installed and the file is not zsh

The hook does **not** execute the edited script. It only formats, parses, and statically analyzes.

If verification fails, the hook returns Claude Code `decision: "block"` for the post-tool event, which does not undo the edit but gives Claude immediate feedback to fix the problem before continuing.

### Manual verification command

The plugin also adds `bin/` commands to Claude Code's Bash-tool PATH while enabled. Use:

```bash
bash-agent-verify --format --changed
```

Or explicit files:

```bash
bash-agent-verify --format scripts/deploy.sh
```

Useful options:

```bash
bash-agent-verify --all
bash-agent-verify --changed
bash-agent-verify --format path/to/file.sh
```

Environment knobs:

```bash
# Disable automatic formatting in the post-edit hook
export BASH_AGENT_SHFMT_ON_HOOK=0

# Extra formatter/linter args
export BASH_AGENT_SHFMT_ARGS="-i 2 -ci"
export BASH_AGENT_SHELLCHECK_ARGS="--severity=warning"

# Allow ShellCheck to follow source statements with -x
export BASH_AGENT_SHELLCHECK_EXTERNAL_SOURCES=1
```

## Skill

The plugin ships a namespaced skill:

```text
/bash-language-server:bash-safe-edit
```

It instructs Claude to use LSP context, keep Bash edits small, and verify with `bash-agent-verify` when appropriate.

## Configuration notes

The scaffold leaves LSP `settings` empty and relies on `bash-language-server` defaults. For more deterministic agent runs on very large or heavily cross-sourced repositories, consider editing `claude-code-bash-language-server/.lsp.json` and adding environment variables such as:

```json
"env": {
  "BASH_IDE_LOG_LEVEL": "warning",
  "BACKGROUND_ANALYSIS_MAX_FILES": "200",
  "SHELLCHECK_EXTERNAL_SOURCES": "false"
}
```

Be aware that `bash-language-server` treats non-log-level environment variables as authoritative and may refuse workspace configuration when they are present.

## Security notes

The language server does not execute the shell scripts it analyzes. It parses scripts with tree-sitter and delegates linting/formatting to `shellcheck` and `shfmt` when available.

The post-edit hook runs local tools with your normal user permissions. It does not add sandboxing. Keep the toolchain trusted and install this plugin only from a trusted copy.

Operational details for untrusted repositories:

1. The language server enumerates executables on `PATH` for command completion.
2. Hover documentation for commands can invoke local `help`/`man` lookup through the shell.
3. The hook can modify edited shell files through `shfmt -w`. Set `BASH_AGENT_SHFMT_ON_HOOK=0` to make it verification-only.
4. ShellCheck external source following is disabled by default in the hook wrapper. Set `BASH_AGENT_SHELLCHECK_EXTERNAL_SOURCES=1` to enable `shellcheck -x`.

## Smoke test

After installation, open a project with a file such as `test.sh`:

```bash
#!/usr/bin/env bash

say_hello() {
  echo "hello $1"
}

say_hello world
```

Expected useful LSP capabilities include document symbols, hover, go-to-definition for local functions/variables, references, rename, diagnostics when ShellCheck is installed, and formatting when shfmt is installed.

Then test the hook command directly:

```bash
bash-agent-verify --format test.sh
```

And validate the package scaffold from the repository root:

```bash
node scripts/validate-claude-code-lsp.mjs
```
