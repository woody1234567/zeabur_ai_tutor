import classMaterials from "./resources/classmaterial_list";
import recommendMaterials from "./tools/recommend_materials";
import searchProblems from "./tools/search_problems";

export default defineMcpHandler({
  name: "student",
  tools: [searchProblems, recommendMaterials],
  resources: [classMaterials],
});
