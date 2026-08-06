import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { readFile, rm, writeFile, mkdir } from "node:fs/promises";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const baseUrl = new URL(process.argv[2] || "http://127.0.0.1:4177/");
const screenshotDir = process.argv[3] || "";
const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const root = path.dirname(fileURLToPath(import.meta.url));
const profile = path.join(os.tmpdir(), `nuttie-d040-edge-${process.pid}`);

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
      // Edge can need a moment to expose its local debugging socket.
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
      (this.listeners.get(message.method) || []).forEach((callback) => callback(message.params || {}));
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

async function assertHttpContract() {
  const htmlBytes = await readFile(path.join(root, "index.html"));
  const getResponse = await fetch(baseUrl);
  assert.equal(getResponse.status, 200);
  assert.match(getResponse.headers.get("content-type") || "", /^text\/html/);
  assert.deepEqual(Buffer.from(await getResponse.arrayBuffer()), htmlBytes, "HTTP body must equal the repository HTML bytes");

  const headResponse = await fetch(baseUrl, { method: "HEAD" });
  assert.equal(headResponse.status, 200);
  assert.equal(Number(headResponse.headers.get("content-length")), htmlBytes.length);

  const postResponse = await fetch(baseUrl, { method: "POST" });
  assert.equal(postResponse.status, 405);
  assert.equal(postResponse.headers.get("allow"), "GET, HEAD");

  const html = htmlBytes.toString("utf8");
  const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map((match) => match[1]);
  assert.equal(scripts.length, 1, "prototype should use one auditable inline script");
  new Function(scripts[0]);
  assert.match(html, /connect-src 'none'/);
  assert.doesNotMatch(html, /fetch\(|XMLHttpRequest|WebSocket|localStorage|sessionStorage|indexedDB|document\.cookie/);
  assert.doesNotMatch(html, /ownerChoice|selectedOption|approved/);
}

async function main() {
  await assertHttpContract();
  const debugPort = await freePort();
  if (screenshotDir) await mkdir(screenshotDir, { recursive: true });
  await mkdir(profile, { recursive: true });

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
    assert.ok(target?.webSocketDebuggerUrl, "Edge should expose a page CDP socket");
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
      await cdp.send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: width <= 430 });
      await cdp.send("Page.navigate", { url: baseUrl.href });
      await waitUntil("document.readyState === 'complete' && Boolean(window.__NUTTIE_D040__)", "prototype load");
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

    async function setValue(selector, value) {
      const found = await evalValue(expression(`
        const target = document.querySelector(${JSON.stringify(selector)});
        if (!target) return false;
        target.value = ${JSON.stringify(value)};
        target.dispatchEvent(new Event('input', { bubbles: true }));
        target.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      `));
      assert.equal(found, true, `Expected field ${selector}`);
    }

    async function submit(selector) {
      const found = await evalValue(expression(`
        const target = document.querySelector(${JSON.stringify(selector)});
        if (!target) return false;
        target.requestSubmit();
        return true;
      `));
      assert.equal(found, true, `Expected form ${selector}`);
      await evalValue("new Promise((resolve) => requestAnimationFrame(resolve))");
    }

    async function state() {
      return evalValue("window.__NUTTIE_D040__.getState()");
    }

    async function assertScreen(name) {
      assert.equal((await state()).screen, name, `Expected screen ${name}`);
    }

    async function assertLayout(label) {
      const layout = await evalValue(expression(`
        const phone = document.querySelector('.phone');
        const phoneRect = phone.getBoundingClientRect();
        const app = document.querySelector('#app-main');
        const visible = [...phone.querySelectorAll('button, input, select, .notice, .summary-block, .status-box, .error-summary')]
          .filter((node) => {
            const style = getComputedStyle(node);
            const rect = node.getBoundingClientRect();
            return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
          });
        return {
          rootOverflow: document.documentElement.scrollWidth - innerWidth,
          appOverflow: app.scrollWidth - app.clientWidth,
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
      assert.deepEqual(layout.shortTargets, [], `${label}: visible buttons/selects meet the 44pt prototype target`);
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
      await assertLayout(`welcome-${viewport.name}`);
      const initial = await state();
      assert.deepEqual(
        { variant: initial.variant, screen: initial.screen, profileWrites: initial.profileWrites, goalWrites: initial.goalWrites },
        { variant: "A", screen: "welcome", profileWrites: 0, goalWrites: 0 }
      );
      assert.match(await evalValue("document.body.innerText"), /CANDIDATE · 未作决定[\s\S]*切换只改变本页预览，不代表 Owner 选择/);
      await capture(`d040-welcome-${viewport.name}`);
      await click('[data-variant="C"]');
      await click('[data-route="start"]');
      await assertScreen("c-questionnaire");
      await assertLayout(`c-questionnaire-${viewport.name}`);
      await click('[data-variant="B"]');
      await click('[data-route="start"]');
      await click('[data-route="skip"]');
      await assertScreen("diary");
      await assertLayout(`b-empty-diary-${viewport.name}`);
      viewportResults.push({ name: viewport.name, screens: ["welcome", "c-questionnaire", "b-empty-diary"], rootOverflow: 0, appOverflow: 0 });
    }

    await load(320, 700);
    await click('[data-route="start"]');
    await assertScreen("a-profile");
    await setValue("#a-age", "");
    await submit('[data-form="a-profile"]');
    await assertScreen("a-profile");
    assert.equal(await evalValue("document.querySelector('#a-age').getAttribute('aria-invalid')"), "true");
    assert.equal(await evalValue("document.activeElement.id"), "a-age");
    assert.equal((await state()).goalWrites, 0);
    await setValue("#a-age", "32");
    await setValue("#a-activity", "");
    await submit('[data-form="a-profile"]');
    assert.match(await evalValue("document.querySelector('#a-activity').getAttribute('aria-describedby')"), /a-activity-error/);
    assert.equal(await evalValue("document.activeElement.id"), "a-activity");
    await setValue("#a-activity", "moderate");
    await submit('[data-form="a-profile"]');
    await assertScreen("target-preview");
    assert.match(await evalValue("document.querySelector('#app-main').innerText"), /D040-FORMULA-PENDING[\s\S]*待 Owner 与健康评审[\s\S]*固定夹具，可修改/);
    assert.equal((await state()).goalWrites, 0);
    await submit('[data-form="target-preview"]');
    await assertScreen("diary");
    assert.deepEqual({ profileWrites: (await state()).profileWrites, goalWrites: (await state()).goalWrites, hasGoal: (await state()).hasGoal }, { profileWrites: 1, goalWrites: 1, hasGoal: true });

    await load(320, 700);
    await click('[data-route="start"]');
    await click('[data-route="skip"]');
    await assertScreen("diary");
    assert.deepEqual({ profileWrites: (await state()).profileWrites, goalWrites: (await state()).goalWrites, hasGoal: (await state()).hasGoal }, { profileWrites: 0, goalWrites: 0, hasGoal: false });
    assert.match(await evalValue("document.querySelector('#app-main').innerText"), /尚未设置每日目标[\s\S]*不会显示 0、默认推荐值或虚构的剩余量/);

    await load(320, 700);
    await click('[data-variant="B"]');
    await click('[data-route="start"]');
    await assertScreen("b-manual");
    assert.equal(await evalValue("Boolean(document.querySelector('#a-age, #c-age'))"), false, "B must not require profile fields");
    await setValue("#b-energy", "-1");
    await submit('[data-form="b-manual"]');
    assert.equal(await evalValue("document.querySelector('#b-energy').value"), "-1");
    assert.equal(await evalValue("document.activeElement.id"), "b-energy");
    assert.equal((await state()).goalWrites, 0);
    await setValue("#b-energy", "2100");
    await submit('[data-form="b-manual"]');
    await assertScreen("target-preview");
    assert.match(await evalValue("document.querySelector('#app-main').innerText"), /来源：用户手工输入[\s\S]*没有运行画像推导公式/);

    await load(320, 700);
    await click('[data-variant="C"]');
    await click('[data-route="start"]');
    await assertScreen("c-questionnaire");
    assert.match(await evalValue("document.querySelector('#app-main').innerText"), /必须完成全部候选问题后才能进入日记/);
    assert.equal(await evalValue("Boolean(document.querySelector('[data-route=skip]'))"), false, "C clean first-run has no direct skip");
    await click('[data-route="restart-questionnaire"]');
    await submit('[data-form="c-questionnaire"]');
    await assertScreen("c-questionnaire");
    const cAfterInvalid = await state();
    assert.equal(cAfterInvalid.goalWrites, 0);
    assert.equal(Object.keys(cAfterInvalid.errors).length, 7);
    for (const [selector, value] of [
      ["#c-age", "32"], ["#c-height", "168"], ["#c-weight", "64"], ["#c-activity", "moderate"],
      ["#c-meal-pattern", "regular"], ["#c-food-preference", "balanced"], ["#c-schedule", "daytime"]
    ]) await setValue(selector, value);
    await submit('[data-form="c-questionnaire"]');
    await assertScreen("target-preview");
    assert.equal((await state()).goalWrites, 0);

    await load(320, 700);
    await click('[data-route="restore"]');
    await assertScreen("restore");
    await click('[data-route="restore-fail"]');
    await assertScreen("restore");
    assert.match(await evalValue("document.querySelector('#app-main').innerText"), /现有本地数据没有变化/);
    assert.deepEqual({ profileWrites: (await state()).profileWrites, goalWrites: (await state()).goalWrites, hasGoal: (await state()).hasGoal }, { profileWrites: 0, goalWrites: 0, hasGoal: false });
    await click('[data-route="cancel-restore"]');
    await assertScreen("welcome");
    assert.deepEqual({ profileWrites: (await state()).profileWrites, goalWrites: (await state()).goalWrites }, { profileWrites: 0, goalWrites: 0 });
    await click('[data-route="restore"]');
    await click('[data-route="restore-success"]');
    await assertScreen("diary");
    assert.equal((await state()).goalWrites, 1);
    assert.match(await evalValue("document.querySelector('#app-main').innerText"), /来源：加密备份恢复演示/);

    await load(320, 700);
    await setValue("#device-state", "existing");
    await assertScreen("diary");
    assert.deepEqual({ profileWrites: (await state()).profileWrites, goalWrites: (await state()).goalWrites, hasGoal: (await state()).hasGoal }, { profileWrites: 0, goalWrites: 0, hasGoal: true });
    assert.match(await evalValue("document.querySelector('#app-main').innerText"), /来源：既有本地档案演示/);

    await load(320, 700);
    await setValue("#device-state", "db-error");
    await assertScreen("db-recovery");
    assert.match(await evalValue("document.querySelector('#app-main').innerText"), /没有创建空数据库[\s\S]*没有覆盖现有文件/);
    assert.deepEqual({ profileWrites: (await state()).profileWrites, goalWrites: (await state()).goalWrites, hasGoal: (await state()).hasGoal }, { profileWrites: 0, goalWrites: 0, hasGoal: false });

    for (const outcome of ["db-error", "storage-low"]) {
      await load(320, 700);
      await setValue("#save-outcome", outcome);
      await click('[data-route="start"]');
      await submit('[data-form="a-profile"]');
      await submit('[data-form="target-preview"]');
      await assertScreen("save-error");
      const failedSave = await state();
      assert.deepEqual({ profileWrites: failedSave.profileWrites, goalWrites: failedSave.goalWrites, hasGoal: failedSave.hasGoal }, { profileWrites: 0, goalWrites: 0, hasGoal: false });
      assert.match(await evalValue("document.querySelector('#app-main').innerText"), /草稿仍在本页流程内[\s\S]*现有本地数据没有变化/);
    }

    await load(320, 700);
    await cdp.send("Input.dispatchKeyEvent", { type: "keyDown", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 });
    await cdp.send("Input.dispatchKeyEvent", { type: "keyUp", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 });
    const keyboardEvidence = await evalValue(expression(`
      const a = document.querySelector('[data-variant="A"]');
      const focusStyle = getComputedStyle(a);
      const focus = { active: document.activeElement === a, visible: a.matches(':focus-visible'), width: focusStyle.outlineWidth, style: focusStyle.outlineStyle, offset: focusStyle.outlineOffset };
      const snapshots = [];
      for (const key of ['ArrowRight', 'ArrowLeft', 'End', 'Home']) {
        document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
        snapshots.push({ key, variant: window.__NUTTIE_D040__.getState().variant, active: document.activeElement?.dataset.variant, selected: document.querySelector('[data-variant][aria-selected="true"]')?.dataset.variant });
      }
      return { focus, snapshots };
    `));
    assert.deepEqual(keyboardEvidence.snapshots, [
      { key: "ArrowRight", variant: "B", active: "B", selected: "B" },
      { key: "ArrowLeft", variant: "A", active: "A", selected: "A" },
      { key: "End", variant: "C", active: "C", selected: "C" },
      { key: "Home", variant: "A", active: "A", selected: "A" }
    ]);
    assert.deepEqual(keyboardEvidence.focus, { active: true, visible: true, width: "3px", style: "solid", offset: "2px" });
    await click('[data-route="start"]');
    assert.equal(await evalValue("document.activeElement.matches('[data-autofocus]')"), true);
    await evalValue("document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))");
    await evalValue("new Promise((resolve) => requestAnimationFrame(resolve))");
    await assertScreen("welcome");
    assert.equal(await evalValue("document.activeElement.matches('[data-route=start]')"), true, "Escape should restore the start trigger");

    await cdp.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
    assert.equal(await evalValue("matchMedia('(prefers-reduced-motion: reduce)').matches"), true);

    const storage = await evalValue(`(async () => {
      const databases = indexedDB.databases ? await indexedDB.databases() : [];
      return { local: localStorage.length, session: sessionStorage.length, cookie: document.cookie, indexedDbDatabases: databases.length };
    })()`);
    assert.deepEqual(storage, { local: 0, session: 0, cookie: "", indexedDbDatabases: 0 });

    const external = [...networkUrls].filter((url) => !url.startsWith(baseUrl.origin));
    assert.deepEqual(external, [], `No external requests expected, saw ${external.join(", ")}`);
    assert.deepEqual(runtimeProblems, [], `No runtime problems expected: ${runtimeProblems.join(" | ")}`);

    console.log(JSON.stringify({
      result: "PASS",
      status: "CANDIDATE / PX-0_INPUT_GAP / FORMULA_REVIEW_REQUIRED",
      viewports: viewportResults,
      flows: [
        "a-validation-preview-save",
        "a-skip-empty-goal",
        "b-manual-validation-preview",
        "c-mandatory-questionnaire",
        "restore-cancel-failure-success-source",
        "existing-data-read-zero-write-source",
        "database-recovery-no-overwrite-zero-write",
        "database-and-storage-save-failure-zero-write",
        "keyboard-focus-escape-reduce-motion"
      ],
      externalRequests: external.length,
      runtimeProblems: runtimeProblems.length,
      persistentStorageRecords: 0
    }, null, 2));
  } finally {
    cdp?.close();
    if (edge.exitCode === null) {
      edge.kill();
      await Promise.race([once(edge, "exit"), new Promise((resolve) => setTimeout(resolve, 3000))]);
    }
    await rm(profile, { recursive: true, force: true, maxRetries: 6, retryDelay: 150 });
  }
}

await main();
