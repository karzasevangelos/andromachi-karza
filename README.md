# Ανδρομάχη Κάρζα — Ψυχολόγος · andromachikarza.com

Single-page bilingual website (Greek default at `/`, English mirror at `/en/`).
Plain HTML/CSS/JS — no build step, no framework, no cookies. Open `index.html`
through any static server and it runs.

```
index.html          Greek page (the site)
en/index.html       English mirror
css/style.css       the whole design system
js/main.js          animations, nav, form (no dependencies)
fonts/              Commissioner, self-hosted, greek+latin subsets
assets/             logo + icons, og image (see "The mark" below)
favicon.ico         16/32/48 px tab icon (Google search uses this or favicon.svg)
_headers            security headers (CSP) + caching — used only if moved to Cloudflare Pages/Netlify
.nojekyll           tells GitHub Pages to serve files as-is
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
| `[00000]` | licence number (Άδεια Ασκήσεως Επαγγέλματος) — footer legal block, both pages |
| `[000000000]` | ΑΦΜ (required by Π.Δ. 131/2003 for regulated professions) |
| `[09:00–20:00]` | the hours she actually answers the phone |
| `[12]` μήνες | real retention period for enquiries |

Already filled in: name and titles (Ψυχολόγος Α.Π.Θ.; MEd Ειδικής Αγωγής και
Εκπαίδευσης, Παν. Πατρών; MSc Εκπαιδευτικής Ψυχολογίας, Παν. Λευκωσίας), phone
`+30 698 835 5485` (also `data-tel` on both forms), email
`andromachikarza@gmail.com` (also the form `action` on both pages), and the fact that
the practice is **online only** — there is no address anywhere, and the
JSON-LD deliberately carries no `PostalAddress`. If an office opens later, add
the address to the contact block, the footer, the privacy notice and the
`MedicalBusiness` node together.

Also: the privacy text and the footer legal block are **templates — have a
lawyer review them before launch**.

## Deploy — GitHub Pages (free)

Settings → Pages → Source **Deploy from a branch**, branch `main`, folder
`/ (root)`. No build step. A free GitHub account can only publish Pages from
a **public** repo. All asset paths are relative, so the site works both at
`https://<user>.github.io/andromachi-karza/` and on a custom domain.

### Custom domain — andromachikarza.com

Registered at **Cloudflare Registrar** (DNS on Cloudflare). The apex is the
primary address; `www` redirects to it. All URLs in both HTML files,
`sitemap.xml` and `robots.txt` use `https://andromachikarza.com`.

1. Cloudflare → DNS → Records, all set to **DNS only** (grey cloud — the
   orange proxy blocks GitHub's HTTPS certificate): four `A` records on `@` →
   `185.199.108.153`, `185.199.109.153`, `185.199.110.153`,
   `185.199.111.153`; and `www` `CNAME` → `<user>.github.io`.
2. Settings → Pages → Custom domain = `andromachikarza.com` (the `CNAME`
   file in the repo root holds the same value), then **Enforce HTTPS** once
   the certificate is issued.

Don't add the `CNAME` file before the DNS works — Pages would redirect the
github.io address to a domain that doesn't resolve yet.

### Contact form — FormSubmit

The form posts to `https://formsubmit.co/andromachikarza@gmail.com` (no
account, no server). `js/main.js` sends it to the `/ajax/` endpoint so the
visitor stays on the page; without JS the browser posts directly.

**One-time activation:** the first submission does NOT deliver — FormSubmit
emails `andromachikarza@gmail.com` an "Activate Form" link instead. Click it,
then submit a second test and confirm it arrives. Until activated the form
shows the failure message with the phone number — it never fakes success.
After activation FormSubmit offers a random-string alias you can put in the
form `action` instead of the address.

### After launch

- **Google Business Profile** as an individual practitioner, category
  Ψυχολόγος. Keep the NAP string (name, address, phone) byte-identical with
  the footer — accent/abbreviation drift (`Λ.` vs `Λεωφόρος`) splits listings.
- Search Console: add a **Domain** property for `andromachikarza.com`
  (verify through Cloudflare), submit `sitemap.xml`, and request indexing of
  `/` and `/en/`. Bing Webmaster Tools can import the property from Google.
- **IndexNow** (Bing, Yandex, Seznam, Naver — and DuckDuckGo/Yahoo/Ecosia via
  Bing): the key file `ba8d31c7664c8a3900ce33f3797be55e.txt` in the root
  proves ownership. Don't delete it. After content changes, ping:
  `curl -X POST https://api.indexnow.org/indexnow -H 'content-type: application/json'
  -d '{"host":"andromachikarza.com","key":"ba8d31c7664c8a3900ce33f3797be55e","urlList":["https://andromachikarza.com/","https://andromachikarza.com/en/"]}'`
- Name searches: the JSON-LD `WebSite`/`Person` nodes carry both spellings
  (Ανδρομάχη Κάρζα / Andromachi Karza). When she has public profiles
  (LinkedIn, Facebook, Instagram, directories), add their URLs to the
  `Person` node as `"sameAs": [...]` in both HTML files, and link each
  profile back to the site.
- Analytics, if wanted: **Cloudflare Web Analytics only** (cookieless — no
  banner needed). GA4 would require a prior-consent banner in Greece.
- No blog of AI-generated posts — this is YMYL health content; Google's
  quality raters flag it. Hand-written articles with her byline only.

## The mark

A Ψ (ψυχή) drawn as a sprouting plant — the stem is the letter's spine, two
oval leaves are its arms, a shiny rose bud on top — drawn like the plant in
the hero illustration, inside the site's organic blob. Colours are the
site's: mint blob (#CDE7D8), rose ring (#E9A3B8), two-tone leaves (#2E7D63 /
#57997F), deep-green stem (#1E5B46), rose bud (#D98AA3).

| File | Use |
|---|---|
| `assets/logo.svg` | master, detailed cut (leaf veins) — footer, 48px and up |
| `assets/favicon.svg` | small cut (no veins) — browser tab, header |
| `favicon.ico` | 16/32/48 px bitmaps of the small cut |
| `assets/icon-192.png`, `icon-512.png` | manifest + JSON-LD `logo` (transparent) |
| `assets/icon-maskable-512.png` | Android adaptive icon (full-bleed mint, sprout in the safe zone) |
| `assets/apple-touch-icon.png` | iOS home screen, 180 px, full-bleed |

The PNGs/ICO were rendered from the SVGs with headless Chrome. If the mark
changes, re-render all of them so the tab, the search result and the home
screen stay identical.

## Design system notes (for future edits)

- Palette lives in `:root` in `css/style.css`. Rules: **teal is text only on
  paper/white** (it fails contrast on the mint wash); **coral and amber are
  decorative only, never text**. All contrast pairs were computed ≥ 4.5:1.
- **Greek type rules**: no `text-transform: uppercase` anywhere (Greek caps
  drop accents by orthographic rule — write caps by hand, accents removed);
  `letter-spacing: 0` on Greek text; Greek runs ~10–15% longer than English,
  so test layouts with the Greek strings.
- **Fonts**: Commissioner (by a Greek designer, verified Greek subset), the
  variable build with `wght`, `FLAR` and `VOLM` axes. Headings use the
  `--display` voice (`FLAR 100, VOLM 80` — flared, inscriptional terminals);
  body text stays plain. To re-download, request
  `family=Commissioner:wght,FLAR,VOLM@100..900,0..100,0..100` and keep only
  the greek + latin subsets. If you ever swap fonts, check the replacement
  actually ships **greek** (not just greek-ext): only 129 of ~1,900 Google
  Fonts do. Cormorant, Playfair, Lora, Montserrat, Raleway do NOT.
- **Layout**: long sections use `.wrap.split` — heading + intro sticky on the
  left, content on the right (≥1000px only). Cards are reserved for real
  units (the four audiences, the form); lists use hairline `--rule`s. No
  all-caps labels above headings — the heading carries the section.
- **Motion**: every animation is gated behind `html.js`, added by JS only
  when `prefers-reduced-motion` is off. No JS / reduced motion → complete,
  still page. Keep it that way: never author `opacity: 0` outside `html.js`.
- **The form must never fake success** — a success message renders only after
  the server confirms the send. The failure message always shows the phone.
- Crisis numbers (1018, 10306, 116111, 112) stay in the footer of every page.
- `.sec--alt` is the alternating band. Never put `--teal` text inside it —
  it measures 4.45:1 on `--wash` and fails; use `--teal-deep` or `--ink`.
- `.path` cards each own one accent through `--accent`; the amber card flips
  its glyph to `--ink` because white on amber is unreadable.
