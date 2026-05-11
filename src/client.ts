import axios, { type AxiosInstance, AxiosError } from "axios";
import FormData from "form-data";
import fs from "fs";
import type { ToolResult } from "./utils.js";

const BASE_URL = "https://intervals.icu/api/v1";

function createClient(): AxiosInstance {
  const apiKey = process.env.INTERVALS_API_KEY ?? "";
  return axios.create({
    baseURL: BASE_URL,
    auth: { username: "API_KEY", password: apiKey },
    headers: { "Content-Type": "application/json" },
  });
}

const client = createClient();

export const athleteId = () => process.env.INTERVALS_ATHLETE_ID ?? "0";

export async function get<T>(path: string, params?: Record<string, unknown>): Promise<T> {
  const { data } = await client.get<T>(path, { params });
  return data;
}

export async function post<T>(path: string, body: unknown): Promise<T> {
  const { data } = await client.post<T>(path, body);
  return data;
}

export async function put<T>(path: string, body: unknown): Promise<T> {
  const { data } = await client.put<T>(path, body);
  return data;
}

export async function postFile<T>(path: string, filePath: string, fields?: Record<string, string>): Promise<T> {
  const form = new FormData();
  form.append("file", fs.createReadStream(filePath));
  if (fields) {
    for (const [key, value] of Object.entries(fields)) {
      form.append(key, value);
    }
  }
  const { data } = await client.post<T>(path, form, {
    headers: form.getHeaders(),
  });
  return data;
}

function formatApiError(err: unknown): string {
  if (err instanceof AxiosError) {
    if (!err.response) {
      return "Network error: could not reach intervals.icu — check your internet connection";
    }
    const { status } = err.response;
    if (status === 401 || status === 403) return "401/403: Invalid API key or access denied — check INTERVALS_API_KEY in your config";
    if (status === 404) return "404: Resource not found — check the ID you provided";
    if (status === 429) return "429: Rate limited — wait a moment and try again";
    if (status >= 500) return `${status}: Intervals.icu server error — try again later`;
    return `${status}: Unexpected API error`;
  }
  if (err instanceof Error) return `Unexpected error: ${err.message}`;
  return "Unexpected error";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function withErrorHandling<F extends (...args: any[]) => Promise<ToolResult>>(fn: F): F {
  return (async (...args: Parameters<F>): Promise<ToolResult> => {
    try {
      return await fn(...args);
    } catch (err) {
      return {
        content: [{ type: "text" as const, text: formatApiError(err) }],
        isError: true,
      };
    }
  }) as F;
}
