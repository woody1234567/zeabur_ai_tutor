import type { H3Event } from "h3";
import { createError } from "h3";

export type McpScope = "student" | "teacher";

export type McpPrincipal = {
  id: string;
  email: string;
  role: string;
  scope: McpScope;
};

export function getMcpPrincipal(options?: {
  allowedRoles?: string[];
  scope?: McpScope;
}): McpPrincipal {
  const principal = useEvent().context.mcpPrincipal as
    | McpPrincipal
    | undefined;

  if (
    !principal ||
    (options?.allowedRoles &&
      !options.allowedRoles.includes(principal.role)) ||
    (options?.scope && principal.scope !== options.scope)
  ) {
    throw createError({ statusCode: 403, statusMessage: "Forbidden" });
  }

  return principal;
}
