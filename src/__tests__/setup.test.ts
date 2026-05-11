import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import os from "os";
import { writeEnvFile, patchConfig, detectConfigPath } from "../setup.js";

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "intervals-mcp-test-"));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true });
});

describe("writeEnvFile", () => {
  it("writes the API key and athlete ID to the file", () => {
    const envPath = path.join(tmpDir, ".env");
    writeEnvFile(envPath, "myapikey", "12345");
    const content = fs.readFileSync(envPath, "utf8");
    expect(content).toContain("INTERVALS_API_KEY=myapikey");
    expect(content).toContain("INTERVALS_ATHLETE_ID=12345");
  });

  it("overwrites an existing file", () => {
    const envPath = path.join(tmpDir, ".env");
    fs.writeFileSync(envPath, "INTERVALS_API_KEY=oldkey\n");
    writeEnvFile(envPath, "newkey", "0");
    const content = fs.readFileSync(envPath, "utf8");
    expect(content).toContain("INTERVALS_API_KEY=newkey");
    expect(content).not.toContain("oldkey");
  });
});

describe("patchConfig", () => {
  const distPath = "/path/to/dist/index.js";
  const apiKey = "testkey";
  const athleteId = "0";

  it("creates a new config file when none exists", () => {
    const configPath = path.join(tmpDir, "claude_desktop_config.json");
    const result = patchConfig(configPath, distPath, apiKey, athleteId);
    expect(result.ok).toBe(true);
    const written = JSON.parse(fs.readFileSync(configPath, "utf8"));
    expect(written.mcpServers.intervals.command).toBe("node");
    expect(written.mcpServers.intervals.args).toContain(distPath);
    expect(written.mcpServers.intervals.env.INTERVALS_API_KEY).toBe(apiKey);
  });

  it("creates parent directories if they do not exist", () => {
    const configPath = path.join(tmpDir, "nested", "dir", "config.json");
    const result = patchConfig(configPath, distPath, apiKey, athleteId);
    expect(result.ok).toBe(true);
    expect(fs.existsSync(configPath)).toBe(true);
  });

  it("returns { ok: false, reason: 'invalid-json' } for a malformed config file", () => {
    const configPath = path.join(tmpDir, "config.json");
    fs.writeFileSync(configPath, "{ not valid json,,, }");
    const result = patchConfig(configPath, distPath, apiKey, athleteId);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("invalid-json");
  });

  it("returns { ok: false, reason: 'key-exists' } when 'intervals' is already present", () => {
    const configPath = path.join(tmpDir, "config.json");
    const existing = { command: "node", args: ["/old/path"] };
    fs.writeFileSync(
      configPath,
      JSON.stringify({ mcpServers: { intervals: existing } })
    );
    const result = patchConfig(configPath, distPath, apiKey, athleteId);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("key-exists");
      expect(result.existingEntry).toEqual(existing);
    }
  });

  it("overwrites the existing key when force is true", () => {
    const configPath = path.join(tmpDir, "config.json");
    fs.writeFileSync(
      configPath,
      JSON.stringify({ mcpServers: { intervals: { command: "node", args: ["/old"] } } })
    );
    const result = patchConfig(configPath, distPath, apiKey, athleteId, true);
    expect(result.ok).toBe(true);
    const written = JSON.parse(fs.readFileSync(configPath, "utf8"));
    expect(written.mcpServers.intervals.args).toContain(distPath);
  });

  it("adds the intervals key without overwriting other servers", () => {
    const configPath = path.join(tmpDir, "config.json");
    fs.writeFileSync(
      configPath,
      JSON.stringify({ mcpServers: { "other-server": { command: "python" } } })
    );
    const result = patchConfig(configPath, distPath, apiKey, athleteId);
    expect(result.ok).toBe(true);
    const written = JSON.parse(fs.readFileSync(configPath, "utf8"));
    expect(written.mcpServers["other-server"]).toBeDefined();
    expect(written.mcpServers.intervals).toBeDefined();
  });

  it("initialises mcpServers when the existing config lacks it", () => {
    const configPath = path.join(tmpDir, "config.json");
    fs.writeFileSync(configPath, JSON.stringify({ someOtherKey: true }));
    const result = patchConfig(configPath, distPath, apiKey, athleteId);
    expect(result.ok).toBe(true);
    const written = JSON.parse(fs.readFileSync(configPath, "utf8"));
    expect(written.mcpServers.intervals).toBeDefined();
    expect(written.someOtherKey).toBe(true);
  });
});

describe("detectConfigPath", () => {
  it("returns an absolute path ending with claude_desktop_config.json", () => {
    const p = detectConfigPath();
    expect(path.isAbsolute(p)).toBe(true);
    expect(p).toMatch(/claude_desktop_config\.json$/);
  });

  it("includes 'Claude' in the path", () => {
    expect(detectConfigPath()).toContain("Claude");
  });
});
