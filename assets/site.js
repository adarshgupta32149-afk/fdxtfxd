/* Automech site add-ons. The site itself is a pre-built React bundle (assets/index-*.js);
 * this one file sits on top of it and runs:
 *   1. slide navigation: one section on screen, animated change, Previous / Next
 *   2. the cylinders page: diameter selector, photo gallery, quote request
 *   3. online orders: cart, NEFT / IMPS / RTGS, WhatsApp hand-off, payment proof, My orders
 * Nothing here holds a key or password. Orders live in the buyer's own browser and reach the
 * workshop by WhatsApp and by the site's Netlify form ("enquiry").
 */
(() => {
  'use strict';
  window.automechReady = true;

  const WHATSAPP = '918090688246';
  const EMAIL = 'automechhydraulic@gmail.com';
  const RTGS_MIN = 200000;            // RTGS is for Rs 2,00,000 and above
  const IMPS_MAX = 500000;            // IMPS carries up to Rs 5,00,000 per transfer
  const PROOF_MAX = 5 * 1024 * 1024;  // largest payment screenshot we accept
  const STORE = 'automech.orders.v1';
  const VIEWS = [['top', 'Home'], ['range', 'Jacks'], ['cylinders', 'Cylinders'], ['order', 'Order'],
    ['build', 'Built Different'], ['process', 'Process'], ['industries', 'Industries'], ['contact', 'Contact']];
  const ASIDE = { orders: 'order' };  // pages reached from another page, not from Previous / Next
  const MAIN = VIEWS.map(v => v[0]);
  const IDS = [...MAIN, ...Object.keys(ASIDE)];

  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const $ = id => document.getElementById(id);
  const inr = n => '₹' + Number(n).toLocaleString('en-IN');
  const esc = s => String(s).replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`);
  const digits = s => String(s).replace(/\D/g, '');
  const two = n => String(n).padStart(2, '0');
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, Math.round(+v) || 0));
  const wa = text => `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`;
  const openWa = text => window.open(wa(text), '_blank', 'noopener');
  const say = (el, text, ok) => { if (el) { el.hidden = !text; el.textContent = text || ''; el.classList.toggle('ok', !!ok); } };
  const WA_ICON = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>';

  /* A copy for the workshop inbox, through the site's Netlify form. Resolves true if it arrived. */
  const post = (fields, file) => {
    const body = file ? new FormData() : new URLSearchParams();
    body.append('form-name', 'enquiry');
    Object.entries(fields).forEach(([k, v]) => body.append(k, v));
    if (file) body.append('proof', file);
    return fetch('/', { method: 'POST', body }).then(r => r.ok).catch(() => false);
  };

  /* Every − / + button: change the number box it belongs to, then let that box's own code react. */
  document.addEventListener('click', e => {
    const b = e.target.closest('.cyl-step');
    if (!b) return;
    const box = b.dataset.for ? $(b.dataset.for) : b.parentElement.querySelector('input');
    box.value = clamp((+box.value || 0) + +b.dataset.step, +box.min || 0, box.max === '' ? 99999 : +box.max);
    box.dispatchEvent(new Event('input', { bubbles: true }));
  });

  /* ================= 1. slide navigation ================= */

  let current = root.dataset.view || 'top', main, pager, running;

  function renderPager() {
    const i = MAIN.indexOf(ASIDE[current] || current);
    const prev = ASIDE[current] ? VIEWS[i] : VIEWS[i - 1], next = VIEWS[i + 1];
    pager.innerHTML =
      (prev ? `<a class="pager-prev" href="#${prev[0]}"><span>Previous</span><strong>← ${prev[1]}</strong></a>` : '') +
      `<span class="pager-count" aria-label="Page ${i + 1} of ${VIEWS.length}"><b>${two(i + 1)}</b> / ${two(VIEWS.length)}</span>` +
      (next ? `<a class="pager-next" href="#${next[0]}"><span>Next</span><strong>${next[1]} →</strong></a>` : '');
  }

  function show(id, focus) {
    current = id;
    root.dataset.view = id;
    scrollTo(0, 0);
    renderPager();
    document.querySelectorAll('.nav a, .mnav a').forEach(a =>
      a.getAttribute('href') === '#' + (ASIDE[id] || id) ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current'));
    if (id === 'orders') renderOrders();
    if (id !== 'order') hideDone();     // the "order placed" panel is for right after ordering
    const sec = focus && $(id);
    if (sec) { sec.tabIndex = -1; sec.focus({ preventScroll: true }); }
  }

  function go(id, push = true) {
    if (!IDS.includes(id) || !main) return;
    if (id === current && !running) return scrollTo({ top: 0, behavior: reduce.matches ? 'auto' : 'smooth' });
    const dir = IDS.indexOf(id) >= IDS.indexOf(running ? running.to : current) ? 1 : -1;
    // Some embedded previews do not allow changing the address; the page still changes.
    if (push) try { history.pushState(null, '', id === 'top' ? location.pathname + location.search : '#' + id); } catch { /* keep going */ }
    if (running) running.anim.cancel();
    running = null;
    if (reduce.matches || !main.animate) return show(id, true);

    const out = main.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: `translateX(${-dir * 22}px)` }],
      { duration: 150, easing: 'cubic-bezier(.4, 0, 1, 1)', fill: 'forwards' });
    running = { anim: out, to: id };
    out.onfinish = () => {
      if (!running || running.anim !== out) return;
      show(id, true);
      out.cancel();
      const inn = main.animate([{ opacity: 0, transform: `translateX(${dir * 34}px)` }, { opacity: 1, transform: 'none' }],
        { duration: 420, easing: 'cubic-bezier(.2, .7, .3, 1)' });
      running = { anim: inn, to: id };
      inn.onfinish = inn.oncancel = () => { if (running && running.anim === inn) running = null; };
    };
  }

  function wireNavigation() {
    // Every in-page link (menu, footer, buttons, logo) changes page instead of scrolling.
    document.addEventListener('click', e => {
      if (e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const id = a.getAttribute('href').slice(1);
      if (a.classList.contains('totop')) { e.preventDefault(); return scrollTo({ top: 0, behavior: reduce.matches ? 'auto' : 'smooth' }); }
      if (!IDS.includes(id)) return;
      e.preventDefault();
      if (a.dataset.order) addToOrder(a.dataset.order);   // "Order online" on a jack's page
      go(id);
    }, true);
    addEventListener('popstate', () => { const id = location.hash.slice(1); go(IDS.includes(id) ? id : 'top', false); });

    // The app scrolls to the jack range from a few buttons. When that section is on another page, go there.
    const nativeScroll = Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView = function (...args) {
      const sec = this.closest('main > section');
      if (sec && sec.id !== current && IDS.includes(sec.id)) return go(sec.id);
      return nativeScroll.apply(this, args);
    };
  }

  /* ================= 2. cylinders ================= */

  function wireCylinders() {
    const form = $('cyl-form');
    if (!form) return;
    const range = $('cyl-dia'), num = $('cyl-dia-num'), qty = $('cyl-qty'), city = $('cyl-city'), notes = $('cyl-notes');
    const name = $('cyl-name'), phone = $('cyl-phone'), send = $('cyl-send'), waBtn = $('cyl-wa'), hint = $('cyl-hint');
    const MIN = +range.min, MAX = +range.max;
    const dia = () => clamp(num.value, MIN, MAX), pcs = () => clamp(qty.value, 1, 99999);
    const details = () => [`Diameter: ${dia()} mm`, `Quantity: ${pcs()}`,
      city.value.trim() && `Deliver to: ${city.value.trim()}`, notes.value.trim() && `Notes: ${notes.value.trim()}`].filter(Boolean);

    // The numbers under the slider sit where the handle (26px wide) stops for each value.
    for (let v = MIN; v <= MAX; v += (MAX - MIN) / 6) {
      const tick = $('cyl-ticks').appendChild(document.createElement('span'));
      tick.textContent = Math.round(v);
      tick.style.setProperty('--p', (v - MIN) / (MAX - MIN));
    }

    const paint = () => {
      const d = dia(), none = d <= 0;
      range.value = d;
      range.style.setProperty('--pct', `${(d - MIN) / (MAX - MIN) * 100}%`);
      form.querySelectorAll('.cyl-step').forEach(b => {
        const v = b.dataset.for === 'cyl-qty' ? pcs() : d, lo = b.dataset.for === 'cyl-qty' ? 1 : MIN;
        b.disabled = +b.dataset.step < 0 ? v <= lo : b.dataset.for !== 'cyl-qty' && v >= MAX;
      });
      waBtn.setAttribute('aria-disabled', none);
      waBtn.tabIndex = none ? -1 : 0;
      waBtn.href = wa(`Hi Automech, I'd like a quote for hydraulic cylinders.\n${details().join('\n')}`);
      send.disabled = none || send.dataset.busy === '1';
      if (none) say(hint, 'Choose a diameter above 0 mm to ask for a quote.');
      else if (!hint.classList.contains('ok')) say(hint, '');
    };

    range.addEventListener('input', () => { num.value = range.value; paint(); });
    form.addEventListener('input', e => { if (e.target !== range && !((e.target === num || e.target === qty) && e.target.value === '')) paint(); });
    num.addEventListener('blur', () => { num.value = dia(); paint(); });
    qty.addEventListener('blur', () => { qty.value = pcs(); paint(); });

    form.addEventListener('submit', e => {
      e.preventDefault();
      num.value = dia(); qty.value = pcs(); paint();
      if (dia() <= 0 || form.elements['bot-field'].value) return;
      if (!name.value.trim()) { say(hint, 'Add your name so we know who to reply to.'); return name.focus(); }
      if (digits(phone.value).length < 10) { say(hint, 'Add a phone number with at least 10 digits.'); return phone.focus(); }

      const model = `Hydraulic cylinder — ${dia()} mm diameter`, message = details().slice(2).join('\n');
      const label = send.querySelector('span');
      send.dataset.busy = '1'; send.disabled = true; label.textContent = 'Sending…';
      post({ name: name.value.trim(), phone: phone.value.trim(), model, qty: String(pcs()), message }).then(sent => {
        send.dataset.busy = ''; label.textContent = 'Request quote'; paint();
        if (sent) return say(hint, "Request received — it's with the workshop now. We'll reply to the number you left, usually the same day.", true);
        // No form service (or offline): hand the same details to the buyer's email app.
        const mail = [`Model: ${model}`, `Quantity: ${pcs()}`, `Name: ${name.value.trim()}`, `Phone: ${phone.value.trim()}`, '', message].join('\n');
        location.href = `mailto:${EMAIL}?subject=${encodeURIComponent('Enquiry: ' + model)}&body=${encodeURIComponent(mail)}`;
        say(hint, `Your email app should open with everything filled in. If it did not, write to ${EMAIL}.`, true);
      });
    });
    paint();
  }

  /* Photo gallery: swipe, drag, arrow keys or tap a thumbnail. */
  function wireGallery() {
    const lead = $('cyl-lead'), track = $('cyl-track');
    if (!lead || !track) return;
    const shots = [...track.children], thumbs = [...document.querySelectorAll('.cyl-thumb')];
    let at = 0, drag = null;

    // The same photo, blurred, fills the frame behind each picture so every photo shows whole.
    shots.forEach(shot => {
      const blur = shot.insertBefore(document.createElement('div'), shot.firstChild);
      blur.className = 'cyl-blur';
      blur.style.backgroundImage = `url("${shot.querySelector('img').getAttribute('src')}")`;
    });

    const place = (dx, animate) => {
      track.style.transition = animate && !reduce.matches ? 'transform .5s cubic-bezier(.2, .7, .3, 1)' : 'none';
      track.style.transform = `translateX(calc(${-at * 100}% + ${dx}px))`;
    };
    const pick = i => {
      at = clamp(i, 0, shots.length - 1);
      place(0, true);
      thumbs.forEach((t, n) => { t.classList.toggle('on', n === at); n === at ? t.setAttribute('aria-current', 'true') : t.removeAttribute('aria-current'); });
      shots.forEach((s, n) => s.setAttribute('aria-hidden', n !== at));
    };

    thumbs.forEach(t => t.addEventListener('click', () => pick(+t.dataset.i)));
    lead.addEventListener('pointerdown', e => {
      if (e.pointerType !== 'mouse' || e.button === 0) drag = { x: e.clientX, y: e.clientY, id: e.pointerId, w: lead.offsetWidth, axis: '' };
    });
    lead.addEventListener('pointermove', e => {
      if (!drag || drag.id !== e.pointerId) return;
      let dx = e.clientX - drag.x;
      const dy = e.clientY - drag.y;
      if (!drag.axis) {
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
        drag.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
        if (drag.axis === 'x') { try { lead.setPointerCapture(e.pointerId); } catch { /* ignore */ } lead.classList.add('dragging'); }
      }
      if (drag.axis !== 'x') return;
      if ((at === 0 && dx > 0) || (at === shots.length - 1 && dx < 0)) dx /= 3;   // past the ends it only gives a little
      place(dx, false);
    });
    const end = e => {
      const d = drag;
      drag = null;
      if (!d || d.axis !== 'x') return;
      lead.classList.remove('dragging');
      const dx = e.type === 'pointercancel' ? 0 : e.clientX - d.x;
      Math.abs(dx) > Math.min(70, d.w * 0.18) ? pick(at + (dx < 0 ? 1 : -1)) : place(0, true);
    };
    lead.addEventListener('pointerup', end);
    lead.addEventListener('pointercancel', end);
    lead.addEventListener('dragstart', e => e.preventDefault());
    lead.tabIndex = 0;
    lead.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); pick(at + (e.key === 'ArrowRight' ? 1 : -1)); }
    });
    pick(0);
  }

  /* ================= 3. online orders ================= */

  let jacks = [];     // [{ code, ton, price }] read from the datasheet on the Jacks page
  let cart = {};      // code -> quantity
  let memory = [];    // orders, when the browser will not store anything
  let shown = null;   // order number on the "order placed" panel

  const loadOrders = () => { try { const v = JSON.parse(localStorage.getItem(STORE)); return Array.isArray(v) ? v : memory; } catch { return memory; } };
  const saveOrders = list => { memory = list; try { localStorage.setItem(STORE, JSON.stringify(list)); } catch { /* private window: kept for this visit */ } };
  const patchOrder = (no, patch) => {
    const list = loadOrders(), o = list.find(x => x.no === no);
    if (o) { Object.assign(o, patch); saveOrders(list); }
    return o;
  };
  const statusOf = o => o.status || (o.utr ? 'proof' : 'placed');   // placed -> proof -> confirmed
  const bankShown = () => { const cells = [...document.querySelectorAll('[data-bank]')]; return cells.length > 0 && cells.every(c => c.textContent.trim()); };

  const orderLines = o => [
    ...o.items.map(i => `${i.qty} x ${i.code} (${i.ton} T) - ${inr(i.qty * i.price)}`),
    `Total: ${inr(o.total)}`, `Payment: ${o.method}`,
    `Deliver to: ${o.name}, ${o.address}, ${o.city} - ${o.pin}`, `Phone: ${o.phone}`, o.gstin && `GSTIN: ${o.gstin}`
  ].filter(Boolean).join('\n');
  const MSG = {
    order: o => `New order ${o.no} from the Automech website\n${orderLines(o)}\n\n` +
      (bankShown() ? '' : 'Please send your bank account details. ') + 'I will send the payment proof in this chat.',
    proof: o => `Payment proof for order ${o.no}\nAmount: ${inr(o.total)} by ${o.method}\nUTR / reference: ${o.utr}`,
    confirm: o => `I have checked the invoice for order ${o.no} (${inr(o.total)}) and I confirm it. Please ship.`,
    ask: o => `Hi Automech, about my order ${o.no} (${inr(o.total)}): `
  };

  function readJacks() {
    return [...document.querySelectorAll('#range .spec-table tbody tr')].map(row => {
      const cells = [...row.querySelectorAll('td')], priced = cells.find(c => c.textContent.includes('₹'));
      return cells.length > 1 && priced && { code: cells[0].textContent.trim(), ton: parseInt(cells[1].textContent, 10) || 0, price: +digits(priced.textContent) };
    }).filter(j => j && j.price > 0);
  }

  function renderItems() {
    $('ord-items').innerHTML = jacks.length ? jacks.map(j => {
      const q = cart[j.code] || 0, code = esc(j.code);
      return `<div class="ord-item${q ? ' on' : ''}" data-code="${code}"><span class="chip-ton small">${j.ton} T</span>` +
        `<span class="ord-item-name"><strong>${code}</strong><em>${inr(j.price)} each</em></span><div class="cyl-qty ord-qty">` +
        `<button type="button" class="cyl-step" data-step="-1" aria-label="One fewer ${code}"${q ? '' : ' disabled'}>−</button>` +
        `<input type="number" inputmode="numeric" min="0" max="9999" step="1" value="${q}" aria-label="Quantity of ${code}" />` +
        `<button type="button" class="cyl-step" data-step="1" aria-label="One more ${code}">+</button></div></div>`;
    }).join('') : '<p class="ord-foot">Loading the price list…</p>';
  }

  function totals() {
    const items = jacks.filter(j => cart[j.code] > 0).map(j => ({ ...j, qty: cart[j.code] }));
    return { items, units: items.reduce((n, i) => n + i.qty, 0), amount: items.reduce((n, i) => n + i.qty * i.price, 0) };
  }

  function renderSummary() {
    const t = totals();
    $('ord-lines').innerHTML = t.items.map(i => `<li><span>${i.qty} × ${esc(i.code)}</span><span>${inr(i.qty * i.price)}</span></li>`).join('') ||
      '<li class="none">No jacks chosen yet</li>';
    $('ord-total').textContent = inr(t.amount);
    // Which transfer types fit this amount.
    const opts = [...document.querySelectorAll('#ord-form .pay-opt')];
    opts.forEach(o => {
      const input = o.querySelector('input');
      input.disabled = input.value === 'RTGS' ? t.amount < RTGS_MIN : input.value === 'IMPS' && t.amount > IMPS_MAX;
      if (input.disabled && input.checked) $('ord-form').querySelector('input[value="NEFT"]').checked = true;
    });
    opts.forEach(o => { const input = o.querySelector('input'); o.classList.toggle('on', input.checked); o.classList.toggle('off', input.disabled); });
  }

  function addToOrder(code) {
    hideDone();
    if (!(cart[code] > 0)) { cart[code] = 1; renderItems(); renderSummary(); }
  }

  function placeOrder(e) {
    e.preventDefault();
    const form = $('ord-form'), hint = $('ord-hint'), t = totals(), f = id => $('ord-' + id);
    const stop = (text, el) => { say(hint, text); if (el) el.focus(); };
    if (form.elements['bot-field'].value) return;
    if (!t.items.length) return stop('Choose at least one jack to place an order.', form.querySelector('.ord-item [data-step="1"]'));
    if (!f('name').value.trim()) return stop('Add your name.', f('name'));
    if (digits(f('phone').value).length < 10) return stop('Add a phone number with at least 10 digits.', f('phone'));
    if (f('address').value.trim().length < 5) return stop('Add the delivery address.', f('address'));
    if (!f('city').value.trim()) return stop('Add the city.', f('city'));
    if (digits(f('pin').value).length !== 6) return stop('Add the 6-digit PIN code.', f('pin'));

    const d = new Date(), abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const tail = Array.from(crypto.getRandomValues(new Uint8Array(4)), n => abc[n % abc.length]).join('');
    const order = {
      no: `AM-${two(d.getFullYear() % 100)}${two(d.getMonth() + 1)}${two(d.getDate())}-${tail}`, at: d.toISOString(), status: 'placed',
      items: t.items, units: t.units, total: t.amount, method: form.querySelector('input[name="pay"]:checked').value,
      name: f('name').value.trim(), phone: f('phone').value.trim(), address: f('address').value.trim(),
      city: f('city').value.trim(), pin: digits(f('pin').value), gstin: f('gstin').value.trim().toUpperCase(), utr: ''
    };
    saveOrders([order, ...loadOrders()]);
    // The workshop hears about it two ways: WhatsApp (the buyer presses send there) and the site inbox.
    openWa(MSG.order(order));
    post({ name: order.name, phone: order.phone, model: `ONLINE ORDER ${order.no} — ${order.method} — ${inr(order.total)}`, qty: String(order.units), message: orderLines(order) });
    cart = {};
    say(hint, '');
    renderItems(); renderSummary(); renderOrders();
    showDone(order);
  }

  /* The payment-proof box, or what replaces it once proof is sent. Used on both order pages. */
  function proofArea(o) {
    if (statusOf(o) !== 'placed') return `<p class="ord-row-utr">Payment reference: <strong>${esc(o.utr)}</strong>. We check the transfer and send your invoice on WhatsApp.</p>`;
    return `<div class="proof" data-no="${esc(o.no)}">` +
      '<label class="f-field"><span>UTR / reference number from your bank</span><input class="proof-utr" autocomplete="off" maxlength="30" /></label>' +
      '<label class="f-field"><span>Payment screenshot</span><input class="proof-file" type="file" accept="image/*,application/pdf" /></label>' +
      `<button class="btn btn-primary proof-send" type="button">${WA_ICON} Send proof on WhatsApp</button>` +
      '<p class="ord-note">If your phone asks where to send the screenshot, choose WhatsApp and then Automech. On a computer, attach it in the chat that opens.</p>' +
      '<p class="cyl-hint" role="status" hidden></p></div>';
  }

  function sendProof(box) {
    const hint = box.querySelector('.cyl-hint'), file = box.querySelector('.proof-file').files[0];
    const utr = box.querySelector('.proof-utr').value.toUpperCase().replace(/\s+/g, '');
    if (!/^[A-Z0-9]{6,30}$/.test(utr)) return say(hint, 'Enter the UTR / reference number from your bank (letters and numbers only).');
    if (file && file.size > PROOF_MAX) return say(hint, 'That file is over 5 MB. Choose a smaller screenshot.');
    const o = patchOrder(box.dataset.no, { utr, status: 'proof' });
    if (!o) return;
    // A phone can hand the screenshot straight to WhatsApp. Elsewhere the chat opens with the details.
    if (file && navigator.canShare && navigator.canShare({ files: [file] })) navigator.share({ files: [file], text: MSG.proof(o) }).catch(() => openWa(MSG.proof(o)));
    else openWa(MSG.proof(o));
    post({ name: o.name, phone: o.phone, model: `PAYMENT PROOF ${o.no} — ${o.method} — ${inr(o.total)}`, qty: String(o.units), message: `UTR / reference: ${utr}\n\n${orderLines(o)}` }, file);
    renderOrders();
    if (shown === o.no) $('done-proof').innerHTML = proofArea(o);
  }

  function showDone(o) {
    shown = o.no;
    $('ord-form').hidden = true;
    $('done-no').textContent = $('done-remark').textContent = o.no;
    $('done-total').textContent = inr(o.total);
    $('done-method').textContent = o.method;
    $('done-wa').href = wa(MSG.order(o));
    $('done-proof').innerHTML = proofArea(o);
    $('bank').hidden = !bankShown();
    $('bank-later').hidden = bankShown();
    $('ord-done').hidden = false;
    scrollTo(0, 0);
    $('ord-done').focus({ preventScroll: true });
  }

  function hideDone() {
    if (!$('ord-done')) return;
    shown = null;
    $('ord-done').hidden = true;
    $('ord-form').hidden = false;
  }

  function renderOrders() {
    const list = loadOrders();
    document.querySelectorAll('[data-orders-count]').forEach(c => { c.textContent = list.length; c.hidden = !list.length; });
    $('stat-count').textContent = list.length;
    $('stat-value').textContent = inr(list.reduce((n, o) => n + o.total, 0));
    $('stat-wait').textContent = list.filter(o => statusOf(o) === 'placed').length;
    $('orders-empty').hidden = list.length > 0;

    const STEPS = ['Order sent', 'Payment proof', 'Invoice confirmed', 'Shipped'];
    const CHIP = { placed: ['wait', 'Awaiting payment'], proof: ['paid', 'Proof sent'], confirmed: ['paid', 'Confirmed'] };
    $('orders-list').innerHTML = list.map(o => {
      const st = statusOf(o), done = { placed: 1, proof: 2, confirmed: 3 }[st];
      const when = new Date(o.at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
      return `<article class="form-card ord-row" data-no="${esc(o.no)}">` +
        `<header class="ord-row-top"><div><h3 class="ord-row-no">${esc(o.no)}</h3><p class="ord-row-meta">${esc(when)} · ${esc(o.method)}</p></div>` +
        `<span class="ord-status ${CHIP[st][0]}">${CHIP[st][1]}</span></header>` +
        `<ol class="trk">${STEPS.map((s, n) => `<li class="${n < done ? 'done' : n === done ? 'now' : ''}">${s}</li>`).join('')}</ol>` +
        `<ul class="ord-lines">${o.items.map(i => `<li><span>${i.qty} × ${esc(i.code)} · ${i.ton} T</span><span>${inr(i.qty * i.price)}</span></li>`).join('')}</ul>` +
        `<div class="ord-total"><span>Total</span><strong>${inr(o.total)}</strong></div>` +
        proofArea(o) +
        (st === 'proof' ? `<p class="ord-note">Got our invoice on WhatsApp? Check it, then confirm so we can ship.</p><button class="btn btn-primary inv-confirm" type="button">${WA_ICON} Confirm invoice on WhatsApp</button>` : '') +
        (st === 'confirmed' ? '<p class="ord-row-utr">Invoice confirmed. We message you on WhatsApp when your order ships.</p>' : '') +
        `<div class="ord-row-actions">${st === 'placed' ? `<a class="btn btn-ghost btn-sm" href="${esc(wa(MSG.order(o)))}" target="_blank" rel="noreferrer">Send order again</a>` : ''}` +
        `<a class="btn btn-ghost btn-sm" href="${esc(wa(MSG.ask(o)))}" target="_blank" rel="noreferrer">Ask about this order</a></div></article>`;
    }).join('');
  }

  function wireOrders() {
    const form = $('ord-form'), items = $('ord-items');
    if (!form) return;
    items.addEventListener('input', e => {
      const row = e.target.closest('.ord-item');
      if (!row || e.target.value === '') return;
      const q = cart[row.dataset.code] = clamp(e.target.value, 0, 9999);
      row.classList.toggle('on', q > 0);
      row.querySelector('[data-step="-1"]').disabled = q <= 0;
      renderSummary();
      say($('ord-hint'), '');
    });
    items.addEventListener('focusout', e => { const row = e.target.closest('.ord-item'); if (row && e.target.matches('input')) e.target.value = cart[row.dataset.code] || 0; });
    form.addEventListener('change', e => { if (e.target.name === 'pay') renderSummary(); });
    $('ord-pin').addEventListener('input', e => { e.target.value = digits(e.target.value).slice(0, 6); });
    form.addEventListener('submit', placeOrder);
    $('done-again').addEventListener('click', () => { hideDone(); scrollTo(0, 0); });

    document.addEventListener('click', e => {
      const proof = e.target.closest('.proof-send'), confirm = e.target.closest('.inv-confirm');
      if (proof) sendProof(proof.closest('.proof'));
      if (confirm) {
        const o = patchOrder(confirm.closest('.ord-row').dataset.no, { status: 'confirmed' });
        if (o) { openWa(MSG.confirm(o)); renderOrders(); }
      }
    });
    addEventListener('storage', e => { if (e.key === STORE) renderOrders(); });   // another tab changed an order

    jacks = readJacks();
    renderItems(); renderSummary(); renderOrders();
  }

  /* ================= start ================= */

  function start(mainEl) {
    main = mainEl;
    // Pages written in index.html (cylinders, order, my orders) wait outside the app; bring them in.
    const extra = [...document.querySelectorAll('body > section.section')];
    extra.forEach(sec => main.appendChild(sec));
    // Same entrance as the app's own sections, in case its observer missed these blocks.
    const io = new IntersectionObserver(entries => entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } }), { threshold: 0.05 });
    extra.forEach(sec => sec.querySelectorAll('.reveal').forEach(el => io.observe(el)));

    pager = main.appendChild(document.createElement('nav'));
    pager.className = 'pager wrap';
    pager.setAttribute('aria-label', 'Previous and next page');

    wireNavigation();
    wireCylinders();
    wireGallery();
    wireOrders();
    show(current, false);
  }

  // The app draws the page a moment after this script runs; start once its <main> and price table exist.
  const app = $('root'), ready = () => app.querySelector('main') && app.querySelector('#range .spec-table tbody tr') && app.querySelector('main');
  if (ready()) start(ready());
  else if (app) {
    const mo = new MutationObserver(() => { const m = ready(); if (m) { mo.disconnect(); start(m); } });
    mo.observe(app, { childList: true, subtree: true });
  }
})();
