// POST /api/admin/save?file=leads.json
// Body: { items: [...] }   (whatever shape the admin UI sends)
//
// Validates the filename, then commits the new content to data/<file>
// in this GitHub repo. Vercel auto-redeploys on the commit.
//
// Required env vars (set in Vercel → Settings → Environment Variables):
//   ADMIN_USERNAME      — same as middleware.js auth (already gated by middleware)
//   ADMIN_PASSWORD      — same as middleware.js auth
//   GITHUB_TOKEN        — fine-grained Personal Access Token, "Contents: read & write"
//                         scope on this repo only
//   GITHUB_REPO         — "owner/repo"  e.g. "frvnzisg-ux/sasha-grampone-art"
//   GITHUB_BRANCH       — branch to commit to (default: "main")

const ALLOWED_FILES = new Set([
  "leads.json",
  "clients.json",
  "projects.json",
  "paintings.json",
]);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const file = (req.query?.file || "").toString();
  if (!ALLOWED_FILES.has(file)) {
    return res.status(400).json({ error: "Unknown data file." });
  }

  const repo = process.env.GITHUB_REPO;
  const token = process.env.GITHUB_TOKEN;
  const branch = process.env.GITHUB_BRANCH || "main";

  if (!repo || !token) {
    return res.status(500).json({
      error: "Missing GITHUB_REPO or GITHUB_TOKEN env vars on Vercel.",
    });
  }

  // req.body is auto-parsed by Vercel for application/json
  let payload = req.body;
  if (typeof payload === "string") {
    try {
      payload = JSON.parse(payload);
    } catch {
      return res.status(400).json({ error: "Invalid JSON body." });
    }
  }
  if (!payload || typeof payload !== "object") {
    return res.status(400).json({ error: "Body must be a JSON object." });
  }

  const path = `data/${file}`;
  const ghBase = `https://api.github.com/repos/${repo}/contents/${path}`;
  const headers = {
    Authorization: `Bearer ${token}`,
    "User-Agent": "sasha-grampone-art-admin",
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  // Get current SHA so we can update (rather than create)
  let sha;
  try {
    const head = await fetch(`${ghBase}?ref=${encodeURIComponent(branch)}`, {
      headers,
    });
    if (head.ok) {
      const json = await head.json();
      sha = json.sha;
    } else if (head.status !== 404) {
      const text = await head.text();
      return res
        .status(502)
        .json({ error: `GitHub fetch failed: ${head.status} ${text}` });
    }
  } catch (err) {
    return res.status(502).json({ error: `GitHub fetch error: ${err.message}` });
  }

  // PUT the new content
  const content = Buffer.from(
    JSON.stringify(payload, null, 2) + "\n",
    "utf8"
  ).toString("base64");

  const message = `chore(admin): update ${file}`;
  const body = { message, content, branch };
  if (sha) body.sha = sha;

  try {
    const put = await fetch(ghBase, {
      method: "PUT",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!put.ok) {
      const text = await put.text();
      return res
        .status(502)
        .json({ error: `GitHub commit failed: ${put.status} ${text}` });
    }
    const json = await put.json();
    return res.status(200).json({
      ok: true,
      commit: json.commit?.sha,
      url: json.commit?.html_url,
    });
  } catch (err) {
    return res
      .status(502)
      .json({ error: `GitHub commit error: ${err.message}` });
  }
}
