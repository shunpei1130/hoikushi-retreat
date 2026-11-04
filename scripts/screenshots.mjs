import { mkdir, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.resolve(fileURLToPath(new URL("../", import.meta.url)));
const OUT = path.join(ROOT, "screenshots", "preview");
const REPORT = path.join(ROOT, "docs", "verification", "layout-audit.json");
const PORT = Number(process.env.SCREENSHOT_PORT || 4174);
const DEBUG_PORT = Number(process.env.SCREENSHOT_DEBUG_PORT || 9333);
const WIDTHS = [360, 390, 430, 768, 1280, 1440];
const HERO_HEIGHT = 844;

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
].filter(Boolean);

function findChrome() {
  for (const candidate of CHROME_CANDIDATES) {
    if (existsSync(candidate)) return candidate;
    const result = spawnSync(candidate, ["--version"], { encoding: "utf8", timeout: 15000 });
    if (!result.error && result.status === 0) return candidate;
  }
  throw new Error("Chrome/Edge が見つかりません。CHROME_PATH を設定してください。");
}

async function waitFor(url, timeoutMs = 30000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) return response;
    } catch {
      // retry
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error(`Timed out waiting for ${url}`);
}

class Cdp {
  constructor(ws) {
    this.ws = ws;
    this.nextId = 1;
    this.pending = new Map();
    this.waiters = new Map();
    this.logs = [];
    ws.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      if (message.id) {
        const pending = this.pending.get(message.id);
        if (!pending) return;
        this.pending.delete(message.id);
        if (message.error) pending.reject(new Error(message.error.message));
        else pending.resolve(message.result);
        return;
      }
      if (message.method === "Log.entryAdded") {
        const entry = message.params.entry;
        if (entry.level === "error" || entry.level === "warning") {
          this.logs.push(`[${entry.level}] ${entry.text}${entry.url ? ` (${entry.url})` : ""}`);
        }
      }
      if (message.method === "Runtime.exceptionThrown") {
        this.logs.push(`[exception] ${message.params.exceptionDetails.text}`);
      }
      const waiters = this.waiters.get(message.method);
      if (waiters && waiters.length > 0) {
        for (const waiter of waiters.splice(0)) waiter(message.params);
      }
    });
  }

  send(method, params = {}) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  once(method, timeoutMs = 30000) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`Timed out waiting for ${method}`)), timeoutMs);
      const wrapped = (params) => {
        clearTimeout(timer);
        resolve(params);
      };
      if (!this.waiters.has(method)) this.waiters.set(method, []);
      this.waiters.get(method).push(wrapped);
    });
  }
}

async function connect(wsUrl) {
  const ws = new WebSocket(wsUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener("open", resolve, { once: true });
    ws.addEventListener("error", reject, { once: true });
  });
  const cdp = new Cdp(ws);
  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");
  await cdp.send("Log.enable");
  return cdp;
}

async function auditExpression() {
  return `(() => {
    const viewport = { width: window.innerWidth, height: window.innerHeight };
    const root = document.documentElement;
    const main = document.querySelector("main");
    const headings = [...document.querySelectorAll("h1, h2, h3, h4, h5, h6")].map((el) => ({
      level: Number(el.tagName.slice(1)),
      text: (el.textContent || "").trim().replace(/\\s+/g, " ").slice(0, 90),
    }));
    const ids = [...document.querySelectorAll("[id]")].map((el) => el.id);
    const duplicateIds = [...new Set(ids.filter((id, i) => ids.indexOf(id) !== i))];
    const overflowElements = [...document.querySelectorAll("body *")]
      .map((el) => {
        const rect = el.getBoundingClientRect();
        const style = getComputedStyle(el);
        return { el, rect, style };
      })
      .filter(({ rect, style }) => rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && rect.right > viewport.width + 1)
      .slice(0, 12)
      .map(({ el, rect }) => ({
        tag: el.tagName.toLowerCase(),
        className: typeof el.className === "string" ? el.className.slice(0, 100) : "",
        id: el.id || "",
        right: Math.round(rect.right),
        width: Math.round(rect.width),
      }));
    const controls = [...document.querySelectorAll("a.button, button, .header-action, .method-card, .sticky-cta a, .toc a, .footer-contact-link")]
      .map((el) => {
        const rect = el.getBoundingClientRect();
        return {
          text: (el.textContent || "").trim().replace(/\\s+/g, " ").slice(0, 50),
          className: typeof el.className === "string" ? el.className.slice(0, 70) : "",
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          visible: rect.width > 0 && rect.height > 0,
        };
      })
      .filter((entry) => entry.visible && (entry.width < 44 || entry.height < 44));
    const methods = [...document.querySelectorAll(".hero .method-card")].map((el) => {
      const rect = el.getBoundingClientRect();
      return {
        channel: el.getAttribute("data-channel") || "",
        top: Math.round(rect.top),
        bottom: Math.round(rect.bottom),
        inFirstScreen: rect.top < viewport.height && rect.bottom > 0,
        fullyInFirstScreen: rect.top >= 0 && rect.bottom <= viewport.height,
      };
    });
    const heroTitle = document.querySelector("h1");
    return {
      viewport,
      title: document.title,
      lang: document.documentElement.lang,
      h1Count: document.querySelectorAll("h1").length,
      headings,
      duplicateIds,
      horizontalOverflow: Math.max(0, root.scrollWidth - viewport.width),
      overflowElements,
      smallControls: controls,
      heroMethods: methods,
      heroTitleBottom: heroTitle ? Math.round(heroTitle.getBoundingClientRect().bottom) : null,
      bodyHeight: Math.round(document.body.scrollHeight),
      mainTextLength: main ? (main.textContent || "").trim().length : 0,
      internalLinks: [...document.querySelectorAll('a[href^="/"]')].length,
      telLinks: [...document.querySelectorAll('a[href^="tel:"]')].length,
    };
  })()`;
}

async function main() {
  const chrome = findChrome();
  const profile = path.join(ROOT, ".tmp", "chrome-screenshots");
  await rm(OUT, { recursive: true, force: true });
  await rm(profile, { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });
  await mkdir(path.dirname(REPORT), { recursive: true });
  await mkdir(profile, { recursive: true });

  const server = spawn(process.execPath, [path.join(ROOT, "scripts", "serve.mjs"), `--dir=dist/preview`, `--port=${PORT}`], {
    cwd: ROOT,
    stdio: "ignore",
  });

  let chromeProcess = null;
  let cdp = null;
  try {
    await waitFor(`http://127.0.0.1:${PORT}/`);
    chromeProcess = spawn(
      chrome,
      [
        "--headless=new",
        "--disable-gpu",
        "--hide-scrollbars",
        "--no-first-run",
        "--no-default-browser-check",
        "--disable-extensions",
        `--remote-debugging-port=${DEBUG_PORT}`,
        `--user-data-dir=${profile}`,
        "about:blank",
      ],
      { stdio: "ignore" },
    );

    await waitFor(`http://127.0.0.1:${DEBUG_PORT}/json/version`);
    const targetResponse = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/new?about:blank`, { method: "PUT" });
    const target = await targetResponse.json();
    cdp = await connect(target.webSocketDebuggerUrl);

    const report = {
      generatedAt: new Date().toISOString(),
      baseUrl: `http://127.0.0.1:${PORT}/`,
      widths: [],
      innerPages: [],
      consoleLogs: [],
    };

    const sectionIds = ["consult", "worries", "price-summary", "staff", "union", "scope", "flow", "pricing", "faq", "closing"];

    for (const width of WIDTHS) {
      await cdp.send("Emulation.setDeviceMetricsOverride", {
        width,
        height: width <= 430 ? HERO_HEIGHT : 900,
        deviceScaleFactor: 1,
        mobile: width <= 430,
      });
      const loaded = cdp.once("Page.loadEventFired");
      await cdp.send("Page.navigate", { url: `http://127.0.0.1:${PORT}/` });
      await loaded;
      await new Promise((resolve) => setTimeout(resolve, 350));

      const metrics = await cdp.send("Page.getLayoutMetrics");
      const content = metrics.cssContentSize || metrics.contentSize;
      const height = Math.min(Math.ceil(content.height), 16000);
      const shot = await cdp.send("Page.captureScreenshot", {
        format: "png",
        fromSurface: true,
        captureBeyondViewport: true,
        clip: { x: 0, y: 0, width, height, scale: 1 },
      });
      const file = path.join(OUT, `width-${width}.png`);
      await writeFile(file, Buffer.from(shot.data, "base64"));

      if (width === 390 || width === 1440) {
        const heroShot = await cdp.send("Page.captureScreenshot", {
          format: "png",
          fromSurface: true,
          captureBeyondViewport: true,
          clip: { x: 0, y: 0, width, height: width === 390 ? HERO_HEIGHT : 900, scale: 1 },
        });
        await writeFile(path.join(OUT, `hero-${width}x${width === 390 ? HERO_HEIGHT : 900}.png`), Buffer.from(heroShot.data, "base64"));

        const sectionEvaluation = await cdp.send("Runtime.evaluate", {
          expression: `(() => {
            const ids = ${JSON.stringify(sectionIds)};
            return ids.map((id) => {
              const el = document.getElementById(id);
              if (!el) return null;
              const rect = el.getBoundingClientRect();
              return { id, top: Math.max(0, Math.round(rect.top + window.scrollY)), height: Math.min(16000, Math.ceil(rect.height)) };
            }).filter(Boolean);
          })()`,
          returnByValue: true,
        });
        for (const section of sectionEvaluation.result.value || []) {
          if (section.height < 40) continue;
          const sectionShot = await cdp.send("Page.captureScreenshot", {
            format: "png",
            fromSurface: true,
            captureBeyondViewport: true,
            clip: { x: 0, y: section.top, width, height: section.height, scale: 1 },
          });
          await writeFile(
            path.join(OUT, `section-${width}-${section.id}.png`),
            Buffer.from(sectionShot.data, "base64"),
          );
        }
      }

      const evaluation = await cdp.send("Runtime.evaluate", {
        expression: await auditExpression(),
        returnByValue: true,
        awaitPromise: true,
      });
      const result = evaluation.result.value || {};
      report.widths.push({
        width,
        screenshot: path.relative(ROOT, file).replace(/\\/g, "/"),
        documentHeight: height,
        ...result,
      });
      console.log(`${width}px: ${result.horizontalOverflow}px overflow, ${result.smallControls?.length || 0} small controls`);
    }

    for (const route of ["/about/", "/privacy/", "/terms/", "/disclosures/", "/404.html"]) {
      const name = route === "/404.html" ? "404" : route.replaceAll("/", "");
      for (const width of [390, 1440]) {
        await cdp.send("Emulation.setDeviceMetricsOverride", {
          width,
          height: width === 390 ? HERO_HEIGHT : 900,
          deviceScaleFactor: 1,
          mobile: width === 390,
        });
        const loaded = cdp.once("Page.loadEventFired");
        await cdp.send("Page.navigate", { url: `http://127.0.0.1:${PORT}${route}` });
        await loaded;
        await new Promise((resolve) => setTimeout(resolve, 250));
        const metrics = await cdp.send("Page.getLayoutMetrics");
        const content = metrics.cssContentSize || metrics.contentSize;
        const height = Math.min(Math.ceil(content.height), 16000);
        const shot = await cdp.send("Page.captureScreenshot", {
          format: "png",
          fromSurface: true,
          captureBeyondViewport: true,
          clip: { x: 0, y: 0, width, height, scale: 1 },
        });
        const file = path.join(OUT, `page-${name}-${width}.png`);
        await writeFile(file, Buffer.from(shot.data, "base64"));
        const evaluation = await cdp.send("Runtime.evaluate", {
          expression: await auditExpression(),
          returnByValue: true,
          awaitPromise: true,
        });
        const result = evaluation.result.value || {};
        report.innerPages.push({
          route,
          width,
          screenshot: path.relative(ROOT, file).replace(/\\/g, "/"),
          documentHeight: height,
          ...result,
        });
        console.log(`${route} ${width}px: ${result.horizontalOverflow}px overflow`);
      }
    }

    report.consoleLogs = [...new Set(cdp.logs)];
    await writeFile(REPORT, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    console.log(`Screenshots: ${path.relative(ROOT, OUT)}`);
    console.log(`Report: ${path.relative(ROOT, REPORT)}`);

    const overflowPages = [...report.widths, ...report.innerPages].filter((entry) => entry.horizontalOverflow > 0);
    if (overflowPages.length > 0) {
      console.warn(
        `Horizontal overflow detected: ${overflowPages.map((entry) => `${entry.width}px${entry.route ? ` ${entry.route}` : ""}`).join(", ")}`,
      );
    }
  } finally {
    if (cdp) cdp.ws.close();
    if (chromeProcess?.pid) {
      spawnSync("taskkill", ["/pid", String(chromeProcess.pid), "/T", "/F"], { stdio: "ignore" });
    }
    server.kill();
    await new Promise((resolve) => setTimeout(resolve, 600));
    for (let attempt = 0; attempt < 4; attempt += 1) {
      try {
        await rm(profile, { recursive: true, force: true, maxRetries: 2 });
        break;
      } catch {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }
  }
}

main().catch((error) => {
  console.error(error.stack || error.message || error);
  process.exit(1);
});
