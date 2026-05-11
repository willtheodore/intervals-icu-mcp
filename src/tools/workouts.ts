import { z } from "zod";
import { post, put, athleteId, withErrorHandling } from "../client.js";
import { jsonResult } from "../utils.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const WORKOUT_TARGETS = ["AUTO", "POWER", "HR", "PACE"] as const;

export async function createWorkout(params: {
  name?: string;
  type?: string;
  description?: string;
  movingTime?: number;
  target?: (typeof WORKOUT_TARGETS)[number];
  indoor?: boolean;
  folderId?: number;
}) {
  const body: Record<string, unknown> = {
    target: params.target ?? "AUTO",
    indoor: params.indoor ?? false,
  };
  if (params.name !== undefined) body.name = params.name;
  if (params.type !== undefined) body.type = params.type;
  if (params.description !== undefined) body.description = params.description;
  if (params.movingTime !== undefined) body.moving_time = params.movingTime;
  if (params.folderId !== undefined) body.folder_id = params.folderId;

  const data = await post(`/athlete/${athleteId()}/workouts`, body);
  return jsonResult(data);
}

export async function updateWorkout(params: {
  workoutId: number;
  name?: string;
  type?: string;
  description?: string;
  movingTime?: number;
  target?: (typeof WORKOUT_TARGETS)[number];
  indoor?: boolean;
  folderId?: number;
}) {
  const body: Record<string, unknown> = {};
  if (params.name !== undefined) body.name = params.name;
  if (params.type !== undefined) body.type = params.type;
  if (params.description !== undefined) body.description = params.description;
  if (params.movingTime !== undefined) body.moving_time = params.movingTime;
  if (params.target !== undefined) body.target = params.target;
  if (params.indoor !== undefined) body.indoor = params.indoor;
  if (params.folderId !== undefined) body.folder_id = params.folderId;

  const data = await put(`/athlete/${athleteId()}/workouts/${params.workoutId}`, body);
  return jsonResult(data);
}

export function registerWorkoutTools(server: McpServer) {
  server.registerTool(
    "create_workout",
    {
      description: "Create a new workout in the athlete's workout library.",
      inputSchema: {
        name: z.string().optional().describe("Workout title."),
        type: z.string().optional().describe("Sport type (e.g. Ride, Run, Swim)."),
        description: z.string().optional().describe("Workout description (supports native intervals.icu format)."),
        movingTime: z.number().int().positive().optional().describe("Planned duration in seconds."),
        target: z
          .enum(WORKOUT_TARGETS)
          .default("AUTO")
          .describe("Training target metric. Defaults to AUTO."),
        indoor: z.boolean().default(false).describe("Whether the workout is indoors."),
        folderId: z.number().int().optional().describe("Workout library folder ID."),
      },
    },
    withErrorHandling(createWorkout)
  );

  server.registerTool(
    "update_workout",
    {
      description: "Update an existing workout in the workout library by ID.",
      inputSchema: {
        workoutId: z.number().int().describe("The workout ID to update."),
        name: z.string().optional().describe("New workout title."),
        type: z.string().optional().describe("New sport type (e.g. Ride, Run, Swim)."),
        description: z.string().optional().describe("New workout description."),
        movingTime: z.number().int().positive().optional().describe("New planned duration in seconds."),
        target: z.enum(WORKOUT_TARGETS).optional().describe("New training target metric."),
        indoor: z.boolean().optional().describe("Whether the workout is indoors."),
        folderId: z.number().int().optional().describe("New workout library folder ID."),
      },
    },
    withErrorHandling(updateWorkout)
  );
}
