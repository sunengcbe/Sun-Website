/* =========================================================
   THREAD FORMS HEADER — threaded bar with a spinning nut
   - The nut travels slowly left to right on its own (about
     70 s across; set by data-travel-seconds on the canvas)
     and comes back in from the left.
   - With a mouse over the header, the nut follows the cursor.
   - On phones, tilting the phone speeds it up / slows it down.
   - "Reduce motion" setting: everything stays still.
   Finish: black oxide bar, brass nut.
   ========================================================= */
(function () {
  "use strict";

  var canvas = document.querySelector(".nut-canvas");
  if (!canvas || !canvas.getContext) return;
  var header = canvas.parentElement;
  var ctx = canvas.getContext("2d");
  var travelSeconds = parseFloat(canvas.dataset.travelSeconds) || 70;

  var FINISH = {
    bar: ["#0c0c0c", "#2c2c2c", "#5e5d5a", "#2a2a29", "#0a0a0a"],
    barStops: [0, 0.26, 0.42, 0.62, 1],
    nutDark: [70, 52, 14],
    nutLight: [236, 196, 92],
    grooveDark: "rgba(0,0,0,0.6)",
    grooveLight: "rgba(255,255,255,0.12)"
  };

  var W = 0, H = 0, S = 1;               /* S = size scale (smaller on phones) */
  var P, RC, D, NR, NW;                  /* pitch, bar core radius, thread depth, nut radius, nut width */

  function resize() {
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    W = header.clientWidth;
    H = header.clientHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    S = W < 600 ? 0.72 : 1;
    P = 14 * S; RC = 15 * S; D = 4.5 * S; NR = 40 * S; NW = 52 * S;
  }

  function barCenterY() {
    var pad = parseFloat(getComputedStyle(header).paddingBottom) || 110;
    return H - pad / 2;
  }

  /* ---------- Drawing ---------- */
  function drawBar(y) {
    var top = y - RC, bot = y + RC;
    var g = ctx.createLinearGradient(0, top - D, 0, bot + D);
    FINISH.barStops.forEach(function (s, i) { g.addColorStop(s, FINISH.bar[i]); });

    ctx.beginPath();
    ctx.moveTo(-P, top);
    for (var x = -P; x <= W + P; x += P) { ctx.lineTo(x + P * 0.5, top - D); ctx.lineTo(x + P, top); }
    for (var x2 = W + P; x2 >= -P; x2 -= P) { ctx.lineTo(x2 - P * 0.25, bot + D); ctx.lineTo(x2 - P * 0.75, bot); }
    ctx.closePath();
    ctx.fillStyle = g;
    ctx.fill();

    for (var x3 = -P; x3 <= W + P; x3 += P) {
      ctx.lineWidth = 1.8 * S;
      ctx.beginPath(); ctx.moveTo(x3 + P * 0.5, top - D + 0.6); ctx.lineTo(x3 - P * 0.25, bot + D - 0.6);
      ctx.strokeStyle = FINISH.grooveDark; ctx.stroke();
      ctx.lineWidth = 1.2 * S;
      ctx.beginPath(); ctx.moveTo(x3 + P * 0.5 + 2.2 * S, top - D + 1.2); ctx.lineTo(x3 - P * 0.25 + 2.2 * S, bot + D - 1.2);
      ctx.strokeStyle = FINISH.grooveLight; ctx.stroke();
    }
  }

  function brass(b) {
    b = Math.max(0, Math.min(1, b));
    var d = FINISH.nutDark, l = FINISH.nutLight;
    return "rgb(" + Math.round(d[0] + (l[0] - d[0]) * b) + "," +
                    Math.round(d[1] + (l[1] - d[1]) * b) + "," +
                    Math.round(d[2] + (l[2] - d[2]) * b) + ")";
  }

  function nutOutline(x, t, b, h, c) {
    ctx.beginPath();
    ctx.moveTo(x - h + c, t); ctx.lineTo(x + h - c, t); ctx.lineTo(x + h, t + c);
    ctx.lineTo(x + h, b - c); ctx.lineTo(x + h - c, b); ctx.lineTo(x - h + c, b);
    ctx.lineTo(x - h, b - c); ctx.lineTo(x - h, t + c); ctx.closePath();
  }

  /* Side view of a hex nut turned by angle th around the bar */
  function drawNut(x, y, th) {
    var h = NW / 2, faces = [];
    for (var k = 0; k < 6; k++) {
      var a1 = th + k * Math.PI / 3, a2 = a1 + Math.PI / 3, mid = a1 + Math.PI / 6;
      var facing = Math.sin(mid);
      if (facing <= 0.001) continue;
      var y1 = y - NR * Math.cos(a1), y2 = y - NR * Math.cos(a2);
      faces.push([Math.min(y1, y2), Math.max(y1, y2), Math.max(0, 0.45 * Math.cos(mid) + 0.85 * facing)]);
    }
    var top = Math.min.apply(null, faces.map(function (f) { return f[0]; }));
    var bot = Math.max.apply(null, faces.map(function (f) { return f[1]; }));
    var chamfer = 6 * S;

    ctx.save();
    nutOutline(x, top, bot, h, chamfer);
    ctx.clip();
    faces.forEach(function (f) {
      var gr = ctx.createLinearGradient(x - h, 0, x + h, 0);
      gr.addColorStop(0, brass(f[2] * 0.62));
      gr.addColorStop(0.5, brass(f[2] * 1.02));
      gr.addColorStop(1, brass(f[2] * 0.55));
      ctx.fillStyle = gr;
      ctx.fillRect(x - h, f[0], NW, f[1] - f[0] + 0.7);
      ctx.fillStyle = "rgba(0,0,0,0.38)";
      ctx.fillRect(x - h, f[0], NW, 1);
    });
    ctx.fillStyle = "rgba(0,0,0,0.28)";
    ctx.fillRect(x - h, top, 3 * S, bot - top);
    ctx.fillRect(x + h - 3 * S, top, 3 * S, bot - top);
    ctx.restore();
  }

  /* ---------- Motion ---------- */
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var x = null, vel = 0, th = 0.3, hover = false, mouseX = 0, tilt = null, last = 0, visible = true, running = false;

  header.addEventListener("pointermove", function (e) {
    if (e.pointerType !== "mouse") return;
    hover = true;
    mouseX = e.clientX - header.getBoundingClientRect().left;
  });
  header.addEventListener("pointerleave", function () { hover = false; });
  window.addEventListener("deviceorientation", function (e) {
    if (e.gamma != null) tilt = Math.max(-30, Math.min(30, e.gamma));
  });

  function frame(now) {
    if (!visible) { running = false; return; }
    var dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
    last = now;
    if (x === null) x = W * 0.12;

    var dx = 0;
    if (!reduce) {
      if (hover) {
        var target = Math.max(NW / 2, Math.min(W - NW / 2, mouseX));
        dx = (target - x) * (1 - Math.pow(0.0008, dt));
        vel = dt ? dx / dt : 0;
      } else {
        var cruise = W / travelSeconds * (tilt !== null ? 1 + tilt / 30 * 0.9 : 1);
        vel += (cruise - vel) * (1 - Math.pow(0.15, dt));
        dx = vel * dt;
      }
    }
    x += dx;
    if (x > W + NW) x = -NW;
    if (x < -NW) x = W + NW;
    th += dx / P * Math.PI;

    var y = barCenterY();
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = 0.9;
    drawBar(y);
    drawNut(x, y, th);
    ctx.globalAlpha = 1;
    requestAnimationFrame(frame);
  }

  function start() {
    if (running) return;
    running = true;
    last = 0;
    requestAnimationFrame(frame);
  }

  resize();
  if ("ResizeObserver" in window) new ResizeObserver(resize).observe(header);
  else window.addEventListener("resize", resize);

  /* Pause while the header is scrolled out of view */
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      if (visible) start();
    }).observe(header);
  }
  start();
})();
