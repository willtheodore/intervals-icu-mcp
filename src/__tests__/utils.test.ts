import { describe, it, expect } from "vitest";
import { isoDate, jsonResult } from "../utils.js";

describe("isoDate", () => {
  it("formats a UTC date as YYYY-MM-DD", () => {
    expect(isoDate(new Date("2024-06-30T12:00:00.000Z"))).toBe("2024-06-30");
  });

  it("zero-pads single-digit month and day", () => {
    expect(isoDate(new Date("2024-01-05T00:00:00.000Z"))).toBe("2024-01-05");
  });
});

describe("jsonResult", () => {
  it("wraps an object in MCP text content shape", () => {
    const data = { id: 1, name: "test" };
    const result = jsonResult(data);
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    expect(JSON.parse(result.content[0].text)).toEqual(data);
  });

  it("wraps an array correctly", () => {
    const data = [1, 2, 3];
    const result = jsonResult(data);
    expect(JSON.parse(result.content[0].text)).toEqual(data);
  });

  it("does not set isError on success results", () => {
    const result = jsonResult({});
    expect(result.isError).toBeUndefined();
  });

  it("pretty-prints the JSON", () => {
    const result = jsonResult({ a: 1 });
    expect(result.content[0].text).toContain("\n");
  });
});
