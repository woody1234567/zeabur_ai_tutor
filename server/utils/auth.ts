import { betterAuth } from "better-auth";
import type { H3Event } from "h3";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../../db";
import * as schema from "../../db/schema";
import { eq, sql } from "drizzle-orm";

import { admin } from "better-auth/plugins";

const baseURL =
  process.env.NUXT_PUBLIC_BASE_URL || "http://localhost:3000";

export const auth = betterAuth({
  baseURL,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: schema,
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? {
          google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          },
        }
      : {}),
  },

  databaseHooks: {
    user: {
      create: {
        after: async (newUser) => {
          const result = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(schema.user);
          if (result[0]?.count === 1) {
            await db
              .update(schema.user)
              .set({ role: "admin" })
              .where(eq(schema.user.id, newUser.id));
          }
        },
      },
    },
    session: {
      create: {
        after: async (session) => {
          await db
            .update(schema.user)
            .set({ lastLogin: new Date() })
            .where(eq(schema.user.id, session.userId));
        },
      },
    },
  },
  plugins: [admin()],
  trustedOrigins: [
    baseURL,
    ...(process.env.NODE_ENV !== "production"
      ? ["http://localhost:3000"]
      : [])
  ],
  debug: process.env.NODE_ENV !== "production",
});

export const requireAuthSession = async (event: H3Event) => {
  const session = await auth.api.getSession({
    headers: event.headers,
  });
  if (!session) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    });
  }
  return session;
};
