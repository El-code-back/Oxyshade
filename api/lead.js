const { deliverLead, normalizeLead } = require("../lead-service");

const MAX_BODY = 50 * 1024;

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}

function readJsonBody(req) {
  if (req.body && typeof req.body === "object") {
    return Promise.resolve(req.body);
  }
  if (typeof req.body === "string") {
    return Promise.resolve(JSON.parse(req.body || "{}"));
  }

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

module.exports = async function leadApi(req, res) {
  if (req.method !== "POST") {
    send(res, 405, { ok: false, message: "Method not allowed" });
    return;
  }

  try {
    const input = await readJsonBody(req);
    const lead = normalizeLead(input, {
      remoteAddress: req.headers["x-forwarded-for"] || req.socket?.remoteAddress || ""
    });

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
};
