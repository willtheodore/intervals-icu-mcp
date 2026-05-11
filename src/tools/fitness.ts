import { z } from "zod";
import { get, athleteId } from "../client.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export async function getFitnessSummary(params: {
  oldest?: string;
  newest?: string;
}) {
  const today = new Date();
  const threeMonthsAgo = new Date(today);
  threeMonthsAgo.setMonth(today.getMonth() - 3);
  const threeMonthsAhead = new Date(today);
  threeMonthsAhead.setMonth(today.getMonth() + 3);

  const data = await get(`/athlete/${athleteId()}/wellness`, {
    oldest: params.oldest ?? isoDate(threeMonthsAgo),
    newest: params.newest ?? isoDate(threeMonthsAhead),
  });
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
  };
}

export function registerFitnessTools(server: McpServer) {
  server.registerTool(
    "get_fitness_summary",
    {
      description:
        "Get daily fitness (CTL), fatigue (ATL), form/TSB, and ramp rate over a date range. Defaults to 3 months ago through 3 months from today.",
      inputSchema: {
        oldest: z
          .string()
          .optional()
          .describe("Start date (YYYY-MM-DD). Defaults to 3 months ago."),
        newest: z
          .string()
          .optional()
          .describe("End date (YYYY-MM-DD). Defaults to 3 months from today."),
      },
    },
    getFitnessSummary
  );
}
