import classMaterials from "./resources/classmaterial_list";
import recommendMaterials from "./tools/recommend_materials";
import searchProblems from "./tools/search_problems";

export default defineMcpHandler({
  name: "student",
  tools: [searchProblems, recommendMaterials],
  resources: [classMaterials],
  middleware: async (event) => {
    // If mcpPrincipal is already set (by chat.post.ts), use it
    if (event.context.mcpPrincipal) return;

    // Fallback: try better-auth session for direct MCP access
    try {
      const session = await requireAuthSession(event);
      if (session?.user) {
        event.context.mcpPrincipal = {
          id: session.user.id,
          email: session.user.email,
          role: session.user.role ?? "student",
          scope: "student" as const,
        };
      }
    } catch {
      // Soft auth — let enabled guards on tools handle unauthorized access
    }
  },
});
