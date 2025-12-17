import { getTestbankMetadata } from "../../utils/testbank";

export default defineMcpResource({
  name: "testbank_list",
  description:
    "List of all available problems in the test bank with metadata (title, source, hashtags, difficulty)",
  uri: "testbank://list",
  metadata: {
    mimeType: "application/json",
  },
  handler: async () => {
    const allProblems = await getTestbankMetadata();

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
