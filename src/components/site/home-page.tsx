import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Check,
  Download,
  Mic,
  MousePointer2,
  Shield,
  Type,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { downloadOrbitSetup } from "@/lib/download";

const FEATURES = [
  {
    title: "Always on the screen",
    body: "A silver orb stays visible. Click it whenever something on the laptop goes wrong.",
  },
  {
    title: "Talk or Text",
    body: "Say the problem out loud, or type it. Orbit reads the issue and decides what to do.",
  },
  {
    title: "It takes the cursor",
    body: "Orbit opens Settings, Device Manager, and Task Manager, clicks the right controls, and keeps going if the first path fails.",
  },
  {
    title: "Permission once",
    body: "Access is requested only for what is needed, and only the first time. After that, Orbit does not ask again.",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Download and install",
    body: "Save Orbit-Setup.html, open it from your Downloads folder, and click Install.",
  },
  {
    n: "02",
    title: "Allow access once",
    body: "The first job asks for screen, pointer, and settings. Talk also asks for the microphone. Never the same prompt twice.",
  },
  {
    n: "03",
    title: "Describe the problem",
    body: "Wi-Fi, no sound, a slow machine, a printer, the camera — speak it or type it.",
  },
  {
    n: "04",
    title: "Task completed",
    body: "Orbit works the problem through other paths if needed, then shows Task completed.",
  },
];

export function HomePage() {
  const [downloaded, setDownloaded] = useState(false);

  function onDownload() {
    downloadOrbitSetup();
    setDownloaded(true);
  }

  return (
    <div className="min-h-dvh bg-ink text-paper">
      <header className="flex items-center gap-3 px-5 py-4 sm:px-10">
        <p className="font-display text-xl font-medium tracking-tight">Orbit</p>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/app">Open</Link>
          </Button>
          <Button size="sm" onClick={onDownload}>
            <Download className="size-4" />
            Download
          </Button>
        </div>
      </header>

      <section className="relative overflow-hidden px-5 pb-16 pt-10 sm:px-10 sm:pb-24 sm:pt-16">
        <img
          src="/wallpaper.jpg"
          alt=""
          className="pointer-events-none absolute inset-0 size-full object-cover opacity-40 outline outline-1 -outline-offset-1 outline-paper/10"
        />
        <div className="pointer-events-none absolute inset-0 bg-ink/70" />
        <div className="relative mx-auto max-w-3xl">
          <p className="text-xs uppercase tracking-widest text-mist">
            Laptop technician
          </p>
          <h1 className="mt-4 font-display text-5xl font-medium tracking-tight text-balance sm:text-7xl">
            Orbit
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-mist">
            Software that lives on the laptop screen. You describe the problem.
            Orbit takes the cursor and works until it is done.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" onClick={onDownload}>
              <Download className="size-4" />
              Download for laptop
            </Button>
            <Button size="lg" variant="secondary" asChild>
              <Link to="/app">Use in the browser</Link>
            </Button>
          </div>
          {downloaded ? (
            <p className="mt-4 max-w-md text-sm leading-relaxed text-ok">
              Saved as Orbit-Setup.html in your Downloads folder. Open that file,
              then click Install. Keep the window open so the orb stays on screen.
            </p>
          ) : (
            <p className="mt-4 max-w-md text-sm leading-relaxed text-subtle">
              Free to use. No account. Works on Windows, Mac, and Linux laptops
              through the browser after install.
            </p>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-16 sm:px-10">
        <h2 className="font-display text-3xl font-medium tracking-tight">
          What Orbit does
        </h2>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-mist">
          Everyday laptop trouble — connections, sound, speed, printers, heat,
          storage, battery, updates, the camera. Instead of searching for steps,
          you tell Orbit once and it drives the machine.
        </p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {FEATURES.map((item) => (
            <article
              key={item.title}
              className="rounded-xl bg-panel p-5 shadow-border"
            >
              <h3 className="text-base font-medium text-paper">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-mist">{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-paper/10 bg-panel px-5 py-16 sm:px-10">
        <div className="mx-auto max-w-5xl">
          <h2 className="font-display text-3xl font-medium tracking-tight">
            How to use it
          </h2>
          <ol className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step) => (
              <li key={step.n}>
                <p className="text-xs tabular-nums tracking-widest text-subtle">
                  {step.n}
                </p>
                <h3 className="mt-2 text-base font-medium">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-mist">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-16 sm:px-10">
        <h2 className="font-display text-3xl font-medium tracking-tight">
          Access, asked only when needed
        </h2>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-mist">
          Orbit does not interrupt every task with the same dialog. The first
          time a kind of access is required, you allow it. After that it is
          remembered on this laptop.
        </p>
        <ul className="mt-8 max-w-xl space-y-4">
          <PermRow
            icon={MousePointer2}
            title="Screen, pointer, and settings"
            body="Asked once, before the first repair. Used for every later job."
          />
          <PermRow
            icon={Mic}
            title="Microphone"
            body="Asked only if you choose Talk, and only the first time."
          />
          <PermRow
            icon={Type}
            title="Text"
            body="No extra permission. Type the problem and send."
          />
          <PermRow
            icon={Shield}
            title="Already allowed"
            body="If Orbit already has that access, it will not ask again."
          />
        </ul>
      </section>

      <section className="px-5 pb-20 sm:px-10">
        <div className="mx-auto max-w-5xl rounded-2xl bg-panel px-6 py-10 shadow-border sm:px-10">
          <h2 className="font-display text-3xl font-medium tracking-tight">
            Put Orbit on this laptop
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-mist">
            Download the installer, open it, click Install. The orb stays on
            the session. Describe problems as they come — Orbit works them
            through to Task completed.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button size="lg" onClick={onDownload}>
              <Download className="size-4" />
              Download Orbit
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/app">Open without downloading</Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-paper/10 px-5 py-8 text-sm text-subtle sm:px-10">
        <p>Orbit — laptop technician. Public software for any laptop browser.</p>
      </footer>
    </div>
  );
}

function PermRow({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof Check;
  title: string;
  body: string;
}) {
  return (
    <li className="flex gap-3">
      <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-md bg-raise">
        <Icon className="size-4 text-mist" />
      </span>
      <span>
        <span className="block text-sm text-paper">{title}</span>
        <span className="block text-sm leading-relaxed text-mist">{body}</span>
      </span>
    </li>
  );
}
