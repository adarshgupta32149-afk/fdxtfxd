# Automech Hydraulic Solutions — Website

Static site for Automech Hydraulic Solutions: hydraulic bottle jacks (15–120 ton) and hydraulic
cylinders. Live: https://automech-workshop.netlify.app

There is no build step. Netlify serves this folder as it is (publish directory = project root).

## Files
- `index.html` — the page. It also holds three pages written in plain HTML: Cylinders (`#cylinders`),
  Order online (`#order`) and My orders (`#orders`).
- `assets/index-*.js`, `assets/index-*.css` — the original site, pre-built (no source in this repo).
- `assets/boot.js` — picks the first page from the address before anything paints.
- `assets/site.js`, `assets/site.css` — everything added on top: slide navigation, the cylinder
  diameter selector and photo gallery, and online orders.
- `images/` — photos (WebP / JPEG). `automech-brochure.pdf` — the brochure download.
- `_headers` — security headers Netlify sends with every file (see Security).

## How an order works
1. The buyer picks jacks (prices are read from the datasheet on the Jacks page), adds delivery
   details and chooses NEFT, IMPS or RTGS. RTGS unlocks at ₹2,00,000; IMPS stops at ₹5,00,000.
2. **Place order** opens WhatsApp to the workshop number with the whole order written out; the buyer
   presses send. A copy also goes to the Netlify form inbox (`enquiry`, marked `ONLINE ORDER AM-…`).
3. The buyer pays from their bank app, then sends **payment proof**: the UTR number and a screenshot.
   It goes to WhatsApp and to the inbox (`PAYMENT PROOF AM-…`, screenshot in the `proof` field).
4. The workshop sends the invoice on WhatsApp. The buyer confirms it from My orders, which sends
   "I confirm … Please ship" on WhatsApp.

My orders is kept in the buyer's own browser, so it shows orders from that phone or computer only,
and the site cannot show "shipped" by itself: that is told on WhatsApp.

## Things to edit
- **Bank details:** search `index.html` for `BANK DETAILS` and type the four values. Until then the
  order message asks for them on WhatsApp.
- **WhatsApp number:** `WHATSAPP` at the top of `assets/site.js` (and `whatsapp:` in the bundle).
- **Cylinder diameter range:** `min`, `max`, `step` on `#cyl-dia` and `#cyl-dia-num` in `index.html`.
- **Cylinder photos:** `images/cylinder-1.jpg` … `-4.jpg`; the comment above the gallery in
  `index.html` says how to add or swap one.
- **Home slider pictures:** the `Fn` list in `assets/index-*.js`. It swipes and also moves by itself.

## Security
- No keys, passwords or tokens are in this repository; the site calls no outside service except
  Google Fonts. Forms post only to the site itself (Netlify Forms).
- `_headers` sets a Content-Security-Policy that allows only the site's own scripts and styles, so
  `index.html` must not contain inline `<script>`, `<style>`, `style="…"` or `onclick="…"`.
- Everything a buyer types is escaped before it is shown.
