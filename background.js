/* ============================================================
   MathEXplained — Shared decorative background
   ------------------------------------------------------------
   Two layers, both purely ornamental and aria-hidden:
     1. #proximity-grid  — canvas dot grid that glows near the cursor
     2. .math-bg-layer   — slowly drifting pre-rendered math symbols

   Loaded with `defer` on every page, so it runs once the DOM is parsed.
   ============================================================ */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ----------------------------------------------------------
     1. Proximity-glow grid
     ----------------------------------------------------------
     Redraws only when something actually changed (pointer moved,
     window resized). The previous version ran a bare
     requestAnimationFrame loop that repainted every dot and grid
     line ~60x/sec forever, which burned CPU even on an idle page.

     Within a frame, the ~2000 background dots are stroked as a
     single path with one fill() call; only the handful of cells
     inside the glow radius are drawn individually.
     ---------------------------------------------------------- */
  (function initGrid() {
    var canvas = document.getElementById('proximity-grid');
    if (!canvas) return;

    var ctx = canvas.getContext('2d');
    var TAU = Math.PI * 2;
    var CELL = 36;
    var RADIUS = 180;
    var BASE_ALPHA = 0.045;
    var GLOW_ALPHA = 0.72;
    var DOT_R = 1.4;
    var RGB = '84, 145, 209';

    var mouse = { x: -9999, y: -9999 };
    var cssW = 0, cssH = 0;
    var dirty = true;
    var queued = false;

    function resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      cssW = window.innerWidth;
      cssH = window.innerHeight;
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      dirty = true;
      schedule();
    }

    function draw() {
      var cols = Math.ceil(cssW / CELL) + 1;
      var rows = Math.ceil(cssH / CELL) + 1;
      var r, c, x, y;

      ctx.clearRect(0, 0, cssW, cssH);

      /* -- grid lines: all at base alpha in two batched paths -- */
      ctx.lineWidth = 0.5;
      ctx.strokeStyle = 'rgba(' + RGB + ',' + (BASE_ALPHA * 0.7).toFixed(3) + ')';
      ctx.beginPath();
      for (r = 0; r < rows; r++) { y = r * CELL; ctx.moveTo(0, y); ctx.lineTo(cssW, y); }
      for (c = 0; c < cols; c++) { x = c * CELL; ctx.moveTo(x, 0); ctx.lineTo(x, cssH); }
      ctx.stroke();

      /* -- dots: all at base alpha in one path -- */
      ctx.fillStyle = 'rgba(' + RGB + ',' + BASE_ALPHA.toFixed(3) + ')';
      ctx.beginPath();
      for (r = 0; r < rows; r++) {
        y = r * CELL;
        for (c = 0; c < cols; c++) {
          x = c * CELL;
          ctx.moveTo(x + DOT_R, y);
          ctx.arc(x, y, DOT_R, 0, TAU);
        }
      }
      ctx.fill();

      /* -- glow: only cells whose centre falls inside the radius -- */
      if (mouse.x < -1000) return;

      var c0 = Math.max(0, Math.floor((mouse.x - RADIUS) / CELL));
      var c1 = Math.min(cols - 1, Math.ceil((mouse.x + RADIUS) / CELL));
      var r0 = Math.max(0, Math.floor((mouse.y - RADIUS) / CELL));
      var r1 = Math.min(rows - 1, Math.ceil((mouse.y + RADIUS) / CELL));

      for (r = r0; r <= r1; r++) {
        y = r * CELL;
        var dy = y - mouse.y;
        for (c = c0; c <= c1; c++) {
          x = c * CELL;
          var dx = x - mouse.x;
          var prox = 1 - Math.sqrt(dx * dx + dy * dy) / RADIUS;
          if (prox <= 0) continue;
          ctx.fillStyle = 'rgba(' + RGB + ',' +
            (BASE_ALPHA + prox * prox * (GLOW_ALPHA - BASE_ALPHA)).toFixed(3) + ')';
          ctx.beginPath();
          ctx.arc(x, y, DOT_R, 0, TAU);
          ctx.fill();
        }
      }

      /* -- glow on the lines nearest the cursor -- */
      ctx.lineWidth = 0.5;
      for (r = r0; r <= r1; r++) {
        y = r * CELL;
        var pyH = 1 - Math.abs(mouse.y - y) / RADIUS;
        if (pyH <= 0) continue;
        ctx.strokeStyle = 'rgba(' + RGB + ',' +
          (BASE_ALPHA * 0.7 + pyH * pyH * 0.30).toFixed(3) + ')';
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(cssW, y);
        ctx.stroke();
      }
      for (c = c0; c <= c1; c++) {
        x = c * CELL;
        var pxV = 1 - Math.abs(mouse.x - x) / RADIUS;
        if (pxV <= 0) continue;
        ctx.strokeStyle = 'rgba(' + RGB + ',' +
          (BASE_ALPHA * 0.7 + pxV * pxV * 0.30).toFixed(3) + ')';
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, cssH);
        ctx.stroke();
      }
    }

    /* Coalesce pointer events into at most one repaint per frame. */
    function schedule() {
      if (queued || !dirty) return;
      queued = true;
      requestAnimationFrame(function () {
        queued = false;
        dirty = false;
        draw();
      });
    }

    function track(x, y) {
      if (x === mouse.x && y === mouse.y) return;
      mouse.x = x;
      mouse.y = y;
      dirty = true;
      schedule();
    }

    window.addEventListener('mousemove', function (e) { track(e.clientX, e.clientY); }, { passive: true });
    window.addEventListener('touchmove', function (e) {
      if (e.touches[0]) track(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });
    window.addEventListener('mouseleave', function () { track(-9999, -9999); }, { passive: true });
    window.addEventListener('resize', resize, { passive: true });

    resize();
  })();

  /* ----------------------------------------------------------
     2. Floating math symbols
     ----------------------------------------------------------
     Symbols come from math-symbols.js as pre-rendered SVG, so
     there is no MathJax runtime, no CDN webfont fetch, and no
     typesetting work on the main thread. Skipped entirely when
     the visitor prefers reduced motion.
     ---------------------------------------------------------- */
  (function initSymbols() {
    var layer = document.querySelector('.math-bg-layer');
    var svgs = window.MATH_SYMBOL_SVGS;
    if (!layer || !svgs || !svgs.length || reduceMotion) return;

    // Fewer symbols on small screens — they crowd the text and cost more
    // per-pixel to composite on the devices least able to afford it.
    var count = window.innerWidth < 700 ? 22 : 58;
    var frag = document.createDocumentFragment();

    for (var k = 0; k < count; k++) {
      var idx = (k + Math.floor(Math.random() * svgs.length)) % svgs.length;
      var el = document.createElement('span');
      var dur = 22 + Math.random() * 30;

      el.className = 'math-symbol';
      el.innerHTML = svgs[idx];
      el.style.cssText =
        'left:' + (Math.random() * 98).toFixed(2) + '%;' +
        'font-size:' + (0.85 + Math.random() * 1.5).toFixed(2) + 'rem;' +
        'animation-duration:' + dur.toFixed(1) + 's;' +
        'animation-delay:' + (-Math.random() * dur).toFixed(1) + 's;' +
        '--rot:' + ((Math.random() - 0.5) * 50).toFixed(1) + 'deg;';
      frag.appendChild(el);
    }

    layer.appendChild(frag);
  })();
})();
