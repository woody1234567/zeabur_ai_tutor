import type { McpPrincipal } from "../utils/mcp-auth";

declare module "h3" {
  interface H3EventContext {
    mcpPrincipal?: McpPrincipal;
  }
}

export {};
