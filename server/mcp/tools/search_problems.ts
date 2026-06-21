import { z } from "zod";
import { searchProblems } from "../../utils/problems";
import { getMcpPrincipal } from "../../utils/mcp-auth";

export default defineMcpTool({
  name: "search_problems",
  description:
    "Search for problems in the question bank by title, source, or hashtag.",
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
  },
  inputSchema: {
    title: z.string().max(200).optional().describe("Filter by problem title"),
    source: z.string().max(200).optional().describe("Filter by problem source"),
    hashtag: z.string().max(100).optional().describe("Filter by hashtag"),
    limit: z
      .number()
      .int()
      .min(1)
      .max(20)
      .default(10)
      .describe("Maximum number of problems to return"),
  },
  handler: async (args) => {
    try {
      getMcpPrincipal({
        allowedRoles: ["student", "teacher", "admin"],
      });
      const results = await searchProblems({
        title: args.title,
        source: args.source,
        hashtag: args.hashtag,
        limit: args.limit,
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(results, null, 2),
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: `Error searching problems: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  },
});
