/* =========================================================
   PRODUCTS HEADER — circular 2-die thread rolling machine
   - Two stainless steel dies and a black oxide bar, all
     spinning left; the bar feeds through and comes out threaded.
   - Wide screens: upright, in the free space right of the text.
   - Narrow screens / phones: no animation (header shows text only).
   - Mouse: lower in the header = faster, higher = slower.
   - "Reduce motion" setting: still picture.
   ========================================================= */
(function () {
  "use strict";

  var canvas = document.querySelector(".roll-canvas");
  if (!canvas || !canvas.getContext) return;
  var header = canvas.parentElement;
  var ctx = canvas.getContext("2d");
  var textEl = header.querySelector(".page-intro") || header.querySelector(".page-title");
  var gapBelowText = isNaN(parseFloat(canvas.dataset.gap)) ? 8 : parseFloat(canvas.dataset.gap);
  var dieLength = parseFloat(canvas.dataset.dieLength) || 130;

  var TAU = Math.PI * 2;
  var STEEL = ["#2f2d29", "#8e8a82", "#ece8de", "#a29d93", "#26241f"];        /* stainless dies */
  var OXIDE = ["#0c0c0c", "#2c2c2c", "#5e5d5a", "#2a2a29", "#0a0a0a"];        /* black oxide bar */
  var STOPS = [0, 0.26, 0.42, 0.62, 1];

  var W = 0, H = 0;
  var layout = null;   /* computed sizes and placement */

  function grad(a, b, cols) {
    var g = ctx.createLinearGradient(a, 0, b, 0);
    STOPS.forEach(function (s, i) { g.addColorStop(s, cols[i]); });
    return g;
  }

  /* ---------- Layout ---------- */
  function resize() {
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    W = header.clientWidth;
    H = header.clientHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    var hRect = header.getBoundingClientRect();
    var tRect = textEl ? textEl.getBoundingClientRect() : { right: W * 0.5, bottom: H * 0.6 };
    var textRight = tRect.right - hRect.left;
    var textBottom = tRect.bottom - hRect.top;

    /* Upright (desktop) sizes */
    var RB = 15, D = 4.5, P = 14, DR = 40, GAP = RB + D - 0.5;   /* dies just touch the bar */
    var reach = GAP + 2 * DR;                      /* centre of bar to outer die edge */
    var free = W - textRight;

    var upright = free >= 2 * reach + 80;
    /* Sideways layout: centre the heading text above the machine */
    if (header.classList.contains("roll-sideways") !== !upright) {
      header.classList.toggle("roll-sideways", !upright);
      hRect = header.getBoundingClientRect();
      tRect = textEl ? textEl.getBoundingClientRect() : tRect;
      textBottom = tRect.bottom - hRect.top;
      H = header.clientHeight;
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    if (upright) {
      /* Upright on the right */
      layout = {
        upright: true, RB: RB, D: D, P: P, DR: DR, GAP: GAP, len: dieLength, shaft: 24,
        cx: textRight + free / 2,
        mid: (function () {           /* middle of the area below the menu bar */
          var top = parseFloat(getComputedStyle(header).paddingTop) || 0;
          return top + (H - top) / 2;
        })()
      };
    } else {
      /* Sideways under the text, scaled to the space left in the header */
      var room = Math.max(40, H - textBottom - gapBelowText - 12);
      var half = Math.min(36, room / 2);
      var rb = half / 6.6;
      var d = rb * 0.3, gap = rb + d + 1.5;
      layout = {
        upright: false, RB: rb, D: d, P: rb * 0.95, DR: (half - gap) / 2, GAP: gap,
        len: dieLength * 0.72, shaft: 12,
        cy: textBottom + gapBelowText + half, axisLen: W
      };
    }
  }

  /* ---------- Drawing (in the machine's own frame: bar axis = +y) ---------- */
  function helixLine(cx, r, y, dy, P, color, width) {
    ctx.beginPath();
    for (var k = 0; k <= 16; k++) {
      var t = -Math.PI / 2 + k * Math.PI / 16;
      ctx.lineTo(cx + r * Math.sin(t), y + dy + (t + Math.PI / 2) / TAU * P);
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
  }

  function drawDie(L, cx, y0, y1, rot) {
    var DR = L.DR, P = L.P, s = L.shaft, radius = Math.min(10, DR * 0.35);
    ctx.fillStyle = grad(cx - DR * 0.4, cx + DR * 0.4, STEEL);
    ctx.fillRect(cx - DR * 0.34, y0 - s, DR * 0.68, s);
    ctx.fillRect(cx - DR * 0.34, y1, DR * 0.68, s);
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(cx - DR * 0.34, y0 - 2, DR * 0.68, 2);
    ctx.fillRect(cx - DR * 0.34, y1, DR * 0.68, 2);

    ctx.beginPath(); ctx.roundRect(cx - DR, y0, DR * 2, y1 - y0, radius);
    ctx.fillStyle = grad(cx - DR, cx + DR, STEEL); ctx.fill();

    ctx.save();
    ctx.beginPath(); ctx.roundRect(cx - DR, y0, DR * 2, y1 - y0, radius); ctx.clip();
    var off = ((rot / TAU * P) % P + P) % P, lw = Math.max(1, P / 7);
    for (var y = y0 - P * 2 + off; y < y1 + P; y += P) {
      helixLine(cx, DR, y, 0, P, "rgba(30,28,24,0.4)", lw);
      helixLine(cx, DR, y, lw * 1.1, P, "rgba(255,255,250,0.25)", lw * 0.55);
    }
    var sh = ctx.createLinearGradient(0, y0, 0, y1);
    sh.addColorStop(0, "rgba(0,0,0,0.35)"); sh.addColorStop(0.18, "rgba(0,0,0,0)");
    sh.addColorStop(0.82, "rgba(0,0,0,0)"); sh.addColorStop(1, "rgba(0,0,0,0.4)");
    ctx.fillStyle = sh; ctx.fillRect(cx - DR, y0, DR * 2, y1 - y0);
    ctx.restore();
  }

  function drawBar(L, axisLen, y0, y1, feed, rot) {
    var RB = L.RB, D = L.D, P = L.P, ph = feed + rot / TAU * P;
    function depth(y) { return Math.max(0, Math.min(1, (y - y0) / ((y1 - y0) * 0.85))); }
    function tooth(y) { var u = (((y - ph) % P) + P) % P / P; return u < 0.5 ? u * 2 : 2 - u * 2; }

    ctx.beginPath();
    var step = Math.max(1, P / 7);
    for (var y = -P; y <= axisLen + P; y += step) { var d = depth(y) * D; ctx.lineTo(-RB - D + d * tooth(y) + (D - d), y); }
    for (var y2 = axisLen + P; y2 >= -P; y2 -= step) { var d2 = depth(y2) * D; ctx.lineTo(RB + D - d2 * tooth(y2 + P / 2) - (D - d2), y2); }
    ctx.closePath();
    ctx.fillStyle = grad(-RB - D, RB + D, OXIDE);
    ctx.fill();

    ctx.save();
    ctx.clip();
    /* soft marks that show the bar turning */
    for (var i = 0; i < 5; i++) {
      var t = -rot + i * TAU / 5, c = Math.cos(t);
      if (c <= 0.05) continue;
      ctx.globalAlpha = c * c * 0.06;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(RB * Math.sin(t) - RB / 15, -10, RB / 7.5, axisLen + 20);
    }
    ctx.globalAlpha = 1;
    ctx.beginPath(); ctx.rect(-RB - D, y0, 2 * (RB + D), axisLen); ctx.clip();
    var off = ((ph % P) + P) % P, lw = Math.max(0.8, P / 9);
    for (var y3 = y0 - P * 2 + off; y3 < axisLen + P; y3 += P) {
      var dd = depth(y3);
      if (dd < 0.1) continue;
      ctx.globalAlpha = dd * 0.6;
      helixLine(0, RB, y3, 0, P, "rgba(0,0,0,0.6)", lw);
      helixLine(0, RB, y3, lw * 1.2, P, "rgba(255,255,255,0.10)", lw * 0.6);
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  function draw(rot, feed) {
    var L = layout;
    ctx.clearRect(0, 0, W, H);
    if (!L.upright) return;   /* no animation when there's no room beside the text */
    ctx.save();
    var axisLen, centre;
    if (L.upright) {
      ctx.translate(L.cx, 0);              /* bar axis runs down the screen */
      axisLen = H; centre = L.mid;
    } else {
      ctx.translate(0, L.cy);              /* bar axis runs across the screen */
      ctx.rotate(-Math.PI / 2);
      axisLen = W; centre = W / 2;
    }
    var y0 = centre - L.len / 2, y1 = centre + L.len / 2;
    drawBar(L, axisLen, y0, y1, feed, rot * L.DR / L.RB);
    drawDie(L, -L.GAP - L.DR, y0, y1, rot);
    drawDie(L, L.GAP + L.DR, y0, y1, rot);
    ctx.restore();
  }

  /* ---------- Motion ---------- */
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var IDLE = 0.35, speed = IDLE, target = IDLE, rot = 0, feed = 0, last = 0, visible = true, running = false;

  header.addEventListener("pointermove", function (e) {
    if (e.pointerType !== "mouse") return;
    var f = (e.clientY - header.getBoundingClientRect().top) / H;
    target = 0.08 + f * f * 1.6;
  });
  header.addEventListener("pointerleave", function () { target = IDLE; });

  function frame(now) {
    if (!visible) { running = false; return; }
    var dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
    last = now;
    if (!reduce) {
      speed += (target - speed) * (1 - Math.pow(0.2, dt));
      rot += speed * dt * TAU * 0.5;
      feed += speed * dt * 16 * (layout.upright ? 1 : 0.45);
    }
    draw(rot, feed);
    requestAnimationFrame(frame);
  }

  function start() {
    if (running) return;
    running = true; last = 0;
    requestAnimationFrame(frame);
  }

  resize();
  if ("ResizeObserver" in window) new ResizeObserver(resize).observe(header);
  else window.addEventListener("resize", resize);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(resize);

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      if (visible) start();
    }).observe(header);
  }
  start();
})();
