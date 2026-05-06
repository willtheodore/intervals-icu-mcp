import { z } from "zod";
import { get, put, postFile, athleteId } from "../client.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export async function listActivities(params: {
  oldest?: string;
  newest?: string;
  limit?: number;
}) {
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 30);

  const data = await get(`/athlete/${athleteId()}/activities`, {
    oldest: params.oldest ?? isoDate(thirtyDaysAgo),
    newest: params.newest ?? isoDate(today),
    limit: params.limit ?? 20,
  });
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
  };
}

export async function getActivity(params: { activityId: string }) {
  const data = await get(`/activity/${params.activityId}`);
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
  };
}

export async function createActivity(params: {
  filePath: string;
  name?: string;
  description?: string;
  startDateLocal?: string;
  type?: string;
}) {
  const fields: Record<string, string> = {};
  if (params.name) fields.name = params.name;
  if (params.description) fields.description = params.description;
  if (params.startDateLocal) fields.start_date_local = params.startDateLocal;
  if (params.type) fields.type = params.type;

  const data = await postFile(`/athlete/${athleteId()}/activities`, params.filePath, fields);
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
  };
}

export async function updateActivity(params: {
  activityId: string;
  name?: string;
  description?: string;
  type?: string;
  startDateLocal?: string;
}) {
  const body: Record<string, string> = {};
  if (params.name) body.name = params.name;
  if (params.description) body.description = params.description;
  if (params.type) body.type = params.type;
  if (params.startDateLocal) body.start_date_local = params.startDateLocal;

  const data = await put(`/activity/${params.activityId}`, body);
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
  };
}

export function registerActivityTools(server: McpServer) {
  server.registerTool(
    "list_activities",
    {
      description: "List recent activities. Returns summaries with id, name, date, sport, distance, duration, and TSS.",
      inputSchema: {
        oldest: z.string().optional().describe("Start date (YYYY-MM-DD). Defaults to 30 days ago."),
        newest: z.string().optional().describe("End date (YYYY-MM-DD). Defaults to today."),
        limit: z.number().int().min(1).max(200).default(20).describe("Max number of activities to return."),
      },
    },
    listActivities
  );

  server.registerTool(
    "get_activity",
    {
      description: "Get full details for a single activity by ID, including power, HR, pace, laps, and intervals.",
      inputSchema: {
        activityId: z.string().describe("The activity ID (e.g. from list_activities)."),
      },
    },
    getActivity
  );

  server.registerTool(
    "create_activity",
    {
      description: "Upload a new activity from a .fit, .tcx, or .gpx file on disk.",
      inputSchema: {
        filePath: z.string().describe("Absolute path to the .fit, .tcx, or .gpx file to upload."),
        name: z.string().optional().describe("Override the activity name."),
        description: z.string().optional().describe("Activity description."),
        startDateLocal: z.string().optional().describe("Start date/time in local time (ISO 8601)."),
        type: z.string().optional().describe("Activity type (e.g. Ride, Run, Swim)."),
      },
    },
    createActivity
  );

  server.registerTool(
    "update_activity",
    {
      description: "Update metadata for an existing activity (name, description, sport type, etc.).",
      inputSchema: {
        activityId: z.string().describe("The activity ID to update."),
        name: z.string().optional().describe("New activity name."),
        description: z.string().optional().describe("New description."),
        type: z.string().optional().describe("Sport type (e.g. Ride, Run, Swim)."),
        startDateLocal: z.string().optional().describe("New start date/time in local time (ISO 8601)."),
      },
    },
    updateActivity
  );
}
