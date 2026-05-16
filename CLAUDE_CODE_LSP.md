# Claude Code LSP scaffold for bash-language-server

This repository includes a minimal Claude Code plugin marketplace scaffold for `bash-language-server`.

## What was added

```text
.claude-plugin/marketplace.json
claude-code-bash-language-server/
  .lsp.json
  plugin.json
```

The plugin does not bundle or build the language server. It follows Claude Code's normal LSP-plugin model: the plugin tells Claude Code how to start an already-installed language server binary.

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

`shellcheck` enables diagnostics. `shfmt` enables formatting. The language server will still start without them, but those features are degraded or unavailable.

## Install in Claude Code from a local checkout

From Claude Code, add this repository as a local marketplace:

```text
/plugin marketplace add /absolute/path/to/bash-language-server-claude-code
/plugin install bash-language-server@bash-language-server-claude-code
/reload-plugins
```

A relative path also works when Claude Code is launched from a suitable directory:

```text
/plugin marketplace add ./bash-language-server-claude-code
```

Claude Code also supports adding marketplaces from GitHub repositories, Git URLs, direct `marketplace.json` paths, and local directories containing `.claude-plugin/marketplace.json`.

## Files activated by the scaffold

The default extension map covers:

- `.sh`
- `.bash`
- `.bats`
- `.command`
- `.inc`
- `.zsh`

The language ID is set to `shellscript`, matching the usual VS Code shell-script language ID. `bash-language-server` mainly analyzes file contents and paths, so this is not expected to be sensitive.

## Configuration notes

The scaffold leaves `settings` empty and relies on `bash-language-server` defaults:

- background analysis max files: `500`
- glob pattern: `**/*@(.sh|.inc|.bash|.command)`
- ShellCheck path: `shellcheck`
- shfmt path: `shfmt`
- ShellCheck external sources: enabled by upstream default

For more deterministic agent runs on very large or heavily cross-sourced script repositories, consider editing `claude-code-bash-language-server/.lsp.json` and adding environment variables such as:

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

Two operational details still matter for untrusted repositories:

1. The server enumerates executables on `PATH` for command completion.
2. Hover documentation for commands can invoke local `help`/`man` lookup through the shell.

That means the runtime trust boundary is the local user environment running Claude Code and the language server, not the repository being analyzed. Keep `PATH` sane and install the plugin only from a trusted copy.

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
