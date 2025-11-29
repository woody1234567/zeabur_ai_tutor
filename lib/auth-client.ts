import { createAuthClient } from "better-auth/vue";
import { adminClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: process.client
    ? window.location.origin
    : (useRuntimeConfig().public.betterAuthUrl as string),
  plugins: [adminClient()],
});

export const { signIn, signOut, useSession } = authClient;
