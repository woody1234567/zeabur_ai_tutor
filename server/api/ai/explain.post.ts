import { db } from "../../../db";
import { problems } from "../../../db/schema";
import { auth } from "../../../server/utils/auth";
import { eq } from "drizzle-orm";
import OpenAI from "openai";

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
  const { problemId, userAnswer } = body;

  const problem = await db
    .select()
    .from(problems)
    .where(eq(problems.id, problemId))
    .limit(1);

  if (!problem.length) {
    throw createError({
      statusCode: 404,
      statusMessage: "Problem not found",
    });
  }

  const p = problem[0];

  const prompt = `
    You are a helpful AI tutor. A student has answered a multiple-choice question.
    
    Question: ${p.content}
    Choices: ${JSON.stringify(p.choices)}
    Correct Answer: ${p.correctAnswer}
    Official Explanation: ${p.explanation}
    
    Student's Answer: ${userAnswer}
    
    Please explain why the student's answer is ${
      userAnswer === p.correctAnswer ? "correct" : "incorrect"
    } and provide a clear, step-by-step explanation of the solution. 
    
    IMPORTANT FORMATTING INSTRUCTIONS:
    - Use standard Markdown for text formatting (bold, lists, etc.).
    - Use LaTeX for ALL mathematical formulas, equations, and symbols.
    - Enclose block math in double dollar signs: $$ ... $$
    - Enclose inline math in single dollar signs: $ ... $
    - Do NOT use code blocks for math.
    - Example: "The area of a circle is given by $A = \pi r^2$."
    
    Be encouraging and friendly. Keep it concise but thorough.
  `;

  const completion = await openai.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "gpt-4o-mini",
  });

  return {
    explanation: completion.choices[0].message.content,
  };
});
