import { Mic, Type } from "lucide-react";
import { useState } from "react";
import { usePointerDrag } from "@/components/agent/use-pointer-drag";
import { useOrbit } from "@/lib/store";
import { cn } from "@/lib/utils";

export function FloatingOrb({
  onTalk,
  onText,
}: {
  onTalk: () => void;
  onText: () => void;
}) {
  const phase = useOrbit((s) => s.phase);
  const orbOpen = useOrbit((s) => s.orbOpen);
  const setOrbOpen = useOrbit((s) => s.setOrbOpen);
  const composer = useOrbit((s) => s.composer);
  const working = phase === "working" || phase === "diagnosing";
  const { pos, onPointerDown, dragging } = usePointerDrag();
  const [hint, setHint] = useState(true);

  return (
    <div
      className="absolute z-orb"
      style={pos ? { left: pos.x, top: pos.y } : { right: 20, bottom: 72 }}
    >
      {hint && !orbOpen && !working && phase === "idle" ? (
        <div className="absolute bottom-16 right-0 w-44 rounded-lg bg-panel px-3 py-2 text-xs leading-relaxed text-mist shadow-float">
          Click, then Talk or Text
        </div>
      ) : null}

      {orbOpen && !working ? (
        <div className="absolute bottom-16 right-0 mb-1 flex w-44 flex-col overflow-hidden rounded-xl bg-panel shadow-float">
          <button
            type="button"
            onClick={onTalk}
            className={cn(
              "flex min-h-12 items-center gap-3 px-4 text-sm text-paper hover:bg-raise",
              composer === "talk" && "bg-raise",
            )}
          >
            <Mic className="size-4 text-mist" />
            Talk
          </button>
          <div className="h-px bg-paper/10" />
          <button
            type="button"
            onClick={onText}
            className={cn(
              "flex min-h-12 items-center gap-3 px-4 text-sm text-paper hover:bg-raise",
              composer === "text" && "bg-raise",
            )}
          >
            <Type className="size-4 text-mist" />
            Text
          </button>
        </div>
      ) : null}

      <button
        type="button"
        aria-label="Orbit"
        onPointerDown={onPointerDown}
        onClick={() => {
          if (dragging.current) return;
          if (working) return;
          setHint(false);
          setOrbOpen(!orbOpen);
        }}
        className="relative flex size-14 items-center justify-center rounded-full bg-signal text-signal-ink shadow-float"
      >
        {working ? null : (
          <span className="orb-ring pointer-events-none absolute inset-0 rounded-full border border-signal" />
        )}
        <span className="relative block size-6 rounded-full border-2 border-signal-ink/70">
          <span className="absolute left-1/2 top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-signal-ink" />
        </span>
        {working ? (
          <span className="absolute -bottom-6 whitespace-nowrap text-xs text-paper">
            {phase === "diagnosing" ? "Reading" : "Working"}
          </span>
        ) : null}
      </button>
    </div>
  );
}
