import { get } from "./client.js";

export function validateEnv(): void {
  const apiKey = process.env.INTERVALS_API_KEY;
  if (!apiKey) {
    console.error("Error: INTERVALS_API_KEY is not set.");
    console.error("Get your key at https://intervals.icu/settings → Developer Settings,");
    console.error("then add it to .env or the env block in your Claude Desktop config.");
    process.exit(1);
  }

  const athleteIdEnv = process.env.INTERVALS_ATHLETE_ID;
  if (!athleteIdEnv) {
    console.log("\x1b[34mNote: INTERVALS_ATHLETE_ID not set — defaulting to your own account.\x1b[0m");
  }
}

// Only runs when INTERVALS_ATHLETE_ID is explicitly set to a non-default value.
// Advisory only: never blocks boot on error.
export async function athleteIdMismatchCheck(): Promise<void> {
  const athleteIdEnv = process.env.INTERVALS_ATHLETE_ID;
  if (!athleteIdEnv || athleteIdEnv === "0") return;

  try {
    const checkPromise = get<{ id: string | number }>("/athlete/0");
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("timeout")), 5000)
    );
    const athlete = await Promise.race([checkPromise, timeoutPromise]);

    if (String(athlete.id) !== athleteIdEnv) {
      console.warn(
        `Warning: INTERVALS_ATHLETE_ID (${athleteIdEnv}) does not match your authenticated account (${athlete.id}). Requests may fail with 403.`
      );
    }
  } catch {
    console.warn("Could not verify athlete ID — continuing.");
  }
}
