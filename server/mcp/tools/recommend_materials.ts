import { z } from "zod";
import { recommendMaterials } from "../../utils/materials";
import { getMcpPrincipal } from "../../utils/mcp-auth";

export default defineMcpTool({
  name: "recommend_materials",
  description:
    "Recommend class materials available to the authenticated student based on their enrolled classrooms and optional search keywords.",
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
  },
  inputSchema: {
    keyword: z
      .string()
      .max(100)
      .optional()
      .describe(
        "Optional keyword to filter materials by name, subject, or hashtags"
      ),
    limit: z
      .number()
      .int()
      .min(1)
      .max(20)
      .default(5)
      .describe("Maximum number of recommendations to return"),
  },
  handler: async (args) => {
    try {
      const principal = getMcpPrincipal({
        allowedRoles: ["student", "admin"],
        scope: "student",
      });
      const materials = await recommendMaterials({
        studentId: principal.id,
        keyword: args.keyword,
        limit: args.limit,
      });

      if (materials.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: "No relevant materials found for this student.",
            },
          ],
        };
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(materials, null, 2),
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: `Error recommending materials: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  },
});
