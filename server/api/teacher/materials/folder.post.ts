import { classMaterials } from "../../../../db/schema";

export default defineEventHandler(async (event) => {
  const session = await requireAuthSession(event);
  const body = await readBody(event);

  const { name, parentId } = body;

  if (!name) {
    throw createError({
      statusCode: 400,
      statusMessage: "Folder name is required",
    });
  }

  // Calculate path
  let parentPath = "";
  if (parentId) {
    const parent = await useDrizzle().query.classMaterials.findFirst({
      where: (cm, { eq }) => eq(cm.id, parentId),
    });
    if (parent) {
      parentPath = parent.path;
    }
  }

  const path = parentPath ? `${parentPath}${name}/` : `${name}/`;

  const [newFolder] = await useDrizzle()
    .insert(classMaterials)
    .values({
      teacherId: session.user.id,
      name,
      path,
      isFolder: true,
      parentId: parentId || null,
      type: "folder",
    })
    .returning();

  return newFolder;
});
