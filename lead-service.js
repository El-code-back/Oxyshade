const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const DATA_DIR = path.join(__dirname, "data");
const LEADS_FILE = path.join(DATA_DIR, "leads.jsonl");

function normalizeLead(input, meta = {}) {
  const name = String(input.name || "").trim();
  const email = String(input.email || "").trim().toLowerCase();
  const organization = String(input.organization || "").trim();
  const type = String(input.type || "").trim();
  const phone = String(input.phone || "").trim();
  const message = String(input.message || "").trim();
  const language = String(input.language || "ru").trim();
  const page = String(input.page || "").trim();
  const remoteAddress = String(meta.remoteAddress || "");

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
    ipHash: crypto.createHash("sha256").update(remoteAddress).digest("hex").slice(0, 16)
  };
}

function saveLeadToFile(lead) {
  if (process.env.SAVE_LEADS_TO_FILE === "false") {
    return { saved: false, skipped: true };
  }

  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.appendFileSync(LEADS_FILE, `${JSON.stringify(lead)}\n`, "utf8");
    return { saved: true, file: LEADS_FILE };
  } catch (error) {
    console.warn("Lead file save failed:", error.message);
    return { saved: false, error: error.message };
  }
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function formatTelegramMessage(lead) {
  const optionalLines = [
    lead.organization ? `🏢 Организация: ${escapeHtml(lead.organization)}` : "",
    lead.phone ? `📞 Телефон: ${escapeHtml(lead.phone)}` : "",
    lead.message ? `💬 Сообщение:\n${escapeHtml(lead.message)}` : "",
    lead.page ? `🔗 Страница: ${escapeHtml(lead.page)}` : ""
  ].filter(Boolean);

  // fix: Telegram notification is concise but contains every field the founder needs to reply quickly.
  return [
    "🌿 <b>Новая заявка OxyShade</b>",
    "",
    `Тип: <b>${escapeHtml(lead.type)}</b>`,
    `Имя: ${escapeHtml(lead.name)}`,
    `Email: ${escapeHtml(lead.email)}`,
    ...optionalLines,
    "",
    `Язык: ${escapeHtml(lead.language)}`,
    `ID: <code>${escapeHtml(lead.id)}</code>`,
    `Время: ${escapeHtml(lead.createdAt)}`
  ].join("\n");
}

async function sendLeadToTelegram(lead) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    return { enabled: false, sent: false };
  }

  const payload = {
    chat_id: chatId,
    text: formatTelegramMessage(lead),
    parse_mode: "HTML",
    disable_web_page_preview: true
  };

  if (process.env.TELEGRAM_MESSAGE_THREAD_ID) {
    payload.message_thread_id = process.env.TELEGRAM_MESSAGE_THREAD_ID;
  }

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    return { enabled: true, sent: false, error: `Telegram error ${response.status}: ${body.slice(0, 240)}` };
  }

  return { enabled: true, sent: true };
}

async function deliverLead(lead) {
  const file = saveLeadToFile(lead);
  const telegram = await sendLeadToTelegram(lead);

  if (telegram.enabled && !telegram.sent) {
    console.warn(telegram.error || "Telegram notification failed");
    throw new Error("Telegram notification failed");
  }

  if (!telegram.enabled && !file.saved) {
    console.warn("Lead delivery is not configured: TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID are missing.");
    throw new Error("Telegram is not configured");
  }

  return { file, telegram };
}

module.exports = {
  deliverLead,
  formatTelegramMessage,
  normalizeLead,
  saveLeadToFile,
  sendLeadToTelegram
};
