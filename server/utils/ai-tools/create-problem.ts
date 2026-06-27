import { z } from "zod";
import { tool } from "ai";
import { problems, testbanks, testbankProblems } from "../../../db/schema";
import { and, eq } from "drizzle-orm";
import type { AiToolContext } from "./types";

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
  imageUrl: z.string().max(2_000).optional().describe("題目內容圖片的 URL（若題目需要圖片才能完整表達）"),
  hashtags: z
    .array(z.string().min(1).max(50))
    .max(20)
    .default([])
    .describe("標籤，如 [\"三角函數\", \"高一\"]"),
  testbankId: z.string().min(1).describe("目標題庫的 ID，請先呼叫 list_testbanks 取得可用題庫"),
});

export const createProblemTool = tool({
  description:
    "將討論好的題目寫入題庫。請先呼叫 list_testbanks 取得老師的題庫列表，讓老師選擇要儲存到哪個題庫後，再呼叫此工具。請在老師確認題目內容（標題、題幹、選項、正確答案）後才呼叫此工具。choices 格式為 {\"A\":\"...\",\"B\":\"...\"}，correctAnswer 為正確選項的 key（如 \"A\"）。",
  inputSchema,
  execute: async (input, { experimental_context }) => {
    const context = experimental_context as AiToolContext;

    if (!(input.correctAnswer in input.choices)) {
      return JSON.stringify({
        error: "correctAnswer 必須是 choices 中的其中一個 key",
      });
    }

    // Validate testbank ownership
    const [tb] = await useDrizzle()
      .select({ id: testbanks.id })
      .from(testbanks)
      .where(and(eq(testbanks.id, input.testbankId), eq(testbanks.ownerId, context.userId)));

    if (!tb) {
      return JSON.stringify({ error: "找不到該題庫或您沒有權限" });
    }

    const [problem] = await useDrizzle()
      .insert(problems)
      .values({
        title: input.title,
        content: input.content,
        choices: input.choices,
        correctAnswer: input.correctAnswer,
        explanation: input.explanation,
        difficulty: input.difficulty,
        subject: input.subject,
        chapter: input.chapter,
        grade: input.grade,
        source: input.source,
        imageUrl: input.imageUrl,
        hashtags: input.hashtags,
        aiGenerated: true,
        createdBy: context.userId,
      })
      .returning({
        id: problems.id,
        title: problems.title,
        createdAt: problems.createdAt,
      });

    // Link problem to testbank
    await useDrizzle().insert(testbankProblems).values({
      testbankId: input.testbankId,
      problemId: problem!.id,
    });

    generateAndStoreEmbedding(problem!.id, {
      title: input.title,
      content: input.content,
      explanation: input.explanation,
      subject: input.subject,
      chapter: input.chapter,
      grade: input.grade,
      hashtags: input.hashtags,
    });

    return JSON.stringify({
      success: true,
      message: `題目「${problem!.title}」已成功建立`,
      problem,
    });
  },
});
