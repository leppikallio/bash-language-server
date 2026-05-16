---
description: Safely edit and review Bash, shell, Bats, and zsh scripts using bash-language-server, shfmt, bash/zsh syntax checks, and ShellCheck. Use when modifying shell scripts or reviewing shell-script changes.
---

# Bash Safe Edit

Use this skill when editing or reviewing shell scripts such as `.sh`, `.bash`, `.bats`, `.command`, `.inc`, `.zsh`, `.envrc`, and Bash profile files.

## Workflow

1. Prefer LSP-aware edits and navigation when available: inspect diagnostics, definitions, references, and symbols before making broad changes.
2. Keep edits small. Bash is environment-sensitive, so avoid speculative rewrites that change quoting, expansion, exit-code, or subshell behavior without a reason.
3. After editing, rely on the plugin PostToolUse hook when it fires. It runs `shfmt`, `bash -n` or `zsh -n`, and `shellcheck` when those tools are available.
4. For manual verification, run:

```bash
bash-agent-verify --format --changed
```

Or verify explicit files:

```bash
bash-agent-verify --format path/to/script.sh
```

5. Treat ShellCheck findings as strong signals, but use judgment for intentionally dynamic Bash. If suppressing a ShellCheck diagnostic, add a narrow directive near the relevant line and explain why.

## Boundaries

The verification command does not execute target scripts. It only formats, parses, and statically analyzes them. Do not claim runtime behavior has been proven unless you also ran project tests or an explicit command requested by the user.

For zsh files, `shfmt` and ShellCheck are skipped; `zsh -n` is used when available.
