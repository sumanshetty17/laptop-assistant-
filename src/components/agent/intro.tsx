import { Button } from "@/components/ui/button";
import { useOrbit } from "@/lib/store";

export function Intro() {
  const phase = useOrbit((s) => s.phase);
  const setIntroSeen = useOrbit((s) => s.setIntroSeen);
  if (phase !== "intro") return null;

  return (
    <div className="absolute inset-0 z-intro flex items-center justify-center bg-ink p-6">
      <div className="w-full max-w-lg">
        <p className="text-xs uppercase tracking-widest text-mist">Laptop technician</p>
        <h1 className="mt-3 font-display text-5xl font-medium tracking-tight text-paper sm:text-6xl">
          Orbit
        </h1>
        <p className="mt-5 max-w-md text-base leading-relaxed text-mist">
          The orb stays on this screen. Describe a problem by voice or text.
          Access is asked only when needed, and only the first time. After you
          allow it, Orbit will not ask again for the same permission.
        </p>
        <div className="mt-8">
          <Button
            size="lg"
            onClick={() => {
              try {
                localStorage.setItem("orbit-intro", "1");
              } catch {
                /* ignore */
              }
              setIntroSeen();
            }}
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
}
