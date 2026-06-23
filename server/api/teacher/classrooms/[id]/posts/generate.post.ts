import OpenAI from "openai";
import { auth } from "../../../../../utils/auth";
import { defineEventHandler, readBody, createError } from "h3";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
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
  const { summary, template } = body;

  if (!summary || !template) {
    throw createError({
      statusCode: 400,
      message: "Summary and Template are required",
    });
  }

  const systemPrompt = `
    You are a helpful assistant that formats educational content.
    Your task is to take a "Summary" of a class and rewrite it to fit a specific "Template".
    
    The user will provide:
    1. A Summary of what happened in class.
    2. A Template structure to fill.

    Output ONLY the filled template. Do not add any conversational filler.
    Ensure the information from the summary is correctly mapped to the fields in the template.
    If information is missing for a part of the template, leave it valid but empty or generic if appropriate, but try to infer from context.
  `;

  try {
    const completion = await openai.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Summary:\n${summary}\n\nTemplate:\n${template}`,
        },
      ],
      model: "gpt-4o-mini",
    });

    return {
      generatedContent: completion.choices[0]!.message.content,
    };
  } catch (error: any) {
    console.error("OpenAI API Error:", error);
    throw createError({
      statusCode: 500,
      message: "Failed to generate content",
    });
  }
});
