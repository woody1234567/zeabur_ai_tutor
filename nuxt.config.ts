// https://nuxt.com/docs/api/configuration/nuxt-config
import dotenv from "dotenv";

// Load .env first
dotenv.config();
// Load .env.local to override
dotenv.config({ path: ".env.local", override: true });

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  modules: ["@nuxtjs/tailwindcss", "@nuxtjs/i18n"],
  i18n: {
    locales: [
      { code: "en", file: "en.json", name: "English" },
      { code: "zh-TW", file: "zh-TW.json", name: "繁體中文" },
    ],
    lazy: true,
    langDir: "locales",
    defaultLocale: "zh-TW",
    strategy: "prefix_and_default", // or 'no_prefix' depending on preference, usually prefix_except_default or prefix_and_default
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: "i18n_redirected",
      redirectOn: "root",
    },
  },
  runtimeConfig: {
    public: {
      baseURL: process.env.NUXT_BASE_URL || "",
      betterAuthUrl: process.env.BETTER_AUTH_URL || "http://localhost:3000",
    },
    databaseUrl: process.env.DATABASE_URL,
    authSecret: process.env.BETTER_AUTH_SECRET,
    betterAuthSecret: process.env.BETTER_AUTH_SECRET,
    googleVisionApiKey: process.env.GOOGLE_VISION_API_KEY,
    openaiApiKey: process.env.OPENAI_API_KEY,
    r2AccountId: process.env.R2_ACCOUNT_ID,
    r2AccessKeyId: process.env.R2_ACCESS_KEY_ID,
    r2SecretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    r2BucketName: process.env.R2_BUCKET_NAME,
    r2PublicDomain: process.env.R2_PUBLIC_DOMAIN,
  },
  css: ["~/assets/css/main.css"],
});
