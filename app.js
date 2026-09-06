// ============================================================
// Google Sheet → Catalogue renderer
// No backend, no build step. Reads config.js and does the rest.
// ============================================================

const gridEl = document.getElementById("grid");
const stateEl = document.getElementById("stateMessage");
const countPill = document.getElementById("countPill");
const searchInput = document.getElementById("searchInput");
const liveDot = document.querySelector(".live-dot");
const liveStatusText = document.getElementById("liveStatusText");

const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightboxImg");
const lightboxClose = document.getElementById("lightboxClose");

let allEntries = [];
let pollTimer = null;

// ---------- Google Drive link → embeddable image URL ----------
function driveIdFromUrl(url) {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  // Matches /d/FILE_ID/, id=FILE_ID, or a bare long Drive-style ID
  const patterns = [/\/d\/([-\w]{20,})/, /id=([-\w]{20,})/, /^([-\w]{20,})$/];

  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match) return match[1];
  }
  return null;
}

// ---------- CSV fetch + parse ----------
async function fetchSheetData() {
  const bustCache = CONFIG.SHEET_CSV_URL.includes("?") ? "&" : "?";
  const url = `${CONFIG.SHEET_CSV_URL}${bustCache}t=${Date.now()}`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Sheet fetch failed (${res.status})`);
  const csvText = await res.text();

  const parsed = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  if (parsed.errors && parsed.errors.length) {
    console.warn("CSV parse warnings:", parsed.errors);
  }

  return parsed.data;
}

function rowsToEntries(rows) {
  return rows
    .map((row, index) => {
      const name = (row[CONFIG.COLUMNS.name] || "").trim();
      const id = (row[CONFIG.COLUMNS.id] || "").trim();
      const images = CONFIG.COLUMNS.images
        .map((col) => row[col])
        .filter(Boolean);

      return { rowIndex: index, name, id, images };
    })
    .filter((entry) => entry.name || entry.id || entry.images.length > 0);
}

// ---------- Rendering ----------
function renderEntries(entries) {
  gridEl.innerHTML = "";

  if (entries.length === 0) {
    stateEl.textContent = "No submissions match yet.";
    stateEl.classList.remove("hidden");
    countPill.textContent = "0 entries";
    return;
  }

  stateEl.classList.add("hidden");
  countPill.textContent = `${entries.length} entr${entries.length === 1 ? "y" : "ies"}`;

  const fragment = document.createDocumentFragment();
  entries.forEach((entry) => fragment.appendChild(buildCard(entry)));
  gridEl.appendChild(fragment);
}

function buildCard(entry) {
  const card = document.createElement("div");
  card.className = "card";

  const imagesWrap = document.createElement("div");
  imagesWrap.className = "card-images" + (entry.images.length <= 1 ? " single" : "");

  if (entry.images.length === 0) {
    imagesWrap.appendChild(buildImageSlot(null));
  } else {
    entry.images.forEach((rawUrl) => imagesWrap.appendChild(buildImageSlot(rawUrl)));
  }

  const body = document.createElement("div");
  body.className = "card-body";

  const nameEl = document.createElement("div");
  nameEl.className = "card-name";
  nameEl.textContent = entry.name || "Unnamed";

  const idEl = document.createElement("div");
  idEl.className = "card-id";
  idEl.textContent = entry.id ? `${CONFIG.ID_LABEL || "ID"}: ${entry.id}` : "";

  body.appendChild(nameEl);
  body.appendChild(idEl);

  card.appendChild(imagesWrap);
  card.appendChild(body);
  return card;
}

function buildImageSlot(rawUrl) {
  const wrap = document.createElement("div");
  wrap.className = "card-image-wrap";

  const id = driveIdFromUrl(rawUrl);

  if (!id && !rawUrl) {
    wrap.innerHTML = '<div class="card-image-placeholder">No image</div>';
    return wrap;
  }

  const img = document.createElement("img");
  img.loading = "lazy";
  img.alt = "Submitted design";
  wrap.appendChild(img);
  wrap.addEventListener("click", () => {
    if (img.src) openLightbox(img.src);
  });

  loadImageIntoSlot(wrap, img, id, rawUrl);

  return wrap;
}

async function loadImageIntoSlot(wrap, img, id, rawUrl) {
  // Preferred: fetch a base64 data URL from our Apps Script proxy.
  // This is fetched explicitly (not set directly as <img src>), which
  // avoids Chrome's ORB blocking cross-origin Drive/Script responses.
  if (id && CONFIG.IMAGE_PROXY_URL) {
    try {
      const res = await fetch(`${CONFIG.IMAGE_PROXY_URL}?id=${encodeURIComponent(id)}`);
      const dataUrl = await res.text();
      if (dataUrl && dataUrl.startsWith("data:")) {
        img.src = dataUrl;
        return;
      }
    } catch (err) {
      console.warn("Image proxy fetch failed for", id, err);
    }
  }

  // Fallback: direct hotlink attempts (may also be blocked by the browser).
  const fallbacks = id
    ? [`https://drive.google.com/thumbnail?id=${id}&sz=w1000`, `https://lh3.googleusercontent.com/d/${id}=w1000`]
    : rawUrl
    ? [rawUrl]
    : [];

  let attempt = 0;
  function tryNext() {
    if (attempt >= fallbacks.length) {
      wrap.innerHTML = '<div class="card-image-placeholder">Image unavailable</div>';
      return;
    }
    img.src = fallbacks[attempt];
    attempt += 1;
  }
  img.onerror = tryNext;
  tryNext();
}

// ---------- Lightbox ----------
function openLightbox(src) {
  lightboxImg.src = src;
  lightbox.classList.remove("hidden");
}

function closeLightbox() {
  lightbox.classList.add("hidden");
  lightboxImg.src = "";
}

lightboxClose.addEventListener("click", closeLightbox);
lightbox.addEventListener("click", (e) => {
  if (e.target === lightbox) closeLightbox();
});

// ---------- Search ----------
searchInput.addEventListener("input", () => {
  const q = searchInput.value.trim().toLowerCase();
  if (!q) {
    renderEntries(allEntries);
    return;
  }
  const filtered = allEntries.filter(
    (e) => e.name.toLowerCase().includes(q) || e.id.toLowerCase().includes(q)
  );
  renderEntries(filtered);
});

// ---------- Polling loop ----------
async function refresh() {
  try {
    const rows = await fetchSheetData();
    allEntries = rowsToEntries(rows);

    const q = searchInput.value.trim().toLowerCase();
    const toShow = q
      ? allEntries.filter(
          (e) => e.name.toLowerCase().includes(q) || e.id.toLowerCase().includes(q)
        )
      : allEntries;

    renderEntries(toShow);
    setLiveStatus(true);
  } catch (err) {
    console.error(err);
    setLiveStatus(false);
    if (allEntries.length === 0) {
      stateEl.textContent =
        "Could not load the sheet. Check SHEET_CSV_URL in config.js and make sure it's published to the web.";
      stateEl.classList.remove("hidden");
    }
  }
}

function setLiveStatus(ok) {
  liveDot.classList.toggle("offline", !ok);
  liveStatusText.textContent = ok ? "Live" : "Reconnecting…";
}

function start() {
  refresh();
  pollTimer = setInterval(refresh, CONFIG.POLL_INTERVAL_MS);
}

start();