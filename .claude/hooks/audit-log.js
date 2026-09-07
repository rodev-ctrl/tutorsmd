#!/usr/bin/env node
// PostToolUse hook — appends every executed Bash command to .claude/audit.log
// for traceability (project handles student personal data).

const fs = require("fs");
const path = require("path");

let raw = "";
process.stdin.on("data", (chunk) => (raw += chunk));
process.stdin.on("end", () => {
  let input;
  try {
    input = JSON.parse(raw);
  } catch {
    process.exit(0);
  }

  if (input.tool_name !== "Bash") process.exit(0);

  const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
  const logPath = path.join(projectDir, ".claude", "audit.log");
  const command = (input.tool_input && input.tool_input.command) || "";
  const timestamp = new Date().toISOString();

  const line = `[${timestamp}] ${JSON.stringify(command)}\n`;

  try {
    fs.appendFileSync(logPath, line);
  } catch {
    // logging failure should never block or crash the session
  }

  process.exit(0);
});
