# Menú del Comedor

A static React app (Vite + Tailwind CSS v4) that shows the company cafeteria's daily menu.
It needs no backend: everything is read from `public/menu.json`.

- Four options per day: **Menú Principal**, **Menú Dieta / Saludable**, **Opcional 1** and **Opcional 2**
- Shows only today's menu (Mon–Fri). On weekends it shows a "closed" message.
- Every dish shows a fixed line: "Ensaladas y postres a elección"
- A hidden admin editor protected by a password, with localStorage preview and JSON import/export

---

## Project structure

```
├── index.html
├── package.json
├── vite.config.js
├── netlify.toml / vercel.json          # deploy config (no-cache for menu.json)
├── .github/workflows/deploy-pages.yml  # GitHub Pages CI
├── .env.example                        # admin password hash
├── scripts/hash-password.js            # generates the hash
├── public/
│   ├── menu.json                       # ← THE DATA. Replace this file to publish a new menu
│   ├── logo.png                        # company logo (white artwork, shown on a dark tile)
│   └── favicon.png
└── src/
    ├── main.jsx
    ├── App.jsx                         # layout, day selection, loading/error states
    ├── index.css                       # Tailwind + theme (Inter / Fraunces)
    ├── hooks/
    │   ├── useMenu.js                  # fetches menu.json, overlays localStorage preview
    │   └── useLongPress.js
    ├── lib/
    │   ├── constants.js                # days, categories
    │   ├── date.js                     # es-AR date formatting, work-week helpers
    │   ├── menuSchema.js               # normalize + validate menu data
    │   ├── auth.js                     # SHA-256 password check
    │   └── storage.js                  # safe storage access, JSON download
    └── components/
        ├── Header.jsx  Logo.jsx  MenuCard.jsx
        ├── Notice.jsx  Footer.jsx  Icons.jsx
        ├── AdminModal.jsx              # password gate + menu editor
        └── admin/ Dialog.jsx  ItemEditor.jsx  Field.jsx
```

## Run locally

Requirements: Node.js 20+.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build in dist/
npm run preview    # serve the built dist/ locally
```

## Admin mode

There are two ways to open the editor:

1. Click the small, faded **pencil icon** at the bottom-right of the footer.
2. **Hold the logo** for about 1.5 seconds. This works with touch and with a mouse.

The default password is **`comedor2026`**. Change it before you deploy:

```bash
npm run hash-password -- "my-new-password"
# → VITE_ADMIN_PASSWORD_HASH=…   put this line in a .env file (or in your host's env vars)
```

> ⚠️ The password only keeps casual visitors out of the editor. It is not real security: anything shipped to the
> browser can be read by anyone. Visitors still can't change the public menu, because the only way to publish
> is to replace `menu.json` on the server.

### Editor actions

| Button | What it does |
|---|---|
| **Publicar para todos** | Commits the menu to `public/menu.json` in the repository through the GitHub API. The Pages workflow redeploys and everyone sees it in 1–2 minutes. Needs a GitHub token (see below). |
| **Guardar vista previa** | Saves your edits in this browser's `localStorage`. Only this browser sees them, and the footer shows a "Vista previa local" badge. |
| **Exportar menu.json** | Downloads the edited menu as `menu.json`. |
| **Importar** | Loads a `menu.json` into the editor. The file is validated first. Click *Guardar* to apply it. |
| **Restaurar publicado** | Deletes the local copy and goes back to the published `menu.json`. |

### GitHub token for "Publicar para todos"

Create it once, signed in as the account that owns the repository:

1. Go to *Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token*.
2. *Repository access*: **Only select repositories** → this repository.
3. *Permissions → Repository permissions → Contents*: **Read and write**.
4. Copy the token and paste it in the editor, under **Publicación en GitHub**.

The token is stored only in that browser's `localStorage`; it is never part of the build. Anyone who has it can
change the repository's files, so only paste it on the administrator's own computer. To revoke it, delete it on GitHub.

### Weekly update workflow (for the cafeteria administrator)

With the token loaded, open the editor, edit the dishes and click **Publicar para todos**. The local preview badge
goes away by itself once the site serves the new menu.

Without a token you can publish by hand:

1. Open the site, open the editor and edit the week's dishes.
2. Click **Guardar vista previa** and check how the menu looks.
3. Click **Exportar menu.json**.
4. Replace `public/menu.json` in the repository with the downloaded file and commit it. If you deploy by hand,
   replace `menu.json` at the root of the published site (or bucket) instead. You don't need to rebuild.
5. Optional: click **Restaurar publicado** so your browser shows the published file again.

## `menu.json` format

```jsonc
{
  "version": 1,
  "updatedAt": "2026-10-26T09:00:00.000Z",
  "cafeteria": { "name": "…", "hours": "12:30 a 13:00 y 13:30 a 14:00", "location": "", "notice": "" },
  "days": {
    "monday": {
      "note": "",                         // optional banner for that day (e.g. "Feriado")
      "items": {
        "principal": {
          "name": "Milanesa de ternera al horno",
          "description": "Con puré de papas"
        },
        "dieta": { … }, "opcional1": { … }, "opcional2": { … }
      }
    },
    "tuesday": { … }, "wednesday": { … }, "thursday": { … }, "friday": { … }
  }
}
```

The menu is a weekly template keyed by weekday, so the same file is shown every week until you replace it.
Missing days or options are filled in automatically and show as "Sin opción cargada".

## Logo

The logo is `public/logo.png` (white artwork on a transparent background, shown on a dark tile in the header).
To change it, replace that file. You can also add `public/logo.svg`, which takes priority. The favicon is `public/favicon.png`.

## Deploy

All three hosts serve the static `dist/` folder.

### Vercel
1. Import the repository at vercel.com. The framework is detected as **Vite**.
2. Add the environment variable `VITE_ADMIN_PASSWORD_HASH`.
3. Deploy. `vercel.json` already makes `menu.json` revalidate on each load.

### Netlify
1. Add a new site from Git. `netlify.toml` already sets `npm run build` → `dist`.
2. Under *Site settings → Environment variables*, add `VITE_ADMIN_PASSWORD_HASH`.
3. Deploy.

### GitHub Pages
1. Push the project to a repository on the `main` branch.
2. Under *Settings → Pages → Source*, choose **GitHub Actions**.
3. Under *Settings → Secrets and variables → Actions*, add the secret `VITE_ADMIN_PASSWORD_HASH`.
4. Every push to `main` runs `.github/workflows/deploy-pages.yml`. That workflow builds the site with
   `BASE_PATH=/<repo>/`, so all asset and `menu.json` URLs resolve under the repository path.

### Any static host / bucket (S3, Azure Blob, nginx…)
Run `npm run build` and upload `dist/`. If the site isn't served at the domain root, build with
`BASE_PATH=/sub/path/ npm run build`. To update the menu later, overwrite `menu.json` in the bucket.
Setting `Cache-Control: no-cache` on that file is recommended.
