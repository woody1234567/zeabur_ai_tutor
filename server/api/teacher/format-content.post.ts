import OpenAI from "openai";
import { auth } from "../../../server/utils/auth";

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
  const { content } = body;

  if (!content) {
    throw createError({
      statusCode: 400,
      message: "Content is required",
    });
  }

  const systemPrompt = `
    You are a helpful assistant that formats educational content.
    Your task is to take raw text (which might be from OCR or rough notes) and format it into clean, readable Markdown.
    
    CRITICAL RULES FOR MATH FORMATTING:
    1. Use LaTeX for ALL mathematical formulas, equations, and variables.
    2. Use double dollar signs $$ ... $$ for block equations (equations on their own line), do not use \[ \].
    3. Use single dollar signs $ ... $ for inline equations (equations within text), do not use \( \).
    4. Do NOT use code blocks (backticks) for math.
    5. Fix any obvious typos or OCR errors in the text.
    6. please stict to the raw text above and do not add any additional text. 
    
    Example Input:
    The area of a circle is pi r squared. If r=5, then A = 25pi.
    
    Example Output:
    The area of a circle is given by $A = \pi r^2$.
    
    If $r=5$, then:
    $$ A = 25\pi $$
  `;

  try {
    const completion = await openai.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: content },
      ],
      model: "gpt-4o-mini",
    });

    return {
      formattedContent: completion.choices[0].message.content,
    };
  } catch (error: any) {
    console.error("OpenAI API Error:", error);
    throw createError({
      statusCode: 500,
      message: "Failed to format content",
    });
  }
});
