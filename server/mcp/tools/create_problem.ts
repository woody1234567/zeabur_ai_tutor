import { z } from "zod";
import { problems } from "../../../db/schema";
import { db } from "../../utils/db";
import { getMcpPrincipal } from "../../utils/mcp-auth";

export default defineMcpTool({
  name: "create_problem",
  description:
    "Create a new question-bank problem. This write operation is available only to authenticated teachers.",
  annotations: {
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: false,
  },
  inputSchema: {
    title: z.string().min(1).max(200).describe("Problem title"),
    content: z.string().min(1).max(20_000).describe("Problem statement"),
    choices: z
      .record(z.string().min(1).max(10), z.string().min(1).max(2_000))
      .refine((value) => Object.keys(value).length >= 2, {
        message: "At least two choices are required",
      })
      .describe('Answer choices keyed by labels such as {"A":"...","B":"..."}'),
    correctAnswer: z
      .string()
      .min(1)
      .max(10)
      .describe("The key of the correct choice, such as A"),
    explanation: z
      .string()
      .max(20_000)
      .optional()
      .describe("Optional answer explanation"),
    difficulty: z
      .enum(["easy", "medium", "hard"])
      .optional()
      .describe("Problem difficulty"),
    subject: z
      .string()
      .max(100)
      .optional()
      .describe("Subject area (e.g. Math, Science, English)"),
    chapter: z
      .string()
      .max(200)
      .optional()
      .describe("Chapter or unit (e.g. Chapter 3, Quadratic Equations)"),
    grade: z
      .string()
      .max(50)
      .optional()
      .describe("Grade level (e.g. Grade 7, Grade 10)"),
    source: z
      .string()
      .max(500)
      .optional()
      .describe("Optional problem source"),
    imageUrl: z
      .url()
      .max(2_000)
      .optional()
      .describe("Optional HTTPS image URL"),
    hashtags: z
      .array(z.string().min(1).max(50))
      .max(20)
      .default([])
      .describe("Searchable problem hashtags"),
  },
  handler: async (args) => {
    getMcpPrincipal({
      allowedRoles: ["teacher", "admin"],
      scope: "teacher",
    });

    if (!(args.correctAnswer in args.choices)) {
      throw createError({
        statusCode: 400,
        statusMessage: "correctAnswer must match one of the choice keys",
      });
    }

    const [problem] = await db
      .insert(problems)
      .values({
        title: args.title,
        content: args.content,
        choices: args.choices,
        correctAnswer: args.correctAnswer,
        explanation: args.explanation,
        difficulty: args.difficulty,
        subject: args.subject,
        chapter: args.chapter,
        grade: args.grade,
        source: args.source,
        imageUrl: args.imageUrl,
        hashtags: args.hashtags,
      })
      .returning({
        id: problems.id,
        title: problems.title,
        createdAt: problems.createdAt,
      });

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(problem),
        },
      ],
    };
  },
});
