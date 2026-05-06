import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { listEvents, createEvent, updateEvent } from "../tools/calendar.js";

vi.mock("../client.js", () => ({
  athleteId: () => "0",
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  postFile: vi.fn(),
}));

import * as client from "../client.js";

const FIXED_NOW = new Date("2024-06-30T12:00:00.000Z");

describe("list_events", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls GET /athlete/0/events with the given date range", async () => {
    vi.mocked(client.get).mockResolvedValue([]);

    await listEvents({ oldest: "2024-06-01", newest: "2024-06-30" });

    expect(client.get).toHaveBeenCalledWith("/athlete/0/events", {
      oldest: "2024-06-01",
      newest: "2024-06-30",
    });
  });

  it("returns events as JSON text", async () => {
    const mockEvents = [
      { id: "evt1", name: "Threshold Intervals", date: "2024-06-05" },
      { id: "evt2", name: "Long Ride", date: "2024-06-08" },
    ];
    vi.mocked(client.get).mockResolvedValue(mockEvents);

    const result = await listEvents({ oldest: "2024-06-01", newest: "2024-06-30" });

    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    expect(JSON.parse(result.content[0].text)).toEqual(mockEvents);
  });

  it("propagates errors from the API client", async () => {
    vi.mocked(client.get).mockRejectedValue(new Error("Network error"));

    await expect(
      listEvents({ oldest: "2024-06-01", newest: "2024-06-30" })
    ).rejects.toThrow("Network error");
  });
});

describe("create_event", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_NOW);
  });

  afterEach(() => vi.useRealTimers());

  it("defaults startDateLocal to today and category to WORKOUT", async () => {
    vi.mocked(client.post).mockResolvedValue({ id: 1 });

    await createEvent({});

    expect(client.post).toHaveBeenCalledWith(
      "/athlete/0/events",
      expect.objectContaining({
        start_date_local: "2024-06-30",
        category: "WORKOUT",
        indoor: false,
      })
    );
  });

  it("defaults indoor to false", async () => {
    vi.mocked(client.post).mockResolvedValue({ id: 1 });

    await createEvent({ name: "Morning Ride" });

    const body = vi.mocked(client.post).mock.calls[0][1] as Record<string, unknown>;
    expect(body.indoor).toBe(false);
  });

  it("uses provided values when supplied", async () => {
    vi.mocked(client.post).mockResolvedValue({ id: 2 });

    await createEvent({
      startDateLocal: "2024-07-04",
      name: "Independence Day Race",
      category: "RACE_A",
      type: "Run",
      movingTime: 3600,
      distance: 10000,
      indoor: true,
    });

    expect(client.post).toHaveBeenCalledWith("/athlete/0/events", {
      start_date_local: "2024-07-04",
      name: "Independence Day Race",
      category: "RACE_A",
      type: "Run",
      moving_time: 3600,
      distance: 10000,
      indoor: true,
    });
  });

  it("omits undefined optional fields from the request body", async () => {
    vi.mocked(client.post).mockResolvedValue({ id: 3 });

    await createEvent({ name: "Easy Spin" });

    const body = vi.mocked(client.post).mock.calls[0][1] as Record<string, unknown>;
    expect(body).not.toHaveProperty("type");
    expect(body).not.toHaveProperty("description");
    expect(body).not.toHaveProperty("moving_time");
    expect(body).not.toHaveProperty("distance");
  });

  it("returns the API response as MCP content JSON", async () => {
    const mockEvent = { id: 5, name: "Test", category: "WORKOUT" };
    vi.mocked(client.post).mockResolvedValue(mockEvent);

    const result = await createEvent({ name: "Test" });

    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    expect(JSON.parse(result.content[0].text)).toEqual(mockEvent);
  });

  it("propagates errors from the API client", async () => {
    vi.mocked(client.post).mockRejectedValue(new Error("Server error"));

    await expect(createEvent({})).rejects.toThrow("Server error");
  });
});

describe("update_event", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls PUT /athlete/0/events/{eventId}", async () => {
    vi.mocked(client.put).mockResolvedValue({ id: 42 });

    await updateEvent({ eventId: 42, name: "Renamed" });

    expect(client.put).toHaveBeenCalledWith(
      "/athlete/0/events/42",
      expect.objectContaining({ name: "Renamed" })
    );
  });

  it("only sends provided fields — omits unspecified ones", async () => {
    vi.mocked(client.put).mockResolvedValue({ id: 10 });

    await updateEvent({ eventId: 10, name: "Updated Name" });

    const body = vi.mocked(client.put).mock.calls[0][1] as Record<string, unknown>;
    expect(body).toEqual({ name: "Updated Name" });
  });

  it("maps camelCase params to snake_case API fields", async () => {
    vi.mocked(client.put).mockResolvedValue({ id: 7 });

    await updateEvent({ eventId: 7, movingTime: 5400, startDateLocal: "2024-08-01" });

    const body = vi.mocked(client.put).mock.calls[0][1] as Record<string, unknown>;
    expect(body).toEqual({ moving_time: 5400, start_date_local: "2024-08-01" });
  });

  it("returns the API response as MCP content JSON", async () => {
    const mockEvent = { id: 42, name: "Renamed" };
    vi.mocked(client.put).mockResolvedValue(mockEvent);

    const result = await updateEvent({ eventId: 42, name: "Renamed" });

    expect(JSON.parse(result.content[0].text)).toEqual(mockEvent);
  });

  it("propagates errors from the API client", async () => {
    vi.mocked(client.put).mockRejectedValue(new Error("Not found"));

    await expect(updateEvent({ eventId: 999, name: "x" })).rejects.toThrow("Not found");
  });
});
