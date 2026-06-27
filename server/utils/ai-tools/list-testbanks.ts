import { z } from "zod";
import { tool } from "ai";
import { testbanks } from "../../../db/schema";
import { eq } from "drizzle-orm";
import type { AiToolContext } from "./types";

export const listTestbanksTool = tool({
  description:
    "列出老師的所有題庫（testbank）。在建立題目前，先呼叫此工具讓老師選擇要儲存到哪個題庫。",
  inputSchema: z.object({}),
  execute: async (_input, { experimental_context }) => {
    const context = experimental_context as AiToolContext;

    const result = await useDrizzle()
      .select({
        id: testbanks.id,
        name: testbanks.name,
        isPublic: testbanks.isPublic,
      })
      .from(testbanks)
      .where(eq(testbanks.ownerId, context.userId));

    return JSON.stringify({
      testbanks: result,
      message: result.length > 0
        ? "請問要將題目儲存到哪個題庫？"
        : "您目前沒有題庫，請先建立一個題庫。",
    });
  },
});
