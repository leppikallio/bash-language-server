#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const marketplacePath = path.join(root, ".claude-plugin", "marketplace.json");
const pluginDir = path.join(root, "claude-code-bash-language-server");
const lspPath = path.join(pluginDir, ".lsp.json");
const legacyPluginPath = path.join(pluginDir, "plugin.json");
const modernPluginPath = path.join(pluginDir, ".claude-plugin", "plugin.json");
const hooksPath = path.join(pluginDir, "hooks", "hooks.json");
const hookScriptPath = path.join(pluginDir, "bin", "bash-agent-post-edit");
const verifyScriptPath = path.join(pluginDir, "bin", "bash-agent-verify");
const skillPath = path.join(pluginDir, "skills", "bash-safe-edit", "SKILL.md");

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function fail(msg) {
  console.error(`validate-claude-code-lsp failed: ${msg}`);
  process.exit(1);
}

for (const p of [marketplacePath, legacyPluginPath, modernPluginPath, lspPath, hooksPath, hookScriptPath, verifyScriptPath, skillPath]) {
  if (!fs.existsSync(p)) fail(`missing ${path.relative(root, p)}`);
}

const marketplace = readJson(marketplacePath);
const lsp = readJson(lspPath);
const modernPlugin = readJson(modernPluginPath);
const hooks = readJson(hooksPath);

if (!Array.isArray(marketplace.plugins) || marketplace.plugins.length !== 1) {
  fail("marketplace must contain exactly one plugin entry");
}

const plugin = marketplace.plugins[0];
if (plugin.source !== "./claude-code-bash-language-server") {
  fail("marketplace plugin source must be ./claude-code-bash-language-server");
}

if (JSON.stringify(plugin.lspServers) !== JSON.stringify(lsp)) {
  fail("marketplace lspServers is stale compared with claude-code-bash-language-server/.lsp.json");
}

const server = lsp.bash;
if (!server) fail("missing bash LSP server entry");
if (server.command !== "bash-language-server") fail("unexpected command");
if (!Array.isArray(server.args) || server.args[0] !== "start") fail("expected args: [\"start\"]");
if (server.transport !== "stdio") fail("expected stdio transport");
if (!server.extensionToLanguage?.[".sh"]) fail("missing .sh mapping");

if (modernPlugin.lspServers !== "./.lsp.json") fail("modern plugin manifest must reference ./.lsp.json");
if (modernPlugin.hooks !== "./hooks/hooks.json") fail("modern plugin manifest must reference hooks/hooks.json");
if (modernPlugin.skills !== "./skills") fail("modern plugin manifest must reference skills");

const postToolUse = hooks.hooks?.PostToolUse;
if (!Array.isArray(postToolUse)) fail("hooks.json missing PostToolUse array");
const editHook = postToolUse.find((h) => typeof h.matcher === "string" && h.matcher.includes("Write"));
if (!editHook) fail("PostToolUse hook must match Write/Edit tools");
const command = editHook.hooks?.[0]?.command || "";
if (!command.includes("bash-agent-post-edit")) fail("PostToolUse hook must call bash-agent-post-edit");

for (const p of [hookScriptPath, verifyScriptPath]) {
  const mode = fs.statSync(p).mode;
  if ((mode & 0o111) === 0) fail(`${path.relative(root, p)} must be executable`);
}

console.log("Claude Code Bash LSP + hook scaffold validation passed.");
