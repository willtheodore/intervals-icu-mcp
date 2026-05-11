import { get, athleteId, withErrorHandling } from "../client.js";
import { jsonResult } from "../utils.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export async function getAthlete() {
  const data = await get(`/athlete/${athleteId()}`);
  return jsonResult(data);
}

export function registerAthleteTools(server: McpServer) {
  server.registerTool(
    "get_athlete",
    {
      description: "Get the athlete profile including name, sport settings, and power/HR zones",
    },
    withErrorHandling(getAthlete)
  );
}
