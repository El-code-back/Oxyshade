const http = require("http");
const fs = require("fs");
const path = require("path");
const { deliverLead, normalizeLead } = require("./lead-service");

const PORT = Number(process.env.PORT || 3000);
const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, "public");
const MAX_BODY = 50 * 1024;
const rateLimits = new Map();

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".md": "text/markdown; charset=utf-8",
  ".txt": "text/plain; charset=utf-8"
};

function send(res, status, body, headers = {}) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    ...headers
  });
  res.end(typeof body === "string" ? body : JSON.stringify(body));
}

function isInsidePublic(filePath) {
  const relative = path.relative(PUBLIC_DIR, filePath);
  return relative && !relative.startsWith("..") && !path.isAbsolute(relative);
}

function serveStatic(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const cleanPath = decodeURIComponent(url.pathname);
  const requested = cleanPath === "/" ? "/index.html" : cleanPath;
  const filePath = path.join(PUBLIC_DIR, requested);

  if (!isInsidePublic(filePath)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not found");
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      "Content-Type": mimeTypes[ext] || "application/octet-stream",
      "X-Content-Type-Options": "nosniff"
    });
    res.end(data);
  });
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (Buffer.byteLength(body) > MAX_BODY) {
        reject(new Error("Payload is too large"));
        req.destroy();
      }
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(body || "{}"));
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });
    req.on("error", reject);
  });
}

function checkRateLimit(req) {
  const ip = req.socket.remoteAddress || "unknown";
  const now = Date.now();
  const windowMs = 60 * 1000;
  const current = rateLimits.get(ip) || [];
  const recent = current.filter((time) => now - time < windowMs);
  recent.push(now);
  rateLimits.set(ip, recent);
  return recent.length <= 8;
}

async function handleLead(req, res) {
  if (!checkRateLimit(req)) {
    send(res, 429, { ok: false, message: "Too many requests. Please try again later." });
    return;
  }

  try {
    const input = await readJsonBody(req);
    const lead = normalizeLead(input, { remoteAddress: req.socket.remoteAddress || "" });

    if (lead.spam) {
      send(res, 200, { ok: true, message: "Thanks. We received your request." });
      return;
    }

    await deliverLead(lead);

    send(res, 200, {
      ok: true,
      id: lead.id,
      message: "Thanks. We received your request."
    });
  } catch (error) {
    const status = error.message === "Telegram notification failed" || error.message === "Telegram is not configured" ? 502 : 400;
    send(res, status, { ok: false, message: error.message });
  }
}

const server = http.createServer((req, res) => {
  if (req.method === "POST" && req.url === "/api/lead") {
    handleLead(req, res);
    return;
  }

  if (req.method === "GET" || req.method === "HEAD") {
    serveStatic(req, res);
    return;
  }

  send(res, 405, { ok: false, message: "Method not allowed" });
});

server.listen(PORT, () => {
  console.log(`OxyShade MVP is running at http://localhost:${PORT}`);
});
