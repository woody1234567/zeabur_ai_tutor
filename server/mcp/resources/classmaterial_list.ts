import { getClassMaterialsMetadata } from "../../utils/materials";

export default defineMcpResource({
  name: "classmaterial_list",
  description:
    "List of available class materials with metadata (name, subject, chapter, source)",
  uri: "classmaterials://list",
  metadata: {
    mimeType: "application/json",
  },
  handler: async () => {
    // Fetch all materials (generic access)
    const materials = await getClassMaterialsMetadata();

    return {
      contents: [
        {
          uri: "classmaterials://list",
          mimeType: "application/json",
          text: JSON.stringify(materials, null, 2),
        },
      ],
    };
  },
});
