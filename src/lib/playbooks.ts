import type { IssueId, OsState } from "./os";

export type WindowKind =
  | "settings"
  | "devices"
  | "tasks"
  | "explorer"
  | "printers";

export type Step =
  | { type: "say"; text: string; ms?: number }
  | { type: "open"; window: WindowKind }
  | { type: "close"; window: WindowKind }
  | { type: "click"; id: string }
  | { type: "wait"; ms: number }
  | { type: "assert"; issue: IssueId };

export type Strategy = {
  name: string;
  steps: Step[];
};

export type Playbook = {
  id: IssueId;
  title: string;
  summary: (os: OsState) => string;
  strategies: Strategy[];
};

export const PLAYBOOKS: Record<IssueId, Playbook> = {
  wifi: {
    id: "wifi",
    title: "Restore wireless connection",
    summary: (os) =>
      `Wireless is back on ${os.wifi.ssid} with address ${os.wifi.ip ?? "—"}.`,
    strategies: [
      {
        name: "Toggle the radio",
        steps: [
          { type: "say", text: "Checking the wireless radio first.", ms: 700 },
          { type: "click", id: "tb-wifi" },
          { type: "say", text: "The adapter is dark. Turning the radio on.", ms: 500 },
          { type: "click", id: "wifi-toggle" },
          { type: "wait", ms: 400 },
          { type: "click", id: "wifi-reconnect" },
          { type: "wait", ms: 500 },
          { type: "assert", issue: "wifi" },
        ],
      },
      {
        name: "Re-enable the adapter",
        steps: [
          { type: "say", text: "Radio alone is not enough. The adapter itself is disabled.", ms: 800 },
          { type: "click", id: "tb-start" },
          { type: "click", id: "start-devices" },
          { type: "say", text: "Opening Device Manager to bring the card back.", ms: 500 },
          { type: "click", id: "dev-wifi" },
          { type: "click", id: "dev-enable" },
          { type: "wait", ms: 400 },
          { type: "click", id: "dev-scan" },
          { type: "wait", ms: 600 },
          { type: "assert", issue: "wifi" },
        ],
      },
      {
        name: "Reset the network stack",
        steps: [
          { type: "say", text: "Last path: a full network stack reset from Settings.", ms: 700 },
          { type: "click", id: "tb-start" },
          { type: "click", id: "start-settings" },
          { type: "click", id: "nav-network" },
          { type: "click", id: "wifi-reset" },
          { type: "wait", ms: 700 },
          { type: "click", id: "wifi-reconnect" },
          { type: "wait", ms: 500 },
          { type: "assert", issue: "wifi" },
        ],
      },
    ],
  },
  audio: {
    id: "audio",
    title: "Restore sound",
    summary: (os) =>
      `Speakers live again — ${os.audio.output} at ${os.audio.volume}%.`,
    strategies: [
      {
        name: "Unmute the session",
        steps: [
          { type: "say", text: "Sound path first: the session is muted.", ms: 600 },
          { type: "click", id: "tb-volume" },
          { type: "click", id: "audio-unmute" },
          { type: "wait", ms: 400 },
          { type: "assert", issue: "audio" },
        ],
      },
      {
        name: "Repair the audio driver",
        steps: [
          { type: "say", text: "Unmute did not hold. The driver is stalled.", ms: 700 },
          { type: "click", id: "tb-start" },
          { type: "click", id: "start-devices" },
          { type: "click", id: "dev-audio" },
          { type: "click", id: "dev-enable" },
          { type: "wait", ms: 400 },
          { type: "open", window: "settings" },
          { type: "click", id: "nav-sound" },
          { type: "click", id: "audio-fix-driver" },
          { type: "click", id: "audio-volume-up" },
          { type: "wait", ms: 500 },
          { type: "assert", issue: "audio" },
        ],
      },
    ],
  },
  slow: {
    id: "slow",
    title: "Clear the bottleneck",
    summary: (os) =>
      `CPU settled at ${os.performance.cpu}% after ending the runaway task and trimming startup.`,
    strategies: [
      {
        name: "End the heavy process",
        steps: [
          { type: "say", text: "Something is pinning the processors. Opening Task Manager.", ms: 700 },
          { type: "click", id: "tb-start" },
          { type: "click", id: "start-tasks" },
          { type: "click", id: "task-heavy" },
          { type: "click", id: "task-end" },
          { type: "wait", ms: 500 },
          { type: "assert", issue: "slow" },
        ],
      },
      {
        name: "Trim startup apps",
        steps: [
          { type: "say", text: "The process is gone, but startup items are still loading the machine.", ms: 700 },
          { type: "click", id: "task-startup-tab" },
          { type: "click", id: "task-disable-startup" },
          { type: "wait", ms: 500 },
          { type: "assert", issue: "slow" },
        ],
      },
    ],
  },
  bluetooth: {
    id: "bluetooth",
    title: "Reconnect Bluetooth",
    summary: (os) =>
      os.bluetooth.connectedDevice
        ? `Bluetooth is on and ${os.bluetooth.connectedDevice} is linked again.`
        : "Bluetooth radio restored.",
    strategies: [
      {
        name: "Enable the radio",
        steps: [
          { type: "say", text: "Bluetooth radio is off. Bringing it up from Settings.", ms: 700 },
          { type: "click", id: "tb-start" },
          { type: "click", id: "start-settings" },
          { type: "click", id: "nav-bluetooth" },
          { type: "click", id: "bt-toggle" },
          { type: "wait", ms: 400 },
          { type: "assert", issue: "bluetooth" },
        ],
      },
      {
        name: "Pair the last device",
        steps: [
          { type: "say", text: "Radio is live. Reconnecting the last accessory.", ms: 600 },
          { type: "click", id: "bt-reconnect" },
          { type: "wait", ms: 600 },
          { type: "assert", issue: "bluetooth" },
        ],
      },
    ],
  },
  display: {
    id: "display",
    title: "Fix the panel",
    summary: (os) =>
      `Brightness at ${os.display.brightness}% and night light off. ${os.display.resolution}.`,
    strategies: [
      {
        name: "Raise brightness",
        steps: [
          { type: "say", text: "The panel is dim. Opening display controls.", ms: 600 },
          { type: "click", id: "tb-start" },
          { type: "click", id: "start-settings" },
          { type: "click", id: "nav-system" },
          { type: "click", id: "display-brighter" },
          { type: "wait", ms: 300 },
          { type: "click", id: "display-brighter" },
          { type: "wait", ms: 400 },
          { type: "assert", issue: "display" },
        ],
      },
      {
        name: "Disable night light",
        steps: [
          { type: "say", text: "Night light is still washing the screen. Switching it off.", ms: 600 },
          { type: "click", id: "night-light" },
          { type: "click", id: "display-native" },
          { type: "wait", ms: 400 },
          { type: "assert", issue: "display" },
        ],
      },
    ],
  },
  printer: {
    id: "printer",
    title: "Bring the printer online",
    summary: (os) =>
      `${os.printer.name} is online, queue cleared.`,
    strategies: [
      {
        name: "Set printer online",
        steps: [
          { type: "say", text: "Printer reports offline. Opening devices.", ms: 600 },
          { type: "click", id: "tb-start" },
          { type: "click", id: "start-settings" },
          { type: "click", id: "nav-printers" },
          { type: "click", id: "printer-online" },
          { type: "wait", ms: 400 },
          { type: "assert", issue: "printer" },
        ],
      },
      {
        name: "Restart the spooler",
        steps: [
          { type: "say", text: "Still stalled. Restarting the spooler and clearing jobs.", ms: 700 },
          { type: "click", id: "printer-restart" },
          { type: "click", id: "printer-clear" },
          { type: "wait", ms: 500 },
          { type: "assert", issue: "printer" },
        ],
      },
    ],
  },
  overheat: {
    id: "overheat",
    title: "Cool the chassis",
    summary: (os) =>
      `Thermals down to ${os.thermal.celsius}° — balanced plan restored.`,
    strategies: [
      {
        name: "Drop the power plan",
        steps: [
          { type: "say", text: "Chassis is hot on a high-performance plan.", ms: 700 },
          { type: "click", id: "tb-start" },
          { type: "click", id: "start-settings" },
          { type: "click", id: "nav-system" },
          { type: "click", id: "power-balanced" },
          { type: "wait", ms: 500 },
          { type: "assert", issue: "overheat" },
        ],
      },
      {
        name: "End the heat source",
        steps: [
          { type: "say", text: "Plan changed, but a process is still cooking the CPU.", ms: 700 },
          { type: "click", id: "tb-start" },
          { type: "click", id: "start-tasks" },
          { type: "click", id: "task-heavy" },
          { type: "click", id: "task-end" },
          { type: "wait", ms: 500 },
          { type: "assert", issue: "overheat" },
        ],
      },
    ],
  },
  disk: {
    id: "disk",
    title: "Free storage",
    summary: (os) =>
      `System volume at ${os.disk.usedPct}% after clearing temporary files.`,
    strategies: [
      {
        name: "Run cleanup",
        steps: [
          { type: "say", text: "The system volume is nearly full. Opening storage.", ms: 700 },
          { type: "click", id: "desk-this-pc" },
          { type: "open", window: "settings" },
          { type: "click", id: "nav-storage" },
          { type: "click", id: "disk-cleanup" },
          { type: "wait", ms: 800 },
          { type: "assert", issue: "disk" },
        ],
      },
    ],
  },
  battery: {
    id: "battery",
    title: "Stop the drain",
    summary: (os) =>
      os.battery.saver
        ? `Battery saver on. Charge at ${os.battery.percent}%.`
        : `Drain contained. Charge at ${os.battery.percent}%.`,
    strategies: [
      {
        name: "Enable battery saver",
        steps: [
          { type: "say", text: "Charge is low and drain is high. Engaging battery saver.", ms: 700 },
          { type: "click", id: "tb-battery" },
          { type: "click", id: "battery-saver" },
          { type: "wait", ms: 400 },
          { type: "assert", issue: "battery" },
        ],
      },
      {
        name: "Disable drain sources",
        steps: [
          { type: "say", text: "Saver is on. Trimming the apps that were draining in the background.", ms: 700 },
          { type: "click", id: "tb-start" },
          { type: "click", id: "start-settings" },
          { type: "click", id: "nav-system" },
          { type: "click", id: "battery-trim" },
          { type: "wait", ms: 400 },
          { type: "assert", issue: "battery" },
        ],
      },
    ],
  },
  update: {
    id: "update",
    title: "Resume updates",
    summary: () => "Updates resumed and the backlog is installing.",
    strategies: [
      {
        name: "Resume the channel",
        steps: [
          { type: "say", text: "Updates are paused. Opening the update pane.", ms: 600 },
          { type: "click", id: "tb-start" },
          { type: "click", id: "start-settings" },
          { type: "click", id: "nav-update" },
          { type: "click", id: "update-resume" },
          { type: "wait", ms: 400 },
          { type: "assert", issue: "update" },
        ],
      },
      {
        name: "Install now",
        steps: [
          { type: "say", text: "Channel is live. Installing the pending set.", ms: 500 },
          { type: "click", id: "update-install" },
          { type: "wait", ms: 700 },
          { type: "assert", issue: "update" },
        ],
      },
    ],
  },
  camera: {
    id: "camera",
    title: "Unlock the camera",
    summary: () => "Camera privacy is open and the device is enabled.",
    strategies: [
      {
        name: "Allow camera access",
        steps: [
          { type: "say", text: "Privacy policy is blocking the camera.", ms: 600 },
          { type: "click", id: "tb-start" },
          { type: "click", id: "start-settings" },
          { type: "click", id: "nav-privacy" },
          { type: "click", id: "camera-allow" },
          { type: "wait", ms: 400 },
          { type: "assert", issue: "camera" },
        ],
      },
      {
        name: "Enable the device",
        steps: [
          { type: "say", text: "Policy is open, but the device is still disabled.", ms: 600 },
          { type: "click", id: "tb-start" },
          { type: "click", id: "start-devices" },
          { type: "click", id: "dev-camera" },
          { type: "click", id: "dev-enable" },
          { type: "wait", ms: 500 },
          { type: "assert", issue: "camera" },
        ],
      },
    ],
  },
  generic: {
    id: "generic",
    title: "Full system pass",
    summary: () => "Scan complete. Temporary files cleared and updates resumed.",
    strategies: [
      {
        name: "Sweep the usual blockers",
        steps: [
          { type: "say", text: "No single fault. Running a full pass.", ms: 700 },
          { type: "click", id: "tb-start" },
          { type: "click", id: "start-settings" },
          { type: "click", id: "nav-storage" },
          { type: "click", id: "disk-cleanup" },
          { type: "wait", ms: 600 },
          { type: "click", id: "nav-update" },
          { type: "click", id: "update-resume" },
          { type: "click", id: "update-install" },
          { type: "wait", ms: 500 },
          { type: "click", id: "tb-start" },
          { type: "click", id: "start-tasks" },
          { type: "click", id: "task-heavy" },
          { type: "click", id: "task-end" },
          { type: "wait", ms: 400 },
          { type: "assert", issue: "generic" },
        ],
      },
    ],
  },
};

export const SAMPLE_PROBLEMS: { label: string; text: string }[] = [
  { label: "Wi-Fi dropped", text: "My wifi keeps disconnecting and I have no internet" },
  { label: "No sound", text: "There is no sound coming from the laptop speakers" },
  { label: "Running slow", text: "The laptop is very slow and keeps freezing" },
  { label: "Printer offline", text: "My printer is offline and will not print" },
  { label: "Overheating", text: "The laptop is too hot and the fans are loud" },
  { label: "Camera blocked", text: "Zoom cannot find my webcam" },
];
