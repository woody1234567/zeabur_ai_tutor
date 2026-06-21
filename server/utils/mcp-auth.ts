import { timingSafeEqual } from "node:crypto";
import { sql } from "drizzle-orm";
import type { H3Event } from "h3";
import { createError, getHeader } from "h3";
import { db } from "../../db";
import { user } from "../../db/schema";

export type McpScope = "student" | "teacher";

export type McpPrincipal = {
  id: string;
  email: string;
  role: string;
  scope: McpScope;
  openWebUiUserId?: string;
  chatId?: string;
};

function secureTokenEqual(actual: string, expected: string) {
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);

  return (
    actualBuffer.length === expectedBuffer.length &&
    timingSafeEqual(actualBuffer, expectedBuffer)
  );
}

export async function requireMcpPrincipal(
  event: H3Event,
  options: {
    allowedRoles: string[];
    expectedToken?: string;
    scope: McpScope;
  }
): Promise<McpPrincipal> {
  if (!options.expectedToken) {
    throw createError({
      statusCode: 503,
      statusMessage: "MCP gateway authentication is not configured",
    });
  }

  const authorization = getHeader(event, "authorization") ?? "";
  const token = authorization.match(/^Bearer\s+(.+)$/i)?.[1];
  const email = getHeader(event, "x-open-webui-user-email")
    ?.trim()
    .toLowerCase();

  if (
    !token ||
    !email ||
    email.length > 320 ||
    !secureTokenEqual(token, options.expectedToken)
  ) {
    throw createError({ statusCode: 403, statusMessage: "Forbidden" });
  }

  const [account] = await db
    .select({
      id: user.id,
      email: user.email,
      role: user.role,
      banned: user.banned,
    })
    .from(user)
    .where(sql`lower(${user.email}) = ${email}`)
    .limit(1);

  if (
    !account ||
    account.banned ||
    !account.role ||
    !options.allowedRoles.includes(account.role)
  ) {
    throw createError({ statusCode: 403, statusMessage: "Forbidden" });
  }

  return {
    id: account.id,
    email: account.email,
    role: account.role,
    scope: options.scope,
    openWebUiUserId: getHeader(event, "x-open-webui-user-id"),
    chatId: getHeader(event, "x-open-webui-chat-id"),
  };
}

export function getMcpPrincipal(options?: {
  allowedRoles?: string[];
  scope?: McpScope;
}) {
  const principal = useEvent().context.mcpPrincipal;

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
