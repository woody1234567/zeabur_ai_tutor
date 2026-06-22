import { createOpenAI } from "@ai-sdk/openai";
import { wrapLanguageModel } from "ai";

export async function getAIModel() {
  const config = useRuntimeConfig();
  const provider = createOpenAI({
    baseURL: config.aiBaseUrl,
    apiKey: config.aiApiKey || "",
  });
  const model = provider(config.aiModel);

  if (process.dev) {
    const { devToolsMiddleware } = await import("@ai-sdk/devtools");
    return wrapLanguageModel({ model, middleware: devToolsMiddleware() });
  }

  return model;
}
