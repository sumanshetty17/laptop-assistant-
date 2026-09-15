import { classifyIssue } from "@/lib/classify";
import { diagnoseProblem } from "@/lib/diagnose";
import { applyIssue, isIssueResolved, type IssueId } from "@/lib/os";
import { PLAYBOOKS, type Step, type WindowKind } from "@/lib/playbooks";
import { useOrbit } from "@/lib/store";
import { prefersReducedMotion, sleep } from "@/lib/utils";

let generation = 0;

export function abortAgent() {
  generation += 1;
}

function alive(token: number) {
  return token === generation;
}

function findTarget(id: string): HTMLElement | null {
  const nodes = Array.from(
    document.querySelectorAll<HTMLElement>(`[data-agent="${id}"]`),
  );
  const visible = nodes.filter((el) => {
    const r = el.getBoundingClientRect();
    return r.width > 2 && r.height > 2;
  });
  return visible.at(-1) ?? nodes.at(-1) ?? null;
}

function deskPoint(el: HTMLElement) {
  const desk = document.querySelector("[data-desktop]");
  const deskRect = desk?.getBoundingClientRect() ?? new DOMRect();
  const r = el.getBoundingClientRect();
  return {
    x: r.left + r.width / 2 - deskRect.left,
    y: r.top + r.height / 2 - deskRect.top,
  };
}

function easeOut(t: number) {
  return 1 - (1 - t) ** 3;
}

async function animateCursor(x: number, y: number, token: number) {
  const store = useOrbit.getState();
  const from = { x: store.cursor.x, y: store.cursor.y };
  const dist = Math.hypot(x - from.x, y - from.y);
  if (prefersReducedMotion() || dist < 4) {
    useOrbit.getState().setCursor({ x, y, visible: true });
    return;
  }
  const duration = Math.min(900, Math.max(280, dist * 0.7));
  const start = performance.now();
  await new Promise<void>((resolve) => {
    const tick = (now: number) => {
      if (!alive(token)) {
        resolve();
        return;
      }
      const t = Math.min(1, (now - start) / duration);
      const e = easeOut(t);
      useOrbit.getState().setCursor({
        x: from.x + (x - from.x) * e,
        y: from.y + (y - from.y) * e,
        visible: true,
      });
      if (t < 1) requestAnimationFrame(tick);
      else resolve();
    };
    requestAnimationFrame(tick);
  });
}

async function clickTarget(id: string, token: number) {
  if (
    (id === "tb-start" && useOrbit.getState().startOpen) ||
    (id === "tb-wifi" && useOrbit.getState().networkFlyout) ||
    (id === "tb-volume" && useOrbit.getState().volumeFlyout) ||
    (id === "tb-battery" && useOrbit.getState().batteryFlyout)
  ) {
    return;
  }

  let el = findTarget(id);
  if (!el && id.startsWith("start-")) {
    await clickTarget("tb-start", token);
    el = findTarget(id);
  }
  if (!el) {
    for (let i = 0; i < 8 && alive(token); i += 1) {
      await sleep(80);
      el = findTarget(id);
      if (el) break;
    }
  }
  if (!el || !alive(token)) {
    throw new Error(`missing:${id}`);
  }

  const point = deskPoint(el);
  useOrbit.getState().setCursor({ label: null });
  await animateCursor(point.x, point.y, token);
  if (!alive(token)) return;
  useOrbit.getState().setCursor({ clicking: true });
  await sleep(90);
  el.click();
  await sleep(140);
  useOrbit.getState().setCursor({ clicking: false });
  await sleep(160);
}

async function runStep(step: Step, issue: IssueId, token: number) {
  const store = useOrbit.getState();
  switch (step.type) {
    case "say":
      store.pushLog(step.text, "info");
      store.setCursor({ label: step.text });
      await sleep(step.ms ?? 650);
      return;
    case "open":
      store.openWindow(step.window);
      await sleep(280);
      return;
    case "close":
      store.closeWindow(step.window);
      await sleep(180);
      return;
    case "click":
      store.pushLog(`Click · ${step.id.replace(/-/g, " ")}`, "action");
      await clickTarget(step.id, token);
      return;
    case "wait":
      await sleep(step.ms);
      return;
    case "assert":
      if (!isIssueResolved(useOrbit.getState().os, step.issue ?? issue)) {
        const err = new Error("assert");
        err.name = "StrategyFail";
        throw err;
      }
      store.pushLog("Check passed.", "ok");
      return;
  }
}

async function forceRepair(issue: IssueId, token: number) {
  const store = useOrbit.getState();
  store.pushLog("Forcing a deeper repair path.", "warn");
  store.openWindow("settings");
  await sleep(300);
  if (!alive(token)) return;
  store.patchOs((os) => {
    const next = { ...os };
    switch (issue) {
      case "wifi":
        next.wifi = {
          radio: true,
          connected: true,
          ssid: "NorthNet-5G",
          adapterEnabled: true,
          ip: "192.168.1.42",
        };
        break;
      case "audio":
        next.audio = { muted: false, volume: 62, output: "Laptop Speakers", driverOk: true };
        break;
      case "slow":
        next.performance = { cpu: 12, ram: 34, startupHeavy: false, heavyProcess: false };
        break;
      case "bluetooth":
        next.bluetooth = { radio: true, connectedDevice: "Studio Buds" };
        break;
      case "display":
        next.display = { brightness: 72, nightLight: false, resolution: "1920 × 1080" };
        break;
      case "printer":
        next.printer = { ...next.printer, online: true, driverOk: true, jobs: 0 };
        break;
      case "overheat":
        next.thermal = { celsius: 49, highPerformance: false };
        next.performance = { ...next.performance, cpu: 18, heavyProcess: false };
        break;
      case "disk":
        next.disk = { usedPct: 54, tempFilesGb: 0.3 };
        break;
      case "battery":
        next.battery = { ...next.battery, saver: true, drainHigh: false };
        break;
      case "update":
        next.updates = { pending: 0, paused: false };
        break;
      case "camera":
        next.camera = { allowed: true, deviceOk: true };
        break;
      case "generic":
        next.disk = { usedPct: 54, tempFilesGb: 0.3 };
        next.updates = { pending: 0, paused: false };
        next.performance = { ...next.performance, cpu: 14, heavyProcess: false };
        break;
    }
    return next;
  });
  await sleep(500);
}

export async function startJob(utterance: string) {
  const token = ++generation;
  const store = useOrbit.getState();
  store.clearLogs();
  store.setComplete(null);
  store.setStrategiesTried(0);
  store.setComposer(null);
  store.setOrbOpen(false);
  store.setPendingText(utterance);
  store.setPhase("diagnosing");
  store.pushLog("Reading the machine…", "info");
  store.setCursor({
    visible: true,
    x: window.innerWidth - 88,
    y: window.innerHeight - 120,
    label: "Diagnosing",
  });

  const local = classifyIssue(utterance);
  store.setDiagnosis(local);

  let result = local;
  try {
    const ai = await diagnoseProblem({ data: { message: utterance } });
    if (alive(token) && ai.result) result = ai.result;
  } catch {
    // local classification already set
  }
  if (!alive(token)) return;

  store.setDiagnosis(result);
  store.pushLog(result.diagnosis, "info");
  store.patchOs((os) => applyIssue(os, result.issue));
  await sleep(500);
  if (!alive(token)) return;

  store.setPhase("working");
  const book = PLAYBOOKS[result.issue];
  store.pushLog(`Working ${book.title.toLowerCase()}.`, "action");

  let tries = 0;
  let solved = false;
  for (const strategy of book.strategies) {
    if (!alive(token)) return;
    tries += 1;
    store.setStrategiesTried(tries);
    store.pushLog(`Path ${tries}: ${strategy.name}`, "action");
    try {
      for (const step of strategy.steps) {
        if (!alive(token)) return;
        await runStep(step, result.issue, token);
      }
      solved = isIssueResolved(useOrbit.getState().os, result.issue);
      if (solved) break;
      const err = new Error("assert");
      err.name = "StrategyFail";
      throw err;
    } catch (error) {
      const failed = error instanceof Error && error.name === "StrategyFail";
      store.pushLog(
        failed
          ? "That path did not hold. Trying another way."
          : "Control missed a target. Switching path.",
        "warn",
      );
      useOrbit.getState().closeFlyouts();
      await sleep(420);
    }
  }

  if (!alive(token)) return;
  if (!isIssueResolved(useOrbit.getState().os, result.issue)) {
    await forceRepair(result.issue, token);
  }

  if (!alive(token)) return;
  const os = useOrbit.getState().os;
  const summary = book.summary(os);
  store.setCursor({ visible: false, clicking: false, label: null });
  store.closeFlyouts();
  store.setComplete({
    title: book.title,
    summary,
    tries: Math.max(tries, 1),
  });
  store.setPhase("complete");
  store.pushLog("Task completed.", "ok");
}

export type { WindowKind };
