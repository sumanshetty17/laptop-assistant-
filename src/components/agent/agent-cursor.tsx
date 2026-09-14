import { useOrbit } from "@/lib/store";
import { cn } from "@/lib/utils";

export function AgentCursor() {
  const cursor = useOrbit((s) => s.cursor);
  if (!cursor.visible) return null;

  return (
    <div
      className="pointer-events-none absolute z-cursor"
      style={{ left: cursor.x, top: cursor.y }}
    >
      <div className="relative -translate-x-1 -translate-y-1">
        {cursor.clicking ? (
          <span className="click-ripple absolute -left-3 -top-3 size-10 rounded-full bg-signal/30" />
        ) : null}
        <svg
          width="22"
          height="22"
          viewBox="0 0 22 22"
          className={cn(
            "drop-shadow transition-transform duration-150",
            cursor.clicking && "scale-90",
          )}
          aria-hidden="true"
        >
          <path
            d="M3 2.5 L3 17.5 L7.2 13.8 L10.2 20.2 L12.4 19.2 L9.3 12.6 L14.8 12.2 Z"
            fill="currentColor"
            className="text-signal"
            stroke="rgb(9 9 11)"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
        </svg>
        {cursor.label ? (
          <div className="absolute left-5 top-5 max-w-52 rounded-md bg-ink/90 px-2 py-1 text-xs text-paper shadow-border">
            {cursor.label}
          </div>
        ) : null}
      </div>
    </div>
  );
}
