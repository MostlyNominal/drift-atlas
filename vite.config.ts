import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The site is deployed as a GitHub Pages PROJECT site at:
//   https://mostlynominal.github.io/drift-atlas/
// so the base path MUST be "/drift-atlas/" (with leading and trailing slash).
// All asset URLs and data fetches resolve against import.meta.env.BASE_URL,
// which Vite sets from this value, so links work on Pages, not just locally.
//
// Override only if you fork to a different repo name:
//   VITE_BASE=/your-repo/ npm run build
const base = process.env.VITE_BASE ?? "/drift-atlas/";

export default defineConfig({
  base,
  plugins: [react()],
  build: {
    outDir: "dist",
    sourcemap: true,
  },
});
