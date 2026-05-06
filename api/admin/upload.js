// POST /api/admin/upload
// Body: { filename: "marlowe.jpg", content: "<base64>", contentType: "image/jpeg" }
//
// Commits the binary file to images/portfolio/<safe-filename> in this repo via the
// GitHub Contents API. Returns the public URL the admin UI saves on the painting.
//
// Same env vars as save.js (ADMIN_*, GITHUB_TOKEN, GITHUB_REPO, GITHUB_BRANCH).
// Already gated by /api/admin/* basic-auth middleware.

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
]);
const MAX_BYTES = 4 * 1024 * 1024; // 4MB after client-side downscale; fits Vercel body limit

// Vercel serverless config — bump body size limit so client-side downscaled images fit
export const config = {
  api: {
    bodyParser: { sizeLimit: "5mb" },
  },
};

function slugify(s) {
  return (s || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

function extOf(name, contentType) {
  const m = (name || "").match(/\.([a-z0-9]+)$/i);
  if (m) return m[1].toLowerCase();
  if (contentType === "image/png") return "png";
  if (contentType === "image/webp") return "webp";
  if (contentType === "image/gif") return "gif";
  return "jpg";
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      return res.status(400).json({ error: "Invalid JSON body." });
    }
  }
  if (!body || typeof body !== "object") {
    return res.status(400).json({ error: "Body must be a JSON object." });
  }

  const { filename, content, contentType } = body;
  if (!content || typeof content !== "string") {
    return res.status(400).json({ error: "Missing 'content' (base64 string)." });
  }
  if (contentType && !ALLOWED_TYPES.has(contentType)) {
    return res.status(400).json({ error: `Unsupported content type: ${contentType}` });
  }

  // Approximate decoded size from base64 length (b64 ≈ 4/3 of binary)
  const approxBytes = Math.floor((content.length * 3) / 4);
  if (approxBytes > MAX_BYTES) {
    return res
      .status(413)
      .json({ error: `Image too large after compression (${approxBytes} bytes). Max ~4MB.` });
  }

  const repo = process.env.GITHUB_REPO;
  const token = process.env.GITHUB_TOKEN;
  const branch = process.env.GITHUB_BRANCH || "main";
  if (!repo || !token) {
    return res.status(500).json({
      error: "Missing GITHUB_REPO or GITHUB_TOKEN env vars on Vercel.",
    });
  }

  const slug = slugify(filename ? filename.replace(/\.[^.]+$/, "") : "upload") || "upload";
  const ext = extOf(filename, contentType);
  // Add a short timestamp-based suffix so re-uploads don't collide
  const stamp = Date.now().toString(36).slice(-5);
  const safeName = `${slug}-${stamp}.${ext}`;
  const path = `images/portfolio/${safeName}`;
  const ghBase = `https://api.github.com/repos/${repo}/contents/${path}`;
  const headers = {
    Authorization: `Bearer ${token}`,
    "User-Agent": "sasha-grampone-art-admin",
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json",
  };

  try {
    const put = await fetch(ghBase, {
      method: "PUT",
      headers,
      body: JSON.stringify({
        message: `chore(admin): upload ${safeName}`,
        content,
        branch,
      }),
    });
    if (!put.ok) {
      const text = await put.text();
      return res
        .status(502)
        .json({ error: `GitHub upload failed: ${put.status} ${text}` });
    }
    const json = await put.json();
    return res.status(200).json({
      ok: true,
      url: `/${path}`,
      path,
      filename: safeName,
      commit: json.commit?.sha,
    });
  } catch (err) {
    return res.status(502).json({ error: `Upload error: ${err.message}` });
  }
}
