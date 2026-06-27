import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../../db/schema";

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export const useDrizzle = () => {
  if (!_db) {
    const config = useRuntimeConfig();
    const connectionString = config.databaseUrl || process.env.DATABASE_URL || "";
    const client = postgres(connectionString);
    _db = drizzle(client, { schema });
  }
  return _db;
};
