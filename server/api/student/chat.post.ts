import OpenAI from "openai";
import { db } from "../../../db";
import { chatHistory } from "../../../db/schema";
import { eq } from "drizzle-orm";
import { searchProblems } from "../../utils/problems";
import { recommendMaterials } from "../../utils/materials";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const tools = [
  {
    type: "function",
    function: {
      name: "search_problems",
      description:
        "Search for problems in the question bank by title, source, or hashtag.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Filter by problem title" },
          source: { type: "string", description: "Filter by problem source" },
          hashtag: { type: "string", description: "Filter by hashtag" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "recommend_materials",
      description:
        "Recommend class materials to a student based on their enrolled classrooms and optional search keywords.",
      parameters: {
        type: "object",
        properties: {
          studentId: {
            type: "string",
            description: "The ID of the student to recommend materials for",
          },
          keyword: {
            type: "string",
            description:
              "Optional keyword to filter materials by name, subject, or hashtags",
          },
          limit: {
            type: "number",
            description: "Maximum number of recommendations to return",
          },
        },
        required: ["studentId"],
      },
    },
  },
];

export default defineEventHandler(async (event) => {
  const session = await requireAuthSession(event);
  const user = session.user;
  const body = await readBody(event);
  const { message, chatId } = body;

  if (!message) {
    throw createError({
      statusCode: 400,
      statusMessage: "Message is required",
    });
  }

  let messages: any[] = [];
  let currentChatId = chatId;
  let title = "New Chat";

  // Load existing chat if chatId provided
  if (currentChatId) {
    const chat = await db.query.chatHistory.findFirst({
      where: eq(chatHistory.id, currentChatId),
    });

    if (chat) {
      messages = chat.messages as any[];
      title = chat.title || title;
    }
  }

  // Append user message
  messages.push({ role: "user", content: message });

  // Create messages for API call (including system context)
  const apiMessages = [
    {
      role: "system",
      content: `You are a helpful AI Tutor. Current Student ID: ${user.id}. Name: ${user.name}. When recommending materials, use the provided Student ID.`,
    },
    ...messages,
  ];

  try {
    // ... (keep commented out runner if it was there)
  } catch (e) {
    // ...
  }

  // Standard loop approach
  let response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: apiMessages,
    tools: tools,
    tool_choice: "auto",
  });

  let responseMessage = response.choices[0].message;

  // Handle tool calls
  while (responseMessage.tool_calls) {
    messages.push(responseMessage); // Add assistant message with tool calls to DB history
    apiMessages.push(responseMessage); // Add to current context

    for (const toolCall of responseMessage.tool_calls) {
      if (toolCall.function.name === "search_problems") {
        const args = JSON.parse(toolCall.function.arguments);
        const searchResults = await searchProblems({
          title: args.title,
          source: args.source,
          hashtag: args.hashtag,
          limit: 3,
        });

        const toolMessage = {
          tool_call_id: toolCall.id,
          role: "tool",
          name: "search_problems",
          content: JSON.stringify(searchResults),
        };
        messages.push(toolMessage);
        apiMessages.push(toolMessage);
      } else if (toolCall.function.name === "recommend_materials") {
        const args = JSON.parse(toolCall.function.arguments);
        const recommendations = await recommendMaterials({
          studentId: args.studentId || user.id,
          keyword: args.keyword,
          limit: args.limit,
        });

        const toolMessage = {
          tool_call_id: toolCall.id,
          role: "tool",
          name: "recommend_materials",
          content: JSON.stringify(recommendations),
        };
        messages.push(toolMessage);
        apiMessages.push(toolMessage);
      }
    }

    // Get next response
    response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: apiMessages,
      tools: tools,
      tool_choice: "auto", // Or none?
    });
    responseMessage = response.choices[0].message;
  }

  // Add final response
  messages.push(responseMessage);

  // Generate title if new chat
  if (!currentChatId && messages.length > 0) {
    // Simple title from first message
    title = (messages[0].content as string).substring(0, 50) + "...";
  }

  // Save to DB
  if (currentChatId) {
    await db
      .update(chatHistory)
      .set({
        messages: messages as any,
        updatedAt: new Date(),
      })
      .where(eq(chatHistory.id, currentChatId));
  } else {
    const newChat = await db
      .insert(chatHistory)
      .values({
        studentId: user.id,
        title: title,
        messages: messages as any,
      })
      .returning({ id: chatHistory.id });
    currentChatId = newChat[0].id;
  }

  return {
    chatId: currentChatId,
    messages: messages,
    response: responseMessage.content,
  };
});
