import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("../client.js", () => ({
  athleteId: () => "0",
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  postFile: vi.fn(),
  withErrorHandling: (fn: unknown) => fn,
}));

import { athleteIdMismatchCheck } from "../startup.js";
import * as client from "../client.js";

describe("athleteIdMismatchCheck", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.INTERVALS_ATHLETE_ID;
  });

  it("skips the check and does not call GET when INTERVALS_ATHLETE_ID is not set", async () => {
    delete process.env.INTERVALS_ATHLETE_ID;
    await athleteIdMismatchCheck();
    expect(client.get).not.toHaveBeenCalled();
  });

  it("skips the check and does not call GET when INTERVALS_ATHLETE_ID is '0'", async () => {
    process.env.INTERVALS_ATHLETE_ID = "0";
    await athleteIdMismatchCheck();
    expect(client.get).not.toHaveBeenCalled();
  });

  it("continues silently when the returned athlete ID matches INTERVALS_ATHLETE_ID", async () => {
    process.env.INTERVALS_ATHLETE_ID = "12345";
    vi.mocked(client.get).mockResolvedValue({ id: 12345 });
    await athleteIdMismatchCheck();
    expect(console.warn).not.toHaveBeenCalled();
  });

  it("logs a warning when the returned athlete ID does not match INTERVALS_ATHLETE_ID", async () => {
    process.env.INTERVALS_ATHLETE_ID = "12345";
    vi.mocked(client.get).mockResolvedValue({ id: 99999 });
    await athleteIdMismatchCheck();
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining("12345")
    );
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining("99999")
    );
  });

  it("logs a warning and continues when the API call throws a network error", async () => {
    process.env.INTERVALS_ATHLETE_ID = "12345";
    vi.mocked(client.get).mockRejectedValue(new Error("Network failure"));
    await athleteIdMismatchCheck();
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining("Could not verify")
    );
  });

  it("logs a warning and continues when the check times out", async () => {
    process.env.INTERVALS_ATHLETE_ID = "12345";
    vi.useFakeTimers();
    vi.mocked(client.get).mockImplementation(
      () => new Promise<never>(() => {}) // Never resolves
    );
    const checkPromise = athleteIdMismatchCheck();
    await vi.advanceTimersByTimeAsync(5001);
    await checkPromise;
    vi.useRealTimers();
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining("Could not verify")
    );
  });
});
