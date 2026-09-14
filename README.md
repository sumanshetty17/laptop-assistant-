# Orbit

Public website for **Orbit**, a laptop technician that lives on the screen as a silver orb.

Visitors can:

- Read what Orbit does
- Download `Orbit-Setup.html`
- Open the technician, talk or type a problem, and watch it work until **Task completed**

Access is asked once per permission (screen/pointer/settings, and microphone only for Talk).

This is a web app. It runs in the browser. It does not control the physical operating system outside the page.

## Put it on GitHub

1. Unzip this folder.
2. On GitHub, create a new repository (for example `orbit`).
3. Upload every file in this folder into that repository, **or** from a computer:

```bash
cd orbit-website
git init
git add .
git commit -m "Orbit website"
git branch -M main
git remote add origin https://github.com/YOUR_USER/orbit.git
git push -u origin main
```

## Deploy on Render (public URL)

1. Sign in at [render.com](https://render.com).
2. **New +** → **Web Service** → connect the GitHub repo.
3. Use these settings:

| Setting | Value |
|---------|--------|
| Runtime | Node |
| Build command | `npm ci && npm run build` |
| Start command | `npm start` |
| Node version | 22 |

4. Optional environment variable: `XAI_API_KEY` (for smarter diagnosis). Leave empty to use built-in problem matching.
5. Deploy. Render gives you a public URL. Share that link.

The free Render plan may sleep after idle time. The first visit after sleep can take a minute to wake.

## Local run (optional)

```bash
npm install
npm run dev
```

Then `npm run build` and `npm start` to match production.
