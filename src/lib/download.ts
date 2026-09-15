export function downloadOrbitSetup() {
  const origin = window.location.origin;
  const html = installerHtml(origin);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "Orbit-Setup.html";
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function installerHtml(origin: string) {
  const app = `${origin}/app?installed=1`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Install Orbit</title>
  <style>
    :root { color-scheme: dark; }
    * { box-sizing: border-box; }
    html, body { margin: 0; min-height: 100%; background: #09090b; color: #f4f4f5;
      font-family: "Segoe UI", system-ui, sans-serif; }
    main { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 32px 20px; }
    .card { width: 100%; max-width: 440px; }
    .kicker { font-size: 12px; letter-spacing: 0.2em; text-transform: uppercase; color: #a1a1aa; }
    h1 { font-family: Georgia, "Times New Roman", serif; font-size: 48px; font-weight: 500;
      letter-spacing: -0.03em; margin: 12px 0 0; }
    p { color: #a1a1aa; line-height: 1.6; font-size: 16px; }
    ol { color: #a1a1aa; line-height: 1.7; padding-left: 18px; }
    a.btn { display: inline-flex; align-items: center; justify-content: center; min-height: 48px;
      padding: 0 20px; background: #c8ccd4; color: #0a0a0b; text-decoration: none;
      border-radius: 8px; font-weight: 600; font-size: 15px; }
    a.btn:active { transform: scale(0.96); }
    .note { font-size: 13px; color: #71717a; margin-top: 24px; }
  </style>
</head>
<body>
  <main>
    <div class="card">
      <p class="kicker">Laptop technician</p>
      <h1>Orbit</h1>
      <p>Install Orbit on this laptop. The orb stays on the screen. Describe a problem by voice or text — Orbit takes the cursor and works until the job is done.</p>
      <p>Access is asked once. After you allow it, Orbit will not ask again for the same permission.</p>
      <ol>
        <li>Click Install below.</li>
        <li>Keep the Orbit window open (or pin the tab).</li>
        <li>Use the silver orb for every new problem.</li>
      </ol>
      <p><a class="btn" href="${app}">Install Orbit</a></p>
      <p class="note">Orbit runs as a laptop session in your browser. Pin the tab or keep this window open so the orb stays available.</p>
    </div>
  </main>
</body>
</html>`;
}
