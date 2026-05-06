# Wiring up the forms (Formspree, ~3 min)

The Commissions and Contact forms ship with placeholder IDs. They currently
fall back to a friendly "thank you" message but **don't actually send
anything yet**. Here's how to make them live.

## 1. Create your Formspree account

1. Go to [formspree.io](https://formspree.io)
2. Sign up with the email you want to receive submissions at
   (recommend: `hello@sashagramponeart.com` once your domain is set up,
   or your existing email for now)
3. Verify the email address from the inbox

The free tier allows 50 submissions/month per form, which is plenty for
a portrait-commissions inbox.

## 2. Create two forms

In the Formspree dashboard:

1. Click **"+ New Form"**
   - **Name:** `Sasha Grampone — Commissions`
   - **Send Email To:** the verified address from step 1
   - **Click Create Form**
2. Copy the **Form ID** — it's the 8-character string in the URL or in
   the "Endpoint" section. It looks like `xpwagk29`.
3. Repeat for a second form named `Sasha Grampone — Contact`. Copy that
   form ID too.

## 3. Replace the placeholders

You need to swap two strings, one in each file. The placeholders all
look like `YOUR_FORM_ID`.

**Easiest method — GitHub web editor (no terminal):**

1. Open this branch on GitHub: <https://github.com/frvnzisg-ux/sasha-grampone-art/tree/setup/formspree>
2. Click `commissions.html` → press `.` (period key) to open the GitHub
   web editor (VS Code in the browser)
3. Press `Ctrl+F`, search for `YOUR_FORM_ID`
4. Replace it with the **Commissions** form ID (e.g. `xpwagk29`)
5. Save (`Ctrl+S`), then commit the change with a message like
   `Wire up Commissions form`
6. Repeat for `contact.html` — replace its `YOUR_FORM_ID` with the
   **Contact** form ID

**Or locally with any editor:**

```bash
# In commissions.html and contact.html, find:
action="https://formspree.io/f/YOUR_FORM_ID"
# Replace YOUR_FORM_ID with each respective Formspree ID, then commit.
```

## 4. Open a Pull Request to merge into `main`

Once both files are updated on the `setup/formspree` branch:

1. GitHub will show a banner: **"Compare & pull request"** — click it
2. Title the PR `Wire up Formspree form IDs`
3. Click **"Create pull request"** then **"Merge pull request"**
4. Vercel will deploy automatically, and the next form submission will
   land in your inbox

## 5. Test it

After Vercel finishes deploying (~30 sec), visit the live Commissions
page, fill out the form with a test message, and watch it land in
your email. Formspree will also confirm receipt in their dashboard.

## What's already configured for you

Both forms include:

- A **honeypot field** (`name="_gotcha"`, hidden via CSS) that catches
  bots automatically
- A **subject line** (`_subject`) so submissions in your inbox are
  clearly tagged: *"New commission inquiry — Sasha Grampone Art"*
- **AJAX submission** via `fetch()` — submitters stay on the same page
  and see an inline thank-you message instead of being redirected
- **Error handling** — if Formspree is down, the form falls back to
  asking the user to email directly

## What if I don't want Formspree?

The forms work with any service that accepts standard HTML form POSTs:

- **Netlify Forms** (free, simpler setup if you migrate to Netlify hosting)
- **Web3Forms** (free, similar API)
- **Basin** (paid, more features)

Just swap the `action="https://formspree.io/f/..."` URL for the
service's endpoint — the JavaScript handler at the bottom of `js/main.js`
auto-detects any form with `data-formspree` and submits via fetch().

---

When you've merged this branch and confirmed at least one test
submission lands in your inbox, you can delete `SETUP-FORMS.md` and
this branch — the work is done.
