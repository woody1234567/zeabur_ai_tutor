import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { problems, testbanks, testbankProblems, user } from "../db/schema";
import * as schema from "../db/schema";
import { eq, isNull, sql } from "drizzle-orm";

const connectionString = process.env.DATABASE_URL || "";
if (!connectionString) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}
const client = postgres(connectionString);
const db = drizzle(client, { schema });

async function migrate() {
  console.log("Starting testbank migration...");

  // 1. Find all distinct createdBy values (non-null)
  const creators = await db
    .selectDistinct({ createdBy: problems.createdBy })
    .from(problems)
    .where(sql`${problems.createdBy} IS NOT NULL`);

  for (const { createdBy } of creators) {
    // Create a public testbank for each creator
    const [tb] = await db
      .insert(testbanks)
      .values({
        name: "Default Testbank",
        ownerId: createdBy!,
        isPublic: true,
      })
      .returning({ id: testbanks.id });

    // Link all their problems
    const userProblems = await db
      .select({ id: problems.id })
      .from(problems)
      .where(eq(problems.createdBy, createdBy!));

    if (userProblems.length > 0) {
      await db.insert(testbankProblems).values(
        userProblems.map((p) => ({
          testbankId: tb!.id,
          problemId: p.id,
        }))
      );
    }

    console.log(`Created testbank for user ${createdBy}, linked ${userProblems.length} problems`);
  }

  // 2. Handle orphaned problems (createdBy = NULL)
  const orphaned = await db
    .select({ id: problems.id })
    .from(problems)
    .where(isNull(problems.createdBy));

  if (orphaned.length > 0) {
    // Find first admin user
    const [admin] = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.role, "admin"))
      .limit(1);

    if (!admin) {
      console.error("No admin user found. Cannot migrate orphaned problems.");
      process.exit(1);
    }

    // Create system testbank
    const [systemTb] = await db
      .insert(testbanks)
      .values({
        name: "Default Testbank",
        ownerId: admin.id,
        isPublic: true,
      })
      .returning({ id: testbanks.id });

    // Link orphaned problems and backfill createdBy
    await db.insert(testbankProblems).values(
      orphaned.map((p) => ({
        testbankId: systemTb!.id,
        problemId: p.id,
      }))
    );

    await db
      .update(problems)
      .set({ createdBy: admin.id })
      .where(isNull(problems.createdBy));

    console.log(`Created system testbank, linked ${orphaned.length} orphaned problems`);
  }

  console.log("Migration complete!");
  process.exit(0);
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
