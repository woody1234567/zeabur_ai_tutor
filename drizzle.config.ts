import { defineConfig } from "drizzle-kit";
import dotenv from "dotenv";

// Load .env first (default behavior of dotenv.config())
dotenv.config();
// Load .env.local to override
dotenv.config({ path: ".env.local", override: true });

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
