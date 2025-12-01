import { createAuthClient } from "better-auth/vue";
import { adminClient } from "better-auth/client/plugins";
const getBaseURL = () => {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  // Server-side logic (SSG, SSR)
  const env = process.env.VERCEL_ENV;

  if (env === "production") return "https://studywithwoody.site";
  if (env === "preview") return "https://preview.studywithwoody.site";

  return "http://localhost:3000";
};

export const authClient = createAuthClient({
  baseURL: getBaseURL(),
  plugins: [adminClient()],
});

// export const authClient = createAuthClient({
//   baseURL: process.client
//     ? window.location.origin
//     : (useRuntimeConfig().public.betterAuthUrl as string),
//   plugins: [adminClient()],
// });

export const { signIn, signOut, useSession } = authClient;
