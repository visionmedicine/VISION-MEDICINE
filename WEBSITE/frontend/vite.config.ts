import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { viteStaticCopy } from "vite-plugin-static-copy";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    tsconfigPaths(),
    viteStaticCopy({
      targets: [
        {
          src: "node_modules/leaflet/dist/images/*",
          dest: "assets/leaflet/images",
        },
      ],
    }),
  ],
});
