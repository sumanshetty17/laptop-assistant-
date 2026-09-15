import { X } from "lucide-react";
import type { ReactNode } from "react";
import { useOrbit } from "@/lib/store";
import type { WindowKind } from "@/lib/playbooks";
import { cn } from "@/lib/utils";

const WINDOW_SIZE: Record<WindowKind, { w: number; h: number }> = {
  settings: { w: 760, h: 500 },
  devices: { w: 560, h: 420 },
  tasks: { w: 620, h: 440 },
  explorer: { w: 520, h: 360 },
  printers: { w: 480, h: 340 },
};

export function OsWindow({
  id,
  title,
  x,
  y,
  z,
  children,
}: {
  id: WindowKind;
  title: string;
  x: number;
  y: number;
  z: number;
  children: ReactNode;
}) {
  const closeWindow = useOrbit((s) => s.closeWindow);
  const focusWindow = useOrbit((s) => s.focusWindow);
  const size = WINDOW_SIZE[id];
  const vw = typeof window !== "undefined" ? window.innerWidth : 1200;
  const vh = typeof window !== "undefined" ? window.innerHeight : 800;
  const width = Math.min(size.w, Math.max(280, vw - 16));
  const maxHeight = Math.min(size.h, Math.max(280, vh - 96));

  return (
    <section
      data-agent={`win-${id}`}
      style={{ left: x, top: y, zIndex: z, width, maxHeight }}
      className="absolute overflow-hidden rounded-xl bg-panel shadow-float"
      onPointerDown={() => focusWindow(id)}
    >
      <header className="flex h-11 items-center justify-between gap-3 border-b border-paper/10 px-3">
        <p className="truncate text-sm font-medium text-paper">{title}</p>
        <button
          type="button"
          data-agent={`close-${id}`}
          onClick={() => closeWindow(id)}
          className="flex size-11 items-center justify-center rounded-sm text-mist transition-colors duration-150 hover:bg-danger/20 hover:text-paper"
          aria-label={`Close ${title}`}
        >
          <X className="size-4" />
        </button>
      </header>
      <div className="overflow-auto" style={{ maxHeight: maxHeight - 44 }}>{children}</div>
    </section>
  );
}

export function RowButton({
  agentId,
  title,
  hint,
  onClick,
  trailing,
  selected,
}: {
  agentId: string;
  title: string;
  hint?: string;
  onClick: () => void;
  trailing?: ReactNode;
  selected?: boolean;
}) {
  return (
    <button
      type="button"
      data-agent={agentId}
      onClick={onClick}
      className={cn(
        "flex min-h-12 w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left transition-colors duration-150",
        selected ? "bg-raise" : "hover:bg-raise/70",
      )}
    >
      <span>
        <span className="block text-sm text-paper">{title}</span>
        {hint ? <span className="block text-xs text-mist">{hint}</span> : null}
      </span>
      {trailing}
    </button>
  );
}

export function ToggleSwitch({ on, label }: { on: boolean; label?: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      {label ? <span className="text-xs text-mist">{label}</span> : null}
      <span
        className={cn(
          "relative h-6 w-10 rounded-full transition-colors duration-150",
          on ? "bg-signal" : "bg-paper/15",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-5 rounded-full bg-paper transition-transform duration-150",
            on ? "translate-x-4" : "translate-x-0.5",
          )}
        />
      </span>
    </span>
  );
}
