import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getFitnessSummary } from "../tools/fitness.js";

vi.mock("../client.js", () => ({
  athleteId: () => "0",
  get: vi.fn(),
}));

import * as client from "../client.js";

const FIXED_NOW = new Date("2026-05-11T12:00:00Z");
const FIXED_THREE_MONTHS_AGO = "2026-02-11";
const FIXED_THREE_MONTHS_AHEAD = "2026-08-11";

describe("get_fitness_summary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("defaults oldest to 3 months ago and newest to 3 months from today", async () => {
    vi.mocked(client.get).mockResolvedValue([]);
    await getFitnessSummary({});
    expect(client.get).toHaveBeenCalledWith("/athlete/0/wellness", {
      oldest: FIXED_THREE_MONTHS_AGO,
      newest: FIXED_THREE_MONTHS_AHEAD,
    });
  });

  it("passes explicit date params through unchanged", async () => {
    vi.mocked(client.get).mockResolvedValue([]);
    await getFitnessSummary({ oldest: "2026-01-01", newest: "2026-06-30" });
    expect(client.get).toHaveBeenCalledWith("/athlete/0/wellness", {
      oldest: "2026-01-01",
      newest: "2026-06-30",
    });
  });

  it("returns wellness records as MCP text content", async () => {
    const mockWellness = [
      { id: "2026-05-10", ctl: 65.2, atl: 72.1, rampRate: -0.3 },
      { id: "2026-05-11", ctl: 65.8, atl: 70.4, rampRate: 0.2 },
    ];
    vi.mocked(client.get).mockResolvedValue(mockWellness);

    const result = await getFitnessSummary({});

    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    expect(JSON.parse(result.content[0].text)).toEqual(mockWellness);
  });

  it("propagates errors from the API client", async () => {
    vi.mocked(client.get).mockRejectedValue(new Error("401 Unauthorized"));
    await expect(getFitnessSummary({})).rejects.toThrow("401 Unauthorized");
  });
});
