import { getRequestURL } from "h3";

export default defineEventHandler(async (event) => {
  const pathname = getRequestURL(event).pathname.replace(/\/$/, "");

  if (pathname === "/mcp") {
    throw createError({ statusCode: 403, statusMessage: "Forbidden" });
  }
});
