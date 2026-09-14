import { ISSUE_IDS, type IssueId } from "./os";

export type Classification = {
  issue: IssueId;
  title: string;
  diagnosis: string;
  confidence: number;
};

const TITLES: Record<IssueId, string> = {
  wifi: "Wireless connection",
  audio: "Sound output",
  slow: "System performance",
  bluetooth: "Bluetooth link",
  display: "Display and brightness",
  printer: "Printer queue",
  overheat: "Thermal load",
  disk: "Storage pressure",
  battery: "Battery drain",
  update: "Paused system updates",
  camera: "Camera access",
  generic: "Full system pass",
};

const DIAGNOSIS: Record<IssueId, string> = {
  wifi: "The wireless radio is down and the adapter is disabled, so the laptop cannot lease an address.",
  audio: "Playback is muted and the audio device driver is not responding.",
  slow: "A background process and heavy startup items are pinning CPU and memory.",
  bluetooth: "The Bluetooth radio is off, so paired accessories cannot reconnect.",
  display: "Brightness is forced low and night light is washing the panel.",
  printer: "The printer is offline with a stalled driver and queued jobs.",
  overheat: "The machine is on a high-performance plan and the chassis is too hot.",
  disk: "Temporary files have filled the system volume.",
  battery: "Background drain is high and battery saver is off at a low charge.",
  update: "Updates are paused with a backlog waiting to install.",
  camera: "Privacy policy is blocking the camera and the device is disabled.",
  generic: "No single fault matches cleanly — a full pass will clear the usual blockers.",
};

const RULES: { issue: IssueId; pattern: RegExp }[] = [
  { issue: "camera", pattern: /\b(camera|webcam|web cam|zoom video|teams video|facetime)\b/i },
  { issue: "printer", pattern: /\b(print(?:er|ing)?|inkjet|laserjet|spooler)\b/i },
  { issue: "bluetooth", pattern: /\b(bluetooth|earbuds?|airpods|headphones? pair|bt\b)\b/i },
  { issue: "wifi", pattern: /\b(wi[-\s]?fi|wireless|internet|no network|can'?t connect|ethernet|router|hotspot|offline)\b/i },
  { issue: "audio", pattern: /\b(sound|audio|speaker|mute|volume|headphone|no nois|can'?t hear|silent)\b/i },
  { issue: "overheat", pattern: /\b(overheat|too hot|burning|fan noisy|fans? (?:are )?loud|thermal|temperature)\b/i },
  { issue: "slow", pattern: /\b(slow|lag|sluggish|freeze|frozen|hang|cpu|not responding|spinning)\b/i },
  { issue: "disk", pattern: /\b(disk|storage|drive full|out of space|low space|temp files?|cleanup)\b/i },
  { issue: "battery", pattern: /\b(batter(?:y|ies)|charge|draining|power drain|won'?t hold)\b/i },
  { issue: "update", pattern: /\b(update|updating|windows update|system update|patch)\b/i },
  { issue: "display", pattern: /\b(display|brightness|monitor|screen|resolution|dim|too dark|night light)\b/i },
];

export function classifyIssue(message: string): Classification {
  const text = message.trim();
  for (const rule of RULES) {
    if (rule.pattern.test(text)) {
      return {
        issue: rule.issue,
        title: TITLES[rule.issue],
        diagnosis: DIAGNOSIS[rule.issue],
        confidence: 0.72,
      };
    }
  }
  return {
    issue: "generic",
    title: TITLES.generic,
    diagnosis: DIAGNOSIS.generic,
    confidence: 0.4,
  };
}

export function classificationFromIssue(
  issue: IssueId,
  extras?: Partial<Classification>,
): Classification {
  return {
    issue,
    title: extras?.title ?? TITLES[issue],
    diagnosis: extras?.diagnosis ?? DIAGNOSIS[issue],
    confidence: extras?.confidence ?? 0.9,
  };
}

export function parseIssueId(value: string): IssueId | null {
  return ISSUE_IDS.includes(value as IssueId) ? (value as IssueId) : null;
}
