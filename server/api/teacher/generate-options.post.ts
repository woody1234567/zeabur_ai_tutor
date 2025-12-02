import OpenAI from "openai";
import { auth } from "../../../server/utils/auth";
import { z } from "zod";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const ResponseSchema = z.object({
  choices: z.array(
    z.object({
      text: z.string(),
      isCorrect: z.boolean(),
    })
  ),
  explanation: z.string(),
});

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({
    headers: event.headers,
  });

  if (!session) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    });
  }

  const body = await readBody(event);
  const { content } = body;

  if (!content) {
    throw createError({
      statusCode: 400,
      message: "Content is required",
    });
  }

  const systemPrompt = `
    You are a helpful assistant that generates educational multiple-choice options and explanations.
    Your task is to take a problem statement and generate:
    1. 4 plausible options (A, B, C, D).
    2. Identify the correct option.
    3. Provide a clear and concise explanation for the solution.

    CRITICAL RULES:
    1. Return ONLY valid JSON.
    2. The JSON must match this structure:
       {
         "choices": [
           { "text": "Option A text", "isCorrect": false },
           { "text": "Option B text", "isCorrect": true },
           { "text": "Option C text", "isCorrect": false },
           { "text": "Option D text", "isCorrect": false }
         ],
         "explanation": "Detailed explanation here..."
       }
    3. Ensure there is exactly one correct answer.
    4. Use LaTeX for math formulas in options and explanation (e.g., $x^2$).
  `;

  try {
    const completion = await openai.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: content },
      ],
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
    });

    const responseContent = completion.choices[0].message.content;
    console.log(responseContent);
    if (!responseContent) {
      throw new Error("No content received from OpenAI");
    }

    const parsedData = JSON.parse(responseContent);
    const validatedData = ResponseSchema.parse(parsedData);

    return validatedData;
  } catch (error: any) {
    console.error("OpenAI API Error:", error);
    throw createError({
      statusCode: 500,
      message: "Failed to generate options",
    });
  }
});
