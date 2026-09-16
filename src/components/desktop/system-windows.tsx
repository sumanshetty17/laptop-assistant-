import { AlertTriangle, Cpu, Folder, HardDrive } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { RowButton } from "@/components/desktop/os-window";
import { useOrbit } from "@/lib/store";
import { cn } from "@/lib/utils";

export function DevicesWindow() {
  const os = useOrbit((s) => s.os);
  const selected = useOrbit((s) => s.selectedDevice);
  const setSelectedDevice = useOrbit((s) => s.setSelectedDevice);
  const patchOs = useOrbit((s) => s.patchOs);

  const devices = [
    {
      id: "wifi",
      agent: "dev-wifi",
      title: "Wireless adapter",
      ok: os.wifi.adapterEnabled,
      hint: os.wifi.adapterEnabled ? "Working" : "Disabled",
    },
    {
      id: "audio",
      agent: "dev-audio",
      title: "Audio device",
      ok: os.audio.driverOk,
      hint: os.audio.driverOk ? "Working" : "Not responding",
    },
    {
      id: "camera",
      agent: "dev-camera",
      title: "Integrated camera",
      ok: os.camera.deviceOk,
      hint: os.camera.deviceOk ? "Working" : "Disabled",
    },
  ];

  return (
    <div className="p-3">
      <div className="mb-3 flex gap-2">
        <button
          type="button"
          data-agent="dev-enable"
          className="h-9 rounded-md px-3 text-xs font-medium text-paper shadow-border hover:bg-raise"
          onClick={() => {
            if (selected === "wifi") {
              patchOs((s) => ({
                ...s,
                wifi: {
                  ...s.wifi,
                  adapterEnabled: true,
                  radio: true,
                  connected: true,
                  ip: "192.168.1.42",
                },
              }));
            } else if (selected === "audio") {
              patchOs((s) => ({
                ...s,
                audio: { ...s.audio, driverOk: true, muted: false, volume: Math.max(s.audio.volume, 50) },
              }));
            } else if (selected === "camera") {
              patchOs((s) => ({
                ...s,
                camera: { allowed: true, deviceOk: true },
              }));
            }
          }}
        >
          Enable device
        </button>
        <button
          type="button"
          data-agent="dev-scan"
          className="h-9 rounded-md px-3 text-xs font-medium text-paper shadow-border hover:bg-raise"
          onClick={() =>
            patchOs((s) => ({
              ...s,
              wifi: s.wifi.adapterEnabled
                ? { ...s.wifi, radio: true, connected: true, ip: s.wifi.ip ?? "192.168.1.42" }
                : s.wifi,
            }))
          }
        >
          Scan hardware
        </button>
      </div>
      <div className="space-y-1">
        {devices.map((d) => (
          <button
            key={d.id}
            type="button"
            data-agent={d.agent}
            onClick={() => setSelectedDevice(d.id)}
            className={cn(
              "flex min-h-12 w-full items-center gap-3 rounded-lg px-3 text-left transition-colors duration-150",
              selected === d.id ? "bg-raise" : "hover:bg-raise/60",
            )}
          >
            {d.ok ? (
              <Cpu className="size-4 text-mist" />
            ) : (
              <AlertTriangle className="size-4 text-warn" />
            )}
            <span className="flex-1">
              <span className="block text-sm text-paper">{d.title}</span>
              <span className="block text-xs text-mist">{d.hint}</span>
            </span>
            <Badge variant={d.ok ? "ok" : "warn"}>{d.ok ? "OK" : "Error"}</Badge>
          </button>
        ))}
      </div>
    </div>
  );
}

export function TasksWindow() {
  const os = useOrbit((s) => s.os);
  const tab = useOrbit((s) => s.taskTab);
  const setTaskTab = useOrbit((s) => s.setTaskTab);
  const patchOs = useOrbit((s) => s.patchOs);

  return (
    <div>
      <div className="flex gap-1 border-b border-paper/10 px-3 pt-2">
        <button
          type="button"
          data-agent="task-processes-tab"
          onClick={() => setTaskTab("processes")}
          className={cn(
            "h-10 px-3 text-sm",
            tab === "processes" ? "border-b border-signal text-paper" : "text-mist",
          )}
        >
          Processes
        </button>
        <button
          type="button"
          data-agent="task-startup-tab"
          onClick={() => setTaskTab("startup")}
          className={cn(
            "h-10 px-3 text-sm",
            tab === "startup" ? "border-b border-signal text-paper" : "text-mist",
          )}
        >
          Startup
        </button>
      </div>
      {tab === "processes" ? (
        <div className="p-3">
          <div className="mb-3 flex gap-6 text-xs text-mist">
            <span>
              CPU <span className="tabular-nums text-paper">{os.performance.cpu}%</span>
            </span>
            <span>
              Memory <span className="tabular-nums text-paper">{os.performance.ram}%</span>
            </span>
          </div>
          <RowButton
            agentId="task-heavy"
            title="Update Helper"
            hint={os.performance.heavyProcess ? "Runaway — 68% CPU" : "Idle"}
            selected={os.performance.heavyProcess}
            onClick={() => undefined}
            trailing={
              <span className="tabular-nums text-xs text-mist">
                {os.performance.heavyProcess ? "68%" : "0.4%"}
              </span>
            }
          />
          <RowButton
            agentId="task-orbit"
            title="Orbit"
            hint="Technician"
            onClick={() => undefined}
            trailing={<span className="tabular-nums text-xs text-mist">1.1%</span>}
          />
          <div className="mt-3">
            <button
              type="button"
              data-agent="task-end"
              className="h-10 rounded-md px-3 text-sm font-medium text-paper shadow-border hover:bg-raise"
              onClick={() =>
                patchOs((s) => ({
                  ...s,
                  performance: {
                    ...s.performance,
                    heavyProcess: false,
                    cpu: s.performance.startupHeavy ? 48 : 14,
                    ram: s.performance.startupHeavy ? 61 : 34,
                  },
                  thermal: {
                    ...s.thermal,
                    celsius: Math.min(s.thermal.celsius, 54),
                  },
                }))
              }
            >
              End task
            </button>
          </div>
        </div>
      ) : (
        <div className="p-3">
          <RowButton
            agentId="task-disable-startup"
            title="Cloud Sync Host"
            hint={os.performance.startupHeavy ? "Starts with the laptop — high impact" : "Disabled"}
            onClick={() =>
              patchOs((s) => ({
                ...s,
                performance: {
                  cpu: 12,
                  ram: 36,
                  startupHeavy: false,
                  heavyProcess: false,
                },
              }))
            }
            trailing={
              <Badge variant={os.performance.startupHeavy ? "warn" : "ok"}>
                {os.performance.startupHeavy ? "Enabled" : "Disabled"}
              </Badge>
            }
          />
        </div>
      )}
    </div>
  );
}

export function ExplorerWindow() {
  const os = useOrbit((s) => s.os);
  const openWindow = useOrbit((s) => s.openWindow);
  const setSettingsPage = useOrbit((s) => s.setSettingsPage);
  return (
    <div className="p-4">
      <p className="mb-3 text-xs uppercase tracking-wide text-mist">Drives</p>
      <button
        type="button"
        data-agent="explorer-c"
        onClick={() => {
          openWindow("settings");
          setSettingsPage("storage");
        }}
        className="flex min-h-14 w-full items-center gap-3 rounded-lg px-3 text-left hover:bg-raise"
      >
        <HardDrive className="size-8 text-mist" />
        <span>
          <span className="block text-sm text-paper">System (C:)</span>
          <span className="block text-xs text-mist">{os.disk.usedPct}% used</span>
        </span>
      </button>
      <button
        type="button"
        className="mt-1 flex min-h-14 w-full items-center gap-3 rounded-lg px-3 text-left hover:bg-raise"
      >
        <Folder className="size-8 text-mist" />
        <span>
          <span className="block text-sm text-paper">Documents</span>
          <span className="block text-xs text-mist">Local files</span>
        </span>
      </button>
    </div>
  );
}
