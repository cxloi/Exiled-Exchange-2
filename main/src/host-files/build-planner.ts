import path from "path";
import fs from "fs/promises";
import { app } from "electron";
import type { Server, IncomingMessage, ServerResponse } from "http";

// .build files are stored beside config.json
const storePath = path.join(app.getPath("userData"), "apt-data", "builds");
const PREFIX = "/build-planner/";
const TARGET_NAME = "EE2.build";

function readBody(req: IncomingMessage, limit = 16_000_000): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    let buf = Buffer.alloc(0);
    req.on("data", (chunk: Buffer) => {
      buf = Buffer.concat([buf, chunk]);
      if (buf.length > limit) {
        req.destroy();
        reject(new Error("too large"));
      }
    });
    req.once("end", () => resolve(buf));
    req.once("error", reject);
  });
}

function send(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader("content-type", "application/json");
  res.end(JSON.stringify(body));
}

const safeName = (s: string) => path.basename(String(s ?? ""));
const isBuild = (s: string) => s.toLowerCase().endsWith(".build");

export function addBuildPlannerRoutes(server: Server) {
  server.addListener("request", async (req, res) => {
    if (req.method !== "POST" || !req.url?.startsWith(PREFIX)) return;
    const action = req.url.slice(PREFIX.length).split("?")[0];
    try {
      if (action === "upload") {
        const data = await readBody(req);
        const orig = safeName(
          decodeURIComponent(String(req.headers["x-file-name"] ?? "")),
        );
        if (!isBuild(orig))
          return send(res, 400, { error: "not a .build file" });
        const name = `${Date.now()}-${orig}`;
        await fs.mkdir(storePath, { recursive: true });
        await fs.writeFile(path.join(storePath, name), data);
        return send(res, 200, { name });
      }

      const body = JSON.parse((await readBody(req, 64_000)).toString("utf8"));
      const targetDir = String(body.targetDir ?? "");
      if (!targetDir || !path.isAbsolute(targetDir)) {
        return send(res, 400, { error: "invalid target folder" });
      }

      if (action === "load") {
        const file = safeName(body.file);
        if (!isBuild(file)) return send(res, 400, { error: "invalid file" });
        await fs.mkdir(targetDir, { recursive: true });
        // always overwrite the same target file
        await fs.copyFile(
          path.join(storePath, file),
          path.join(targetDir, TARGET_NAME),
        );
        return send(res, 200, { ok: true });
      }

      if (action === "reset") {
        await fs.rm(path.join(targetDir, TARGET_NAME), { force: true });
        return send(res, 200, { ok: true });
      }

      if (action === "delete") {
        const file = safeName(body.file);
        if (isBuild(file))
          await fs.rm(path.join(storePath, file), { force: true });
        return send(res, 200, { ok: true });
      }

      send(res, 404, { error: "unknown action" });
    } catch (e) {
      send(res, 500, { error: (e as Error).message });
    }
  });
}
