# Ανδρομάχη Κάρζα — Ψυχολόγος · andromachikarza.gr

Single-page bilingual website (Greek default at `/`, English mirror at `/en/`).
Plain HTML/CSS/JS — no build step, no framework, no cookies. Open `index.html`
through any static server and it runs.

```
index.html          Greek page (the site)
en/index.html       English mirror
css/style.css       the whole design system
js/main.js          animations, nav, form (no dependencies)
fonts/              Commissioner, self-hosted, greek+latin subsets
assets/             favicon, og image, icons — replace photos here
functions/contact.js  Cloudflare Pages Function: Turnstile → Brevo email
_headers            security headers (CSP) + caching for Cloudflare Pages
sitemap.xml robots.txt site.webmanifest
```

## Run locally

```
python -m http.server 8899
# → http://127.0.0.1:8899/
```

(Open via a server, not file:// — paths are absolute.)

## Before going live — find-and-replace checklist

Every placeholder is bracketed so nothing ships by accident. Search the two
HTML files for `[` to find them all:

| Placeholder | Replace with |
|---|---|
| `https://www.andromachikarza.gr` | the real domain (also in `sitemap.xml`, `robots.txt`) |
| `[00000]` | licence number (Άδεια Ασκήσεως Επαγγέλματος) — footer + About card + both pages |
| `[000000000]` | ΑΦΜ (required by Π.Δ. 131/2003 for regulated professions) |
| `[09:00–20:00]` | the hours she actually answers the phone |
| `[12]` μήνες | real retention period for enquiries |
| `ΦΩΤΟΓΡΑΦΙΑ` / `PHOTOGRAPH` | a real portrait (`<img>` with explicit `width`/`height`) |

Already filled in: name and titles (Ψυχολόγος Α.Π.Θ.; MEd Ειδικής Αγωγής και
Εκπαίδευσης, Παν. Πατρών; MSc Εκπαιδευτικής Ψυχολογίας, Παν. Λευκωσίας), phone
`+30 698 835 5485` (also `data-tel` on both forms and `TEL` in
`functions/contact.js`), email `andromachikarza@gmail.com`, and the fact that
the practice is **online only** — there is no address anywhere, and the
JSON-LD deliberately carries no `PostalAddress`. If an office opens later, add
the address to the contact block, the footer, the privacy notice and the
`MedicalBusiness` node together.

Also: the privacy text and the footer legal block are **templates — have a
lawyer review them before launch**.

## Deploy — Cloudflare Pages (free)

1. Push this folder to a Git repo → Cloudflare Pages → "Connect to Git",
   framework preset **None**, build command **none**, output dir `/`.
2. Buy the .gr domain (Papaki is the usual registrar) and point its
   nameservers at Cloudflare; add the domain under Pages → Custom domains.
   Don't buy hosting from the registrar — Pages serves the site.
3. Email on the domain: Cloudflare Email Routing forwards `info@…` to any
   existing inbox for free.

### Activate the contact form (until then the phone number is the CTA)

The form **fails loudly** while unconfigured — it tells the visitor to call
instead. It never pretends to send.

1. **Turnstile** (free, no cookies): Cloudflare dashboard → Turnstile →
   Add site. Put the **site key** in `js/main.js` (`TURNSTILE_SITE_KEY`).
2. **Brevo** (EU email provider): create account → verify a sender →
   SMTP & API → new API key.
3. Pages → Settings → Environment variables:
   - `TURNSTILE_SECRET_KEY` — Turnstile secret
   - `BREVO_API_KEY`
   - `CONTACT_TO` — her inbox
   - `CONTACT_FROM` — the Brevo-verified sender
4. Submit a real test through the deployed form and confirm the mail arrives.

### After launch

- **Google Business Profile** as an individual practitioner, category
  Ψυχολόγος. Keep the NAP string (name, address, phone) byte-identical with
  the footer — accent/abbreviation drift (`Λ.` vs `Λεωφόρος`) splits listings.
- Search Console: submit `sitemap.xml`.
- Analytics, if wanted: **Cloudflare Web Analytics only** (cookieless — no
  banner needed). GA4 would require a prior-consent banner in Greece.
- No blog of AI-generated posts — this is YMYL health content; Google's
  quality raters flag it. Hand-written articles with her byline only.

## Design system notes (for future edits)

- Palette lives in `:root` in `css/style.css`. Rules: **teal is text only on
  paper/white** (it fails contrast on the mint wash); **coral and amber are
  decorative only, never text**. All contrast pairs were computed ≥ 4.5:1.
- **Greek type rules**: no `text-transform: uppercase` anywhere (Greek caps
  drop accents by orthographic rule — write caps by hand, accents removed);
  `letter-spacing: 0` on Greek text; Greek runs ~10–15% longer than English,
  so test layouts with the Greek strings.
- **Fonts**: Commissioner (by a Greek designer, verified Greek subset).
  If you ever swap fonts, check the replacement actually ships **greek**
  (not just greek-ext): only 129 of ~1,900 Google Fonts do. Cormorant,
  Playfair, Lora, Montserrat, Raleway do NOT.
- **Motion**: every animation is gated behind `html.js`, added by JS only
  when `prefers-reduced-motion` is off. No JS / reduced motion → complete,
  still page. Keep it that way: never author `opacity: 0` outside `html.js`.
- **The form must never fake success** — a success message renders only after
  the server confirms the send. The failure message always shows the phone.
- Crisis numbers (1018, 10306, 116111, 112) stay in the footer of every page.
- `.sec--alt` is the alternating band. Inside it the kicker steps down to
  `--teal-deep` — plain `--teal` measures 4.45:1 on `--wash` and fails.
- `.path` cards each own one accent through `--accent`; the amber card flips
  its glyph to `--ink` because white on amber is unreadable.
