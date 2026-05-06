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

Once you own a domain (e.g. `sashagrampone.art`):

1. Vercel → Project → **Settings** → **Domains** → add your domain
2. Update the DNS records as Vercel instructs (usually a single `CNAME` or `A` record)
3. Find-and-replace `sashagrampone.art` across the HTML files if you used a different domain — this updates the OG/Twitter share URLs

## Tech notes

- No JavaScript framework. Vanilla DOM, IntersectionObserver, FormData, native `<details>`.
- Fonts: [Cormorant Garamond](https://fonts.google.com/specimen/Cormorant+Garamond) (serif) + [Inter](https://fonts.google.com/specimen/Inter) (sans), both via Google Fonts.
- Color palette: warm off-white background, charcoal ink, deep-pastel sage and terracotta accents.
- Accessibility: keyboard navigation works on lightbox and before/after slider; aria attributes on toggles; `prefers-reduced-motion` respected by reveal animations (transitions, not transforms).
- Browser support: anything from the last 3 years (uses `clip-path`, `aspect-ratio`, `backdrop-filter`).

## License

All artwork and images on the site belong to Sasha Grampone. The site code is for personal/portfolio use.
