import { useEffect } from "react";
import { ActivityDock } from "@/components/agent/activity-dock";
import { AgentCursor } from "@/components/agent/agent-cursor";
import { Composer } from "@/components/agent/composer";
import { FloatingOrb } from "@/components/agent/floating-orb";
import { Intro } from "@/components/agent/intro";
import { PermissionGate } from "@/components/agent/permission-gate";
import { TaskComplete } from "@/components/agent/task-complete";
import { Desktop } from "@/components/desktop/desktop";
import { startJob } from "@/lib/agent/session";
import { useOrbit, type AccessScope } from "@/lib/store";

function persist(key: string) {
  try {
    localStorage.setItem(key, "1");
  } catch {
    /* ignore */
  }
}

export function OrbitApp() {
  const phase = useOrbit((s) => s.phase);
  const granted = useOrbit((s) => s.granted);
  const micGranted = useOrbit((s) => s.micGranted);
  const setGranted = useOrbit((s) => s.setGranted);
  const setMicGranted = useOrbit((s) => s.setMicGranted);
  const setPhase = useOrbit((s) => s.setPhase);
  const setPendingText = useOrbit((s) => s.setPendingText);
  const setPendingComposer = useOrbit((s) => s.setPendingComposer);
  const setNeededScopes = useOrbit((s) => s.setNeededScopes);
  const setComposer = useOrbit((s) => s.setComposer);
  const setIntroSeen = useOrbit((s) => s.setIntroSeen);

  useEffect(() => {
    try {
      if (
        localStorage.getItem("orbit-intro") === "1" ||
        localStorage.getItem("orbit-installed") === "1"
      ) {
        setIntroSeen();
      }
      if (localStorage.getItem("orbit-access") === "1") setGranted(true);
      if (localStorage.getItem("orbit-mic") === "1") setMicGranted(true);
    } catch {
      /* ignore */
    }

    const params = new URLSearchParams(window.location.search);
    if (params.get("installed") === "1") {
      persist("orbit-installed");
      persist("orbit-intro");
      setIntroSeen();
    }
  }, [setGranted, setIntroSeen, setMicGranted]);

  function missingFor(kind: "talk" | "text" | "job"): AccessScope[] {
    const need: AccessScope[] = [];
    if (!granted) need.push("system");
    if (kind === "talk" && !micGranted) need.push("mic");
    return need;
  }

  function ask(scopes: AccessScope[], then: { text?: string; composer?: "talk" | "text" }) {
    setNeededScopes(scopes);
    setPendingText(then.text ?? "");
    setPendingComposer(then.composer ?? null);
    setPhase("permissions");
  }

  function openTalk() {
    const need = missingFor("talk");
    if (need.length) {
      ask(need, { composer: "talk" });
      return;
    }
    setComposer("talk");
  }

  function openText() {
    setComposer("text");
  }

  function begin(text: string) {
    const talking = useOrbit.getState().composer === "talk";
    const need = missingFor(talking ? "talk" : "job");
    if (need.length) {
      ask(need, { text, composer: talking ? "talk" : "text" });
      return;
    }
    void startJob(text);
  }

  function allow() {
    const scopes = useOrbit.getState().neededScopes;
    if (scopes.includes("system")) {
      persist("orbit-access");
      setGranted(true);
    }
    if (scopes.includes("mic")) {
      persist("orbit-mic");
      setMicGranted(true);
    }
    const { pendingText, pendingComposer } = useOrbit.getState();
    setNeededScopes([]);
    if (pendingText) {
      void startJob(pendingText);
      return;
    }
    if (pendingComposer) {
      setComposer(pendingComposer);
      setPhase("idle");
      return;
    }
    setPhase("idle");
  }

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-ink">
      <Desktop />
      {(phase === "working" || phase === "diagnosing") && (
        <div className="absolute inset-0 z-lock" aria-hidden="true" />
      )}
      <AgentCursor />
      <ActivityDock />
      {phase !== "intro" ? (
        <FloatingOrb onTalk={openTalk} onText={openText} />
      ) : null}
      <Composer onSubmit={begin} />
      <PermissionGate onAllow={allow} />
      <TaskComplete />
      <Intro />
    </main>
  );
}
