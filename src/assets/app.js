(() => {
  "use strict";

  const root = document.documentElement;
  const analyticsEnabled = root.dataset.analytics === "enabled";
  const pageType = document.body?.dataset.page === "home" ? "home" : "other";

  function track(name, params = {}) {
    if (!analyticsEnabled) return;
    const allowed = {};
    for (const [key, value] of Object.entries(params)) {
      if (typeof value === "string" && value.length <= 64) allowed[key] = value;
    }
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: name, ...allowed });
  }

  document.addEventListener(
    "click",
    (event) => {
      const target = event.target instanceof Element ? event.target.closest("[data-track]") : null;
      if (!target) return;
      const name = target.getAttribute("data-track");
      if (name !== "consult_cta_click") return;
      track(name, {
        channel: target.getAttribute("data-channel") || "",
        placement: target.getAttribute("data-placement") || "",
      });
    },
    { passive: true },
  );

  for (const details of document.querySelectorAll("details[data-faq-id]")) {
    details.addEventListener("toggle", () => {
      if (!details.open) return;
      track("faq_open", { faq_id: details.getAttribute("data-faq-id") || "" });
    });
  }

  const chatForm = document.querySelector("[data-ai-chat-form]");
  const chatLog = document.querySelector("[data-ai-chat-log]");
  if (chatForm && chatLog) {
    const input = chatForm.querySelector("textarea[name='message']");
    const submit = chatForm.querySelector("[data-ai-chat-submit]");
    const status = chatForm.querySelector("[data-ai-chat-status]");
    const history = [];

    const appendMessage = (role, text) => {
      const message = document.createElement("p");
      message.className = `ai-chat-message ai-chat-message--${role}`;
      message.textContent = text;
      chatLog.append(message);
      chatLog.scrollTop = chatLog.scrollHeight;
    };

    chatForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const text = input?.value.trim();
      if (!text || !submit || !input) return;

      input.value = "";
      status.textContent = "";
      appendMessage("user", text);
      history.push({ role: "user", content: text });
      submit.disabled = true;
      submit.setAttribute("aria-busy", "true");
      chatForm.setAttribute("aria-busy", "true");
      status.textContent = "回答を作成しています…";

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: history }),
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(payload.error || "回答を取得できませんでした。時間をおいて再度お試しください。");
        }
        if (typeof payload.answer !== "string" || !payload.answer.trim()) {
          throw new Error("回答を取得できませんでした。LINE相談もご利用いただけます。");
        }
        history.push({ role: "assistant", content: payload.answer });
        if (history.length > 10) history.splice(0, history.length - 10);
        appendMessage("assistant", payload.answer);
        status.textContent = "";
      } catch (error) {
        history.pop();
        input.value = text;
        status.textContent = error instanceof Error ? error.message : "送信できませんでした。時間をおいて再度お試しください。";
      } finally {
        submit.disabled = false;
        submit.removeAttribute("aria-busy");
        chatForm.removeAttribute("aria-busy");
        input.focus();
      }
    });
  }

  const pricing = document.querySelector("#pricing");
  if (pricing && "IntersectionObserver" in window) {
    let seen = false;
    const observer = new IntersectionObserver(
      (entries) => {
        if (seen) return;
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          seen = true;
          track("pricing_view", { page_type: pageType });
          observer.disconnect();
        }
      },
      { threshold: 0.35 },
    );
    observer.observe(pricing);
  }

  const hero = document.querySelector(".hero");
  const chatPanel = document.querySelector("#ai-chat");
  const closing = document.querySelector("#closing");
  const sticky = document.querySelector("[data-sticky-cta]");
  if ((hero || chatPanel || closing) && sticky && "IntersectionObserver" in window) {
    let heroVisible = false;
    let chatVisible = false;
    let closingVisible = false;
    const stickyObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.target === hero) heroVisible = entry.isIntersecting;
          if (entry.target === chatPanel) chatVisible = entry.isIntersecting;
          if (entry.target === closing) closingVisible = entry.isIntersecting;
        }
        const hideSticky = heroVisible || chatVisible || closingVisible;
        sticky.hidden = hideSticky;
        sticky.classList.toggle("is-visible", !hideSticky);
      },
      { threshold: 0, rootMargin: "-10% 0px 0px 0px" },
    );
    if (hero) stickyObserver.observe(hero);
    if (chatPanel) stickyObserver.observe(chatPanel);
    if (closing) stickyObserver.observe(closing);
  }

  for (const chip of document.querySelectorAll("[data-chip]")) {
    chip.addEventListener("click", () => {
      const input = document.querySelector("#ai-chat-input");
      if (input) {
        input.value = chip.getAttribute("data-chip") || "";
        input.focus();
      }
    });
  }
})();
