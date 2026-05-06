// Shared admin helpers — small enough to live in one file.
// Each admin page imports this via <script src="admin.js"></script>.

const ADMIN = (() => {
  const state = {
    cache: {},  // { 'leads.json': {items: [...]}, ... }
  };

  // ----- Toasts -----
  function toast(msg, type = "") {
    let el = document.querySelector(".toast");
    if (!el) {
      el = document.createElement("div");
      el.className = "toast";
      document.body.appendChild(el);
    }
    el.className = `toast ${type}`;
    el.textContent = msg;
    requestAnimationFrame(() => el.classList.add("show"));
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove("show"), 3500);
  }

  // ----- Data fetch (read JSON files served as static assets) -----
  async function load(file) {
    if (state.cache[file]) return state.cache[file];
    // bust cache so we don't get stale JSON during a deploy window
    const url = `/data/${file}?_=${Date.now()}`;
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(`Failed to load ${file}: ${res.status}`);
      const json = await res.json();
      state.cache[file] = json;
      return json;
    } catch (err) {
      console.error(err);
      // First-load defaults if file missing
      const fallback = { items: [] };
      state.cache[file] = fallback;
      return fallback;
    }
  }

  // ----- Save (commits via /api/admin/save) -----
  async function save(file, data) {
    state.cache[file] = data;
    const res = await fetch(`/api/admin/save?file=${encodeURIComponent(file)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Save failed (${res.status}): ${text}`);
    }
    return res.json();
  }

  // ----- ID generator -----
  function id() {
    return (
      Date.now().toString(36) +
      Math.random().toString(36).slice(2, 8)
    );
  }

  // ----- Date helpers -----
  function fmtDate(iso) {
    if (!iso) return "—";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  }
  function fmtRelative(iso) {
    if (!iso) return "";
    const ms = Date.now() - new Date(iso).getTime();
    if (isNaN(ms)) return "";
    const d = Math.floor(ms / 86400000);
    if (d < 1) return "today";
    if (d === 1) return "yesterday";
    if (d < 30) return `${d} days ago`;
    if (d < 365) return `${Math.floor(d / 30)} mo ago`;
    return `${Math.floor(d / 365)} yr ago`;
  }

  // ----- Drawer helpers -----
  function openDrawer() {
    document.querySelector(".drawer")?.classList.add("open");
    document.querySelector(".drawer-overlay")?.classList.add("open");
  }
  function closeDrawer() {
    document.querySelector(".drawer")?.classList.remove("open");
    document.querySelector(".drawer-overlay")?.classList.remove("open");
  }

  // Close drawer on overlay click and Esc
  document.addEventListener("click", (e) => {
    if (e.target.classList?.contains("drawer-overlay")) closeDrawer();
    if (e.target.classList?.contains("drawer-close")) closeDrawer();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeDrawer();
  });

  // ----- Confirm helper -----
  function confirmDelete(label) {
    return confirm(`Delete ${label}? This cannot be undone (you'd need to restore via Git).`);
  }

  // ----- Logout (clear basic auth) -----
  async function logout() {
    // Hit a 401-returning URL with a bogus user to invalidate the cached creds.
    try {
      await fetch("/api/admin/save?file=__logout__", {
        method: "POST",
        headers: { Authorization: "Basic " + btoa("logout:logout") },
      });
    } catch {}
    location.href = "/";
  }

  // ----- Escape HTML for safe innerHTML -----
  function esc(s) {
    if (s == null) return "";
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  return { toast, load, save, id, fmtDate, fmtRelative, openDrawer, closeDrawer, confirmDelete, logout, esc };
})();
