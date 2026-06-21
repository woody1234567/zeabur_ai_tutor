import { getTestbankMetadata } from "../../utils/testbank";
import { getMcpPrincipal } from "../../utils/mcp-auth";

export default defineMcpResource({
  name: "testbank_list",
  description:
    "List of all available problems in the test bank with metadata (title, source, hashtags, difficulty)",
  uri: "testbank://list",
  metadata: {
    mimeType: "application/json",
    annotations: {
      audience: ["assistant"],
      priority: 0.7,
    },
  },
  handler: async () => {
    getMcpPrincipal({
      allowedRoles: ["teacher", "admin"],
      scope: "teacher",
    });
    const allProblems = await getTestbankMetadata(100);

    return {
      contents: [
        {
          uri: "testbank://list",
          mimeType: "application/json",
          text: JSON.stringify(allProblems, null, 2),
        },
      ],
    };
  },
});
