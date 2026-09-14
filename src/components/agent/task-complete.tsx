import { Button } from "@/components/ui/button";
import { useOrbit } from "@/lib/store";

export function TaskComplete() {
  const complete = useOrbit((s) => s.complete);
  const phase = useOrbit((s) => s.phase);
  const resetSession = useOrbit((s) => s.resetSession);
  if (phase !== "complete" || !complete) return null;

  return (
    <div className="absolute inset-0 z-done flex items-center justify-center bg-ink/70 p-6">
      <div className="w-full max-w-lg text-center">
        <p className="font-display text-5xl font-medium tracking-tight text-paper sm:text-6xl">
          Task completed
        </p>
        <p className="mt-4 text-sm text-mist">{complete.title}</p>
        <p className="mx-auto mt-3 max-w-md text-base leading-relaxed text-paper">
          {complete.summary}
        </p>
        <p className="mt-3 text-xs tabular-nums text-subtle">
          {complete.tries} {complete.tries === 1 ? "path" : "paths"} tried
        </p>
        <div className="mt-8 flex justify-center">
          <Button onClick={resetSession} size="lg">
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
