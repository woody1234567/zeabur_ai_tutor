import { z } from "zod";
import { searchProblems } from "../../utils/problems";
import { getMcpPrincipal } from "../../utils/mcp-auth";

export default defineMcpTool({
  name: "search_problems",
  description:
    "Search for problems in the question bank. Supports semantic search (describe what you want in natural language) and keyword/structured filters.",
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
  },
  inputSchema: {
    query: z.string().max(500).optional().describe("Semantic search — describe the type of problems you want in natural language"),
    title: z.string().max(200).optional().describe("Filter by problem title or content keyword"),
    source: z.string().max(200).optional().describe("Filter by problem source"),
    hashtag: z.string().max(100).optional().describe("Filter by hashtag"),
    subject: z.string().max(100).optional().describe("Filter by subject (e.g. Math, Science, English)"),
    chapter: z.string().max(200).optional().describe("Filter by chapter or unit"),
    grade: z.string().max(50).optional().describe("Filter by grade level"),
    difficulty: z.enum(["easy", "medium", "hard"]).optional().describe("Filter by difficulty"),
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
        query: args.query,
        title: args.title,
        source: args.source,
        hashtag: args.hashtag,
        subject: args.subject,
        chapter: args.chapter,
        grade: args.grade,
        difficulty: args.difficulty,
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
