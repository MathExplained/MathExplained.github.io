/* ============================================================
   MathEXplained — Shared site behaviour
   Nav state, banner dismissal, scroll affordances, archive filter.
   ============================================================ */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Mark the current page in the nav ---------- */
  (function activeNav() {
    var here = location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-right a[href]').forEach(function (a) {
      var href = a.getAttribute('href');
      if (href && href.split('/').pop() === here) {
        a.classList.add('is-active');
        a.setAttribute('aria-current', 'page');
      }
    });
  })();

  /* ---------- Dismissible announcement banner ---------- */
  (function banner() {
    var el = document.querySelector('.announcement-banner');
    if (!el) return;

    // Key on the message itself, so publishing a new announcement
    // re-shows the bar for people who dismissed the previous one.
    var key = 'mx-banner:' + (el.dataset.bannerId || el.textContent.trim().slice(0, 60));
    var store;
    try { store = window.localStorage; } catch (e) { store = null; }

    function hide() {
      document.body.classList.add('banner-hidden');
      el.remove();
      document.documentElement.style.removeProperty('--banner-h');
    }

    if (store && store.getItem(key)) { hide(); return; }

    // The banner is fixed-position and the header sits directly beneath it,
    // so --banner-h has to match its real rendered height. Announcement text
    // that wraps to two lines on a phone would otherwise slide under the header.
    function measure() {
      document.documentElement.style.setProperty('--banner-h', el.offsetHeight + 'px');
    }
    measure();
    window.addEventListener('resize', measure, { passive: true });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);

    var close = document.createElement('button');
    close.type = 'button';
    close.className = 'banner-close';
    close.setAttribute('aria-label', 'Dismiss announcement');
    close.innerHTML = '&times;';
    close.addEventListener('click', function () {
      hide();
      if (store) { try { store.setItem(key, '1'); } catch (e) { /* quota / private mode */ } }
    });
    el.appendChild(close);
  })();

  /* ---------- Shadow the header once the page scrolls ---------- */
  (function headerState() {
    var header = document.querySelector('.headerbar');
    if (!header) return;
    var ticking = false;
    function update() {
      ticking = false;
      header.classList.toggle('is-scrolled', window.scrollY > 12);
    }
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    }, { passive: true });
    update();
  })();

  /* ---------- Reveal cards as they scroll into view ---------- */
  (function reveal() {
    var targets = document.querySelectorAll('.release-card, .staff-card, .info-card');
    if (!targets.length) return;

    if (reduceMotion || !('IntersectionObserver' in window)) {
      targets.forEach(function (el) { el.classList.add('is-revealed'); });
      return;
    }

    targets.forEach(function (el) { el.classList.add('will-reveal'); });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-revealed');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });

    targets.forEach(function (el) { io.observe(el); });
  })();

  /* ---------- Close staff modals with Escape ---------- */
  (function modalEscape() {
    if (!document.querySelector('.staff-modal')) return;
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && location.hash && location.hash !== '#close') {
        location.hash = '#close';
      }
    });
  })();

  /* ---------- Count the hero stats up from zero ----------
     Runs after heroStats has written the real figures, so the target is
     whatever is in the DOM — derived or hard-coded, with any '+' suffix
     preserved. Fires once per page load, when the stats scroll into view. */
  (function heroStatsCountUp() {
    var stats = document.querySelectorAll('.hero-stats dt');
    if (!stats.length || reduceMotion) return;

    var DURATION = 1800;

    function animate(el) {
      var text = el.textContent.trim();
      var target = parseInt(text, 10);
      if (isNaN(target)) return;
      // Keep everything that isn't the leading number, e.g. the '+' in '100+'.
      var suffix = text.slice(String(target).length);
      var start;

      el.textContent = '0' + suffix;

      function frame(now) {
        if (start === undefined) start = now;
        var t = Math.min((now - start) / DURATION, 1);
        // easeOutCubic: quick off the mark, settling gently onto the final value.
        var eased = 1 - Math.pow(1 - t, 3);
        el.textContent = Math.round(eased * target) + suffix;
        if (t < 1) requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    }

    if (!('IntersectionObserver' in window)) {
      stats.forEach(animate);
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        io.unobserve(entry.target);
        animate(entry.target);
      });
    }, { threshold: 0.5 });

    stats.forEach(function (el) { io.observe(el); });
  })();

  /* ---------- Archive filter (index only) ---------- */
  (function archive() {
    var root = document.querySelector('[data-archive]');
    if (!root) return;

    var cards = Array.from(document.querySelectorAll('.release-card'));
    var pillBox = root.querySelector('.filter-pills');
    var search = root.querySelector('#archive-search');
    var countEl = root.querySelector('#archive-count');
    var empty = document.querySelector('.archive-empty');
    if (!cards.length || !pillBox) return;

    function titleOf(card) {
      var t = card.querySelector('.releasetitle');
      return t ? t.textContent.trim() : '';
    }
    function bodyOf(card) {
      var d = card.querySelector('.releasedescription');
      return d ? d.textContent.toLowerCase() : '';
    }

    // Cache the searchable text once rather than re-reading the DOM per keystroke.
    cards.forEach(function (card) {
      var title = titleOf(card);
      var m = title.match(/\b(20\d{2})\b/);
      card.dataset.year = card.classList.contains('exclusive-card') ? '2026' : (m ? m[1] : '');
      card.dataset.haystack = (title + ' ' + bodyOf(card)).toLowerCase();
      // Normalize exclusive attribute so checks are predictable. Do NOT mark any cards here.
      card.dataset.exclusive = card.dataset.exclusive === 'true' ? 'true' : '';
    });

    var years = Array.from(new Set(cards.map(function (c) { return c.dataset.year; })))
      .filter(Boolean)
      .sort(function (a, b) { return b - a; });

    var activeYear = 'all';
    var activeexclusive = 'all'; // 'all' or 'only'

    function makePill(value, label) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'filter-pill';
      b.dataset.year = value;
      b.textContent = label;
      b.setAttribute('aria-pressed', String(value === 'all'));
      if (value === 'all') b.classList.add('is-active');
      b.addEventListener('click', function () {
        activeYear = value;
        pillBox.querySelectorAll('.filter-pill').forEach(function (p) {
          // Only toggle year pills here — exclusive pill handled separately below.
          if (p.dataset.year !== undefined && p.dataset.year !== '') {
            var on = p === b;
            p.classList.toggle('is-active', on);
            p.setAttribute('aria-pressed', String(on));
          }
        });
        apply();
      });
      return b;
    }

    // Year pills (unchanged behaviour)
    pillBox.appendChild(makePill('all', 'All years'));
    years.forEach(function (y) { pillBox.appendChild(makePill(y, y)); });

    // exclusive pill — same visual style as year pills
    var exclusivePill = document.createElement('button');
    exclusivePill.type = 'button';
    exclusivePill.className = 'filter-pill';
    exclusivePill.dataset.exclusive = 'only';
    exclusivePill.textContent = 'Exclusive';
    exclusivePill.setAttribute('aria-pressed', 'false');

    exclusivePill.addEventListener('click', function () {
      // Toggle between showing only exclusives and showing all
      activeexclusive = activeexclusive === 'only' ? 'all' : 'only';
      exclusivePill.classList.toggle('is-active', activeexclusive === 'only');
      exclusivePill.setAttribute('aria-pressed', String(activeexclusive === 'only'));
      apply();
    });

    // Keep the same styling as the other pills; slight separation so it doesn't
    // visually merge with the year buttons (optional but subtle).
    exclusivePill.style.backgroundColor = 'var(--gold-soft)';
    pillBox.appendChild(exclusivePill);

    function apply() {
      var q = (search && search.value || '').trim().toLowerCase();
      var shown = 0;

      cards.forEach(function (card) {
        var yearOk = (activeYear === 'all' || card.dataset.year === activeYear);
        var textOk = (!q || card.dataset.haystack.indexOf(q) !== -1);
        var isexclusiveCard = card.dataset.exclusive === 'true';
        var exclusiveOk = isexclusiveCard ? (activeexclusive === 'only') : (activeexclusive === 'all');

        // exclusive cards are intentionally hidden until the user primes the filter by
        // selecting the exclusive pill; once selected, year filtering continues to work.
        if (isexclusiveCard && activeexclusive !== 'only') {
          exclusiveOk = false;
        }

        var ok = yearOk && textOk && exclusiveOk;
        card.hidden = !ok;
        if (ok) shown++;
      });

      if (countEl) {
        countEl.textContent = shown + (shown === 1 ? ' issue' : ' issues');
      }
      if (empty) empty.hidden = shown !== 0;
    }

    if (search) {
      var t;
      search.addEventListener('input', function () {
        clearTimeout(t);
        t = setTimeout(apply, 120);
      });
      search.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') { search.value = ''; apply(); }
      });
    }

    apply();
  })();
})();
