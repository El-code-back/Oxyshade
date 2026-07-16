const LANGS = ["ru", "kg", "en"];
let currentLang = localStorage.getItem("oxyshade-lang") || "ru";

function t(path) {
  return path.split(".").reduce((value, key) => value?.[key], window.OXY_CONTENT[currentLang]) || "";
}

function track(eventName, payload = {}) {
  const event = {
    eventName,
    payload,
    language: currentLang,
    at: new Date().toISOString()
  };
  window.dispatchEvent(new CustomEvent("oxyshade:analytics", { detail: event }));
  if (window.OXY_ANALYTICS_ID) {
    console.info("Analytics placeholder:", window.OXY_ANALYTICS_ID, event);
  }
}

function createCard([title, body]) {
  const article = document.createElement("article");
  article.className = "info-card";
  article.innerHTML = `<h3>${title}</h3><p>${body}</p>`;
  return article;
}

function renderLanguage() {
  const languageSwitch = document.querySelector(".language-switch");
  languageSwitch.innerHTML = "";

  LANGS.forEach((lang) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = lang.toUpperCase();
    button.className = lang === currentLang ? "active" : "";
    button.setAttribute("aria-pressed", String(lang === currentLang));
    button.addEventListener("click", () => {
      currentLang = lang;
      localStorage.setItem("oxyshade-lang", lang);
      render();
      track("language_change", { lang });
    });
    languageSwitch.append(button);
  });
}

function renderNav() {
  const nav = document.querySelector("#site-nav");
  nav.innerHTML = "";
  window.OXY_CONTENT[currentLang].nav.forEach(([id, label]) => {
    const link = document.createElement("a");
    link.href = `#${id}`;
    link.textContent = label;
    link.addEventListener("click", () => track("nav_click", { id }));
    nav.append(link);
  });
}

function renderText() {
  document.documentElement.lang = currentLang === "kg" ? "ky" : currentLang;
  document.querySelectorAll("[data-text]").forEach((node) => {
    node.textContent = t(node.dataset.text);
  });
}

function renderTrust() {
  const strip = document.querySelector("#trust-strip");
  strip.innerHTML = "";
  window.OXY_CONTENT[currentLang].trust.forEach((item) => {
    const span = document.createElement("span");
    span.textContent = item;
    strip.append(span);
  });
}

function renderMetrics() {
  const grid = document.querySelector("#metric-grid");
  grid.innerHTML = "";
  window.OXY_CONTENT[currentLang].metrics.forEach(([label, value]) => {
    const div = document.createElement("div");
    div.className = "metric";
    div.innerHTML = `<span>${label}</span><strong>${value}</strong>`;
    grid.append(div);
  });
}

function renderCards(selector, items) {
  const grid = document.querySelector(selector);
  grid.innerHTML = "";
  items.forEach((item) => grid.append(createCard(item)));
}

function renderMeasurements() {
  const table = document.querySelector("#research-table");
  table.innerHTML = "";
  window.OXY_CONTENT[currentLang].measurements.forEach(([name, status, note]) => {
    const row = document.createElement("div");
    row.className = "research-row";
    row.innerHTML = `<strong>${name}</strong><span>${status}</span><p>${note}</p>`;
    table.append(row);
  });
}

function renderFaq() {
  const list = document.querySelector("#faq-list");
  list.innerHTML = "";
  window.OXY_CONTENT[currentLang].faqItems.forEach(([question, answer], index) => {
    const details = document.createElement("details");
    if (index === 0) details.open = true;
    details.innerHTML = `<summary>${question}</summary><p>${answer}</p>`;
    list.append(details);
  });
}

function renderForm() {
  const select = document.querySelector("select[name='type']");
  const selected = select.value;
  select.innerHTML = "";
  window.OXY_CONTENT[currentLang].form.options.forEach((option) => {
    const optionNode = document.createElement("option");
    optionNode.value = option;
    optionNode.textContent = option;
    select.append(optionNode);
  });
  if (selected) select.value = selected;
}

function render() {
  renderLanguage();
  renderNav();
  renderText();
  renderTrust();
  renderMetrics();
  renderCards("#inside-grid", window.OXY_CONTENT[currentLang].inside);
  renderCards("#prototype-grid", window.OXY_CONTENT[currentLang].prototypeItems);
  renderCards("#use-case-grid", window.OXY_CONTENT[currentLang].useCaseItems);
  renderCards("#partner-list", window.OXY_CONTENT[currentLang].partnerItems);
  renderMeasurements();
  renderFaq();
  renderForm();
}

function setupMenu() {
  const button = document.querySelector(".menu-toggle");
  const nav = document.querySelector("#site-nav");
  button.addEventListener("click", () => {
    const open = button.getAttribute("aria-expanded") === "true";
    button.setAttribute("aria-expanded", String(!open));
    nav.classList.toggle("open", !open);
  });
}

function setupForm() {
  const form = document.querySelector("#lead-form");
  const status = form.querySelector(".form-status");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    status.textContent = "";

    if (!form.reportValidity()) {
      return;
    }

    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());
    payload.language = currentLang;
    payload.page = location.href;

    try {
      const response = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.message);

      form.reset();
      renderForm();
      status.textContent = t("form.success");
      status.className = "form-status success";
      track("lead_submit", { type: payload.type });
    } catch {
      status.textContent = t("form.error");
      status.className = "form-status error";
    }
  });
}

function setupCtas() {
  document.querySelectorAll(".button").forEach((button) => {
    button.addEventListener("click", () => {
      track("cta_click", { label: button.textContent.trim(), href: button.getAttribute("href") });
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  render();
  setupMenu();
  setupForm();
  setupCtas();
});
