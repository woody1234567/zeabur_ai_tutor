import type { Config } from "tailwindcss";
import daisyui from "daisyui";

export default <Config>{
  content: ["./app/**/*.{vue,js,ts,jsx,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [daisyui],
  daisyui: {
    themes: ["dark", "retro"],
  },
};
