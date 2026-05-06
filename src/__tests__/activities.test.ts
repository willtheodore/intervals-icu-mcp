import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  listActivities,
  getActivity,
  createActivity,
  updateActivity,
} from "../tools/activities.js";

vi.mock("../client.js", () => ({
  athleteId: () => "0",
  get: vi.fn(),
  put: vi.fn(),
  postFile: vi.fn(),
}));

import * as client from "../client.js";

const FIXED_NOW = new Date("2024-06-30T12:00:00.000Z");
const FIXED_TODAY = "2024-06-30";
const FIXED_30_DAYS_AGO = "2024-05-31";

describe("list_activities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_NOW);
  });

  afterEach(() => vi.useRealTimers());

  it("defaults oldest to 30 days ago and newest to today", async () => {
    vi.mocked(client.get).mockResolvedValue([]);

    await listActivities({});

    expect(client.get).toHaveBeenCalledWith("/athlete/0/activities", {
      oldest: FIXED_30_DAYS_AGO,
      newest: FIXED_TODAY,
      limit: 20,
    });
  });

  it("defaults limit to 20", async () => {
    vi.mocked(client.get).mockResolvedValue([]);

    await listActivities({ oldest: "2024-01-01", newest: "2024-01-31" });

    expect(client.get).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ limit: 20 })
    );
  });

  it("uses provided date range and limit when given", async () => {
    vi.mocked(client.get).mockResolvedValue([]);

    await listActivities({ oldest: "2024-01-01", newest: "2024-01-31", limit: 5 });

    expect(client.get).toHaveBeenCalledWith("/athlete/0/activities", {
      oldest: "2024-01-01",
      newest: "2024-01-31",
      limit: 5,
    });
  });

  it("returns activity list as JSON text", async () => {
    const mockActivities = [{ id: "abc123", name: "Morning Ride", type: "Ride" }];
    vi.mocked(client.get).mockResolvedValue(mockActivities);

    const result = await listActivities({});

    expect(JSON.parse(result.content[0].text)).toEqual(mockActivities);
  });
});

describe("get_activity", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls GET /activity/:id and returns detail as JSON text", async () => {
    const mockDetail = { id: "abc123", name: "Morning Ride", moving_time: 3600 };
    vi.mocked(client.get).mockResolvedValue(mockDetail);

    const result = await getActivity({ activityId: "abc123" });

    expect(client.get).toHaveBeenCalledWith("/activity/abc123");
    expect(JSON.parse(result.content[0].text)).toEqual(mockDetail);
  });
});

describe("create_activity", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls postFile with the correct path and no extra fields", async () => {
    const mockResponse = { id: "new123" };
    vi.mocked(client.postFile).mockResolvedValue(mockResponse);

    const result = await createActivity({ filePath: "/tmp/ride.fit" });

    expect(client.postFile).toHaveBeenCalledWith(
      "/athlete/0/activities",
      "/tmp/ride.fit",
      {}
    );
    expect(JSON.parse(result.content[0].text)).toEqual(mockResponse);
  });

  it("includes optional fields when provided", async () => {
    vi.mocked(client.postFile).mockResolvedValue({});

    await createActivity({
      filePath: "/tmp/ride.fit",
      name: "Epic Ride",
      description: "Long one",
      startDateLocal: "2024-06-01T08:00:00",
      type: "Ride",
    });

    expect(client.postFile).toHaveBeenCalledWith(
      "/athlete/0/activities",
      "/tmp/ride.fit",
      {
        name: "Epic Ride",
        description: "Long one",
        start_date_local: "2024-06-01T08:00:00",
        type: "Ride",
      }
    );
  });
});

describe("update_activity", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls PUT /activity/:id with provided fields", async () => {
    const mockResponse = { id: "abc123", name: "Renamed Ride" };
    vi.mocked(client.put).mockResolvedValue(mockResponse);

    const result = await updateActivity({ activityId: "abc123", name: "Renamed Ride" });

    expect(client.put).toHaveBeenCalledWith("/activity/abc123", { name: "Renamed Ride" });
    expect(JSON.parse(result.content[0].text)).toEqual(mockResponse);
  });

  it("omits undefined fields from the request body", async () => {
    vi.mocked(client.put).mockResolvedValue({});

    await updateActivity({ activityId: "abc123" });

    expect(client.put).toHaveBeenCalledWith("/activity/abc123", {});
  });
});
