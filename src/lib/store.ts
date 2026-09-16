import { create } from "zustand";
import { cloneOs, HEALTHY_OS, type OsState } from "./os";
import type { Classification } from "./classify";
import type { WindowKind } from "./playbooks";
import { uid } from "./utils";

export type Phase =
  | "intro"
  | "idle"
  | "permissions"
  | "diagnosing"
  | "working"
  | "complete";

export type AccessScope = "system" | "mic";
export type Composer = "talk" | "text" | null;

export type LogKind = "info" | "action" | "ok" | "warn";

export type LogEntry = {
  id: string;
  text: string;
  kind: LogKind;
  at: number;
};

export type AppWindow = {
  id: WindowKind;
  title: string;
  x: number;
  y: number;
  z: number;
};

export type CursorState = {
  x: number;
  y: number;
  visible: boolean;
  clicking: boolean;
  label: string | null;
};

export type CompleteState = {
  title: string;
  summary: string;
  tries: number;
};

const WINDOW_META: Record<WindowKind, { title: string }> = {
  settings: { title: "Settings" },
  devices: { title: "Device Manager" },
  tasks: { title: "Task Manager" },
  explorer: { title: "This PC" },
  printers: { title: "Printers" },
};

type OrbitState = {
  phase: Phase;
  orbOpen: boolean;
  composer: Composer;
  granted: boolean;
  micGranted: boolean;
  neededScopes: AccessScope[];
  pendingComposer: Composer;
  pendingText: string;
  diagnosis: Classification | null;
  logs: LogEntry[];
  cursor: CursorState;
  os: OsState;
  windows: AppWindow[];
  zTop: number;
  settingsPage: string;
  selectedDevice: string | null;
  taskTab: "processes" | "startup";
  startOpen: boolean;
  networkFlyout: boolean;
  volumeFlyout: boolean;
  batteryFlyout: boolean;
  complete: CompleteState | null;
  strategiesTried: number;
  introSeen: boolean;
  openWindow: (id: WindowKind) => void;
  closeWindow: (id: WindowKind) => void;
  focusWindow: (id: WindowKind) => void;
  patchOs: (fn: (os: OsState) => OsState) => void;
  setSettingsPage: (page: string) => void;
  setSelectedDevice: (id: string | null) => void;
  setTaskTab: (tab: "processes" | "startup") => void;
  setStartOpen: (open: boolean) => void;
  setNetworkFlyout: (open: boolean) => void;
  setVolumeFlyout: (open: boolean) => void;
  setBatteryFlyout: (open: boolean) => void;
  closeFlyouts: () => void;
  setPhase: (phase: Phase) => void;
  setOrbOpen: (open: boolean) => void;
  setComposer: (composer: Composer) => void;
  setGranted: (granted: boolean) => void;
  setMicGranted: (granted: boolean) => void;
  setNeededScopes: (scopes: AccessScope[]) => void;
  setPendingComposer: (composer: Composer) => void;
  setPendingText: (text: string) => void;
  setDiagnosis: (d: Classification | null) => void;
  pushLog: (text: string, kind?: LogKind) => void;
  clearLogs: () => void;
  setCursor: (partial: Partial<CursorState>) => void;
  setComplete: (c: CompleteState | null) => void;
  setStrategiesTried: (n: number) => void;
  setIntroSeen: () => void;
  resetSession: () => void;
};

export const useOrbit = create<OrbitState>((set, get) => ({
  phase: "intro",
  orbOpen: false,
  composer: null,
  granted: false,
  micGranted: false,
  neededScopes: [],
  pendingComposer: null,
  pendingText: "",
  diagnosis: null,
  logs: [],
  cursor: { x: 0, y: 0, visible: false, clicking: false, label: null },
  os: cloneOs(HEALTHY_OS),
  windows: [],
  zTop: 20,
  settingsPage: "system",
  selectedDevice: null,
  taskTab: "processes",
  startOpen: false,
  networkFlyout: false,
  volumeFlyout: false,
  batteryFlyout: false,
  complete: null,
  strategiesTried: 0,
  introSeen: false,

  openWindow: (id) => {
    const { windows, zTop } = get();
    const existing = windows.find((w) => w.id === id);
    if (existing) {
      set({
        windows: windows.map((w) => (w.id === id ? { ...w, z: zTop + 1 } : w)),
        zTop: zTop + 1,
        startOpen: false,
      });
      return;
    }
    const offset = windows.length * 28;
    const vw = typeof window !== "undefined" ? window.innerWidth : 1200;
    const narrow = vw < 720;
    set({
      windows: [
        ...windows,
        {
          id,
          title: WINDOW_META[id].title,
          x: narrow ? 8 : 72 + offset,
          y: narrow ? 8 : 48 + offset,
          z: zTop + 1,
        },
      ],
      zTop: zTop + 1,
      startOpen: false,
    });
  },

  closeWindow: (id) =>
    set({ windows: get().windows.filter((w) => w.id !== id) }),

  focusWindow: (id) => {
    const { windows, zTop } = get();
    if (!windows.some((w) => w.id === id)) return;
    set({
      windows: windows.map((w) => (w.id === id ? { ...w, z: zTop + 1 } : w)),
      zTop: zTop + 1,
    });
  },

  patchOs: (fn) => set({ os: fn(get().os) }),
  setSettingsPage: (page) => set({ settingsPage: page }),
  setSelectedDevice: (id) => set({ selectedDevice: id }),
  setTaskTab: (tab) => set({ taskTab: tab }),
  setStartOpen: (open) =>
    set({
      startOpen: open,
      networkFlyout: open ? false : get().networkFlyout,
      volumeFlyout: open ? false : get().volumeFlyout,
      batteryFlyout: open ? false : get().batteryFlyout,
    }),
  setNetworkFlyout: (open) =>
    set({
      networkFlyout: open,
      startOpen: false,
      volumeFlyout: false,
      batteryFlyout: false,
    }),
  setVolumeFlyout: (open) =>
    set({
      volumeFlyout: open,
      startOpen: false,
      networkFlyout: false,
      batteryFlyout: false,
    }),
  setBatteryFlyout: (open) =>
    set({
      batteryFlyout: open,
      startOpen: false,
      networkFlyout: false,
      volumeFlyout: false,
    }),
  closeFlyouts: () =>
    set({
      startOpen: false,
      networkFlyout: false,
      volumeFlyout: false,
      batteryFlyout: false,
    }),
  setPhase: (phase) => set({ phase }),
  setOrbOpen: (open) => set({ orbOpen: open, composer: open ? get().composer : null }),
  setComposer: (composer) => set({ composer, orbOpen: true }),
  setGranted: (granted) => set({ granted }),
  setMicGranted: (micGranted) => set({ micGranted }),
  setNeededScopes: (neededScopes) => set({ neededScopes }),
  setPendingComposer: (pendingComposer) => set({ pendingComposer }),
  setPendingText: (text) => set({ pendingText: text }),
  setDiagnosis: (d) => set({ diagnosis: d }),
  pushLog: (text, kind = "info") =>
    set({
      logs: [...get().logs, { id: uid(), text, kind, at: Date.now() }].slice(-24),
    }),
  clearLogs: () => set({ logs: [] }),
  setCursor: (partial) => set({ cursor: { ...get().cursor, ...partial } }),
  setComplete: (c) => set({ complete: c }),
  setStrategiesTried: (n) => set({ strategiesTried: n }),
  setIntroSeen: () => set({ introSeen: true, phase: "idle" }),
  resetSession: () =>
    set({
      phase: "idle",
      orbOpen: false,
      composer: null,
      pendingText: "",
      diagnosis: null,
      logs: [],
      cursor: { x: 0, y: 0, visible: false, clicking: false, label: null },
      complete: null,
      windows: [],
      startOpen: false,
      networkFlyout: false,
      volumeFlyout: false,
      batteryFlyout: false,
    }),
}));
