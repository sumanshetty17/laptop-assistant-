import { format } from "date-fns";
import {
  Battery,
  BatteryLow,
  BatteryWarning,
  Bluetooth,
  Search,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { BatteryFlyoutExtras } from "@/components/desktop/settings-window";
import { ToggleSwitch } from "@/components/desktop/os-window";
import { useOrbit } from "@/lib/store";
import { cn } from "@/lib/utils";

export function Taskbar() {
  const os = useOrbit((s) => s.os);
  const startOpen = useOrbit((s) => s.startOpen);
  const setStartOpen = useOrbit((s) => s.setStartOpen);
  const networkFlyout = useOrbit((s) => s.networkFlyout);
  const setNetworkFlyout = useOrbit((s) => s.setNetworkFlyout);
  const volumeFlyout = useOrbit((s) => s.volumeFlyout);
  const setVolumeFlyout = useOrbit((s) => s.setVolumeFlyout);
  const batteryFlyout = useOrbit((s) => s.batteryFlyout);
  const setBatteryFlyout = useOrbit((s) => s.setBatteryFlyout);
  const openWindow = useOrbit((s) => s.openWindow);
  const patchOs = useOrbit((s) => s.patchOs);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(t);
  }, []);

  const BatteryIcon =
    os.battery.percent < 20 ? BatteryLow : os.battery.drainHigh ? BatteryWarning : Battery;

  return (
    <>
      {startOpen ? (
        <div className="absolute bottom-14 left-2 z-40 w-64 overflow-hidden rounded-xl bg-panel p-2 shadow-float sm:left-3">
          <p className="px-2 py-2 text-xs uppercase tracking-wide text-mist">Applications</p>
          <StartItem
            agent="start-settings"
            label="Settings"
            onClick={() => openWindow("settings")}
          />
          <StartItem
            agent="start-devices"
            label="Device Manager"
            onClick={() => openWindow("devices")}
          />
          <StartItem
            agent="start-tasks"
            label="Task Manager"
            onClick={() => openWindow("tasks")}
          />
          <StartItem
            agent="start-explorer"
            label="This PC"
            onClick={() => openWindow("explorer")}
          />
        </div>
      ) : null}

      {networkFlyout ? (
        <div className="absolute bottom-14 right-2 z-40 w-72 overflow-hidden rounded-xl bg-panel p-3 shadow-float sm:right-3">
          <p className="mb-2 text-xs uppercase tracking-wide text-mist">Network</p>
          <FlyRow
            agent="wifi-toggle"
            title="Wi-Fi"
            hint={os.wifi.connected ? os.wifi.ssid : os.wifi.radio ? "Not connected" : "Off"}
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
          <FlyRow
            agent="wifi-reconnect"
            title="Reconnect"
            hint={os.wifi.ip ?? "No address"}
            onClick={() =>
              patchOs((s) => {
                if (!s.wifi.radio || !s.wifi.adapterEnabled) return s;
                return { ...s, wifi: { ...s.wifi, connected: true, ip: "192.168.1.42" } };
              })
            }
          />
          <div className="mt-2 flex items-center gap-2 px-1 text-xs text-mist">
            <Bluetooth className="size-3.5" />
            {os.bluetooth.radio ? os.bluetooth.connectedDevice ?? "On" : "Bluetooth off"}
          </div>
        </div>
      ) : null}

      {volumeFlyout ? (
        <div className="absolute bottom-14 right-2 z-40 w-72 overflow-hidden rounded-xl bg-panel p-3 shadow-float sm:right-20">
          <p className="mb-2 text-xs uppercase tracking-wide text-mist">Sound</p>
          <FlyRow
            agent="audio-unmute"
            title={os.audio.muted ? "Unmute" : "Mute"}
            hint={os.audio.output}
            onClick={() =>
              patchOs((s) => ({
                ...s,
                audio: {
                  ...s.audio,
                  muted: !s.audio.muted,
                  volume: s.audio.muted ? Math.max(s.audio.volume, 40) : 0,
                },
              }))
            }
            trailing={<ToggleSwitch on={!os.audio.muted} />}
          />
        </div>
      ) : null}

      {batteryFlyout ? (
        <div className="absolute bottom-14 right-2 z-40 w-72 overflow-hidden rounded-xl bg-panel p-3 shadow-float sm:right-28">
          <p className="mb-2 text-xs uppercase tracking-wide text-mist">Battery</p>
          <BatteryFlyoutExtras />
        </div>
      ) : null}

      <footer className="absolute inset-x-0 bottom-0 z-40 flex h-12 items-center justify-between border-t border-paper/10 bg-ink px-2 sm:px-3">
        <div className="flex items-center gap-1">
          <button
            type="button"
            data-agent="tb-start"
            onClick={() => setStartOpen(!startOpen)}
            className={cn(
              "flex size-10 items-center justify-center rounded-md transition-colors duration-150",
              startOpen ? "bg-raise" : "hover:bg-raise",
            )}
            aria-label="Start"
          >
            <span className="relative block size-4 rounded-full border border-signal">
              <span className="absolute left-1/2 top-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-signal" />
            </span>
          </button>
          <button
            type="button"
            data-agent="tb-search"
            className="hidden h-9 items-center gap-2 rounded-md bg-raise px-3 text-xs text-mist sm:flex"
            aria-label="Search"
          >
            <Search className="size-3.5" />
            Search
          </button>
        </div>

        <div className="flex items-center gap-0.5 text-mist">
          <button
            type="button"
            data-agent="tb-wifi"
            onClick={() => setNetworkFlyout(!networkFlyout)}
            className="flex size-10 items-center justify-center rounded-md hover:bg-raise"
            aria-label="Network"
          >
            {os.wifi.connected ? (
              <Wifi className="size-4" />
            ) : (
              <WifiOff className="size-4 text-warn" />
            )}
          </button>
          <button
            type="button"
            data-agent="tb-volume"
            onClick={() => setVolumeFlyout(!volumeFlyout)}
            className="flex size-10 items-center justify-center rounded-md hover:bg-raise"
            aria-label="Volume"
          >
            {os.audio.muted || os.audio.volume === 0 ? (
              <VolumeX className="size-4 text-warn" />
            ) : (
              <Volume2 className="size-4" />
            )}
          </button>
          <button
            type="button"
            data-agent="tb-battery"
            onClick={() => setBatteryFlyout(!batteryFlyout)}
            className="flex size-10 items-center justify-center rounded-md hover:bg-raise"
            aria-label="Battery"
          >
            <BatteryIcon className={cn("size-4", os.battery.percent < 20 && "text-warn")} />
          </button>
          <div className="hidden px-2 text-right text-xs leading-tight text-paper sm:block">
            {now ? (
              <>
                <div className="tabular-nums">{format(now, "HH:mm")}</div>
                <div className="text-mist">{format(now, "EEE d MMM")}</div>
              </>
            ) : (
              <div className="h-8" />
            )}
          </div>
        </div>
      </footer>
    </>
  );
}

function StartItem({
  agent,
  label,
  onClick,
}: {
  agent: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      data-agent={agent}
      onClick={onClick}
      className="flex min-h-11 w-full items-center rounded-lg px-3 text-sm text-paper hover:bg-raise"
    >
      {label}
    </button>
  );
}

function FlyRow({
  agent,
  title,
  hint,
  onClick,
  trailing,
}: {
  agent: string;
  title: string;
  hint: string;
  onClick: () => void;
  trailing?: ReactNode;
}) {
  return (
    <button
      type="button"
      data-agent={agent}
      onClick={onClick}
      className="flex min-h-12 w-full items-center justify-between gap-3 rounded-lg px-2 text-left hover:bg-raise"
    >
      <span>
        <span className="block text-sm text-paper">{title}</span>
        <span className="block text-xs text-mist">{hint}</span>
      </span>
      {trailing}
    </button>
  );
}
