import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export const createDb = () => {
  if (!_db) {
    const config = useRuntimeConfig();
    const connectionString = config.databaseUrl || process.env.DATABASE_URL || "";
    _db = drizzle(postgres(connectionString), { schema });
  }
  return _db;
};
