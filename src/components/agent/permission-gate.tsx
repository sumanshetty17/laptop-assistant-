import { Eye, Mic, MousePointer2, SlidersHorizontal } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOrbit, type AccessScope } from "@/lib/store";

const CATALOG: {
  id: AccessScope | "pointer" | "settings";
  scope: AccessScope;
  icon: LucideIcon;
  title: string;
  body: string;
}[] = [
  {
    id: "system",
    scope: "system",
    icon: Eye,
    title: "Observe the screen",
    body: "See open windows, trays, and what the machine is doing.",
  },
  {
    id: "pointer",
    scope: "system",
    icon: MousePointer2,
    title: "Control the pointer",
    body: "Move the cursor, click, and type on your behalf.",
  },
  {
    id: "settings",
    scope: "system",
    icon: SlidersHorizontal,
    title: "Change system settings",
    body: "Toggle radios, drivers, power plans, and updates.",
  },
  {
    id: "mic",
    scope: "mic",
    icon: Mic,
    title: "Use the microphone",
    body: "Only for Talk. Not requested again after you allow it.",
  },
];

export function PermissionGate({ onAllow }: { onAllow: () => void }) {
  const phase = useOrbit((s) => s.phase);
  const needed = useOrbit((s) => s.neededScopes);
  if (phase !== "permissions") return null;

  const items = CATALOG.filter((item) => needed.includes(item.scope));
  const micOnly = needed.length === 1 && needed[0] === "mic";

  return (
    <div className="absolute inset-0 z-gate flex items-end justify-center bg-ink/55 p-4 sm:items-center">
      <div className="w-full max-w-md rounded-2xl bg-panel p-5 shadow-float">
        <p className="font-display text-2xl font-medium tracking-tight text-paper">
          {micOnly ? "Allow the microphone" : "Allow Orbit to work"}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-mist">
          {micOnly
            ? "Talk needs the microphone this one time. Later Talk sessions will not ask again."
            : "Asked only for access Orbit does not already have. After you allow it, this prompt will not return for the same permission."}
        </p>
        <ul className="mt-5 space-y-3">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.id} className="flex gap-3">
                <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-md bg-raise text-paper">
                  <Icon className="size-4" />
                </span>
                <span>
                  <span className="block text-sm text-paper">{item.title}</span>
                  <span className="block text-xs leading-relaxed text-mist">{item.body}</span>
                </span>
              </li>
            );
          })}
        </ul>
        <div className="mt-6 flex justify-end gap-2">
          <Button
            variant="ghost"
            onClick={() => useOrbit.getState().setPhase("idle")}
          >
            Not now
          </Button>
          <Button onClick={onAllow}>Allow access</Button>
        </div>
      </div>
    </div>
  );
}
