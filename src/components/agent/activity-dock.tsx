import { useOrbit } from "@/lib/store";
import { cn } from "@/lib/utils";

export function ActivityDock() {
  const logs = useOrbit((s) => s.logs);
  const phase = useOrbit((s) => s.phase);
  if (phase !== "working" && phase !== "diagnosing") return null;
  const visible = logs.slice(-6);

  return (
    <aside className="absolute top-4 right-3 left-3 z-sheet max-w-xs rounded-xl bg-ink/80 p-3 shadow-border sm:top-6 sm:left-auto sm:w-72">
      <p
        className={cn(
          "text-xs uppercase tracking-wide text-mist",
          phase === "diagnosing" && "shimmer-text",
        )}
      >
        {phase === "diagnosing" ? "Diagnosing" : "Orbit is working"}
      </p>
      <ul className="mt-2 space-y-1.5">
        {visible.map((log) => (
          <li
            key={log.id}
            className={cn(
              "text-xs leading-relaxed",
              log.kind === "ok" && "text-ok",
              log.kind === "warn" && "text-warn",
              log.kind === "action" && "text-paper",
              log.kind === "info" && "text-mist",
            )}
          >
            {log.text}
          </li>
        ))}
      </ul>
    </aside>
  );
}
