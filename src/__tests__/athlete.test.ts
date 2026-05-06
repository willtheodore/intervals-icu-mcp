import { describe, it, expect, vi, beforeEach } from "vitest";
import { getAthlete } from "../tools/athlete.js";

vi.mock("../client.js", () => ({
  athleteId: () => "0",
  get: vi.fn(),
  put: vi.fn(),
  postFile: vi.fn(),
}));

import * as client from "../client.js";

describe("get_athlete", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls GET /athlete/0 and returns JSON text", async () => {
    const mockAthlete = { id: "i12345", name: "Jane Athlete", country: "US" };
    vi.mocked(client.get).mockResolvedValue(mockAthlete);

    const result = await getAthlete();

    expect(client.get).toHaveBeenCalledWith("/athlete/0");
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    expect(JSON.parse(result.content[0].text)).toEqual(mockAthlete);
  });

  it("propagates errors from the API client", async () => {
    vi.mocked(client.get).mockRejectedValue(new Error("401 Unauthorized"));

    await expect(getAthlete()).rejects.toThrow("401 Unauthorized");
  });
});
