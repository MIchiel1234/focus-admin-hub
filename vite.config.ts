// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// `cloudflare: false` disables the Cloudflare Workers build plugin so TanStack
// Start emits a normal Node server bundle. Combined with prerender, every route
// is baked into static HTML so the output can be served by any static file
// server (Node `serve`, nginx, Coolify, etc.) — no Worker runtime required.
export default defineConfig({
  cloudflare: false,
  tanstackStart: {
    prerender: {
      enabled: true,
      crawlLinks: true,
      routes: [
        "/",
        "/calendar",
        "/modules",
        "/goals",
        "/notes",
        "/achievements",
        "/settings",
      ],
    },
  },
});
