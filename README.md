# Automech Hydraulic Solutions — Website

Static marketing site for Automech Hydraulic Solutions (hydraulic bottle jacks, 15–120 ton).

Live: https://automech-workshop.netlify.app

## Contents
This is the built/static output (HTML + bundled JS/CSS + images + product brochure).
It is a single-page site; deploy by serving the repository root as a static site
(e.g. Netlify publish directory = project root, no build step required).

- `index.html` — entry page; also holds the Hydraulic Cylinders page (the `<section id="cylinders">` block)
- `assets/index-*.js`, `assets/index-*.css` — the bundled site (pre-built, no source in this repo)
- `assets/slides.js`, `assets/slides.css` — slide navigation (one section on screen at a time, animated
  change, Previous / Next) and the cylinder stroke selector and quote form
- `images/` — hero slides, product photos (transparent PNGs) and logo
- `automech-brochure.pdf` — downloadable product brochure

The enquiry form posts to Netlify Forms (no backend/database required).

## Hydraulic cylinders page
- **Stroke range:** set by `min`, `max` and `step` on the two stroke inputs in `index.html`
  (`#cyl-stroke` and `#cyl-stroke-num`), plus the numbers printed under the slider.
- **Photos:** three empty slots are marked `PHOTO SLOT 1–3` in `index.html`. Put the picture in
  `images/` and replace the slot's contents with an `<img>` as the comment there shows.
- **Quotes:** "Request quote" posts to the same Netlify form as the contact page (`enquiry`), with the
  stroke in the `model` field. "Order on WhatsApp" opens a chat with the details filled in.

## Order online and My orders
- **Order page** (`#order`): buyers pick jacks (prices are read from the datasheet on the Jacks page),
  add delivery details and choose NEFT, IMPS or RTGS. RTGS unlocks at ₹2,00,000; IMPS stops at ₹5,00,000.
  UPI buyers are pointed to WhatsApp.
- Orders go to the workshop through the same Netlify form (`enquiry`), marked `ONLINE ORDER AM-…`.
  Payment references (UTR) arrive as `PAYMENT REPORTED AM-…`.
- **Bank details:** type them into the four empty `data-bank` fields in `index.html` (search for
  `BANK DETAILS`). Until then, buyers are asked to get them on WhatsApp.
- **My orders** (`#orders`) lists orders placed from that browser, with totals and payment status.
  It is stored in the buyer's browser, not on a server.
- Logic and styles: `assets/order.js`, `assets/order.css`.
