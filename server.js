const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PORT = Number(process.env.PORT || 3000);
const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, "public");
const DATA_DIR = path.join(ROOT, "data");
const LEADS_FILE = path.join(DATA_DIR, "leads.jsonl");
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

function normalizeLead(input, req) {
  const name = String(input.name || "").trim();
  const email = String(input.email || "").trim().toLowerCase();
  const organization = String(input.organization || "").trim();
  const type = String(input.type || "").trim();
  const phone = String(input.phone || "").trim();
  const message = String(input.message || "").trim();
  const language = String(input.language || "ru").trim();
  const page = String(input.page || "").trim();

  if (String(input.website || "").trim()) {
    return { spam: true };
  }

  if (!name || name.length < 2) {
    throw new Error("Name is required");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Valid email is required");
  }
  if (!type) {
    throw new Error("Interest type is required");
  }

  return {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    name,
    email,
    organization,
    type,
    phone,
    message,
    language,
    page,
    ipHash: crypto.createHash("sha256").update(req.socket.remoteAddress || "").digest("hex").slice(0, 16)
  };
}

async function handleLead(req, res) {
  if (!checkRateLimit(req)) {
    send(res, 429, { ok: false, message: "Too many requests. Please try again later." });
    return;
  }

  try {
    const input = await readJsonBody(req);
    const lead = normalizeLead(input, req);

    if (lead.spam) {
      send(res, 200, { ok: true, message: "Thanks. We received your request." });
      return;
    }

    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.appendFileSync(LEADS_FILE, `${JSON.stringify(lead)}\n`, "utf8");

    send(res, 200, {
      ok: true,
      id: lead.id,
      message: "Thanks. We received your request."
    });
  } catch (error) {
    send(res, 400, { ok: false, message: error.message });
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
