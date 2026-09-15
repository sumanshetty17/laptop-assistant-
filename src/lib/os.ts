export type IssueId =
  | "wifi"
  | "audio"
  | "slow"
  | "bluetooth"
  | "display"
  | "printer"
  | "overheat"
  | "disk"
  | "battery"
  | "update"
  | "camera"
  | "generic";

export const ISSUE_IDS: IssueId[] = [
  "wifi",
  "audio",
  "slow",
  "bluetooth",
  "display",
  "printer",
  "overheat",
  "disk",
  "battery",
  "update",
  "camera",
  "generic",
];

export type OsState = {
  wifi: {
    radio: boolean;
    connected: boolean;
    ssid: string;
    adapterEnabled: boolean;
    ip: string | null;
  };
  bluetooth: { radio: boolean; connectedDevice: string | null };
  audio: {
    muted: boolean;
    volume: number;
    output: string;
    driverOk: boolean;
  };
  display: {
    brightness: number;
    nightLight: boolean;
    resolution: string;
  };
  performance: {
    cpu: number;
    ram: number;
    startupHeavy: boolean;
    heavyProcess: boolean;
  };
  printer: {
    online: boolean;
    name: string;
    driverOk: boolean;
    jobs: number;
  };
  thermal: { celsius: number; highPerformance: boolean };
  disk: { usedPct: number; tempFilesGb: number };
  battery: { percent: number; saver: boolean; drainHigh: boolean };
  updates: { pending: number; paused: boolean };
  camera: { allowed: boolean; deviceOk: boolean };
};

export const HEALTHY_OS: OsState = {
  wifi: {
    radio: true,
    connected: true,
    ssid: "NorthNet-5G",
    adapterEnabled: true,
    ip: "192.168.1.42",
  },
  bluetooth: { radio: true, connectedDevice: "Studio Buds" },
  audio: {
    muted: false,
    volume: 62,
    output: "Laptop Speakers",
    driverOk: true,
  },
  display: {
    brightness: 72,
    nightLight: false,
    resolution: "1920 × 1080",
  },
  performance: {
    cpu: 11,
    ram: 38,
    startupHeavy: false,
    heavyProcess: false,
  },
  printer: {
    online: true,
    name: "Aether Laser",
    driverOk: true,
    jobs: 0,
  },
  thermal: { celsius: 48, highPerformance: false },
  disk: { usedPct: 54, tempFilesGb: 0.4 },
  battery: { percent: 71, saver: false, drainHigh: false },
  updates: { pending: 0, paused: false },
  camera: { allowed: true, deviceOk: true },
};

export function cloneOs(os: OsState = HEALTHY_OS): OsState {
  return structuredClone(os);
}

export function applyIssue(os: OsState, issue: IssueId): OsState {
  const next = cloneOs(os);
  switch (issue) {
    case "wifi":
      next.wifi = {
        ...next.wifi,
        radio: false,
        connected: false,
        adapterEnabled: false,
        ip: null,
      };
      break;
    case "audio":
      next.audio = {
        ...next.audio,
        muted: true,
        volume: 0,
        driverOk: false,
      };
      break;
    case "slow":
      next.performance = {
        cpu: 94,
        ram: 88,
        startupHeavy: true,
        heavyProcess: true,
      };
      break;
    case "bluetooth":
      next.bluetooth = { radio: false, connectedDevice: null };
      break;
    case "display":
      next.display = {
        brightness: 12,
        nightLight: true,
        resolution: "1280 × 720",
      };
      break;
    case "printer":
      next.printer = {
        ...next.printer,
        online: false,
        driverOk: false,
        jobs: 3,
      };
      break;
    case "overheat":
      next.thermal = { celsius: 91, highPerformance: true };
      next.performance.cpu = 86;
      break;
    case "disk":
      next.disk = { usedPct: 97, tempFilesGb: 18.6 };
      break;
    case "battery":
      next.battery = { percent: 19, saver: false, drainHigh: true };
      break;
    case "update":
      next.updates = { pending: 6, paused: true };
      break;
    case "camera":
      next.camera = { allowed: false, deviceOk: false };
      break;
    case "generic":
      next.updates.paused = true;
      next.disk.tempFilesGb = 6.2;
      next.disk.usedPct = 81;
      next.performance.cpu = 64;
      break;
  }
  return next;
}

export function isIssueResolved(os: OsState, issue: IssueId): boolean {
  switch (issue) {
    case "wifi":
      return os.wifi.radio && os.wifi.adapterEnabled && os.wifi.connected && Boolean(os.wifi.ip);
    case "audio":
      return !os.audio.muted && os.audio.volume > 20 && os.audio.driverOk;
    case "slow":
      return os.performance.cpu < 40 && !os.performance.heavyProcess && !os.performance.startupHeavy;
    case "bluetooth":
      return os.bluetooth.radio && Boolean(os.bluetooth.connectedDevice);
    case "display":
      return os.display.brightness >= 60 && !os.display.nightLight;
    case "printer":
      return os.printer.online && os.printer.driverOk && os.printer.jobs === 0;
    case "overheat":
      return os.thermal.celsius < 60 && !os.thermal.highPerformance;
    case "disk":
      return os.disk.usedPct < 80 && os.disk.tempFilesGb < 2;
    case "battery":
      return os.battery.saver || !os.battery.drainHigh;
    case "update":
      return !os.updates.paused && os.updates.pending === 0;
    case "camera":
      return os.camera.allowed && os.camera.deviceOk;
    case "generic":
      return os.disk.tempFilesGb < 2 && !os.updates.paused && os.performance.cpu < 40;
  }
}
