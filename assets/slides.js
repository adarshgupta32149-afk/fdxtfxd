/* Slide navigation and the cylinder order form.
 *
 * The site itself is a pre-built React bundle (assets/index-*.js). This file sits on top of it:
 *   1. shows one section at a time and animates the change when a menu link is clicked,
 *   2. adds Previous / Next at the foot of every page,
 *   3. runs the stroke selector and quote form on the cylinders page.
 * Which section is showing lives in <html data-view="…">; assets/slides.css does the hiding.
 */
(function () {
  'use strict';

  var VIEWS = [
    ['top', 'Home'],
    ['range', 'Jacks'],
    ['cylinders', 'Cylinders'],
    ['order', 'Order'],
    ['build', 'Built Different'],
    ['process', 'Process'],
    ['industries', 'Industries'],
    ['contact', 'Contact']
  ];
  // Pages reached from another page rather than from Previous / Next: id -> the page they belong to.
  var ASIDE = { orders: 'order' };
  var IDS = VIEWS.map(function (v) { return v[0]; }).concat(Object.keys(ASIDE));
  var WHATSAPP = '918090688246';
  var EMAIL = 'automechhydraulic@gmail.com';

  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var current = root.getAttribute('data-view') || 'top';
  var main = null;
  var pager = null;
  var running = null;

  function isView(id) { return IDS.indexOf(id) > -1; }
  function two(n) { return (n < 10 ? '0' : '') + n; }

  /* ---------------- pages ---------------- */

  function renderPager() {
    var home = ASIDE[current] || current;
    var i = VIEWS.map(function (v) { return v[0]; }).indexOf(home), prev = VIEWS[i - 1], next = VIEWS[i + 1];
    if (ASIDE[current]) { prev = VIEWS[i]; }
    pager.innerHTML =
      (prev ? '<a class="pager-prev" href="#' + prev[0] + '"><span>Previous</span><strong>← ' + prev[1] + '</strong></a>' : '') +
      '<span class="pager-count" aria-label="Page ' + (i + 1) + ' of ' + VIEWS.length + '"><b>' + two(i + 1) + '</b> / ' + two(VIEWS.length) + '</span>' +
      (next ? '<a class="pager-next" href="#' + next[0] + '"><span>Next</span><strong>' + next[1] + ' →</strong></a>' : '');
  }

  function markMenu() {
    var links = document.querySelectorAll('.nav a, .mnav a');
    for (var i = 0; i < links.length; i++) {
      if (links[i].getAttribute('href') === '#' + (ASIDE[current] || current)) links[i].setAttribute('aria-current', 'page');
      else links[i].removeAttribute('aria-current');
    }
  }

  function show(id, focus) {
    current = id;
    root.setAttribute('data-view', id);
    window.scrollTo(0, 0);
    renderPager();
    markMenu();
    document.dispatchEvent(new CustomEvent('automech:view', { detail: id }));
    if (focus) {
      var sec = document.getElementById(id);
      if (sec) { sec.setAttribute('tabindex', '-1'); sec.focus({ preventScroll: true }); }
    }
  }

  function go(id, opts) {
    if (!isView(id) || !main) return;
    opts = opts || {};
    if (id === current && !running) {
      window.scrollTo({ top: 0, behavior: reduce.matches ? 'auto' : 'smooth' });
      return;
    }
    var from = IDS.indexOf(running ? running.to : current);
    var dir = IDS.indexOf(id) >= from ? 1 : -1;
    if (opts.push !== false) {
      // Some embedded previews do not allow changing the address; the page still changes.
      try { history.pushState({ view: id }, '', id === 'top' ? location.pathname + location.search : '#' + id); } catch (err) { /* keep going */ }
    }
    if (running) { running.anim.cancel(); running = null; }
    if (reduce.matches || !main.animate) { show(id, true); return; }

    var out = main.animate(
      [{ opacity: 1, transform: 'translateX(0)' }, { opacity: 0, transform: 'translateX(' + (-dir * 22) + 'px)' }],
      { duration: 150, easing: 'cubic-bezier(.4, 0, 1, 1)', fill: 'forwards' }
    );
    running = { anim: out, to: id };
    out.onfinish = function () {
      if (!running || running.anim !== out) return;
      show(id, true);
      out.cancel();
      var inn = main.animate(
        [{ opacity: 0, transform: 'translateX(' + (dir * 34) + 'px)' }, { opacity: 1, transform: 'translateX(0)' }],
        { duration: 420, easing: 'cubic-bezier(.2, .7, .3, 1)' }
      );
      running = { anim: inn, to: id };
      inn.onfinish = inn.oncancel = function () { if (running && running.anim === inn) running = null; };
    };
  }

  function wireNavigation() {
    // Every in-page link (menu, footer, buttons, logo) changes page instead of scrolling.
    document.addEventListener('click', function (e) {
      if (e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!a) return;
      var id = a.getAttribute('href').slice(1);
      if (a.classList.contains('totop')) {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: reduce.matches ? 'auto' : 'smooth' });
        return;
      }
      if (!isView(id)) return;
      e.preventDefault();
      // A link can carry something for the page it opens (the jack to put in the order).
      if (a.hasAttribute('data-order')) {
        document.dispatchEvent(new CustomEvent('automech:order', { detail: a.getAttribute('data-order') }));
      }
      go(id);
    }, true);

    // Browser back / forward.
    window.addEventListener('popstate', function () {
      var id = location.hash.slice(1);
      go(isView(id) ? id : 'top', { push: false });
    });

    // The app scrolls to the jack range from a few buttons ("View specs", footer models).
    // When that section is on another page, go to the page instead.
    var nativeScroll = Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView = function () {
      var sec = this.closest ? this.closest('main > section') : null;
      if (sec && sec.id !== current && isView(sec.id)) { go(sec.id); return; }
      return nativeScroll.apply(this, arguments);
    };
  }

  /* ---------------- cylinder order form ---------------- */

  function wireCylinders(section) {
    var form = section.querySelector('#cyl-form');
    if (!form) return;
    var range = form.querySelector('#cyl-stroke');
    var num = form.querySelector('#cyl-stroke-num');
    var qty = form.querySelector('#cyl-qty');
    var city = form.querySelector('#cyl-city');
    var name = form.querySelector('#cyl-name');
    var phone = form.querySelector('#cyl-phone');
    var notes = form.querySelector('#cyl-notes');
    var send = form.querySelector('#cyl-send');
    var sendLabel = send.querySelector('span');
    var wa = form.querySelector('#cyl-wa');
    var hint = form.querySelector('#cyl-hint');
    var unit = (form.querySelector('.cyl-unit') || {}).textContent || 'mm';
    var MIN = +range.min, MAX = +range.max;
    var hintTimer = 0;

    function clamp(v, lo, hi) { v = Math.round(+v); if (isNaN(v)) v = lo; return Math.min(hi, Math.max(lo, v)); }
    function stroke() { return clamp(num.value, MIN, MAX); }
    function pieces() { return Math.max(1, clamp(qty.value, 1, 99999)); }

    function summary() {
      var lines = ['Stroke: ' + stroke() + ' ' + unit, 'Quantity: ' + pieces()];
      if (city.value.trim()) lines.push('Deliver to: ' + city.value.trim());
      if (notes.value.trim()) lines.push('Notes: ' + notes.value.trim());
      return lines;
    }

    function say(text, ok) {
      window.clearTimeout(hintTimer);
      if (!text) { hint.hidden = true; return; }
      hint.textContent = text;
      hint.className = 'cyl-hint' + (ok ? ' ok' : '');
      hint.hidden = false;
      if (ok) hintTimer = window.setTimeout(function () { hint.hidden = true; }, 9000);
    }

    function paint() {
      var s = stroke();
      range.value = s;
      range.style.setProperty('--pct', ((s - MIN) / (MAX - MIN) * 100) + '%');
      var steps = form.querySelectorAll('.cyl-step');
      for (var i = 0; i < steps.length; i++) {
        var b = steps[i], d = +b.getAttribute('data-step');
        if (b.getAttribute('data-for') === 'cyl-qty') b.disabled = d < 0 && pieces() <= 1;
        else b.disabled = (d < 0 && s <= MIN) || (d > 0 && s >= MAX);
      }
      var none = s <= 0;
      wa.setAttribute('aria-disabled', none ? 'true' : 'false');
      if (none) wa.setAttribute('tabindex', '-1'); else wa.removeAttribute('tabindex');
      send.disabled = none || send.getAttribute('data-busy') === '1';
      wa.href = 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(
        "Hi Automech, I'd like a quote for hydraulic cylinders.\n" + summary().join('\n'));
      if (none) say('Choose a stroke above 0 ' + unit + ' to ask for a quote.');
      else if (!hint.classList.contains('ok')) say('');
    }

    range.addEventListener('input', function () { num.value = range.value; paint(); });
    num.addEventListener('input', function () { if (num.value !== '') paint(); });
    num.addEventListener('blur', function () { num.value = stroke(); paint(); });
    qty.addEventListener('blur', function () { qty.value = pieces(); paint(); });
    [qty, city, notes].forEach(function (el) { el.addEventListener('input', paint); });

    form.addEventListener('click', function (e) {
      var b = e.target.closest('.cyl-step');
      if (!b) return;
      var d = +b.getAttribute('data-step');
      if (b.getAttribute('data-for') === 'cyl-qty') qty.value = Math.max(1, pieces() + d);
      else num.value = clamp(stroke() + d, MIN, MAX);
      paint();
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      num.value = stroke(); qty.value = pieces(); paint();
      if (stroke() <= 0) return;
      if (form.querySelector('[name="bot-field"]').value) return;
      if (!name.value.trim()) { say('Add your name so we know who to reply to.'); name.focus(); return; }
      if (phone.value.replace(/\D/g, '').length < 10) { say('Add a phone number with at least 10 digits.'); phone.focus(); return; }

      var model = 'Hydraulic cylinder — ' + stroke() + ' ' + unit + ' stroke';
      var message = summary().slice(2).join('\n');
      var body = new URLSearchParams();
      body.append('form-name', 'enquiry');
      body.append('name', name.value.trim());
      body.append('phone', phone.value.trim());
      body.append('model', model);
      body.append('qty', String(pieces()));
      body.append('message', message);

      var done = function (text) {
        send.removeAttribute('data-busy'); sendLabel.textContent = 'Request quote'; paint(); say(text, true);
      };
      send.setAttribute('data-busy', '1'); send.disabled = true; sendLabel.textContent = 'Sending…';

      fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body.toString() })
        .then(function (r) {
          if (!r.ok) throw new Error(String(r.status));
          done("Request received — it's with the workshop now. We'll reply to the number you left, usually the same day.");
        })
        .catch(function () {
          // No form service (or offline): hand the same details to the visitor's email app.
          var mail = ['Model: ' + model, 'Quantity: ' + pieces(), 'Name: ' + name.value.trim(), 'Phone: ' + phone.value.trim(), '', message]
            .join('\n');
          window.location.href = 'mailto:' + EMAIL + '?subject=' + encodeURIComponent('Enquiry: ' + model) + '&body=' + encodeURIComponent(mail);
          done('Your email app should open with everything filled in. If it did not, write to ' + EMAIL + '.');
        });
    });

    paint();
  }

  /* ---------------- start ---------------- */

  function start(mainEl) {
    main = mainEl;

    // Pages written in index.html (cylinders, order, my orders) wait outside the app; bring them in.
    var extra = document.querySelectorAll('body > section.section');
    for (var n = 0; n < extra.length; n++) main.appendChild(extra[n]);
    var cyl = document.getElementById('cylinders');
    if (cyl) wireCylinders(cyl);
    // Same entrance as the app's own sections, in case its observer missed these blocks.
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
      }, { threshold: 0.05 });
      for (var k = 0; k < extra.length; k++) {
        var items = extra[k].querySelectorAll('.reveal');
        for (var i = 0; i < items.length; i++) io.observe(items[i]);
      }
    }

    pager = document.createElement('nav');
    pager.className = 'pager wrap';
    pager.setAttribute('aria-label', 'Previous and next page');
    main.appendChild(pager);

    wireNavigation();
    renderPager();
    markMenu();
    document.dispatchEvent(new CustomEvent('automech:view', { detail: current }));
  }

  function waitForApp() {
    var app = document.getElementById('root');
    var found = app && app.querySelector('main');
    if (found) { start(found); return; }
    if (!app) return;
    var mo = new MutationObserver(function () {
      var m = app.querySelector('main');
      if (m) { mo.disconnect(); start(m); }
    });
    mo.observe(app, { childList: true, subtree: true });
  }

  waitForApp();
})();
