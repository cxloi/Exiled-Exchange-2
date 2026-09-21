import path from "path";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

function logForward(): Plugin {
  return {
    name: 'log-forward',
    apply: 'serve',
    configureServer(server) {
      server.ws.on('client:log', ({ level, args }) => {
        const fn = (console as any)[level] ?? console.log
        fn('[browser]', ...args)
      })
    },
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    target: "esnext",
    assetsInlineLimit: 0,
    sourcemap: true,
  },
  optimizeDeps: {
    esbuildOptions: { target: "esnext" },
  },
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag === "webview",
        },
      },
    }),
    logForward()
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@ipc": path.resolve(__dirname, "./src/../../ipc"),
      "@specs": path.resolve(__dirname, "./specs"),
    },
    extensions: [".ts", ".js", ".vue", ".json"],
  },
  define: {
    "import.meta.vitest": "undefined",
  },
  server: {
    proxy: {
      "^/(config|uploads|proxy|build-planner)": { target: "http://127.0.0.1:8584" },
      "/events": { ws: true, target: "http://127.0.0.1:8584" },
    },
  },
});
