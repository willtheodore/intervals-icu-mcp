import { get, athleteId } from "../client.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export async function getAthlete() {
  const data = await get(`/athlete/${athleteId()}`);
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
  };
}

export function registerAthleteTools(server: McpServer) {
  server.registerTool(
    "get_athlete",
    {
      description: "Get the athlete profile including name, sport settings, and power/HR zones",
    },
    getAthlete
  );
}
