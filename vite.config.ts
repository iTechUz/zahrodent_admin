import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

/** Long-lived vendor chunks (all used on every page): they change rarely, so browsers keep them cached across deploys. */
function vendorChunk(id: string): string | undefined {
  if (!id.includes("node_modules")) return undefined;
  // recharts (only on the lazy dashboard/analytics pages) and xlsx (dynamic import() on export) are
  // left to Rollup so they stay out of the entry graph — a manual chunk would also swallow shared
  // deps like clsx and get preloaded on every page.
  if (/[\\/]node_modules[\\/](react|react-dom|scheduler|react-router|react-router-dom|@remix-run)[\\/]/.test(id)) return "vendor-react";
  if (/[\\/]node_modules[\\/](@radix-ui|cmdk|vaul|sonner|@floating-ui)[\\/]/.test(id)) return "vendor-ui";
  if (/[\\/]node_modules[\\/]@tanstack[\\/]/.test(id)) return "vendor-query";
  if (/[\\/]node_modules[\\/](framer-motion|motion-dom|motion-utils)[\\/]/.test(id)) return "vendor-motion";
  if (/[\\/]node_modules[\\/](socket\.io-client|engine\.io-client|engine\.io-parser|socket\.io-parser|@socket\.io)[\\/]/.test(id)) return "vendor-socket";
  if (/[\\/]node_modules[\\/](date-fns|react-day-picker)[\\/]/.test(id)) return "vendor-date";
  return undefined;
}

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "0.0.0.0",
    port: 8070,
    allowedHosts: true,
    strictPort: true,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: vendorChunk,
      },
    },
  },
});
