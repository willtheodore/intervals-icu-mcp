import axios, { type AxiosInstance } from "axios";
import FormData from "form-data";
import fs from "fs";

const BASE_URL = "https://intervals.icu/api/v1";

function createClient(): AxiosInstance {
  const apiKey = process.env.INTERVALS_API_KEY;
  if (!apiKey) throw new Error("INTERVALS_API_KEY is not set");

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
