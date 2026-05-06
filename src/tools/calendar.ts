import { z } from "zod";
import { get, post, put, athleteId } from "../client.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

const EVENT_CATEGORIES = [
  "WORKOUT",
  "RACE_A",
  "RACE_B",
  "RACE_C",
  "NOTE",
  "HOLIDAY",
  "SICK",
  "INJURED",
] as const;

export async function listEvents(params: { oldest: string; newest: string }) {
  const data = await get(`/athlete/${athleteId()}/events`, {
    oldest: params.oldest,
    newest: params.newest,
  });
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
  };
}

export async function createEvent(params: {
  startDateLocal?: string;
  name?: string;
  category?: (typeof EVENT_CATEGORIES)[number];
  type?: string;
  description?: string;
  movingTime?: number;
  distance?: number;
  indoor?: boolean;
}) {
  const body: Record<string, unknown> = {
    start_date_local: params.startDateLocal ?? isoDate(new Date()),
    category: params.category ?? "WORKOUT",
    indoor: params.indoor ?? false,
  };
  if (params.name !== undefined) body.name = params.name;
  if (params.type !== undefined) body.type = params.type;
  if (params.description !== undefined) body.description = params.description;
  if (params.movingTime !== undefined) body.moving_time = params.movingTime;
  if (params.distance !== undefined) body.distance = params.distance;

  const data = await post(`/athlete/${athleteId()}/events`, body);
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
  };
}

export async function updateEvent(params: {
  eventId: number;
  startDateLocal?: string;
  name?: string;
  category?: (typeof EVENT_CATEGORIES)[number];
  type?: string;
  description?: string;
  movingTime?: number;
  distance?: number;
  indoor?: boolean;
}) {
  const body: Record<string, unknown> = {};
  if (params.startDateLocal !== undefined) body.start_date_local = params.startDateLocal;
  if (params.name !== undefined) body.name = params.name;
  if (params.category !== undefined) body.category = params.category;
  if (params.type !== undefined) body.type = params.type;
  if (params.description !== undefined) body.description = params.description;
  if (params.movingTime !== undefined) body.moving_time = params.movingTime;
  if (params.distance !== undefined) body.distance = params.distance;
  if (params.indoor !== undefined) body.indoor = params.indoor;

  const data = await put(`/athlete/${athleteId()}/events/${params.eventId}`, body);
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
  };
}

export function registerCalendarTools(server: McpServer) {
  server.registerTool(
    "list_events",
    {
      description: "List planned workouts and calendar events in a date range.",
      inputSchema: {
        oldest: z.string().describe("Start date (YYYY-MM-DD)."),
        newest: z.string().describe("End date (YYYY-MM-DD)."),
      },
    },
    listEvents
  );

  server.registerTool(
    "create_event",
    {
      description: "Add a planned workout or event to the training calendar.",
      inputSchema: {
        startDateLocal: z.string().optional().describe("Event date (YYYY-MM-DD). Defaults to today."),
        name: z.string().optional().describe("Event title."),
        category: z
          .enum(EVENT_CATEGORIES)
          .optional()
          .describe("Event category. Defaults to WORKOUT."),
        type: z.string().optional().describe("Sport type (e.g. Ride, Run, Swim)."),
        description: z.string().optional().describe("Workout description or notes."),
        movingTime: z.number().int().positive().optional().describe("Planned duration in seconds."),
        distance: z.number().int().positive().optional().describe("Planned distance in meters."),
        indoor: z.boolean().default(false).describe("Whether the workout is indoors."),
      },
    },
    createEvent
  );

  server.registerTool(
    "update_event",
    {
      description: "Update an existing calendar event by ID.",
      inputSchema: {
        eventId: z.number().int().describe("The event ID to update."),
        startDateLocal: z.string().optional().describe("New event date (YYYY-MM-DD)."),
        name: z.string().optional().describe("New event title."),
        category: z.enum(EVENT_CATEGORIES).optional().describe("New event category."),
        type: z.string().optional().describe("New sport type (e.g. Ride, Run, Swim)."),
        description: z.string().optional().describe("New workout description or notes."),
        movingTime: z.number().int().positive().optional().describe("New planned duration in seconds."),
        distance: z.number().int().positive().optional().describe("New planned distance in meters."),
        indoor: z.boolean().optional().describe("Whether the workout is indoors."),
      },
    },
    updateEvent
  );
}
