import { FileText, Monitor, Recycle, Settings2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { SettingsWindow } from "@/components/desktop/settings-window";
import { OsWindow } from "@/components/desktop/os-window";
import {
  DevicesWindow,
  ExplorerWindow,
  TasksWindow,
} from "@/components/desktop/system-windows";
import { Taskbar } from "@/components/desktop/taskbar";
import { useOrbit } from "@/lib/store";
import type { WindowKind } from "@/lib/playbooks";
import { cn } from "@/lib/utils";

const ICONS: { id: string; agent: string; label: string; icon: LucideIcon; window?: WindowKind }[] = [
  { id: "recycle", agent: "desk-recycle", label: "Recycle Bin", icon: Recycle },
  { id: "pc", agent: "desk-this-pc", label: "This PC", icon: Monitor, window: "explorer" },
  { id: "docs", agent: "desk-docs", label: "Documents", icon: FileText },
  { id: "settings", agent: "desk-settings", label: "Settings", icon: Settings2, window: "settings" },
];

export function Desktop() {
  const windows = useOrbit((s) => s.windows);
  const openWindow = useOrbit((s) => s.openWindow);
  const closeFlyouts = useOrbit((s) => s.closeFlyouts);
  const os = useOrbit((s) => s.os);
  const night = os.display.nightLight;
  const dim = os.display.brightness < 30;

  return (
    <div data-desktop className="absolute inset-0 overflow-hidden bg-ink">
      <img
        src="/wallpaper.jpg"
        alt=""
        className={cn(
          "pointer-events-none absolute inset-0 size-full object-cover outline outline-1 -outline-offset-1 outline-paper/10 transition-[filter] duration-500",
          night && "sepia-[0.35] saturate-50",
          dim && "brightness-50",
        )}
      />
      <div className="pointer-events-none absolute inset-0 bg-ink/25" />
      <button
        type="button"
        aria-label="Desktop"
        className="absolute inset-0 z-0"
        onClick={closeFlyouts}
      />
      <div className="absolute top-4 left-3 z-10 flex flex-col gap-3 sm:top-6 sm:left-5">
        {ICONS.map((icon) => {
          const Icon = icon.icon;
          return (
            <button
              key={icon.id}
              type="button"
              data-agent={icon.agent}
              onClick={() => {
                if (icon.window) openWindow(icon.window);
              }}
              className="group flex w-20 flex-col items-center gap-1.5"
            >
              <span className="flex size-12 items-center justify-center rounded-lg bg-ink/55 shadow-border transition-colors duration-150 group-hover:bg-ink/75">
                <Icon className="size-6 text-paper" />
              </span>
              <span className="text-center text-xs leading-tight text-paper drop-shadow">
                {icon.label}
              </span>
            </button>
          );
        })}
      </div>

      {windows.map((win) => (
        <OsWindow
          key={win.id}
          id={win.id}
          title={win.title}
          x={win.x}
          y={win.y}
          z={win.z}
        >
          {win.id === "settings" && <SettingsWindow />}
          {win.id === "devices" && <DevicesWindow />}
          {win.id === "tasks" && <TasksWindow />}
          {win.id === "explorer" && <ExplorerWindow />}
        </OsWindow>
      ))}

      <Taskbar />
    </div>
  );
}
