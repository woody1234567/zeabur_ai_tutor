import { betterAuth } from "better-auth";
import type { H3Event } from "h3";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../../db";
import * as schema from "../../db/schema";
import { eq } from "drizzle-orm";

import { admin } from "better-auth/plugins";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: schema,
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },

  databaseHooks: {
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
    "https://preview.studywithwoody.site",
    "https://staging.studywithwoody.site",
    "https://studywithwoody.site",
    "http://localhost:3000",
  ],
  debug: true,
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
