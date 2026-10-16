/* =========================================================
   HOME HERO — gold 3D helix
   The gold line is a real helix with a front and a back side,
   turning like a thread.
   - Mouse left / right: turns it one way or the other (gently)
   - Mouse up / down: slightly tighter or looser pitch
   - Phones: turns slowly on its own
   - "Reduce motion" setting: still picture
   ========================================================= */
(function () {
  "use strict";

  var canvas = document.querySelector(".helix-canvas");
  if (!canvas || !canvas.getContext) return;
  var box = canvas.parentElement;              /* .hero-spiral */
  var hero = box.closest(".hero") || document.body;
  var ctx = canvas.getContext("2d");
  var TAU = Math.PI * 2;
  var W = 0, H = 0, R = 46, BASE_PITCH = 180, pitchSet = false;

  function resize() {
    var dpr = Math.min(window.innerWidth < 768 ? 1.5 : 2, window.devicePixelRatio || 1);
    W = box.clientWidth; H = box.clientHeight;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    R = Math.max(30, Math.min(110, W * 0.26));
    BASE_PITCH = Math.max(150, H * 0.2);
    if (!pitchSet) { pitch = tPitch = BASE_PITCH; pitchSet = true; }
  }

  /* ---------- Drawing ----------
     Segments are grouped by brightness so each frame needs only a few dozen
     strokes (no per-segment shadow blur), which keeps phones smooth. */
  var ZL = 8, FL = 6;                          /* depth and fade levels */
  function strand(pitch, phase, front) {
    var step = 2, prev = null, buckets = {};
    for (var y = -step; y <= H + step; y += step) {
      var th = (y / pitch) * TAU + phase;
      var p = [W / 2 + R * Math.sin(th), y, Math.cos(th)];
      if (prev) {
        var z = (prev[2] + p[2]) / 2;
        if ((z >= 0) === front) {
          var fade = Math.sin(Math.PI * Math.max(0, Math.min(1, y / H)));
          var zi = Math.min(ZL - 1, Math.floor(Math.abs(z) * ZL));
          var fi = Math.min(FL - 1, Math.floor(fade * FL));
          var key = zi * FL + fi;
          (buckets[key] || (buckets[key] = [])).push(prev[0], prev[1], p[0], p[1]);
        }
      }
      prev = p;
    }
    ctx.lineCap = "round";
    for (var k in buckets) {
      var zq = (Math.floor(k / FL) + 0.5) / ZL, fq = (k % FL + 0.5) / FL;
      var zz = front ? zq : -zq;
      var a = (front ? 0.35 + 0.65 * zz : 0.12 + 0.18 * (1 + zz)) * fq;
      var g = front ? Math.round(196 + 59 * zz) : 196;
      var bl = front ? Math.round(140 * zz * zz) : 0;
      var w = front ? 2.8 + 2 * zz : 2.4;
      var seg = buckets[k];
      ctx.beginPath();
      for (var i = 0; i < seg.length; i += 4) { ctx.moveTo(seg[i], seg[i + 1]); ctx.lineTo(seg[i + 2], seg[i + 3]); }
      if (front) {                              /* soft gold glow */
        ctx.globalCompositeOperation = "lighter";
        ctx.strokeStyle = "rgba(255,170,0," + (a * 0.09).toFixed(3) + ")";
        ctx.lineWidth = w * 5;
        ctx.stroke();
        ctx.lineWidth = w * 2.6;
        ctx.stroke();
        ctx.globalCompositeOperation = "source-over";
      }
      ctx.strokeStyle = "rgba(255," + g + "," + bl + "," + a.toFixed(3) + ")";
      ctx.lineWidth = w;
      ctx.stroke();
    }
  }

  function draw(pitch, phase) {
    ctx.clearRect(0, 0, W, H);
    strand(pitch, phase, false);               /* back side, dim */
    strand(pitch, phase, true);                /* front side, bright */
  }

  /* ---------- Motion (slow, gentle response) ---------- */
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var BASE_SPEED = 0.6;
  var speed = BASE_SPEED, pitch = 180, tSpeed = BASE_SPEED, tPitch = 180;
  var phase = 0, last = 0, visible = true, running = false;

  hero.addEventListener("pointermove", function (e) {
    if (e.pointerType !== "mouse") return;
    var r = hero.getBoundingClientRect();
    var fx = (e.clientX - r.left) / r.width - 0.5;      /* -0.5 .. 0.5 */
    var fy = (e.clientY - r.top) / r.height;            /*  0 .. 1 */
    tSpeed = fx * 2.4;                                  /* -1.2 .. 1.2 rad/s */
    tPitch = BASE_PITCH * (0.8 + 0.4 * fy);            /* +/-20% */
  });
  hero.addEventListener("pointerleave", function () { tSpeed = BASE_SPEED; tPitch = BASE_PITCH; });

  function frame(now) {
    if (!visible) { running = false; return; }
    var dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
    last = now;
    if (!reduce) {
      var k = 1 - Math.pow(0.35, dt);                   /* slow easing */
      speed += (tSpeed - speed) * k;
      pitch += (tPitch - pitch) * k;
      phase += speed * dt;
    }
    draw(pitch, phase);
    requestAnimationFrame(frame);
  }
  function start() { if (running) return; running = true; last = 0; requestAnimationFrame(frame); }

  resize();
  if ("ResizeObserver" in window) new ResizeObserver(resize).observe(box);
  else window.addEventListener("resize", resize);
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (en) { visible = en[0].isIntersecting; if (visible) start(); }).observe(hero);
  }
  start();
})();
