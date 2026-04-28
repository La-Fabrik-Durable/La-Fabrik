import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import type { Plugin } from "vite";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

const MAX_MAP_PAYLOAD_BYTES = 1024 * 1024;

const saveMapPlugin = (): Plugin => ({
  name: "save-map-api",
  configureServer(server) {
    server.middlewares.use("/api/save-map", async (req, res) => {
      if (req.method !== "POST") {
        res.writeHead(405).end(JSON.stringify({ error: "Method not allowed" }));
        return;
      }

      const chunks: Buffer[] = [];
      let size = 0;

      for await (const chunk of req) {
        size += chunk.length;
        if (size > MAX_MAP_PAYLOAD_BYTES) {
          res
            .writeHead(413)
            .end(JSON.stringify({ error: "Payload too large" }));
          req.destroy();
          return;
        }
        chunks.push(chunk);
      }

      try {
        const data = JSON.parse(Buffer.concat(chunks).toString());
        const mapPath = path.resolve(__dirname, "public/map.json");
        await fs.promises.writeFile(
          mapPath,
          JSON.stringify(data, null, 2),
          "utf8",
        );
        res.writeHead(200).end(JSON.stringify({ success: true }));
      } catch (err) {
        const status = err instanceof SyntaxError ? 400 : 500;
        const message = err instanceof Error ? err.message : "Unknown error";
        res.writeHead(status).end(JSON.stringify({ error: message }));
      }
    });
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
