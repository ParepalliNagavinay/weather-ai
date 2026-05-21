import { createReadStream, existsSync } from "node:fs";
import { extname, join, resolve } from "node:path";
import { createServer } from "node:http";
import "./loadEnv.js";
import { handleWeatherChat } from "./weatherChat.js";

const PORT = Number(process.env.PORT || 4173);
const ROOT = resolve("dist");

const contentTypes = {
  ".css": "text/css",
  ".html": "text/html",
  ".js": "text/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
};

const serveFile = (res, filePath) => {
  const type = contentTypes[extname(filePath)] || "application/octet-stream";
  res.setHeader("Content-Type", type);
  createReadStream(filePath).pipe(res);
};

createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === "/api/weather-chat") {
    handleWeatherChat(req, res);
    return;
  }

  const requestedPath = url.pathname === "/" ? "/index.html" : url.pathname;
  const filePath = join(ROOT, requestedPath);

  if (existsSync(filePath)) {
    serveFile(res, filePath);
    return;
  }

  serveFile(res, join(ROOT, "index.html"));
}).listen(PORT, () => {
  console.log(`Weather AI server running at http://localhost:${PORT}`);
});
