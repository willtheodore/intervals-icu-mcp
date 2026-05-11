import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { validateEnv } from "../startup.js";

// startup.ts imports client.js at module level (createClient runs with empty key).
// That's fine — the throw was removed from createClient.

describe("validateEnv", () => {
  beforeEach(() => {
    vi.spyOn(process, "exit").mockImplementation(
      (() => { throw new Error("process.exit"); }) as unknown as typeof process.exit
    );
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.INTERVALS_API_KEY;
    delete process.env.INTERVALS_ATHLETE_ID;
  });

  it("exits with code 1 when INTERVALS_API_KEY is not set", () => {
    delete process.env.INTERVALS_API_KEY;
    expect(() => validateEnv()).toThrow("process.exit");
    expect(vi.mocked(process.exit)).toHaveBeenCalledWith(1);
  });

  it("does not exit when INTERVALS_ATHLETE_ID is not set", () => {
    process.env.INTERVALS_API_KEY = "testkey";
    delete process.env.INTERVALS_ATHLETE_ID;
    expect(() => validateEnv()).not.toThrow();
    expect(vi.mocked(process.exit)).not.toHaveBeenCalled();
  });

  it("does not exit when INTERVALS_ATHLETE_ID is a numeric string", () => {
    process.env.INTERVALS_API_KEY = "testkey";
    process.env.INTERVALS_ATHLETE_ID = "12345";
    expect(() => validateEnv()).not.toThrow();
    expect(vi.mocked(process.exit)).not.toHaveBeenCalled();
  });

  it("does not exit when INTERVALS_ATHLETE_ID is a prefixed string like 'i12345'", () => {
    process.env.INTERVALS_API_KEY = "testkey";
    process.env.INTERVALS_ATHLETE_ID = "i12345";
    expect(() => validateEnv()).not.toThrow();
    expect(vi.mocked(process.exit)).not.toHaveBeenCalled();
  });

  it("does not exit when INTERVALS_ATHLETE_ID is '0'", () => {
    process.env.INTERVALS_API_KEY = "testkey";
    process.env.INTERVALS_ATHLETE_ID = "0";
    expect(() => validateEnv()).not.toThrow();
    expect(vi.mocked(process.exit)).not.toHaveBeenCalled();
  });
});
