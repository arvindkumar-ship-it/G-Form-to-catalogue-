// ============================================================
// CONFIG — edit this file to point at your own Google Sheet.
// No build step needed, just edit and save.
// ============================================================

const CONFIG = {
  // 1. Publish your Google Sheet to the web as CSV:
  //    File → Share → Publish to web → choose the response sheet/tab → CSV → Publish
  //    Paste the link it gives you below.
  SHEET_CSV_URL:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ3xze28qUO-BIUPrazSsdc37p2qkNeWGSYSjWLbuq1lc9PoH9gsuHhhlpc4kgJW6oKJwvZWKm9mb65/pub?gid=583690830&single=true&output=csv",

  // 2. Exact column headers as they appear in your Google Sheet
  //    (these come from your Google Form question titles).
  COLUMNS: {
    name: "Name",
    id: "Roll No.",
    images: ["Upload Your Login Screen", "Upload Your Home Screen"],
  },

  // Label shown before the "id" value on each card (e.g. "Roll No.: 12345").
  ID_LABEL: "Roll No.",

  // 4. Image proxy — fixes flaky/broken Drive thumbnails (recommended).
  //    See apps-script-image-proxy.gs for the 5-minute setup.
  //    Leave as "" to fall back to direct Drive hotlinking (less reliable).
  IMAGE_PROXY_URL: "https://script.google.com/macros/s/AKfycbzhpyzU2DNciJCYqu4fMA11-bClgFz90ToejAoiI5CYq5YPG_KA5HfTPAnYmlENrseBlw/exec",

  // 3. How often to re-check the sheet for new submissions (in milliseconds).
  //    10000 = 10 seconds. Lower = more "live", but more requests to Google.
  POLL_INTERVAL_MS: 10000,
};