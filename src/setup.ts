import readline from "readline";
import fs from "fs";
import path from "path";
import os from "os";
import { fileURLToPath } from "url";

// --- Pure functions (exported for testing) ---

export function detectConfigPath(): string {
  const home = os.homedir();
  if (process.platform === "win32") {
    const appdata = process.env.APPDATA ?? path.join(home, "AppData", "Roaming");
    return path.join(appdata, "Claude", "claude_desktop_config.json");
  }
  if (process.platform === "linux") {
    return path.join(home, ".config", "Claude", "claude_desktop_config.json");
  }
  return path.join(home, "Library", "Application Support", "Claude", "claude_desktop_config.json");
}

export function writeEnvFile(filePath: string, apiKey: string, athleteId: string): void {
  const content = `INTERVALS_API_KEY=${apiKey}\nINTERVALS_ATHLETE_ID=${athleteId}\n`;
  fs.writeFileSync(filePath, content, "utf8");
}

export type PatchResult =
  | { ok: true }
  | { ok: false; reason: "invalid-json" | "key-exists"; existingEntry?: unknown };

export function patchConfig(
  configPath: string,
  distPath: string,
  apiKey: string,
  athleteId: string,
  force = false
): PatchResult {
  let config: Record<string, unknown>;

  if (!fs.existsSync(configPath)) {
    config = { mcpServers: {} };
  } else {
    const raw = fs.readFileSync(configPath, "utf8");
    try {
      config = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return { ok: false, reason: "invalid-json" };
    }
    if (!config.mcpServers || typeof config.mcpServers !== "object") {
      config.mcpServers = {};
    }
    const servers = config.mcpServers as Record<string, unknown>;
    if (!force && servers.intervals !== undefined) {
      return { ok: false, reason: "key-exists", existingEntry: servers.intervals };
    }
  }

  const mcpServers = config.mcpServers as Record<string, unknown>;
  mcpServers.intervals = {
    command: "node",
    args: [distPath],
    env: {
      INTERVALS_API_KEY: apiKey,
      INTERVALS_ATHLETE_ID: athleteId,
    },
  };

  const dir = path.dirname(configPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf8");
  return { ok: true };
}

// --- Wizard ---

function printManualConfig(distPath: string, apiKey: string, athleteId: string): void {
  console.log(
    JSON.stringify(
      {
        mcpServers: {
          intervals: {
            command: "node",
            args: [distPath],
            env: {
              INTERVALS_API_KEY: apiKey,
              INTERVALS_ATHLETE_ID: athleteId,
            },
          },
        },
      },
      null,
      2
    )
  );
}

async function main(): Promise<void> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  let envWritten = false;

  function ask(question: string): Promise<string> {
    return new Promise(resolve => rl.question(question, resolve));
  }

  rl.on("SIGINT", () => {
    if (envWritten) {
      console.log(
        "\nSetup interrupted — .env was written but Claude Desktop config was not updated."
      );
      console.log("Run `npm run setup` again or add the server to your config manually.");
    } else {
      console.log("\nSetup cancelled.");
    }
    rl.close();
    process.exit(0);
  });

  console.log("=== Intervals MCP Setup ===\n");
  console.log(
    "This wizard will create your .env file and optionally update your Claude Desktop config.\n"
  );

  // Step 1: API key
  console.log("Get your API key at: https://intervals.icu/settings → Developer Settings\n");
  const apiKey = (await ask("Paste your Intervals.icu API key: ")).trim();
  if (!apiKey) {
    console.error("\nAPI key cannot be empty. Run `npm run setup` again.");
    rl.close();
    process.exit(1);
  }

  // Step 2: Athlete ID
  const rawAthleteId = (
    await ask("Enter your athlete ID (press Enter to use your own account): ")
  ).trim();
  const athleteId = rawAthleteId || "0";

  // Step 3: Write .env
  const envPath = path.resolve(process.cwd(), ".env");
  writeEnvFile(envPath, apiKey, athleteId);
  console.log(`\nWritten to ${envPath}`);
  envWritten = true;

  // Step 4: Claude Desktop config
  const patchAnswer = (
    await ask("\nAutomatically add this server to Claude Desktop? (y/n): ")
  )
    .trim()
    .toLowerCase();

  if (patchAnswer !== "y") {
    console.log(
      "\nSkipping automatic config update. Add this block to your Claude Desktop config manually:\n"
    );
    printManualConfig(path.resolve(process.cwd(), "dist", "index.js"), apiKey, athleteId);
    rl.close();
    return;
  }

  // Step 5: Confirm dist path
  const distPath = path.resolve(process.cwd(), "dist", "index.js");
  console.log(`\nWill register this server path:\n  ${distPath}`);
  const pathOk = (await ask("Is this path correct? (y/n): ")).trim().toLowerCase();

  if (pathOk !== "y") {
    console.log("\nPlease add the server to your Claude Desktop config manually:\n");
    printManualConfig(distPath, apiKey, athleteId);
    rl.close();
    return;
  }

  // Step 6: Patch config
  const configPath = detectConfigPath();
  const result = patchConfig(configPath, distPath, apiKey, athleteId);

  if (!result.ok && result.reason === "invalid-json") {
    console.log("\nCould not update Claude Desktop config — the file contains invalid JSON.");
    console.log("Please add the server manually:\n");
    printManualConfig(distPath, apiKey, athleteId);
    rl.close();
    return;
  }

  if (!result.ok && result.reason === "key-exists") {
    const overwrite = (
      await ask('\nAn "intervals" server is already in your config. Overwrite? (y/n): ')
    )
      .trim()
      .toLowerCase();

    if (overwrite !== "y") {
      console.log("\nSkipped. Your existing config was not changed.");
      console.log("Current entry:\n" + JSON.stringify(result.existingEntry, null, 2));
      rl.close();
      return;
    }

    patchConfig(configPath, distPath, apiKey, athleteId, true);
  }

  console.log(`\nUpdated ${configPath}`);

  // Step 7: Check if dist exists
  if (!fs.existsSync(distPath)) {
    console.log(
      "\ndist/index.js not found — run `npm run build` before restarting Claude."
    );
  }

  // Summary
  console.log("\n=== Setup Complete ===");
  console.log("Next steps:");
  console.log("  1. Run `npm run build` if you haven't already.");
  console.log("  2. Restart Claude Desktop.");
  console.log('  3. Try asking Claude: "What activities did I do last week?"\n');

  rl.close();
}

// Only run the wizard when executed directly (e.g. `npm run setup`), not when imported by tests.
const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] === __filename) {
  main().catch(err => {
    console.error("Setup failed:", err instanceof Error ? err.message : err);
    process.exit(1);
  });
}
