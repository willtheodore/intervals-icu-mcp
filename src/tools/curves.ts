import { z } from "zod";
import { get, athleteId } from "../client.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function defaultDates() {
  const today = new Date();
  const oneYearAgo = new Date(today);
  oneYearAgo.setFullYear(today.getFullYear() - 1);
  return { today: isoDate(today), oneYearAgo: isoDate(oneYearAgo) };
}

const curveInputSchema = {
  oldest: z.string().optional().describe("Start date (YYYY-MM-DD). Defaults to 1 year ago."),
  newest: z.string().optional().describe("End date (YYYY-MM-DD). Defaults to today."),
  type: z.string().optional().describe("Sport type filter (e.g. Ride, Run, Swim)."),
};

export async function getPowerCurves(params: {
  oldest?: string;
  newest?: string;
  type?: string;
}) {
  const { today, oneYearAgo } = defaultDates();
  const query: Record<string, unknown> = {
    oldest: params.oldest ?? oneYearAgo,
    newest: params.newest ?? today,
  };
  if (params.type !== undefined) query.type = params.type;

  const data = await get(`/athlete/${athleteId()}/power-curves`, query);
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
  };
}

export async function getHrCurves(params: {
  oldest?: string;
  newest?: string;
  type?: string;
}) {
  const { today, oneYearAgo } = defaultDates();
  const query: Record<string, unknown> = {
    oldest: params.oldest ?? oneYearAgo,
    newest: params.newest ?? today,
  };
  if (params.type !== undefined) query.type = params.type;

  const data = await get(`/athlete/${athleteId()}/hr-curves`, query);
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
  };
}

export async function getPaceCurves(params: {
  oldest?: string;
  newest?: string;
  type?: string;
}) {
  const { today, oneYearAgo } = defaultDates();
  const query: Record<string, unknown> = {
    oldest: params.oldest ?? oneYearAgo,
    newest: params.newest ?? today,
  };
  if (params.type !== undefined) query.type = params.type;

  const data = await get(`/athlete/${athleteId()}/pace-curves`, query);
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
  };
}

export function registerCurveTools(server: McpServer) {
  server.registerTool(
    "get_power_curves",
    {
      description:
        "Get the power-duration curve (MMP) for the athlete. Returns best average power in watts for each duration across activities in the date range.",
      inputSchema: curveInputSchema,
    },
    getPowerCurves
  );

  server.registerTool(
    "get_hr_curves",
    {
      description:
        "Get the heart rate-duration curve for the athlete. Returns best average HR in bpm for each duration across activities in the date range.",
      inputSchema: curveInputSchema,
    },
    getHrCurves
  );

  server.registerTool(
    "get_pace_curves",
    {
      description:
        "Get the pace-duration curve for the athlete. Returns best average pace for each duration across activities in the date range.",
      inputSchema: curveInputSchema,
    },
    getPaceCurves
  );
}
