# Sasha Grampone Art

Portfolio site for Sasha Grampone — fine portrait artist working in oil and graphite. Plain static HTML/CSS/JS, no framework, no build step required. Deploys to Vercel from `main` automatically.

**Live preview (local):** `http://localhost:8080` (see [Run locally](#run-locally))
**Production:** *connect via Vercel — see [Deploy](#deploy) below*

---

## Pages

| File | Purpose |
| --- | --- |
| [`index.html`](index.html) | Hero, intro, 3-stage process, video, testimonial, stats, press, Instagram, CTA |
| [`portfolio.html`](portfolio.html) | Filterable gallery with lightbox + custom "View" cursor |
| [`commissions.html`](commissions.html) | Process, before/after slider, pricing, FAQ, inquiry form |
| [`originals.html`](originals.html) | Available + sold originals with sticky "Inquire" bar |
| [`about.html`](about.html) | Bio with drop cap, studio photo, testimonials |
| [`contact.html`](contact.html) | Contact form + studio info |

## Project structure

```
.
├── index.html, portfolio.html, ...   # Pages (CSS/JS inlined — see "Why inlined")
├── css/styles.css                    # Source-of-truth stylesheet
├── js/main.js                        # Source-of-truth JavaScript
├── images/                           # Logos, favicons, OG image
│   ├── favicon.svg                   # Modern browsers
│   ├── favicon.ico, favicon-16/32.png
│   ├── apple-touch-icon.png          # iOS home screen
│   ├── og-image.png                  # Social share preview (1200×630)
│   ├── raw/                          # Drop original photos here (gitignored)
│   └── portfolio/                    # Optimized output (created by tools/optimize-images.py)
├── tools/
│   ├── inline.py                     # Re-inlines css/styles.css + js/main.js into HTML
│   └── optimize-images.py            # Batch resize + compress raw paintings
├── .github/workflows/inline.yml      # Auto-runs tools/inline.py on push to css/js
├── vercel.json                       # cleanUrls + cache headers
└── .gitignore
```

## Run locally

Any static file server works. Easiest with Python:

```bash
python -m http.server 8080
```

Then open `http://localhost:8080`.

## Editing styles or scripts

The HTML files contain inline `<style>` and `<script>` blocks for portability. **Don't edit those by hand** — edit the source files instead:

1. Edit [`css/styles.css`](css/styles.css) or [`js/main.js`](js/main.js)
2. Run the inliner to update all six HTML files:
   ```bash
   python tools/inline.py
   ```
3. Commit and push.

A GitHub Action ([.github/workflows/inline.yml](.github/workflows/inline.yml)) will also run the inliner automatically whenever you push changes to `css/styles.css` or `js/main.js` — it commits the regenerated HTML back to the branch on your behalf, so even if you forget step 2, the deployed site stays in sync.

### Why inlined?

Each page is a single self-contained file (one HTTP request, no separate stylesheet load), which makes it trivial to share via email or paste into any preview tool. The build step is a 1-second Python script — no Node/npm/webpack required.

## Adding new paintings

1. Drop original photos into `images/raw/`. Filename = the painting's slug (e.g. `marlowe.jpg`).
2. Run the optimizer:
   ```bash
   python tools/optimize-images.py
   ```
3. Three sizes (800/1200/1600 px) and WebP variants land in `images/portfolio/`.
4. Use them in HTML with responsive `srcset`:
   ```html
   <img src="images/portfolio/marlowe-1200.jpg"
        srcset="images/portfolio/marlowe-800.jpg 800w,
                images/portfolio/marlowe-1200.jpg 1200w,
                images/portfolio/marlowe-1600.jpg 1600w"
        sizes="(min-width: 880px) 50vw, 100vw"
        alt="Marlowe — golden retriever portrait" loading="lazy" />
   ```

The optimizer skips files whose hash hasn't changed, so re-running is fast.

## Forms (Formspree)

Both the [Commissions](commissions.html) and [Contact](contact.html) forms are wired to Formspree. Until you replace the placeholder, they fall back to a friendly "thank you" message without actually sending anything.

To make them live:

1. Sign up free at [formspree.io](https://formspree.io)
2. Create one form for "Commissions" and one for "Contact"; copy each form ID (looks like `xpwagk29`)
3. In `commissions.html`, find `YOUR_FORM_ID` and replace it with the Commissions form ID
4. In `contact.html`, find `YOUR_FORM_ID` and replace it with the Contact form ID
5. Commit and push

After replacement, submissions go straight to Sasha's inbox; Formspree handles spam filtering (the hidden `_gotcha` honeypot is already in place).

## Deploy (Vercel)

This repo is ready to deploy as-is — no build step, no environment variables required.

1. Go to [vercel.com/new](https://vercel.com/new) and sign in with GitHub
2. Click **Import** next to `sasha-grampone-art`
3. Leave all settings at defaults (Framework: *Other*, Build Command: empty, Output: empty)
4. Click **Deploy**

Every push to `main` triggers a production deploy. Branch pushes get unique preview URLs.

### Custom domain

Once you own a domain (e.g. `sashagramponeart.com`):

1. Vercel → Project → **Settings** → **Domains** → add your domain
2. Update the DNS records as Vercel instructs (usually a single `CNAME` or `A` record)
3. Find-and-replace `sashagramponeart.com` across the HTML files if you used a different domain — this updates the OG/Twitter share URLs

## Admin / CRM (`/admin`)

A password-gated admin area lives at `/admin/` with a small CRM for tracking leads, clients, and projects.

**How it works**
- Vercel Edge Middleware ([`middleware.js`](middleware.js)) gates every URL under `/admin/*` and `/api/admin/*` with HTTP Basic Auth — when you visit, the browser pops up its native username/password dialog.
- Data lives in [`data/leads.json`](data/leads.json), [`data/clients.json`](data/clients.json), and [`data/projects.json`](data/projects.json) — plain JSON files in this repo.
- Saving in admin calls `/api/admin/save`, which commits the new JSON to GitHub via the GitHub API. Vercel auto-redeploys (~30 sec) and the data is live.
- Every change shows up in the Git history as a commit — you have a free audit log.

**Pages**
- `/admin/` — dashboard with counts and recent activity
- `/admin/leads.html` — inquiries / prospects with status pipeline (New → Contacted → Quoted → Won / Lost)
- `/admin/clients.html` — full client profiles (name, email, phone, address, Instagram, notes) and linked projects
- `/admin/projects.html` — active commissions with stages (Sketch → Underpainting → Detail → Shipped → Done), pricing, deposit tracking

### Setup (one-time)

In Vercel → Project → Settings → **Environment Variables**, set four values for **Production** (and optionally Preview):

| Variable | What | Example |
| --- | --- | --- |
| `ADMIN_USERNAME` | Username you'll type at the login dialog | `sasha` |
| `ADMIN_PASSWORD` | Strong password (use a password manager) | `(at least 16 random chars)` |
| `GITHUB_TOKEN` | A fine-grained GitHub Personal Access Token | `github_pat_...` |
| `GITHUB_REPO` | Repo to commit data to | `frvnzisg-ux/sasha-grampone-art` |

**Generating the GitHub token:**

1. Go to **https://github.com/settings/personal-access-tokens/new**
2. **Token name:** `Sasha Grampone Admin`
3. **Resource owner:** your username
4. **Expiration:** 1 year (or your preference)
5. **Repository access:** *Only select repositories* → `sasha-grampone-art`
6. **Repository permissions** → **Contents: Read and write**
7. Generate, copy the token (starts with `github_pat_`), paste into the Vercel env var

After setting the env vars, **redeploy** (Vercel → Deployments → ⋯ → Redeploy) so the new env vars take effect.

### Using the admin

1. Visit **`https://your-vercel-url.vercel.app/admin/`**
2. Browser shows a Sign In dialog → enter your `ADMIN_USERNAME` + `ADMIN_PASSWORD`
3. Add leads, clients, projects via the "+ Add" buttons
4. Each save triggers a commit + redeploy (~30 sec until the live site reflects the change)

**Sign out** = use the link in the sidebar, or close all browser windows for the site (browsers cache Basic Auth credentials per session).

### Security notes

- Vercel always serves over HTTPS, so Basic Auth credentials are encrypted in transit.
- The middleware is enforced on the **Edge Runtime** (Vercel's CDN tier), which means even API routes are protected before they execute.
- The GitHub token only has `Contents: read/write` scope on this single repo — it can't touch your other repos or your account.
- **Use a unique strong password** for `ADMIN_PASSWORD`. There's no rate-limiting on Basic Auth out of the box.
- If you need stricter security later, swap to a session-based login flow with rate-limiting (a few hours of work).

## Tech notes

- No JavaScript framework. Vanilla DOM, IntersectionObserver, FormData, native `<details>`.
- Fonts: [Cormorant Garamond](https://fonts.google.com/specimen/Cormorant+Garamond) (serif) + [Inter](https://fonts.google.com/specimen/Inter) (sans), both via Google Fonts.
- Color palette: warm off-white background, charcoal ink, deep-pastel sage and terracotta accents.
- Accessibility: keyboard navigation works on lightbox and before/after slider; aria attributes on toggles; `prefers-reduced-motion` respected by reveal animations (transitions, not transforms).
- Browser support: anything from the last 3 years (uses `clip-path`, `aspect-ratio`, `backdrop-filter`).

## License

All artwork and images on the site belong to Sasha Grampone. The site code is for personal/portfolio use.
