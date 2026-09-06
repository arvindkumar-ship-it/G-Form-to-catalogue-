# Design Catalogue — Google Form → Live Website

A static site that reads your Google Form responses (via the linked Google Sheet)
and shows every submission as a card — photo(s) on top, name + ID below — in a
theme matching **UI-Verse**. No backend, no database, no build step.

---

## How it works

1. Your Google Form → responses land in a Google Sheet (this part you already have).
2. The Sheet is **published to the web as CSV** (a free, built-in Google Sheets feature).
3. This site fetches that CSV every few seconds and re-renders the catalogue.
4. Image-upload answers arrive as Google Drive links — the site converts them into
   viewable `<img>` URLs automatically.

No servers, no API keys, no cost.

---

## Setup — Step by step

### 1. Publish your Sheet as CSV

1. Open the Google Sheet linked to your Form (the one showing responses).
2. `File → Share → Publish to web`.
3. Under "Link", choose the specific sheet/tab that holds the responses.
4. Under the format dropdown, choose **Comma-separated values (.csv)**.
5. Click **Publish**, confirm, and copy the link it gives you.
   It looks like:
   `https://docs.google.com/spreadsheets/d/e/2PACX-xxxxxxx/pub?output=csv`

> This only publishes that one sheet publicly (read-only) — nobody can edit it,
> and it doesn't touch your Form's edit access.

### 2. Check your column headers

Open the Sheet and note the **exact** header text for:
- Name column (e.g. `Name`)
- ID column (e.g. `ID` or `Roll Number`)
- Each photo/image upload column (Forms usually names these after the question,
  e.g. `Design Photo 1`, `Design Photo 2`)

### 3. Make sure image answers are viewable

Google Forms stores uploaded files in a Drive folder tied to the form. For the
site to display them:
- Open that Drive folder (Form → Responses → the folder-shaped icon, or check
  the linked Sheet's owner Drive).
- Select all files → right-click → **Share** → set to **"Anyone with the link
  → Viewer"**.
- This is a one-time setting for the folder; new files uploaded into it usually
  inherit the same sharing, but double check after the first few real submissions.

### 4. Edit `config.js`

Open `config.js` in this folder and fill in:

```js
const CONFIG = {
  SHEET_CSV_URL: "PASTE THE LINK FROM STEP 1 HERE",
  COLUMNS: {
    name: "Name",              // <- your exact column header
    id: "ID",                  // <- your exact column header
    images: ["Design Photo 1", "Design Photo 2"], // <- your exact column headers
  },
  POLL_INTERVAL_MS: 10000,     // how often to check for new submissions
};
```

That's the only file you need to touch. No other code needs changing.

### 5. Test it locally

You can't just double-click `index.html` (browsers block `fetch` on local files).
Run a tiny local server instead:

```bash
cd catalogue-site
python3 -m http.server 8080
```

Then open `http://localhost:8080` in your browser.

---

## Deployment

Any static hosting works. Two easy, free options:

### Option A — Vercel (recommended, fastest)

1. Create a free account at vercel.com.
2. Install the CLI: `npm i -g vercel`
3. Inside the `catalogue-site` folder, run:
   ```bash
   vercel --prod
   ```
4. Follow the prompts (accept defaults — it's a static site, no build command
   needed). You'll get a live URL in under a minute.

### Option B — Netlify (drag & drop)

1. Go to app.netlify.com/drop
2. Drag the entire `catalogue-site` folder into the browser window.
3. Done — you get a live URL instantly. You can rename the site or attach a
   custom domain from the Netlify dashboard.

### Option C — GitHub Pages

1. Push this folder to a GitHub repo.
2. Repo → Settings → Pages → Source: deploy from branch → pick `main` and
   root folder.
3. Your site goes live at `https://yourusername.github.io/reponame/`.

No environment variables, no server, no database — it's just static files
talking to a public Google Sheet CSV link.

---

## Speed / "how live is live"

Google's "Publish to web" CSV is cached by Google for roughly 1–5 minutes
before it reflects new rows. For most registration/catalogue use-cases this
is fine. If you need faster updates (a few seconds), the next step is a
Google Apps Script `doGet` endpoint reading the Sheet live via
`SpreadsheetApp` instead of the published CSV — ask if you want that version,
it's a small change to `config.js` + `app.js` only.

---

## File structure

```
catalogue-site/
├── index.html      → page structure, nav, search bar, grid
├── style.css        → UI-Verse theme (colors, fonts, cards, glass nav)
├── config.js         → YOUR settings — sheet URL, column names, poll speed
├── app.js            → fetch + parse + render + polling logic
├── assets/
│   ├── green-forest.png   → background (from UI-Verse)
│   └── favicon.svg
└── README.md          → this file
```

## Customizing the look

All colors/fonts live at the top of `style.css` as CSS variables:

```css
--primary: #291c0e;
--secondary: #714012;
--accent: #b28561;
--light-bg: #f5e6d3;
```

Swap `assets/green-forest.png` for a different background image (keep the
same filename, or update the `<img src>` in `index.html`).
