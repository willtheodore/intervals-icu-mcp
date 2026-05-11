import { describe, it, expect, vi } from "vitest";
import { AxiosError } from "axios";
import { withErrorHandling } from "../client.js";
import type { ToolResult } from "../utils.js";

// createClient() runs at module load but uses "" for the key, which is fine —
// these tests never make actual HTTP calls.
vi.mock("../client.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../client.js")>();
  // Keep withErrorHandling real; mock the HTTP functions so createClient() side effects don't matter.
  return { ...actual, get: vi.fn(), post: vi.fn(), put: vi.fn(), postFile: vi.fn() };
});

function makeAxiosError(status: number | null): AxiosError {
  const err = new AxiosError("test error");
  if (status !== null) {
    // @ts-expect-error — minimal AxiosResponse mock
    err.response = { status, data: null, headers: {}, config: {}, statusText: String(status) };
  }
  return err;
}

const successHandler = async (_params: Record<string, unknown>): Promise<ToolResult> => ({
  content: [{ type: "text", text: "success" }],
});

describe("withErrorHandling", () => {
  it("passes through successful handler results unchanged", async () => {
    const wrapped = withErrorHandling(successHandler);
    const result = await wrapped({});
    expect(result.content[0].text).toBe("success");
    expect(result.isError).toBeUndefined();
  });

  it("returns isError:true with an auth message for AxiosError 401", async () => {
    const handler = vi.fn().mockRejectedValue(makeAxiosError(401));
    const result = await withErrorHandling(handler)({});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("API key");
  });

  it("returns isError:true with an auth message for AxiosError 403 (intervals.icu uses 403 for bad keys)", async () => {
    const result = await withErrorHandling(vi.fn().mockRejectedValue(makeAxiosError(403)))({});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("API key");
  });

  it("returns isError:true with a 404 message for AxiosError 404", async () => {
    const result = await withErrorHandling(vi.fn().mockRejectedValue(makeAxiosError(404)))({});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("404");
  });

  it("returns isError:true with a 429 message for AxiosError 429", async () => {
    const result = await withErrorHandling(vi.fn().mockRejectedValue(makeAxiosError(429)))({});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("429");
  });

  it("returns isError:true with a server error message for AxiosError 500", async () => {
    const result = await withErrorHandling(vi.fn().mockRejectedValue(makeAxiosError(500)))({});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("500");
    expect(result.content[0].text).toContain("server error");
  });

  it("returns isError:true with a network message when there is no response", async () => {
    const result = await withErrorHandling(vi.fn().mockRejectedValue(makeAxiosError(null)))({});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Network error");
  });

  it("returns isError:true with the error message for non-Axios errors", async () => {
    const handler = vi.fn().mockRejectedValue(new TypeError("unexpected boom"));
    const result = await withErrorHandling(handler)({});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("unexpected boom");
  });
});
