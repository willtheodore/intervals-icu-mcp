import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getPowerCurves, getHrCurves, getPaceCurves } from "../tools/curves.js";

vi.mock("../client.js", () => ({
  athleteId: () => "0",
  get: vi.fn(),
}));

import * as client from "../client.js";

const FIXED_NOW = new Date("2024-06-30T12:00:00.000Z");
const FIXED_TODAY = "2024-06-30";
const FIXED_ONE_YEAR_AGO = "2023-06-30";

describe("get_power_curves", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_NOW);
  });

  afterEach(() => vi.useRealTimers());

  it("defaults oldest to 1 year ago and newest to today", async () => {
    vi.mocked(client.get).mockResolvedValue([]);

    await getPowerCurves({});

    expect(client.get).toHaveBeenCalledWith("/athlete/0/power-curves", {
      oldest: FIXED_ONE_YEAR_AGO,
      newest: FIXED_TODAY,
    });
  });

  it("uses provided date range when given", async () => {
    vi.mocked(client.get).mockResolvedValue([]);

    await getPowerCurves({ oldest: "2024-01-01", newest: "2024-06-01" });

    expect(client.get).toHaveBeenCalledWith("/athlete/0/power-curves", {
      oldest: "2024-01-01",
      newest: "2024-06-01",
    });
  });

  it("includes type param when provided", async () => {
    vi.mocked(client.get).mockResolvedValue([]);

    await getPowerCurves({ type: "Ride" });

    expect(client.get).toHaveBeenCalledWith("/athlete/0/power-curves", {
      oldest: FIXED_ONE_YEAR_AGO,
      newest: FIXED_TODAY,
      type: "Ride",
    });
  });

  it("returns curve data as JSON text", async () => {
    const mockData = [{ secs: 1, watts: 1200 }, { secs: 60, watts: 450 }];
    vi.mocked(client.get).mockResolvedValue(mockData);

    const result = await getPowerCurves({});

    expect(JSON.parse(result.content[0].text)).toEqual(mockData);
  });
});

describe("get_hr_curves", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_NOW);
  });

  afterEach(() => vi.useRealTimers());

  it("defaults oldest to 1 year ago and newest to today", async () => {
    vi.mocked(client.get).mockResolvedValue([]);

    await getHrCurves({});

    expect(client.get).toHaveBeenCalledWith("/athlete/0/hr-curves", {
      oldest: FIXED_ONE_YEAR_AGO,
      newest: FIXED_TODAY,
    });
  });

  it("includes type param when provided", async () => {
    vi.mocked(client.get).mockResolvedValue([]);

    await getHrCurves({ type: "Run" });

    expect(client.get).toHaveBeenCalledWith("/athlete/0/hr-curves", {
      oldest: FIXED_ONE_YEAR_AGO,
      newest: FIXED_TODAY,
      type: "Run",
    });
  });

  it("returns curve data as JSON text", async () => {
    const mockData = [{ secs: 60, bpm: 185 }];
    vi.mocked(client.get).mockResolvedValue(mockData);

    const result = await getHrCurves({});

    expect(JSON.parse(result.content[0].text)).toEqual(mockData);
  });
});

describe("get_pace_curves", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_NOW);
  });

  afterEach(() => vi.useRealTimers());

  it("defaults oldest to 1 year ago and newest to today", async () => {
    vi.mocked(client.get).mockResolvedValue([]);

    await getPaceCurves({});

    expect(client.get).toHaveBeenCalledWith("/athlete/0/pace-curves", {
      oldest: FIXED_ONE_YEAR_AGO,
      newest: FIXED_TODAY,
    });
  });

  it("includes type param when provided", async () => {
    vi.mocked(client.get).mockResolvedValue([]);

    await getPaceCurves({ type: "Run" });

    expect(client.get).toHaveBeenCalledWith("/athlete/0/pace-curves", {
      oldest: FIXED_ONE_YEAR_AGO,
      newest: FIXED_TODAY,
      type: "Run",
    });
  });

  it("returns curve data as JSON text", async () => {
    const mockData = [{ secs: 60, ms: 4.5 }];
    vi.mocked(client.get).mockResolvedValue(mockData);

    const result = await getPaceCurves({});

    expect(JSON.parse(result.content[0].text)).toEqual(mockData);
  });
});
