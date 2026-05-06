import "dotenv/config";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerAthleteTools } from "./tools/athlete.js";
import { registerActivityTools } from "./tools/activities.js";
import { registerCalendarTools } from "./tools/calendar.js";
import { registerWorkoutTools } from "./tools/workouts.js";

const server = new McpServer({
  name: "intervals-mcp",
  version: "0.1.0",
});

registerAthleteTools(server);
registerActivityTools(server);
registerCalendarTools(server);
registerWorkoutTools(server);

const transport = new StdioServerTransport();
await server.connect(transport);
