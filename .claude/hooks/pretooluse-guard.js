#!/usr/bin/env node
// PreToolUse hook — blocks destructive operations before they run.
// Exit 0 = allow. Exit 2 = block (message on stderr is shown to Claude).

let raw = "";
process.stdin.on("data", (chunk) => (raw += chunk));
process.stdin.on("end", () => {
  let input;
  try {
    input = JSON.parse(raw);
  } catch {
    process.exit(0); // can't parse, don't block
  }

  if (input.tool_name !== "Bash") process.exit(0);

  const command = (input.tool_input && input.tool_input.command) || "";

  const block = (reason) => {
    process.stderr.write(reason);
    process.exit(2);
  };

  // 1. rm -rf — this project has dedicated tools for file management;
  // rm -rf via Bash is never the intended path.
  if (/\brm\s+(-[a-z]*r[a-z]*f[a-z]*|-[a-z]*f[a-z]*r[a-z]*)\b/i.test(command)) {
    return block(
      "Blocked: 'rm -rf' via Bash is disabled in this project. " +
      "If you need to delete a file, use a narrower command or ask the user to confirm first."
    );
  }

  // 2. Force-push — can overwrite remote history / teammates' work.
  if (/\bgit\s+push\b/.test(command) && /(--force\b|-f\b|--force-with-lease)/.test(command)) {
    return block(
      "Blocked: force-push is disabled by project hook. Ask the user to run it manually if truly needed."
    );
  }

  // 3. Direct commits on main/master — TutorsMD requires feature branches.
  if (/\bgit\s+commit\b/.test(command)) {
    try {
      const { execSync } = require("child_process");
      const branch = execSync("git rev-parse --abbrev-ref HEAD", {
        cwd: input.cwd || process.cwd(),
      })
        .toString()
        .trim();
      if (branch === "main" || branch === "master") {
        return block(
          `Blocked: direct commit on '${branch}' branch. Create a feature branch first.`
        );
      }
    } catch {
      // not a git repo or branch check failed — don't block on infra error
    }
  }

  // 4. Overwriting production config / secrets via shell redirection.
  if (/[>]{1,2}\s*(\.env(\.[a-z]+)?|.*docker-compose.*\.yml|ssl\/)/i.test(command)) {
    return block(
      "Blocked: writing to .env / docker-compose*.yml / ssl/ via shell redirection is disabled. " +
      "Use the Write/Edit tool so the change is visible and reviewable."
    );
  }

  // 5. Destructive SQL / Prisma reset.
  if (/\b(drop\s+table|drop\s+database|truncate\s+table)\b/i.test(command)) {
    return block("Blocked: destructive SQL (DROP/TRUNCATE) is disabled via Bash. Ask the user first.");
  }
  if (/prisma\s+migrate\s+reset/i.test(command)) {
    return block("Blocked: 'prisma migrate reset' wipes the database. Ask the user first.");
  }

  process.exit(0);
});
