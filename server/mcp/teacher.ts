import classMaterials from "./resources/classmaterial_list";
import testbank from "./resources/testbank_list";
import createProblem from "./tools/create_problem";
import searchProblems from "./tools/search_problems";

export default defineMcpHandler({
  name: "teacher",
  tools: [searchProblems, createProblem],
  resources: [classMaterials, testbank],
});
