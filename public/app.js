const LANGS = ["ru", "kg", "en"];
let currentLang = localStorage.getItem("oxyshade-lang") || "ru";

/* ─── Translation helper ─────────────────────────────────────── */
function t(path) {
  return path.split(".").reduce((v, k) => v?.[k], window.OXY_CONTENT[currentLang]) ?? "";
}

/* ─── Analytics stub ─────────────────────────────────────────── */
function track(eventName, payload = {}) {
  const event = { eventName, payload, language: currentLang, at: new Date().toISOString() };
  window.dispatchEvent(new CustomEvent("oxyshade:analytics", { detail: event }));
  if (window.OXY_ANALYTICS_ID) console.info("Analytics:", window.OXY_ANALYTICS_ID, event);
}

/* ─── Language switcher ──────────────────────────────────────── */
function renderLanguage() {
  document.querySelectorAll(".language-switch").forEach((container) => {
    container.innerHTML = "";
    LANGS.forEach((lang) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = lang.toUpperCase();
      btn.className = lang === currentLang ? "active" : "";
      btn.setAttribute("aria-pressed", String(lang === currentLang));
      btn.addEventListener("click", () => {
        currentLang = lang;
        localStorage.setItem("oxyshade-lang", lang);
        render();
        track("language_change", { lang });
      });
      container.append(btn);
    });
  });
}

/* ─── Navigation ─────────────────────────────────────────────── */
function renderNav() {
  const nav = document.querySelector("#site-nav");
  if (!nav) return;
  nav.innerHTML = "";
  (window.OXY_CONTENT[currentLang].nav || []).forEach(([id, label]) => {
    const link = document.createElement("a");
    link.href = `#${id}`;
    link.textContent = label;
    link.addEventListener("click", () => {
      closeMenu();
      track("nav_click", { id });
    });
    nav.append(link);
  });
}

/* ─── data-text nodes ────────────────────────────────────────── */
function renderText() {
  document.documentElement.lang = currentLang === "kg" ? "ky" : currentLang;
  document.querySelectorAll("[data-text]").forEach((node) => {
    node.textContent = t(node.dataset.text);
  });
  // Update page title and meta description
  const titles = { ru: "OxyShade — живая технология для современных пространств", kg: "OxyShade — заманбап мейкиндиктер үчүн жандуу технология", en: "OxyShade — living technology for modern spaces" };
  const descs = { ru: "Модульный фотобиореактор с Chlorella для демонстрации фотосинтеза, образовательных сценариев и пилотных установок в Бишкеке.", kg: "Chlorella бар модулдук фотобиореактор — фотосинтезди көрсөтүү жана пилоттук орнотуулар үчүн.", en: "A modular Chlorella microalgae photobioreactor for visible photosynthesis, pilot installations and partnerships in Bishkek, Kyrgyzstan." };
  document.title = titles[currentLang] || titles.ru;
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) metaDesc.content = descs[currentLang] || descs.ru;
}

/* ─── Trust strip ────────────────────────────────────────────── */
function renderTrust() {
  const strip = document.querySelector("#trust-strip");
  if (!strip) return;
  strip.innerHTML = "";
  (window.OXY_CONTENT[currentLang].trust || []).forEach((item) => {
    const span = document.createElement("span");
    span.textContent = item;
    strip.append(span);
  });
}

/* ─── About metrics / status panel ──────────────────────────── */
function renderMetrics() {
  const grid = document.querySelector("#metric-grid");
  if (!grid) return;
  grid.innerHTML = "";
  (window.OXY_CONTENT[currentLang].metrics || []).forEach(([label, value]) => {
    const div = document.createElement("div");
    div.className = "metric";
    div.innerHTML = `<span>${label}</span><strong>${value}</strong>`;
    grid.append(div);
  });
}

/* ─── Reactor legend (numbered) ──────────────────────────────── */
function renderInsideLegend() {
  const container = document.querySelector("#inside-grid");
  if (!container) return;
  container.innerHTML = "";
  (window.OXY_CONTENT[currentLang].inside || []).forEach(([num, title, body]) => {
    const item = document.createElement("div");
    item.className = "legend-item";
    item.innerHTML = `
      <div class="legend-num" aria-hidden="true">${num}</div>
      <div class="legend-copy">
        <h3>${title}</h3>
        <p>${body}</p>
      </div>`;
    container.append(item);
  });
}

/* ─── Prototype specs + checklist ────────────────────────────── */
function renderPrototype() {
  const specsEl = document.querySelector("#prototype-specs");
  const checkEl = document.querySelector("#prototype-checklist");

  if (specsEl) {
    specsEl.innerHTML = "";
    (window.OXY_CONTENT[currentLang].prototypeSpecs || []).forEach(([label, value]) => {
      const row = document.createElement("div");
      row.className = "spec-row";
      row.innerHTML = `<span>${label}</span><strong>${value}</strong>`;
      specsEl.append(row);
    });
  }

  if (checkEl) {
    checkEl.innerHTML = "";
    (window.OXY_CONTENT[currentLang].prototypeChecklist || []).forEach(([status, text]) => {
      const li = document.createElement("li");
      li.className = `checklist-item checklist-${status}`;
      const icon = status === "done" ? "✓" : status === "active" ? "◉" : "○";
      li.innerHTML = `<span class="check-icon" aria-hidden="true">${icon}</span><span>${text}</span>`;
      checkEl.append(li);
    });
  }
}

/* ─── Use cases — editorial layout ──────────────────────────── */
function renderUseCases() {
  const grid = document.querySelector("#use-case-grid");
  if (!grid) return;
  grid.innerHTML = "";
  (window.OXY_CONTENT[currentLang].useCaseItems || []).forEach(([title, body, tag], i) => {
    const card = document.createElement("article");
    card.className = "use-case-card reveal";
    card.innerHTML = `
      <div class="use-case-num" aria-hidden="true">0${i + 1}</div>
      <div class="use-case-tag">${tag}</div>
      <h3>${title}</h3>
      <p>${body}</p>`;
    grid.append(card);
  });
}

/* ─── Validation roadmap ─────────────────────────────────────── */
function renderValidationSteps() {
  const container = document.querySelector("#research-table");
  if (!container) return;
  container.innerHTML = "";
  const statusLabels = {
    ru: { active: "В работе", planned: "Планируется", next: "Следующий этап" },
    kg: { active: "Иштелүүдө", planned: "Планда", next: "Кийинки этап" },
    en: { active: "In progress", planned: "Planned", next: "Next step" }
  };
  const labels = statusLabels[currentLang] || statusLabels.en;

  (window.OXY_CONTENT[currentLang].validationSteps || []).forEach((step, i) => {
    const row = document.createElement("div");
    row.className = `validation-step validation-${step.status} reveal`;
    row.innerHTML = `
      <div class="vstep-num">${String(i + 1).padStart(2, "0")}</div>
      <div class="vstep-body">
        <div class="vstep-header">
          <strong class="vstep-title">${step.title}</strong>
          <span class="vstep-status vstep-status-${step.status}">${labels[step.status] || step.status}</span>
        </div>
        <p class="vstep-note">${step.note}</p>
      </div>`;
    container.append(row);
  });
}

/* ─── Partner cards ──────────────────────────────────────────── */
function renderPartners() {
  const list = document.querySelector("#partner-list");
  if (!list) return;
  list.innerHTML = "";
  (window.OXY_CONTENT[currentLang].partnerItems || []).forEach(([title, what, details]) => {
    const card = document.createElement("article");
    card.className = "partner-card reveal";
    card.innerHTML = `
      <h3>${title}</h3>
      <p class="partner-what">${what}</p>
      <p class="partner-details">${details}</p>`;
    list.append(card);
  });
}

/* ─── FAQ ────────────────────────────────────────────────────── */
function renderFaq() {
  const list = document.querySelector("#faq-list");
  if (!list) return;
  list.innerHTML = "";
  (window.OXY_CONTENT[currentLang].faqItems || []).forEach(([question, answer], index) => {
    const details = document.createElement("details");
    if (index === 0) details.open = true;
    details.innerHTML = `<summary>${question}</summary><p>${answer}</p>`;
    list.append(details);
  });
}

/* ─── Form select options ────────────────────────────────────── */
function renderForm() {
  const select = document.querySelector("select[name='type']");
  if (!select) return;
  const selected = select.value;
  select.innerHTML = "";
  (window.OXY_CONTENT[currentLang].form?.options || []).forEach((option) => {
    const opt = document.createElement("option");
    opt.value = option;
    opt.textContent = option;
    select.append(opt);
  });
  if (selected) select.value = selected;
}

/* ─── Footer ─────────────────────────────────────────────────── */
function renderFooter() {
  const f = window.OXY_CONTENT[currentLang].footer || {};

  const tagline = document.querySelector("#footer-tagline");
  if (tagline) tagline.textContent = f.tagline || "";

  const status = document.querySelector("#footer-status");
  if (status) status.textContent = f.status || "";

  const location = document.querySelector("#footer-location");
  if (location) location.textContent = f.location || "";

  const context = document.querySelector("#footer-context");
  if (context) context.textContent = f.context || "";

  const privacy = document.querySelector("#footer-privacy");
  if (privacy) privacy.textContent = f.privacy || "";

  const legal = document.querySelector("#footer-legal");
  if (legal) legal.textContent = f.legal || "";

  // Footer nav
  const footerNav = document.querySelector("#footer-nav");
  if (footerNav) {
    footerNav.innerHTML = "";
    (window.OXY_CONTENT[currentLang].nav || []).forEach(([id, label]) => {
      const a = document.createElement("a");
      a.href = `#${id}`;
      a.textContent = label;
      footerNav.append(a);
    });
  }
}

/* ─── Main render ────────────────────────────────────────────── */
function render() {
  renderLanguage();
  renderNav();
  renderText();
  renderTrust();
  renderMetrics();
  renderInsideLegend();
  renderPrototype();
  renderUseCases();
  renderValidationSteps();
  renderPartners();
  renderFaq();
  renderForm();
  renderFooter();
}

/* ─── Mobile menu ────────────────────────────────────────────── */
function closeMenu() {
  const button = document.querySelector(".menu-toggle");
  const nav = document.querySelector("#site-nav");
  if (!button || !nav) return;
  button.setAttribute("aria-expanded", "false");
  button.setAttribute("aria-label", "Open navigation");
  nav.classList.remove("open");
}

function openMenu() {
  const button = document.querySelector(".menu-toggle");
  const nav = document.querySelector("#site-nav");
  if (!button || !nav) return;
  button.setAttribute("aria-expanded", "true");
  button.setAttribute("aria-label", "Close navigation");
  nav.classList.add("open");
}

function setupMenu() {
  const button = document.querySelector(".menu-toggle");
  const nav = document.querySelector("#site-nav");
  if (!button || !nav) return;

  button.addEventListener("click", () => {
    const isOpen = button.getAttribute("aria-expanded") === "true";
    isOpen ? closeMenu() : openMenu();
  });

  // Close on Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && nav.classList.contains("open")) {
      closeMenu();
      button.focus();
    }
  });

  // Close on outside click
  document.addEventListener("click", (e) => {
    if (nav.classList.contains("open") && !nav.contains(e.target) && !button.contains(e.target)) {
      closeMenu();
    }
  });
}

/* ─── Form submission ────────────────────────────────────────── */
function setupForm() {
  const form = document.querySelector("#lead-form");
  if (!form) return;
  const status = form.querySelector(".form-status");
  const submitBtn = form.querySelector("button[type='submit']");
  let isSubmitting = false;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!form.reportValidity()) return;

    isSubmitting = true;
    status.textContent = "";
    status.className = "form-status";
    submitBtn.disabled = true;
    submitBtn.textContent = t("form.submitting") || "…";

    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());
    payload.language = currentLang;
    payload.page = location.href;

    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      if (!res.ok || !result.ok) throw new Error(result.message);

      form.reset();
      renderForm();
      status.textContent = t("form.success");
      status.className = "form-status success";
      track("lead_submit", { type: payload.type });
    } catch (error) {
      const serverMessage = error?.message || "";
      const errorKey = serverMessage === "Telegram is not configured"
        ? "form.errors.telegramNotConfigured"
        : serverMessage === "Telegram notification failed"
          ? "form.errors.telegramFailed"
          : "form.error";
      // fix: form now explains Telegram setup problems instead of showing a vague registration error.
      status.textContent = t(errorKey) || t("form.error");
      status.className = "form-status error";
    } finally {
      isSubmitting = false;
      submitBtn.disabled = false;
      submitBtn.textContent = t("form.submit");
    }
  });
}

/* ─── CTA tracking ───────────────────────────────────────────── */
function setupCtas() {
  document.querySelectorAll(".button").forEach((btn) => {
    btn.addEventListener("click", () => {
      track("cta_click", { label: btn.textContent.trim(), href: btn.getAttribute("href") });
    });
  });
}

/* ─── Reactor live demo ─────────────────────────────────────── */
function setupReactorDemo() {
  const wrap = document.querySelector(".reactor-wrap");
  const visual = document.querySelector(".reactor-visual");
  const buttons = [...document.querySelectorAll("[data-reactor-mode]")];
  if (!wrap || !visual || !buttons.length) return;

  const modes = ["blueprint", "live", "pilot"];
  let currentIndex = 0;
  let userControlled = false;
  let autoTimer;

  function setMode(mode, source = "auto") {
    currentIndex = Math.max(0, modes.indexOf(mode));
    visual.dataset.mode = mode;
    buttons.forEach((button) => {
      const active = button.dataset.reactorMode === mode;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    if (source === "user") track("reactor_mode_change", { mode });
  }

  function startAutoCycle() {
    if (userControlled || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    clearInterval(autoTimer);
    autoTimer = setInterval(() => {
      currentIndex = (currentIndex + 1) % modes.length;
      setMode(modes[currentIndex]);
    }, 4600);
  }

  // fix: the reactor now has meaningful staged states instead of one always-on animation.
  setMode("blueprint");

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      userControlled = true;
      clearInterval(autoTimer);
      setMode(button.dataset.reactorMode, "user");
    });
  });

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          wrap.classList.add("reactor-awake");
          startAutoCycle();
          observer.disconnect();
        }
      },
      { threshold: 0.35 }
    );
    observer.observe(wrap);
  } else {
    startAutoCycle();
  }
}

/* ─── Scroll reveal via IntersectionObserver ─────────────────── */
function initReveal() {
  if (!("IntersectionObserver" in window)) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("revealed");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
  );

  document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
}

/* ─── Bootstrap ──────────────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", () => {
  render();
  setupMenu();
  setupForm();
  setupCtas();
  setupReactorDemo();
  // Re-observe after dynamic render
  requestAnimationFrame(initReveal);
});
