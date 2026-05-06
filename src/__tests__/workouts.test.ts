import { describe, it, expect, vi, beforeEach } from "vitest";
import { createWorkout, updateWorkout } from "../tools/workouts.js";

vi.mock("../client.js", () => ({
  athleteId: () => "0",
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  postFile: vi.fn(),
}));

import * as client from "../client.js";

describe("create_workout", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls POST /athlete/0/workouts", async () => {
    vi.mocked(client.post).mockResolvedValue({ id: 1 });

    await createWorkout({ name: "Sweet Spot Intervals" });

    expect(client.post).toHaveBeenCalledWith(
      "/athlete/0/workouts",
      expect.objectContaining({ name: "Sweet Spot Intervals" })
    );
  });

  it("defaults target to AUTO and indoor to false", async () => {
    vi.mocked(client.post).mockResolvedValue({ id: 1 });

    await createWorkout({});

    const body = vi.mocked(client.post).mock.calls[0][1] as Record<string, unknown>;
    expect(body.target).toBe("AUTO");
    expect(body.indoor).toBe(false);
  });

  it("uses provided values when supplied", async () => {
    vi.mocked(client.post).mockResolvedValue({ id: 2 });

    await createWorkout({
      name: "Trainer VO2",
      type: "Ride",
      description: "5x3min @ 120% FTP",
      movingTime: 3600,
      target: "POWER",
      indoor: true,
      folderId: 99,
    });

    expect(client.post).toHaveBeenCalledWith("/athlete/0/workouts", {
      name: "Trainer VO2",
      type: "Ride",
      description: "5x3min @ 120% FTP",
      moving_time: 3600,
      target: "POWER",
      indoor: true,
      folder_id: 99,
    });
  });

  it("omits undefined optional fields from the request body", async () => {
    vi.mocked(client.post).mockResolvedValue({ id: 3 });

    await createWorkout({ name: "Easy Run" });

    const body = vi.mocked(client.post).mock.calls[0][1] as Record<string, unknown>;
    expect(body).not.toHaveProperty("type");
    expect(body).not.toHaveProperty("description");
    expect(body).not.toHaveProperty("moving_time");
    expect(body).not.toHaveProperty("folder_id");
  });

  it("returns the API response as MCP content JSON", async () => {
    const mockWorkout = { id: 5, name: "Sweet Spot", target: "POWER" };
    vi.mocked(client.post).mockResolvedValue(mockWorkout);

    const result = await createWorkout({ name: "Sweet Spot" });

    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    expect(JSON.parse(result.content[0].text)).toEqual(mockWorkout);
  });

  it("propagates errors from the API client", async () => {
    vi.mocked(client.post).mockRejectedValue(new Error("Server error"));

    await expect(createWorkout({})).rejects.toThrow("Server error");
  });
});

describe("update_workout", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls PUT /athlete/0/workouts/{workoutId}", async () => {
    vi.mocked(client.put).mockResolvedValue({ id: 42 });

    await updateWorkout({ workoutId: 42, name: "Renamed" });

    expect(client.put).toHaveBeenCalledWith(
      "/athlete/0/workouts/42",
      expect.objectContaining({ name: "Renamed" })
    );
  });

  it("only sends provided fields — omits unspecified ones", async () => {
    vi.mocked(client.put).mockResolvedValue({ id: 10 });

    await updateWorkout({ workoutId: 10, name: "Updated Name" });

    const body = vi.mocked(client.put).mock.calls[0][1] as Record<string, unknown>;
    expect(body).toEqual({ name: "Updated Name" });
  });

  it("maps camelCase params to snake_case API fields", async () => {
    vi.mocked(client.put).mockResolvedValue({ id: 7 });

    await updateWorkout({ workoutId: 7, movingTime: 5400, folderId: 12 });

    const body = vi.mocked(client.put).mock.calls[0][1] as Record<string, unknown>;
    expect(body).toEqual({ moving_time: 5400, folder_id: 12 });
  });

  it("returns the API response as MCP content JSON", async () => {
    const mockWorkout = { id: 42, name: "Renamed" };
    vi.mocked(client.put).mockResolvedValue(mockWorkout);

    const result = await updateWorkout({ workoutId: 42, name: "Renamed" });

    expect(JSON.parse(result.content[0].text)).toEqual(mockWorkout);
  });

  it("propagates errors from the API client", async () => {
    vi.mocked(client.put).mockRejectedValue(new Error("Not found"));

    await expect(updateWorkout({ workoutId: 999, name: "x" })).rejects.toThrow("Not found");
  });
});
