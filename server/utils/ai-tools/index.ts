import { searchProblemsTool } from "./search-problems";
import { recommendMaterialsTool } from "./recommend-materials";
import { createProblemTool } from "./create-problem";
import { webSearchTool } from "./web-search";

export const studentTools = {
  search_problems: searchProblemsTool,
  recommend_materials: recommendMaterialsTool,
  web_search: webSearchTool,
};

export const teacherTools = {
  search_problems: searchProblemsTool,
  create_problem: createProblemTool,
  web_search: webSearchTool,
};

export function getTools(role: "student" | "teacher" = "student") {
  return role === "teacher" ? teacherTools : studentTools;
}
