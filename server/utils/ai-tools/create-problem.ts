import { z } from "zod";
import { db } from "../../../db";
import { problems } from "../../../db/schema";
import type { AiToolDefinition } from "./types";

const inputSchema = z.object({
  title: z.string().min(1).max(200).describe("題目標題"),
  content: z.string().min(1).max(20_000).describe("題目敘述（支援 Markdown）"),
  choices: z
    .record(z.string().min(1).max(10), z.string().min(1).max(2_000))
    .refine((v) => Object.keys(v).length >= 2, {
      message: "至少需要兩個選項",
    })
    .describe('選項，格式如 {"A":"選項A","B":"選項B","C":"選項C","D":"選項D"}'),
  correctAnswer: z
    .string()
    .min(1)
    .max(10)
    .describe("正確答案的 key，如 A"),
  explanation: z
    .string()
    .max(20_000)
    .optional()
    .describe("答案解析（選填）"),
  difficulty: z
    .enum(["easy", "medium", "hard"])
    .optional()
    .describe("難度：easy / medium / hard"),
  subject: z.string().max(100).optional().describe("科目，如 數學、英文、物理"),
  chapter: z.string().max(200).optional().describe("章節，如 第三章、二次方程式"),
  grade: z.string().max(50).optional().describe("年級，如 國一、高二"),
  source: z.string().max(500).optional().describe("來源（選填）"),
  hashtags: z
    .array(z.string().min(1).max(50))
    .max(20)
    .default([])
    .describe("標籤，如 [\"三角函數\", \"高一\"]"),
});

export const createProblemTool = {
  name: "create_problem",
  description:
    "將討論好的題目寫入題庫。請在老師確認題目內容（標題、題幹、選項、正確答案）後才呼叫此工具。choices 格式為 {\"A\":\"...\",\"B\":\"...\"}，correctAnswer 為正確選項的 key（如 \"A\"）。",
  parameters: z.toJSONSchema(inputSchema),
  handler: async (args) => {
    const parsed = inputSchema.parse(args);

    if (!(parsed.correctAnswer in parsed.choices)) {
      return JSON.stringify({
        error: "correctAnswer 必須是 choices 中的其中一個 key",
      });
    }

    const [problem] = await db
      .insert(problems)
      .values({
        title: parsed.title,
        content: parsed.content,
        choices: parsed.choices,
        correctAnswer: parsed.correctAnswer,
        explanation: parsed.explanation,
        difficulty: parsed.difficulty,
        subject: parsed.subject,
        chapter: parsed.chapter,
        grade: parsed.grade,
        source: parsed.source,
        hashtags: parsed.hashtags,
      })
      .returning({
        id: problems.id,
        title: problems.title,
        createdAt: problems.createdAt,
      });

    return JSON.stringify({
      success: true,
      message: `題目「${problem!.title}」已成功建立`,
      problem,
    });
  },
} satisfies AiToolDefinition;
