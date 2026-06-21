import { getRequestURL } from "h3";
import { requireMcpPrincipal } from "../utils/mcp-auth";

export default defineEventHandler(async (event) => {
  const pathname = getRequestURL(event).pathname.replace(/\/$/, "");

  if (pathname === "/mcp") {
    throw createError({ statusCode: 403, statusMessage: "Forbidden" });
  }

  if (pathname !== "/mcp/student" && pathname !== "/mcp/teacher") {
    return;
  }

  const config = useRuntimeConfig(event);
  const scope = pathname.endsWith("/student") ? "student" : "teacher";

  event.context.mcpPrincipal = await requireMcpPrincipal(event, {
    scope,
    allowedRoles:
      scope === "student" ? ["student", "admin"] : ["teacher", "admin"],
    expectedToken:
      scope === "student"
        ? config.mcpStudentGatewayToken
        : config.mcpTeacherGatewayToken,
  });
});
