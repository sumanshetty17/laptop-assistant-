import { Mic, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SAMPLE_PROBLEMS } from "@/lib/playbooks";
import { useOrbit } from "@/lib/store";
import { cn } from "@/lib/utils";

type SpeechCtor = new () => {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((ev: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((ev: { error: string }) => void) | null;
  onend: (() => void) | null;
};

function getSpeechCtor(): SpeechCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as Window & {
    SpeechRecognition?: SpeechCtor;
    webkitSpeechRecognition?: SpeechCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function Composer({ onSubmit }: { onSubmit: (text: string) => void }) {
  const composer = useOrbit((s) => s.composer);
  const setComposer = useOrbit((s) => s.setComposer);
  const [text, setText] = useState("");
  const [listening, setListening] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const recRef = useRef<{ stop: () => void } | null>(null);

  useEffect(() => {
    if (composer !== "talk") {
      recRef.current?.stop();
      setListening(false);
      return;
    }
    const Ctor = getSpeechCtor();
    if (!Ctor) {
      setSpeechError("Voice is not available in this browser. Use text.");
      return;
    }
    setSpeechError(null);
    const rec = new Ctor();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = "en-US";
    rec.onresult = (ev) => {
      const parts: string[] = [];
      for (let i = 0; i < ev.results.length; i += 1) {
        parts.push(ev.results[i]?.[0]?.transcript ?? "");
      }
      setText(parts.join(" ").trim());
    };
    rec.onerror = (ev) => {
      if (ev.error === "not-allowed") {
        setSpeechError("Microphone permission was denied. Use text.");
      } else if (ev.error !== "no-speech") {
        setSpeechError("Could not hear that. Try again, or type.");
      }
      setListening(false);
    };
    rec.onend = () => setListening(false);
    recRef.current = rec;
    try {
      rec.start();
      setListening(true);
    } catch {
      setSpeechError("Voice could not start. Use text.");
    }
    return () => {
      rec.stop();
    };
  }, [composer]);

  if (!composer) return null;

  function send(value?: string) {
    const next = (value ?? text).trim();
    if (!next) return;
    recRef.current?.stop();
    onSubmit(next);
  }

  return (
    <div className="absolute right-3 bottom-24 left-3 z-sheet max-w-sm rounded-2xl bg-panel p-4 shadow-float sm:left-auto sm:right-6 sm:w-96">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-medium text-paper">
          {composer === "talk" ? "Talk" : "Text"}
        </p>
        <button
          type="button"
          className="text-xs text-mist hover:text-paper"
          onClick={() => setComposer(null)}
        >
          Close
        </button>
      </div>

      {composer === "talk" ? (
        <div className="mb-3 flex items-center gap-3">
          <span
            className={cn(
              "flex size-10 items-center justify-center rounded-full",
              listening ? "bg-signal text-signal-ink" : "bg-raise text-mist",
            )}
          >
            <Mic className="size-4" />
          </span>
          <p className="text-sm text-mist">
            {listening ? "Listening…" : speechError ?? "Microphone idle"}
          </p>
        </div>
      ) : null}

      {speechError && composer === "talk" ? (
        <p className="mb-3 text-xs text-warn">{speechError}</p>
      ) : null}

      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={
          composer === "talk"
            ? "Your words will appear here"
            : "Wi-Fi dropped, no sound, laptop is slow…"
        }
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            send();
          }
        }}
      />

      <div className="mt-3 flex flex-wrap gap-1.5">
        {SAMPLE_PROBLEMS.slice(0, 4).map((sample) => (
          <button
            key={sample.label}
            type="button"
            onClick={() => send(sample.text)}
            className="h-8 rounded-full px-3 text-xs text-mist shadow-border hover:bg-raise hover:text-paper"
          >
            {sample.label}
          </button>
        ))}
      </div>

      <div className="mt-3 flex justify-end">
        <Button onClick={() => send()} disabled={!text.trim()} className="min-w-24">
          <Send className="size-4" />
          Send
        </Button>
      </div>
    </div>
  );
}
