import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    deploymentTarget: process.env.DOCKER ? "node" : "cloudflare-workers",
  },
  cloudflare: process.env.DOCKER ? false : undefined,
  vite: {
    build: {
      rollupOptions: {
        external: ["cloudflare:sockets"],
      },
    },
  },
});
