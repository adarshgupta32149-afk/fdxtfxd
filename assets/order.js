/* Online order, bank-transfer payment and "My orders".
 *
 * - The jack list and prices are read from the datasheet table the site already shows,
 *   so there is one place to change a price.
 * - An order is sent to the workshop through the site's existing Netlify form ("enquiry")
 *   and kept in this browser (localStorage) so the buyer can see it under My orders.
 * - Nothing here takes money: the buyer pays from their own bank app (NEFT / IMPS / RTGS)
 *   and can add the bank's UTR / reference number afterwards.
 */
(function () {
  'use strict';

  var KEY = 'automech.orders.v1';
  var WHATSAPP = '918090688246';
  var RTGS_MIN = 200000;   // RTGS is for Rs 2,00,000 and above
  var IMPS_MAX = 500000;   // IMPS carries up to Rs 5,00,000 per transfer

  var jacks = [];          // [{ code, ton, price }]
  var cart = {};           // code -> quantity
  var memory = [];         // used when the browser will not store anything
  var shown = null;        // order number on the confirmation panel

  function $(id) { return document.getElementById(id); }
  function inr(n) { return '₹' + Number(n).toLocaleString('en-IN'); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function digits(s) { return String(s).replace(/\D/g, ''); }

  function loadOrders() {
    try { var v = JSON.parse(localStorage.getItem(KEY)); return Array.isArray(v) ? v : memory; } catch (e) { return memory; }
  }
  function saveOrders(list) {
    memory = list;
    try { localStorage.setItem(KEY, JSON.stringify(list)); } catch (e) { /* private window: kept for this visit only */ }
  }

  function sendToWorkshop(fields) {
    var body = new URLSearchParams();
    body.append('form-name', 'enquiry');
    Object.keys(fields).forEach(function (k) { body.append(k, fields[k]); });
    return fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body.toString() })
      .then(function (r) { if (!r.ok) throw new Error(String(r.status)); return true; })
      .catch(function () { return false; });
  }

  function waLink(text) { return 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(text); }

  function orderText(o) {
    var lines = ['Hi Automech, this is my order ' + o.no + '.'];
    o.items.forEach(function (it) { lines.push(it.qty + ' x ' + it.code + ' (' + it.ton + ' T) - ' + inr(it.qty * it.price)); });
    lines.push('Total: ' + inr(o.total), 'Paying by: ' + o.method);
    if (o.utr) lines.push('Payment reference (UTR): ' + o.utr);
    lines.push('Deliver to: ' + o.name + ', ' + o.address + ', ' + o.city + ' - ' + o.pin, 'Phone: ' + o.phone);
    if (o.gstin) lines.push('GSTIN: ' + o.gstin);
    return lines.join('\n');
  }

  /* ---------------- the jack list ---------------- */

  function readJacks() {
    var rows = document.querySelectorAll('#range .spec-table tbody tr'), out = [];
    for (var i = 0; i < rows.length; i++) {
      var cells = rows[i].querySelectorAll('td'), price = 0;
      if (cells.length < 2) continue;
      for (var c = 0; c < cells.length; c++) {
        if (cells[c].textContent.indexOf('₹') > -1) price = parseInt(digits(cells[c].textContent), 10) || 0;
      }
      var ton = parseInt(cells[1].textContent, 10) || 0;
      if (price > 0) out.push({ code: cells[0].textContent.trim(), ton: ton, price: price });
    }
    return out;
  }

  function renderItems() {
    var box = $('ord-items');
    if (!box) return;
    if (!jacks.length) { box.innerHTML = '<p class="ord-foot">Loading the price list…</p>'; return; }
    box.innerHTML = jacks.map(function (j) {
      var q = cart[j.code] || 0;
      return '<div class="ord-item' + (q ? ' on' : '') + '" data-code="' + esc(j.code) + '">' +
        '<span class="chip-ton small">' + j.ton + ' T</span>' +
        '<span class="ord-item-name"><strong>' + esc(j.code) + '</strong><em>' + inr(j.price) + ' each</em></span>' +
        '<div class="cyl-qty ord-qty">' +
          '<button type="button" class="cyl-step" data-d="-1" aria-label="One fewer ' + esc(j.code) + '"' + (q ? '' : ' disabled') + '>−</button>' +
          '<input type="number" inputmode="numeric" min="0" step="1" value="' + q + '" aria-label="Quantity of ' + esc(j.code) + '" />' +
          '<button type="button" class="cyl-step" data-d="1" aria-label="One more ' + esc(j.code) + '">+</button>' +
        '</div></div>';
    }).join('');
  }

  function totals() {
    var units = 0, amount = 0, items = [];
    jacks.forEach(function (j) {
      var q = cart[j.code] || 0;
      if (q > 0) { units += q; amount += q * j.price; items.push({ code: j.code, ton: j.ton, price: j.price, qty: q }); }
    });
    return { units: units, amount: amount, items: items };
  }

  function chosenMethod() {
    var r = document.querySelector('#ord-form input[name="pay"]:checked');
    return r ? r.value : '';
  }

  function say(el, text, ok) {
    if (!el) return;
    if (!text) { el.hidden = true; return; }
    el.textContent = text;
    el.className = 'cyl-hint' + (ok ? ' ok' : '');
    el.hidden = false;
  }

  function renderSummary() {
    var t = totals(), lines = $('ord-lines');
    if (!lines) return;
    lines.innerHTML = t.items.length
      ? t.items.map(function (it) { return '<li><span>' + it.qty + ' × ' + esc(it.code) + '</span><span>' + inr(it.qty * it.price) + '</span></li>'; }).join('')
      : '<li class="none">No jacks chosen yet</li>';
    $('ord-total').textContent = inr(t.amount);

    // Which transfer types fit this amount.
    var opts = document.querySelectorAll('#ord-form .pay-opt');
    for (var i = 0; i < opts.length; i++) {
      var input = opts[i].querySelector('input'), off = false;
      if (input.value === 'RTGS') off = t.amount < RTGS_MIN;
      if (input.value === 'IMPS') off = t.amount > IMPS_MAX;
      input.disabled = off;
      if (off && input.checked) { input.checked = false; document.querySelector('#ord-form input[value="NEFT"]').checked = true; }
    }
    for (var k = 0; k < opts.length; k++) {
      var inp = opts[k].querySelector('input');
      opts[k].classList.toggle('on', inp.checked);
      opts[k].classList.toggle('off', inp.disabled);
    }
  }

  function setQty(code, q) {
    q = Math.max(0, Math.min(9999, Math.round(+q) || 0));
    cart[code] = q;
    var row = document.querySelector('#ord-items .ord-item[data-code="' + code + '"]');
    if (row) {
      row.classList.toggle('on', q > 0);
      var input = row.querySelector('input');
      if (document.activeElement !== input || String(q) !== input.value) input.value = q;
      row.querySelector('[data-d="-1"]').disabled = q <= 0;
    }
    renderSummary();
    say($('ord-hint'), '');
  }

  /* ---------------- placing an order ---------------- */

  function newNumber() {
    var d = new Date(), abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', tail = '';
    for (var i = 0; i < 4; i++) tail += abc.charAt(Math.floor(Math.random() * abc.length));
    var two = function (n) { return (n < 10 ? '0' : '') + n; };
    return 'AM-' + String(d.getFullYear()).slice(2) + two(d.getMonth() + 1) + two(d.getDate()) + '-' + tail;
  }

  function placeOrder(e) {
    e.preventDefault();
    var form = $('ord-form'), hint = $('ord-hint'), t = totals();
    if (form.querySelector('[name="bot-field"]').value) return;
    var f = { name: $('ord-name'), phone: $('ord-phone'), address: $('ord-address'), city: $('ord-city'), pin: $('ord-pin'), gstin: $('ord-gstin') };
    var stop = function (text, el) { say(hint, text); if (el) el.focus(); };

    if (!t.items.length) return stop('Choose at least one jack to place an order.', document.querySelector('#ord-items [data-d="1"]'));
    if (!f.name.value.trim()) return stop('Add your name.', f.name);
    if (digits(f.phone.value).length < 10) return stop('Add a phone number with at least 10 digits.', f.phone);
    if (f.address.value.trim().length < 5) return stop('Add the delivery address.', f.address);
    if (!f.city.value.trim()) return stop('Add the city.', f.city);
    if (digits(f.pin.value).length !== 6) return stop('Add the 6-digit PIN code.', f.pin);
    if (!chosenMethod()) return stop('Choose NEFT, IMPS or RTGS.');

    var order = {
      no: newNumber(), at: new Date().toISOString(),
      items: t.items, units: t.units, total: t.amount, method: chosenMethod(),
      name: f.name.value.trim(), phone: f.phone.value.trim(), address: f.address.value.trim(),
      city: f.city.value.trim(), pin: digits(f.pin.value), gstin: f.gstin.value.trim().toUpperCase(),
      utr: '', sent: false
    };

    var btn = $('ord-place'), label = btn.querySelector('span');
    btn.disabled = true; label.textContent = 'Placing order…';
    say(hint, '');

    sendToWorkshop({
      name: order.name,
      phone: order.phone,
      model: 'ONLINE ORDER ' + order.no + ' — ' + order.method + ' — ' + inr(order.total),
      qty: String(order.units),
      message: orderText(order)
    }).then(function (sent) {
      order.sent = sent;
      saveOrders([order].concat(loadOrders()));
      btn.disabled = false; label.textContent = 'Place order';
      cart = {};
      renderItems(); renderSummary(); renderOrders();
      showDone(order);
    });
  }

  function showDone(o) {
    shown = o.no;
    $('ord-form').hidden = true;
    var done = $('ord-done');
    $('done-no').textContent = o.no;
    $('done-sent').textContent = o.sent
      ? 'The workshop has your order. Pay the amount below from your bank app, then add the reference number here.'
      : 'Saved on this device, but it could not be sent to the workshop automatically. Tap "Send order on WhatsApp" below so we receive it.';
    $('done-total').textContent = inr(o.total);
    $('done-method').textContent = o.method;
    $('done-remark').textContent = o.no;
    $('done-wa').href = waLink(orderText(o));
    $('done-utr').value = o.utr || '';
    say($('done-hint'), '');

    // Bank details are typed into index.html; show them only when all are there.
    var cells = done.querySelectorAll('[data-bank]'), filled = cells.length > 0;
    for (var i = 0; i < cells.length; i++) if (!cells[i].textContent.trim()) filled = false;
    $('bank').hidden = !filled;
    $('bank-later').hidden = filled;
    if (!filled) $('done-wa').href = waLink(orderText(o) + '\n\nPlease send your bank account details for the transfer.');

    done.hidden = false;
    window.scrollTo(0, 0);
    done.focus({ preventScroll: true });
  }

  function hideDone() {
    shown = null;
    $('ord-done').hidden = true;
    $('ord-form').hidden = false;
  }

  function saveUtr(no, value, hintEl, after) {
    var utr = String(value).trim().toUpperCase().replace(/\s+/g, '');
    if (!/^[A-Z0-9]{6,30}$/.test(utr)) { say(hintEl, 'Enter the UTR / reference number from your bank (letters and numbers only).'); return; }
    var list = loadOrders(), order = null;
    list.forEach(function (o) { if (o.no === no) { o.utr = utr; order = o; } });
    if (!order) return;
    saveOrders(list);
    renderOrders();
    sendToWorkshop({
      name: order.name,
      phone: order.phone,
      model: 'PAYMENT REPORTED ' + order.no + ' — ' + order.method + ' — ' + inr(order.total),
      qty: String(order.units),
      message: 'UTR / reference: ' + utr + '\n\n' + orderText(order)
    }).then(function (sent) {
      say(hintEl, sent
        ? 'Reference saved and sent to the workshop. We confirm once the transfer shows in our account.'
        : 'Reference saved on this device. Send it to us on WhatsApp so we can match your payment.', sent);
      if (after) after(order);
    });
  }

  /* ---------------- my orders ---------------- */

  function renderOrders() {
    var list = loadOrders(), value = 0, waiting = 0;
    list.forEach(function (o) { value += o.total; if (!o.utr) waiting++; });

    var counts = document.querySelectorAll('[data-orders-count]');
    for (var i = 0; i < counts.length; i++) { counts[i].textContent = list.length; counts[i].hidden = !list.length; }
    if (!$('orders-list')) return;
    $('stat-count').textContent = list.length;
    $('stat-value').textContent = inr(value);
    $('stat-wait').textContent = waiting;
    $('orders-empty').hidden = list.length > 0;

    $('orders-list').innerHTML = list.map(function (o) {
      var when = new Date(o.at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
      return '<article class="form-card ord-row" data-no="' + esc(o.no) + '">' +
        '<header class="ord-row-top"><div><h3 class="ord-row-no">' + esc(o.no) + '</h3><p class="ord-row-meta">' + esc(when) + ' · ' + esc(o.method) + '</p></div>' +
          '<span class="ord-status ' + (o.utr ? 'paid' : 'wait') + '">' + (o.utr ? 'Payment reported' : 'Awaiting payment') + '</span></header>' +
        '<ul class="ord-lines">' + o.items.map(function (it) {
          return '<li><span>' + it.qty + ' × ' + esc(it.code) + ' · ' + it.ton + ' T</span><span>' + inr(it.qty * it.price) + '</span></li>';
        }).join('') + '</ul>' +
        '<div class="ord-total"><span>Total</span><strong>' + inr(o.total) + '</strong></div>' +
        (o.sent ? '' : '<p class="ord-row-warn">Not sent to the workshop yet. Use the WhatsApp button so we receive it.</p>') +
        (o.utr
          ? '<p class="ord-row-utr">Payment reference: <strong>' + esc(o.utr) + '</strong></p>'
          : '<div class="ord-utr"><label class="f-field"><span>Paid? Add the UTR / reference number</span><input class="row-utr" autocomplete="off" maxlength="30" /></label>' +
            '<button class="btn btn-ghost row-utr-save" type="button">Save reference</button></div>') +
        '<p class="cyl-hint row-hint" role="status" hidden></p>' +
        '<div class="ord-row-actions"><a class="btn btn-ghost btn-sm" href="' + esc(waLink(orderText(o))) + '" target="_blank" rel="noreferrer">Ask about this order</a></div>' +
        '</article>';
    }).join('');
  }

  /* ---------------- start ---------------- */

  function wire() {
    var form = $('ord-form');
    if (!form) return;

    $('ord-items').addEventListener('click', function (e) {
      var b = e.target.closest('.cyl-step'); if (!b) return;
      var row = b.closest('.ord-item'), code = row.getAttribute('data-code');
      setQty(code, (cart[code] || 0) + (+b.getAttribute('data-d')));
    });
    $('ord-items').addEventListener('input', function (e) {
      var row = e.target.closest('.ord-item'); if (!row || e.target.value === '') return;
      setQty(row.getAttribute('data-code'), e.target.value);
    });
    $('ord-items').addEventListener('focusout', function (e) {
      var row = e.target.closest && e.target.closest('.ord-item');
      if (row && e.target.tagName === 'INPUT') e.target.value = cart[row.getAttribute('data-code')] || 0;
    });
    form.addEventListener('change', function (e) { if (e.target.name === 'pay') renderSummary(); });
    $('ord-pin').addEventListener('input', function () { this.value = digits(this.value).slice(0, 6); });
    form.addEventListener('submit', placeOrder);

    $('done-utr-save').addEventListener('click', function () {
      if (shown) saveUtr(shown, $('done-utr').value, $('done-hint'), function (o) { $('done-wa').href = waLink(orderText(o)); });
    });
    $('done-again').addEventListener('click', function () { hideDone(); window.scrollTo(0, 0); });

    $('orders-list').addEventListener('click', function (e) {
      var b = e.target.closest('.row-utr-save'); if (!b) return;
      var row = b.closest('.ord-row'), no = row.getAttribute('data-no');
      // The list is redrawn after saving, so point the message at the new copy of this order's card.
      saveUtr(no, row.querySelector('.row-utr').value, row.querySelector('.row-hint'), function () {
        var again = document.querySelector('.ord-row[data-no="' + no + '"] .row-hint');
        say(again, 'Reference saved. We confirm once the transfer shows in our account.', true);
      });
    });

    // "Order online" on a jack's page puts that jack in the order.
    document.addEventListener('automech:order', function (e) {
      hideDone();
      if (e.detail && !(cart[e.detail] > 0)) { cart[e.detail] = 1; renderItems(); renderSummary(); }
    });
    document.addEventListener('automech:view', function (e) {
      if (e.detail === 'orders') renderOrders();
      // The "order placed" panel is for right after ordering; coming back later shows the form again.
      if (e.detail !== 'order') hideDone();
      if (e.detail === 'order' && !jacks.length) boot();
    });
    // Another tab placed or updated an order.
    window.addEventListener('storage', function (e) { if (e.key === KEY) renderOrders(); });
  }

  function boot() {
    jacks = readJacks();
    renderItems();
    renderSummary();
    renderOrders();
    return jacks.length > 0;
  }

  wire();
  if (!boot()) {
    // The price table is drawn by the app a moment after this script runs.
    var app = document.getElementById('root');
    if (app && 'MutationObserver' in window) {
      var mo = new MutationObserver(function () { if (boot()) mo.disconnect(); });
      mo.observe(app, { childList: true, subtree: true });
    }
  }
})();
