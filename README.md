# Orbit website

Marketing site + browser demo for **Orbit**, plus download links for the real Windows desktop agent.

## Deploy on Render

1. Unzip this folder.
2. Push **all files** to GitHub so `package.json` is at the **repo root**.
3. On [render.com](https://render.com): **New +** → **Web Service** → connect the repo.
4. Settings:

| Setting | Value |
|---------|--------|
| Root Directory | *(leave empty)* |
| Runtime | Node |
| Build Command | `npm install && npm run build` |
| Start Command | `npm start` |
| Node | 22 |

5. Environment variables:

| Key | Value |
|-----|--------|
| `VITE_AUTH_ENABLED` | `false` |
| `HOST` | `0.0.0.0` |
| `NODE_VERSION` | `22` |

6. Deploy. You get a public URL.

**Do not use `npm ci`.** Use `npm install && npm run build`.

## GitHub push (important)

Upload so the root of the repo looks like:

```text
package.json
vite.config.ts
src/
public/
scripts/
server/
render.yaml
README.md
```

Do **not** put everything inside a subfolder unless you set Root Directory on Render to that folder name.

Skip `.grok` if GitHub blocks it — it is not required for Render.

## Local

```bash
npm install
npm run build
npm start
```

## Windows agent download

The site Download button serves:

- `public/orbit-desktop/Start-Orbit.bat`
- `public/orbit-desktop/Orbit.ps1`

Those run on a real Windows PC (not inside Render).
