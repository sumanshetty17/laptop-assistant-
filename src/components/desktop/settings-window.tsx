import {
  Battery,
  Bell,
  Bluetooth,
  Camera,
  HardDrive,
  Monitor,
  Printer,
  Shield,
  Volume2,
  Wifi,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { RowButton, ToggleSwitch } from "@/components/desktop/os-window";
import { useOrbit } from "@/lib/store";
import { cn } from "@/lib/utils";

const NAV: { id: string; label: string; icon: LucideIcon; agent: string }[] = [
  { id: "system", label: "System", icon: Monitor, agent: "nav-system" },
  { id: "network", label: "Network", icon: Wifi, agent: "nav-network" },
  { id: "bluetooth", label: "Bluetooth", icon: Bluetooth, agent: "nav-bluetooth" },
  { id: "sound", label: "Sound", icon: Volume2, agent: "nav-sound" },
  { id: "storage", label: "Storage", icon: HardDrive, agent: "nav-storage" },
  { id: "printers", label: "Printers", icon: Printer, agent: "nav-printers" },
  { id: "privacy", label: "Privacy", icon: Shield, agent: "nav-privacy" },
  { id: "update", label: "Updates", icon: Bell, agent: "nav-update" },
];

export function SettingsWindow() {
  const page = useOrbit((s) => s.settingsPage);
  const setSettingsPage = useOrbit((s) => s.setSettingsPage);

  return (
    <div className="flex min-h-80">
      <nav className="flex w-40 shrink-0 flex-col gap-0.5 border-r border-paper/10 p-2 sm:w-48">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = page === item.id;
          return (
            <button
              key={item.id}
              type="button"
              data-agent={item.agent}
              onClick={() => setSettingsPage(item.id)}
              className={cn(
                "flex min-h-11 items-center gap-2 rounded-md px-2.5 text-sm transition-colors duration-150",
                active ? "bg-raise text-paper" : "text-mist hover:bg-raise/60 hover:text-paper",
              )}
            >
              <Icon className="size-4 shrink-0" />
              {item.label}
            </button>
          );
        })}
      </nav>
      <div className="min-w-0 flex-1 p-4">
        {page === "system" && <SystemPage />}
        {page === "network" && <NetworkPage />}
        {page === "bluetooth" && <BluetoothPage />}
        {page === "sound" && <SoundPage />}
        {page === "storage" && <StoragePage />}
        {page === "printers" && <PrintersPage />}
        {page === "privacy" && <PrivacyPage />}
        {page === "update" && <UpdatePage />}
      </div>
    </div>
  );
}

function SystemPage() {
  const os = useOrbit((s) => s.os);
  const patchOs = useOrbit((s) => s.patchOs);
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-paper">Display</h3>
      <RowButton
        agentId="display-brighter"
        title="Brightness"
        hint={`${os.display.brightness}%`}
        onClick={() =>
          patchOs((s) => ({
            ...s,
            display: {
              ...s.display,
              brightness: Math.min(100, s.display.brightness + 30),
            },
          }))
        }
        trailing={<span className="text-xs tabular-nums text-mist">{os.display.brightness}%</span>}
      />
      <RowButton
        agentId="night-light"
        title="Night light"
        hint={os.display.nightLight ? "Warm cast is on" : "Off"}
        onClick={() =>
          patchOs((s) => ({
            ...s,
            display: { ...s.display, nightLight: !s.display.nightLight },
          }))
        }
        trailing={<ToggleSwitch on={os.display.nightLight} />}
      />
      <RowButton
        agentId="display-native"
        title="Resolution"
        hint={os.display.resolution}
        onClick={() =>
          patchOs((s) => ({
            ...s,
            display: { ...s.display, resolution: "1920 × 1080", brightness: Math.max(s.display.brightness, 72) },
          }))
        }
      />
      <h3 className="pt-3 text-sm font-medium text-paper">Power</h3>
      <RowButton
        agentId="power-balanced"
        title="Power plan"
        hint={os.thermal.highPerformance ? "High performance — running hot" : "Balanced"}
        onClick={() =>
          patchOs((s) => ({
            ...s,
            thermal: { celsius: Math.min(s.thermal.celsius, 52), highPerformance: false },
            performance: { ...s.performance, cpu: Math.min(s.performance.cpu, 28) },
          }))
        }
        trailing={
          <Badge variant={os.thermal.highPerformance ? "warn" : "ok"}>
            {os.thermal.celsius}°
          </Badge>
        }
      />
      <RowButton
        agentId="battery-trim"
        title="Background drain"
        hint={os.battery.drainHigh ? "Several apps waking the radio" : "Quiet"}
        onClick={() =>
          patchOs((s) => ({
            ...s,
            battery: { ...s.battery, drainHigh: false, saver: true },
          }))
        }
      />
    </div>
  );
}

function NetworkPage() {
  const os = useOrbit((s) => s.os);
  const patchOs = useOrbit((s) => s.patchOs);
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-paper">Wi-Fi</h3>
      <RowButton
        agentId="wifi-toggle"
        title="Wireless radio"
        hint={os.wifi.radio ? "On" : "Off"}
        onClick={() =>
          patchOs((s) => {
            const radio = !s.wifi.radio;
            const connected = radio && s.wifi.adapterEnabled;
            return {
              ...s,
              wifi: {
                ...s.wifi,
                radio,
                connected,
                ip: connected ? s.wifi.ip ?? "192.168.1.42" : null,
              },
            };
          })
        }
        trailing={<ToggleSwitch on={os.wifi.radio} />}
      />
      <RowButton
        agentId="wifi-reconnect"
        title="Reconnect"
        hint={os.wifi.connected ? os.wifi.ssid : "Not associated"}
        onClick={() =>
          patchOs((s) => {
            if (!s.wifi.radio || !s.wifi.adapterEnabled) return s;
            return {
              ...s,
              wifi: { ...s.wifi, connected: true, ip: "192.168.1.42" },
            };
          })
        }
        trailing={
          <Badge variant={os.wifi.connected ? "ok" : "danger"}>
            {os.wifi.connected ? os.wifi.ip : "No IP"}
          </Badge>
        }
      />
      <RowButton
        agentId="wifi-reset"
        title="Reset network stack"
        hint="Forget leases, restart the adapter, request a new address"
        onClick={() =>
          patchOs((s) => ({
            ...s,
            wifi: {
              radio: true,
              connected: true,
              ssid: "NorthNet-5G",
              adapterEnabled: true,
              ip: "192.168.1.42",
            },
          }))
        }
      />
    </div>
  );
}

function BluetoothPage() {
  const os = useOrbit((s) => s.os);
  const patchOs = useOrbit((s) => s.patchOs);
  return (
    <div className="space-y-2">
      <RowButton
        agentId="bt-toggle"
        title="Bluetooth"
        hint={os.bluetooth.radio ? "Discoverable" : "Off"}
        onClick={() =>
          patchOs((s) => {
            const radio = !s.bluetooth.radio;
            return {
              ...s,
              bluetooth: {
                radio,
                connectedDevice: radio ? s.bluetooth.connectedDevice ?? "Studio Buds" : null,
              },
            };
          })
        }
        trailing={<ToggleSwitch on={os.bluetooth.radio} />}
      />
      <RowButton
        agentId="bt-reconnect"
        title="Studio Buds"
        hint={os.bluetooth.connectedDevice ? "Connected" : "Paired, not connected"}
        onClick={() =>
          patchOs((s) =>
            s.bluetooth.radio
              ? { ...s, bluetooth: { radio: true, connectedDevice: "Studio Buds" } }
              : s,
          )
        }
        trailing={
          <Badge variant={os.bluetooth.connectedDevice ? "ok" : "warn"}>
            {os.bluetooth.connectedDevice ? "Linked" : "Idle"}
          </Badge>
        }
      />
    </div>
  );
}

function SoundPage() {
  const os = useOrbit((s) => s.os);
  const patchOs = useOrbit((s) => s.patchOs);
  return (
    <div className="space-y-2">
      <RowButton
        agentId="audio-unmute"
        title="Mute"
        hint={os.audio.muted ? "Output is silenced" : "Live"}
        onClick={() =>
          patchOs((s) => ({
            ...s,
            audio: {
              ...s.audio,
              muted: !s.audio.muted,
              volume: !s.audio.muted ? 0 : Math.max(s.audio.volume, 40),
            },
          }))
        }
        trailing={<ToggleSwitch on={os.audio.muted} label={os.audio.muted ? "Muted" : "On"} />}
      />
      <RowButton
        agentId="audio-volume-up"
        title="Volume"
        hint={os.audio.output}
        onClick={() =>
          patchOs((s) => ({
            ...s,
            audio: {
              ...s.audio,
              muted: false,
              volume: Math.min(100, Math.max(s.audio.volume, 20) + 20),
            },
          }))
        }
        trailing={<span className="text-xs tabular-nums text-mist">{os.audio.volume}%</span>}
      />
      <RowButton
        agentId="audio-fix-driver"
        title="Repair audio device"
        hint={os.audio.driverOk ? "Driver responding" : "Device not responding"}
        onClick={() =>
          patchOs((s) => ({
            ...s,
            audio: { ...s.audio, driverOk: true, muted: false, volume: Math.max(s.audio.volume, 62) },
          }))
        }
        trailing={<Badge variant={os.audio.driverOk ? "ok" : "danger"}>{os.audio.driverOk ? "OK" : "Fault"}</Badge>}
      />
    </div>
  );
}

function StoragePage() {
  const os = useOrbit((s) => s.os);
  const patchOs = useOrbit((s) => s.patchOs);
  return (
    <div className="space-y-3">
      <div>
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-paper">System (C:)</span>
          <span className="tabular-nums text-mist">{os.disk.usedPct}% used</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-raise">
          <div
            className={cn("h-full rounded-full", os.disk.usedPct > 90 ? "bg-danger" : "bg-signal")}
            style={{ width: `${os.disk.usedPct}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-mist">Temporary files: {os.disk.tempFilesGb.toFixed(1)} GB</p>
      </div>
      <RowButton
        agentId="disk-cleanup"
        title="Clear temporary files"
        hint="Downloads cache, installer leftovers, thumbnails"
        onClick={() =>
          patchOs((s) => ({
            ...s,
            disk: { usedPct: Math.max(48, s.disk.usedPct - 20), tempFilesGb: 0.3 },
            updates: s.updates,
            performance: { ...s.performance, cpu: Math.min(s.performance.cpu, 22) },
          }))
        }
      />
    </div>
  );
}

function PrintersPage() {
  const os = useOrbit((s) => s.os);
  const patchOs = useOrbit((s) => s.patchOs);
  return (
    <div className="space-y-2">
      <RowButton
        agentId="printer-online"
        title={os.printer.name}
        hint={os.printer.online ? "Ready" : "Offline"}
        onClick={() =>
          patchOs((s) => ({
            ...s,
            printer: { ...s.printer, online: true },
          }))
        }
        trailing={<Badge variant={os.printer.online ? "ok" : "danger"}>{os.printer.online ? "Online" : "Offline"}</Badge>}
      />
      <RowButton
        agentId="printer-restart"
        title="Restart print spooler"
        hint={os.printer.driverOk ? "Driver healthy" : "Driver stalled"}
        onClick={() =>
          patchOs((s) => ({
            ...s,
            printer: { ...s.printer, driverOk: true, online: true },
          }))
        }
      />
      <RowButton
        agentId="printer-clear"
        title="Clear queued jobs"
        hint={`${os.printer.jobs} waiting`}
        onClick={() =>
          patchOs((s) => ({
            ...s,
            printer: { ...s.printer, jobs: 0, online: true, driverOk: true },
          }))
        }
      />
    </div>
  );
}

function PrivacyPage() {
  const os = useOrbit((s) => s.os);
  const patchOs = useOrbit((s) => s.patchOs);
  return (
    <div className="space-y-2">
      <RowButton
        agentId="camera-allow"
        title="Camera access"
        hint={os.camera.allowed ? "Apps may use the camera" : "Blocked for all apps"}
        onClick={() =>
          patchOs((s) => ({
            ...s,
            camera: { ...s.camera, allowed: true },
          }))
        }
        trailing={
          <span className="inline-flex items-center gap-2">
            <Camera className="size-4 text-mist" />
            <ToggleSwitch on={os.camera.allowed} />
          </span>
        }
      />
    </div>
  );
}

function UpdatePage() {
  const os = useOrbit((s) => s.os);
  const patchOs = useOrbit((s) => s.patchOs);
  return (
    <div className="space-y-2">
      <p className="text-sm text-mist">
        {os.updates.paused
          ? "Updates are paused. Security patches will wait."
          : os.updates.pending
            ? `${os.updates.pending} updates ready.`
            : "This device is current."}
      </p>
      <RowButton
        agentId="update-resume"
        title="Pause updates"
        hint={os.updates.paused ? "Currently paused" : "Channel open"}
        onClick={() =>
          patchOs((s) => ({
            ...s,
            updates: { ...s.updates, paused: false },
          }))
        }
        trailing={<ToggleSwitch on={os.updates.paused} />}
      />
      <RowButton
        agentId="update-install"
        title="Install now"
        hint={os.updates.pending ? `${os.updates.pending} pending` : "Nothing queued"}
        onClick={() =>
          patchOs((s) =>
            s.updates.paused
              ? s
              : { ...s, updates: { pending: 0, paused: false } },
          )
        }
      />
    </div>
  );
}

export function BatteryFlyoutExtras() {
  const os = useOrbit((s) => s.os);
  const patchOs = useOrbit((s) => s.patchOs);
  return (
    <RowButton
      agentId="battery-saver"
      title="Battery saver"
      hint={`${os.battery.percent}% remaining`}
      onClick={() =>
        patchOs((s) => ({
          ...s,
          battery: { ...s.battery, saver: true, drainHigh: false },
        }))
      }
      trailing={<ToggleSwitch on={os.battery.saver} />}
    />
  );
}
