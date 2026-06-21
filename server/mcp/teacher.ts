import classMaterials from "./resources/classmaterial_list";
import testbank from "./resources/testbank_list";
import createProblem from "./tools/create_problem";
import searchProblems from "./tools/search_problems";

export default defineMcpHandler({
  name: "teacher",
  tools: [searchProblems, createProblem],
  resources: [classMaterials, testbank],
  middleware: async (event) => {
    if (event.context.mcpPrincipal) return;

    try {
      const session = await requireAuthSession(event);
      if (session?.user) {
        event.context.mcpPrincipal = {
          id: session.user.id,
          email: session.user.email,
          role: session.user.role ?? "teacher",
          scope: "teacher" as const,
        };
      }
    } catch {
      // Soft auth — let enabled guards on tools handle unauthorized access
    }
  },
});
