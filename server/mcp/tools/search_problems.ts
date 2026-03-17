import { z } from "zod";
import { searchProblems } from "../../utils/problems";

export default defineMcpTool({
  name: "search_problems",
  description:
    "Search for problems in the question bank by title, source, or hashtag.",
  inputSchema: {
    title: z.string().optional().describe("Filter by problem title"),
    source: z.string().optional().describe("Filter by problem source"),
    hashtag: z.string().optional().describe("Filter by hashtag"),
  },
  handler: async (args) => {
    try {
      const results = await searchProblems({
        title: args.title,
        source: args.source,
        hashtag: args.hashtag,
        limit: 10,
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
