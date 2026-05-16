#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const marketplacePath = path.join(root, ".claude-plugin", "marketplace.json");
const pluginDir = path.join(root, "claude-code-bash-language-server");
const lspPath = path.join(pluginDir, ".lsp.json");
const pluginPath = path.join(pluginDir, "plugin.json");

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function fail(msg) {
  console.error(`validate-claude-code-lsp failed: ${msg}`);
  process.exit(1);
}

for (const p of [marketplacePath, pluginPath, lspPath]) {
  if (!fs.existsSync(p)) fail(`missing ${path.relative(root, p)}`);
}

const marketplace = readJson(marketplacePath);
const lsp = readJson(lspPath);

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

console.log("Claude Code LSP scaffold validation passed.");
