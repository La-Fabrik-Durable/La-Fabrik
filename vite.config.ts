import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import type { ViteDevServer } from "vite";
import type { IncomingMessage, ServerResponse } from "http";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

const MAX_MAP_PAYLOAD_BYTES = 1024 * 1024; // 1MB limit

const saveMapPlugin = () => ({
  name: "save-map-api",
  configureServer(server: ViteDevServer) {
    server.middlewares.use(
      "/api/save-map",
      async (req: IncomingMessage, res: ServerResponse) => {
        if (req.method !== "POST") {
          res.writeHead(405, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Method not allowed" }));
          return;
        }

        let body = "";
        let bodySize = 0;
        let requestAborted = false;

        req.on("data", (chunk: Buffer) => {
          if (requestAborted) return;
          bodySize += chunk.length;
          if (bodySize > MAX_MAP_PAYLOAD_BYTES) {
            requestAborted = true;
            res.writeHead(413, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Payload too large" }));
            req.destroy();
            return;
          }
          body += chunk.toString();
        });

        req.on("error", (err: Error) => {
          if (!res.headersSent) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: err.message }));
          }
        });

        req.on("end", async () => {
          if (requestAborted) return;

          try {
            const parsedBody = JSON.parse(body);
            const mapPath = path.resolve(__dirname, "public/map.json");
            await fs.promises.writeFile(
              mapPath,
              JSON.stringify(parsedBody, null, 2),
              "utf8",
            );
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: true }));
          } catch (err) {
            const statusCode = err instanceof SyntaxError ? 400 : 500;
            res.writeHead(statusCode, { "Content-Type": "application/json" });
            res.end(
              JSON.stringify({
                error: err instanceof Error ? err.message : "Unknown error",
              }),
            );
          }
        });
      },
    );
  },
});

export default defineConfig({
  plugins: [react(), saveMapPlugin()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
