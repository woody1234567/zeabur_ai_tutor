import { z } from "zod";

export default defineMcpTool({
  name: "test",
  description: "A simple test MCP tool that echoes the provided message.",
  inputSchema: {
    message: z
      .string()
      .min(1)
      .default("Hello from Nuxt MCP")
      .describe("Message to echo back from the MCP test tool"),
  },
  handler: async (args) => {
    return {
      content: [
        {
          type: "text",
          text: `MCP test tool received: ${args.message}`,
        },
      ],
    };
  },
});
