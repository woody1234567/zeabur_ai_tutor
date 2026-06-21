import { getClassMaterialsMetadata } from "../../utils/materials";
import { getMcpPrincipal } from "../../utils/mcp-auth";

export default defineMcpResource({
  name: "classmaterial_list",
  description:
    "List of available class materials with metadata (name, subject, chapter, source)",
  uri: "classmaterials://list",
  metadata: {
    mimeType: "application/json",
    annotations: {
      audience: ["assistant"],
      priority: 0.8,
    },
  },
  handler: async () => {
    const principal = getMcpPrincipal({
      allowedRoles: ["student", "teacher", "admin"],
    });
    const materials = await getClassMaterialsMetadata({
      studentId: principal.scope === "student" ? principal.id : undefined,
      teacherId: principal.scope === "teacher" ? principal.id : undefined,
      limit: 100,
    });

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
