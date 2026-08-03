import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdir, rm, writeFile } from "node:fs/promises";
import net from "node:net";
import os from "node:os";
import path from "node:path";

const baseUrl = process.argv[2] || "http://127.0.0.1:4176/";
const screenshotDir = process.argv[3] || "";
const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const profile = path.join(os.tmpdir(), `nuttie-d039-edge-${process.pid}`);

async function freePort() {
  const server = net.createServer();
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;
  await new Promise((resolve) => server.close(resolve));
  return port;
}

async function waitForJson(url, attempts = 80) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) return response.json();
    } catch {
      // Edge may not have opened the debugging socket yet.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Timed out waiting for ${url}`);
}

class CDP {
  constructor(url) {
    this.socket = new WebSocket(url);
    this.nextId = 1;
    this.pending = new Map();
    this.listeners = new Map();
  }

  async open() {
    await new Promise((resolve, reject) => {
      this.socket.addEventListener("open", resolve, { once: true });
      this.socket.addEventListener("error", reject, { once: true });
    });
    this.socket.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      if (message.id) {
        const pending = this.pending.get(message.id);
        if (!pending) return;
        this.pending.delete(message.id);
        if (message.error) pending.reject(new Error(message.error.message));
        else pending.resolve(message.result || {});
        return;
      }
      const callbacks = this.listeners.get(message.method) || [];
      callbacks.forEach((callback) => callback(message.params || {}));
    });
  }

  send(method, params = {}) {
    const id = this.nextId;
    this.nextId += 1;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }

  on(method, callback) {
    this.listeners.set(method, [...(this.listeners.get(method) || []), callback]);
  }

  close() {
    this.socket.close();
  }
}

function expression(source) {
  return `(() => { ${source} })()`;
}

async function main() {
  const debugPort = await freePort();
  await mkdir(profile, { recursive: true });
  if (screenshotDir) await mkdir(screenshotDir, { recursive: true });

  const edge = spawn(edgePath, [
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    `--remote-debugging-port=${debugPort}`,
    "--remote-debugging-address=127.0.0.1",
    `--user-data-dir=${profile}`,
    "about:blank"
  ], { stdio: "ignore", windowsHide: true });

  let cdp;
  try {
    await waitForJson(`http://127.0.0.1:${debugPort}/json/version`);
    const targets = await waitForJson(`http://127.0.0.1:${debugPort}/json`);
    const target = targets.find((item) => item.type === "page");
    assert.ok(target?.webSocketDebuggerUrl, "Edge page target should expose a CDP socket");
    cdp = new CDP(target.webSocketDebuggerUrl);
    await cdp.open();

    const runtimeProblems = [];
    const networkUrls = new Set();
    cdp.on("Runtime.exceptionThrown", ({ exceptionDetails }) => runtimeProblems.push(`exception:${exceptionDetails?.text || "unknown"}`));
    cdp.on("Runtime.consoleAPICalled", ({ type, args }) => {
      if (["error", "warning"].includes(type)) runtimeProblems.push(`console:${type}:${args?.map((item) => item.value).join(" ")}`);
    });
    cdp.on("Log.entryAdded", ({ entry }) => {
      if (["error", "warning"].includes(entry?.level)) runtimeProblems.push(`log:${entry.level}:${entry.text}`);
    });
    cdp.on("Network.requestWillBeSent", ({ request }) => networkUrls.add(request.url));

    await Promise.all([
      cdp.send("Page.enable"),
      cdp.send("Runtime.enable"),
      cdp.send("Log.enable"),
      cdp.send("Network.enable")
    ]);

    async function evalValue(source) {
      const result = await cdp.send("Runtime.evaluate", {
        expression: source,
        awaitPromise: true,
        returnByValue: true,
        userGesture: true
      });
      if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || "Runtime evaluate failed");
      return result.result?.value;
    }

    async function waitUntil(source, label, attempts = 60) {
      for (let attempt = 0; attempt < attempts; attempt += 1) {
        if (await evalValue(source)) return;
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
      throw new Error(`Timed out waiting for ${label}`);
    }

    async function load(width = 390, height = 844) {
      await cdp.send("Emulation.setDeviceMetricsOverride", {
        width,
        height,
        deviceScaleFactor: 1,
        mobile: width <= 430
      });
      await cdp.send("Page.navigate", { url: baseUrl });
      await waitUntil("document.readyState === 'complete' && Boolean(window.__NUTTIE_D039__)", "prototype load");
      await evalValue("new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))");
    }

    async function click(selector) {
      const found = await evalValue(expression(`
        const target = document.querySelector(${JSON.stringify(selector)});
        if (!target) return false;
        target.click();
        return true;
      `));
      assert.equal(found, true, `Expected clickable selector ${selector}`);
      await evalValue("new Promise((resolve) => requestAnimationFrame(resolve))");
    }

    async function setSelect(selector, value) {
      const changed = await evalValue(expression(`
        const target = document.querySelector(${JSON.stringify(selector)});
        if (!target) return false;
        target.value = ${JSON.stringify(value)};
        target.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      `));
      assert.equal(changed, true, `Expected select ${selector}`);
      await evalValue("new Promise((resolve) => requestAnimationFrame(resolve))");
    }

    async function setValue(selector, value) {
      const changed = await evalValue(expression(`
        const target = document.querySelector(${JSON.stringify(selector)});
        if (!target) return false;
        target.value = ${JSON.stringify(value)};
        target.dispatchEvent(new Event('input', { bubbles: true }));
        return true;
      `));
      assert.equal(changed, true, `Expected field ${selector}`);
    }

    async function submit(selector) {
      const submitted = await evalValue(expression(`
        const target = document.querySelector(${JSON.stringify(selector)});
        if (!target) return false;
        target.requestSubmit();
        return true;
      `));
      assert.equal(submitted, true, `Expected form ${selector}`);
      await evalValue("new Promise((resolve) => requestAnimationFrame(resolve))");
    }

    async function assertLayout(label) {
      const layout = await evalValue(expression(`
        const phone = document.querySelector('.phone');
        const phoneRect = phone.getBoundingClientRect();
        const visible = [...phone.querySelectorAll('button, input, select, textarea, .preview-row, .status-box')]
          .filter((node) => {
            const style = getComputedStyle(node);
            const rect = node.getBoundingClientRect();
            return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
          });
        return {
          rootOverflow: document.documentElement.scrollWidth - innerWidth,
          appOverflow: document.querySelector('#app-main').scrollWidth - document.querySelector('#app-main').clientWidth,
          outsidePhone: visible.filter((node) => {
            const rect = node.getBoundingClientRect();
            return rect.left < phoneRect.left - 1 || rect.right > phoneRect.right + 1;
          }).map((node) => ({ tag: node.tagName, text: node.textContent.trim().slice(0, 30) })),
          shortTargets: visible.filter((node) => ['BUTTON', 'SELECT'].includes(node.tagName) && node.getBoundingClientRect().height < 43.5)
            .map((node) => ({ tag: node.tagName, text: node.textContent.trim().slice(0, 30), height: node.getBoundingClientRect().height }))
        };
      `));
      assert.ok(layout.rootOverflow <= 1, `${label}: no root horizontal overflow`);
      assert.ok(layout.appOverflow <= 1, `${label}: no app horizontal overflow`);
      assert.deepEqual(layout.outsidePhone, [], `${label}: visible controls remain inside the phone`);
      assert.deepEqual(layout.shortTargets, [], `${label}: controls meet the 44pt prototype target`);
    }

    async function assertScreen(screen) {
      assert.equal((await evalValue("window.__NUTTIE_D039__.getState()"))?.screen, screen, `Expected screen ${screen}`);
      await assertLayout(screen);
    }

    async function capture(name) {
      if (!screenshotDir) return;
      const shot = await cdp.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
      await writeFile(path.join(screenshotDir, `${name}.png`), Buffer.from(shot.data, "base64"));
    }

    const viewportResults = [];
    for (const viewport of [
      { width: 320, height: 700, name: "320" },
      { width: 375, height: 812, name: "375" },
      { width: 430, height: 932, name: "430" },
      { width: 1280, height: 900, name: "desktop" }
    ]) {
      await load(viewport.width, viewport.height);
      const layout = await evalValue(expression(`
        const visible = [...document.querySelectorAll('button, input, select, textarea, .phone, .lab-header')]
          .filter((node) => {
            const style = getComputedStyle(node);
            const rect = node.getBoundingClientRect();
            return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
          });
        const outside = visible.filter((node) => {
          const rect = node.getBoundingClientRect();
          return rect.left < -1 || rect.right > innerWidth + 1;
        }).map((node) => ({ tag: node.tagName, text: node.textContent.trim().slice(0, 30), rect: node.getBoundingClientRect().toJSON() }));
        const shortTargets = visible.filter((node) => ['BUTTON', 'SELECT'].includes(node.tagName) && node.getBoundingClientRect().height < 43.5)
          .map((node) => ({ tag: node.tagName, text: node.textContent.trim().slice(0, 30), height: node.getBoundingClientRect().height }));
        return {
          rootOverflow: document.documentElement.scrollWidth - innerWidth,
          outside,
          shortTargets,
          phoneWidth: document.querySelector('.phone').getBoundingClientRect().width,
          phoneHeight: document.querySelector('.phone').getBoundingClientRect().height
        };
      `));
      assert.ok(layout.rootOverflow <= 1, `${viewport.name}: no root horizontal overflow`);
      assert.deepEqual(layout.outside, [], `${viewport.name}: no visible controls cross horizontal viewport bounds`);
      assert.deepEqual(layout.shortTargets, [], `${viewport.name}: buttons/selects meet the 44pt prototype target`);
      viewportResults.push({ viewport: viewport.name, phone: `${layout.phoneWidth}x${layout.phoneHeight}` });

      if (screenshotDir) {
        const shot = await cdp.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
        await writeFile(path.join(screenshotDir, `d039-${viewport.name}.png`), Buffer.from(shot.data, "base64"));
      }
    }

    await load(320, 700);
    assert.equal((await evalValue("window.__NUTTIE_D039__.getState()"))?.variant, "A");
    assert.match(await evalValue("document.body.innerText"), /切换不代表选择/);
    assert.match(await evalValue("document.body.innerText"), /本地搜索和最近使用先出现/);

    await submit('[data-form="search"]');
    await assertScreen("search");
    await click('[data-food-id="yogurt"]');
    await assertScreen("editor");
    await evalValue("document.querySelector('#edit-name').value = '原味无糖酸奶（已校正）'");
    await submit('[data-form="editor"]');
    await assertScreen("success");
    assert.equal((await evalValue("window.__NUTTIE_D039__.getState()"))?.savedCount, 1);
    assert.match(await evalValue("document.querySelector('#app-main').innerText"), /网络请求 0 次/);

    await load(320, 700);
    await click('[data-food-id="oats"]');
    await assertScreen("editor");
    await submit('[data-form="editor"]');
    await assertScreen("success");

    await load(320, 700);
    await click('[data-route="scan"]');
    await click('[data-barcode-result="hit"]');
    await assertScreen("barcode-hit");
    await click("[data-use-barcode-food]");
    await assertScreen("editor");

    await load(320, 700);
    await click('[data-route="scan"]');
    await click('[data-barcode-result="miss"]');
    await assertScreen("barcode-miss");
    assert.match(await evalValue("document.querySelector('#app-main').innerText"), /本次日记写入 0 条/);
    await click('[data-route="create"]');
    await submit('[data-form="create-food"]');
    await assertScreen("editor");
    await submit('[data-form="editor"]');
    await assertScreen("success");

    await load(320, 700);
    await click('[data-route="ai-menu"]');
    await click('[data-route="ai-photo"]');
    await assertScreen("ai-unconfigured");
    assert.match(await evalValue("document.querySelector('#app-main').innerText"), /网络请求 0 次/);

    async function openLabelPreview() {
      await setSelect("#ai-config", "fixture");
      await click('[data-route="ai-menu"]');
      await click('[data-route="ai-label"]');
      await assertScreen("ai-media-draft");
      await click("[data-open-ai-preview]");
      await assertScreen("ai-preview");
      const text = await evalValue("document.querySelector('#app-main').innerText");
      assert.match(text, /营养标签照片/);
      assert.match(text, /UNKNOWN \/ BLOCKED/);
      assert.match(text, /D-053 未决定/);
    }

    await load(320, 700);
    await openLabelPreview();
    await capture("d039-ai-preview-320");
    await click('[data-ai-outcome="cancel"]');
    await assertScreen("ai-cancelled");
    assert.match(await evalValue("document.querySelector('#app-main').innerText"), /网络请求 0 次 · 候选 0 条 · 本次日记写入 0 条/);

    await load(320, 700);
    await openLabelPreview();
    await click('[data-ai-outcome="failure"]');
    await assertScreen("ai-failure");
    assert.match(await evalValue("document.querySelector('#app-main').innerText"), /AI 候选 0 条 · 本次日记写入 0 条/);

    await load(320, 700);
    await openLabelPreview();
    await click('[data-ai-outcome="fixture"]');
    await assertScreen("editor");
    await capture("d039-ai-editor-320");
    assert.match(await evalValue("document.querySelector('#app-main').innerText"), /AI 估算 · 可修改/);
    await evalValue("document.querySelector('#edit-energy').value = '470'");
    await submit('[data-form="editor"]');
    await assertScreen("success");
    assert.match(await evalValue("document.querySelector('#app-main').innerText"), /470 千卡/);

    await load(320, 700);
    await setSelect("#permission-state", "camera-denied");
    await click('[data-route="scan"]');
    assert.match(await evalValue("document.querySelector('#app-main').innerText"), /相机权限已拒绝/);
    assert.ok(await evalValue("Boolean(document.querySelector('[data-form=barcode]'))"));
    assert.ok(await evalValue("Boolean(document.querySelector('[data-route=search]'))"), "camera denial should offer local search");

    await load(320, 700);
    await click('[data-route="create"]');
    await assertScreen("create");
    await setValue("#create-name", "   ");
    await setValue("#create-energy", "321");
    await setValue("#create-protein", "22.4");
    await submit('[data-form="create-food"]');
    await assertScreen("create");
    assert.equal(await evalValue("document.querySelector('#create-name').value"), "   ");
    assert.equal(await evalValue("document.querySelector('#create-energy').value"), "321");
    assert.equal(await evalValue("document.querySelector('#create-protein').value"), "22.4");
    assert.equal(await evalValue("document.querySelector('#create-name').getAttribute('aria-invalid')"), "true");
    assert.equal(await evalValue("document.activeElement.id"), "create-name");
    assert.equal((await evalValue("window.__NUTTIE_D039__.getState()"))?.savedCount, 0);
    await setValue("#create-name", "保留后的自建食品");
    await submit('[data-form="create-food"]');
    await assertScreen("editor");
    await setValue("#edit-name", "   ");
    await setValue("#edit-energy", "333");
    await setSelect("#edit-meal", "早餐");
    await submit('[data-form="editor"]');
    await assertScreen("editor");
    assert.equal(await evalValue("document.querySelector('#edit-name').value"), "   ");
    assert.equal(await evalValue("document.querySelector('#edit-energy').value"), "333");
    assert.equal(await evalValue("document.querySelector('#edit-meal').value"), "早餐");
    assert.equal(await evalValue("document.querySelector('#edit-name').getAttribute('aria-invalid')"), "true");
    assert.equal(await evalValue("document.activeElement.id"), "edit-name");
    assert.equal((await evalValue("window.__NUTTIE_D039__.getState()"))?.savedCount, 0);

    await setValue("#edit-name", "数值约束测试");
    await setValue("#edit-protein", "-1");
    await submit('[data-form="editor"]');
    await assertScreen("editor");
    assert.equal(await evalValue("document.querySelector('[data-form=editor]').checkValidity()"), false);
    assert.equal(await evalValue("document.querySelector('#edit-protein').value"), "-1");
    assert.equal(await evalValue("document.activeElement.id"), "edit-protein");
    assert.equal((await evalValue("window.__NUTTIE_D039__.getState()"))?.savedCount, 0);

    await load(320, 700);
    await openLabelPreview();
    await click('[data-ai-outcome="fixture"]');
    await assertScreen("editor");
    await click('[data-discard-draft="ai"]');
    await assertScreen("discarded");
    await capture("d039-ai-discarded-320");
    const discardedState = await evalValue("window.__NUTTIE_D039__.getState()");
    assert.equal(discardedState.hasDraft, false);
    assert.equal(discardedState.savedCount, 0);
    assert.equal(discardedState.discardedKind, "ai");
    assert.match(await evalValue("document.querySelector('#app-main').innerText"), /AI 候选已删除[\s\S]*候选 0 条[\s\S]*日记写入 0 条/);

    for (const variant of ["A", "B", "C"]) {
      await load(320, 700);
      if (variant !== "A") await click(`[data-variant="${variant}"]`);
      await click('[data-route="scan"]');
      await assertScreen("scan");
      await evalValue("document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))");
      await evalValue("new Promise((resolve) => requestAnimationFrame(resolve))");
      await assertScreen("entry");
      assert.equal(await evalValue("document.activeElement.matches('[data-route=scan]')"), true, `${variant}: Escape restores the scan trigger`);
    }

    await load(320, 700);
    await click('[data-route="ai-menu"]');
    await assertScreen("ai-menu");
    await click("#back-button");
    await assertScreen("entry");
    assert.equal(await evalValue("document.activeElement.matches('[data-route=ai-menu]')"), true, "Back restores the AI trigger");

    await load(320, 700);
    await setValue('[data-form="search"] input[name="query"]', "熟鸡胸肉");
    await submit('[data-form="search"]');
    await assertScreen("search");
    assert.match(await evalValue("document.querySelector('[data-food-id=chicken] small').innerText"), /来源：用户自建测试条目/);

    await load(320, 700);
    await setSelect("#ai-config", "fixture");
    await click('[data-variant="C"]');
    await click('[data-route="ai-text"]');
    await assertScreen("ai-text-input");
    await setValue("#ai-text-input", "   ");
    await submit('[data-form="ai-text"]');
    await assertScreen("ai-text-input");
    assert.equal(await evalValue("document.querySelector('#ai-text-input').value"), "   ");
    assert.equal(await evalValue("document.querySelector('#ai-text-input').getAttribute('aria-invalid')"), "true");
    assert.equal(await evalValue("document.activeElement.id"), "ai-text-input");
    const emptyTextState = await evalValue("window.__NUTTIE_D039__.getState()");
    assert.equal(emptyTextState.hasDraft, false);
    assert.equal(emptyTextState.savedCount, 0);

    await load(320, 700);
    await click('[data-route="scan"]');
    await click('[data-barcode-result="miss"]');
    await assertScreen("barcode-miss");
    await click('[data-route="create"]');
    await assertScreen("create");
    assert.equal(await evalValue("document.querySelector('#create-barcode').value"), "4719999999999");
    await submit('[data-form="create-food"]');
    await assertScreen("editor");
    assert.equal(await evalValue("document.querySelector('#edit-barcode').value"), "4719999999999");
    await submit('[data-form="editor"]');
    await assertScreen("success");
    assert.match(await evalValue("document.querySelector('#app-main').innerText"), /关联 GTIN[\s\S]*4719999999999/);

    await load(320, 700);
    await click('[data-variant="B"]');
    assert.equal((await evalValue("window.__NUTTIE_D039__.getState()"))?.variant, "B");
    await setSelect("#b-memory", "first");
    assert.match(await evalValue("document.querySelector('#app-main').innerText"), /首次使用/);
    await setSelect("#b-memory", "local");
    assert.match(await evalValue("document.querySelector('#app-main').innerText"), /继续搜索本地食品/);
    await setSelect("#b-memory", "ai");
    const bAiText = await evalValue("document.querySelector('#app-main').innerText");
    assert.match(bAiText, /继续用拍照识别/);
    assert.match(bAiText, /每张图片仍显示目标 host/);
    assert.deepEqual(await evalValue("['#b-memory', '#ai-config', '#permission-state'].map((selector) => document.querySelector(selector).getBoundingClientRect().height >= 43.5)"), [true, true, true]);
    await capture("d039-b-last-ai-320");

    await click('[data-variant="C"]');
    assert.equal((await evalValue("window.__NUTTIE_D039__.getState()"))?.variant, "C");
    assert.equal(await evalValue(`document.querySelectorAll('[aria-label="全部添加方式"] .method-tile').length`), 6);
    assert.match(await evalValue(`document.querySelector('[aria-label="全部添加方式"]').innerText`), /搜索[\s\S]*扫描[\s\S]*拍照[\s\S]*相册[\s\S]*文字[\s\S]*自建/);
    await capture("d039-c-six-methods-320");

    await load(320, 700);
    await evalValue(expression(`
      const tab = document.querySelector('[data-variant="A"]');
      tab.focus();
      tab.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      return true;
    `));
    assert.equal((await evalValue("window.__NUTTIE_D039__.getState()"))?.variant, "B", "ArrowRight should select B");
    await click('[data-route="search"]');
    await assertScreen("search");
    assert.equal(await evalValue("document.activeElement.matches('[data-autofocus]')"), true, "new screen heading should receive focus");
    await evalValue("document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))");
    await assertScreen("entry");

    await cdp.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
    assert.equal(await evalValue("matchMedia('(prefers-reduced-motion: reduce)').matches"), true);

    const external = [...networkUrls].filter((url) => !url.startsWith(baseUrl));
    assert.deepEqual(external, [], `No external requests expected, saw ${external.join(", ")}`);
    assert.deepEqual(runtimeProblems, [], `No console/runtime problems expected: ${runtimeProblems.join(" | ")}`);

    console.log(JSON.stringify({
      result: "PASS",
      viewports: viewportResults,
      flows: [
        "local-search-edit-save",
        "recent-edit-save",
        "barcode-hit",
        "barcode-miss-create-save",
        "ai-unconfigured",
        "d014-label-preview-cancel-zero-write",
        "ai-failure-zero-write",
        "ai-fixture-edit-save",
        "camera-denied-fallback",
        "validation-preserves-create-and-editor-drafts",
        "ai-candidate-explicit-discard",
        "back-and-escape-focus-restoration",
        "search-results-show-source",
        "empty-ai-text-local-validation",
        "barcode-miss-carries-gtin",
        "b-first-local-ai-states",
        "c-six-first-layer-methods",
        "keyboard-focus-escape-reduce-motion"
      ],
      externalRequests: external.length,
      runtimeProblems: runtimeProblems.length
    }, null, 2));
  } finally {
    cdp?.close();
    if (edge.exitCode === null) {
      edge.kill();
      await Promise.race([
        once(edge, "exit"),
        new Promise((resolve) => setTimeout(resolve, 3000))
      ]);
    }
    await rm(profile, { recursive: true, force: true, maxRetries: 6, retryDelay: 150 });
  }
}

await main();
