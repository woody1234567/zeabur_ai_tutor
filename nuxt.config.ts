// https://nuxt.com/docs/api/configuration/nuxt-config
import dotenv from "dotenv";

// Load .env first
dotenv.config();
// Load .env.local to override
dotenv.config({ path: ".env.local", override: true });

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: {
    enabled: true,

    timeline: {
      enabled: true,
    },
  },
  modules: [
    "@nuxtjs/tailwindcss",
    "@nuxtjs/i18n",
    "@nuxtjs/mcp-toolkit",
    "@nuxt/icon",
  ],
  i18n: {
    locales: [
      { code: "en", file: "en.json", name: "English" },
      { code: "zhTW", file: "zhTW.json", name: "繁體中文" },
    ],

    langDir: "locales",
    defaultLocale: "en",
    // strategy: "prefix_and_default", // or 'no_prefix' depending on preference, usually prefix_except_default or prefix_and_default
    strategy: "prefix_except_default",
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: "i18n_redirected",
      redirectOn: "root",
    },
  },
  runtimeConfig: {
    public: {
      baseURL: process.env.NUXT_PUBLIC_BASE_URL || "",
      betterAuthUrl: process.env.NUXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000",
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
    classMaterialsR2BucketName: process.env.CLASS_MATERIALS_R2_BUCKET_NAME,
    classMaterialsR2AccountId: process.env.CLASS_MATERIALS_R2_ACCOUNT_ID,
    classMaterialsR2AccessKeyId: process.env.CLASS_MATERIALS_R2_ACCESS_KEY_ID,
    classMaterialsR2SecretAccessKey:
      process.env.CLASS_MATERIALS_R2_SECRET_ACCESS_KEY,
    classMaterialsR2PublicDomain: process.env.CLASS_MATERIALS_R2_PUBLIC_DOMAIN,
    aiBaseUrl: process.env.AI_BASE_URL || "https://api.openai.com/v1",
    aiModel: process.env.AI_MODEL || "gpt-4o",
    aiApiKey: process.env.AI_API_KEY || process.env.OPENAI_API_KEY,
    embeddingBaseUrl:
      process.env.EMBEDDING_BASE_URL || "https://api.openai.com/v1",
    embeddingModel: process.env.EMBEDDING_MODEL || "text-embedding-3-small",
    embeddingApiKey:
      process.env.EMBEDDING_API_KEY || process.env.OPENAI_API_KEY,
    tavilyApiKey: process.env.TAVILY_API_KEY,
    mcpStudentGatewayToken: "",
    mcpTeacherGatewayToken: "",
  },
  mcp: {
    name: "Study With Woody",
  },
  nitro: {
    experimental: {
      asyncContext: true,
    },
  },
  vite: {
    build: {
      chunkSizeWarningLimit: 750,
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            if (id.includes("node_modules/katex") || id.includes("node_modules/marked")) {
              return "vendor-markdown";
            }
          },
        },
      },
    },
  },
  css: ["~/assets/css/main.css"],
});
