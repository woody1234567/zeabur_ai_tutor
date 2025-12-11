import { z } from "zod";
import { recommendMaterials } from "../../utils/materials";

export default defineMcpTool({
  name: "recommend_materials",
  description:
    "Recommend class materials to a student based on their enrolled classrooms and optional search keywords. Use this to find relevant reading materials, notes, or slides for the student.",
  inputSchema: {
    studentId: z
      .string()
      .describe("The ID of the student to recommend materials for"),
    keyword: z
      .string()
      .optional()
      .describe(
        "Optional keyword to filter materials by name, subject, or hashtags"
      ),
    limit: z
      .number()
      .optional()
      .default(5)
      .describe("Maximum number of recommendations to return"),
  },
  handler: async (args: any) => {
    try {
      const materials = await recommendMaterials({
        studentId: args.studentId,
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
