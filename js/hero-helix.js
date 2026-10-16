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
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    W = box.clientWidth; H = box.clientHeight;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    R = Math.max(30, Math.min(110, W * 0.26));
    BASE_PITCH = Math.max(150, H * 0.2);
    if (!pitchSet) { pitch = tPitch = BASE_PITCH; pitchSet = true; }
  }

  /* ---------- Drawing ---------- */
  function strand(pitch, phase, front) {
    var step = 2, prev = null;
    ctx.lineCap = "round";
    for (var y = -step; y <= H + step; y += step) {
      var th = (y / pitch) * TAU + phase;
      var p = [W / 2 + R * Math.sin(th), y, Math.cos(th)];
      if (prev) {
        var z = (prev[2] + p[2]) / 2;
        if ((z >= 0) === front) {
          var fade = Math.sin(Math.PI * Math.max(0, Math.min(1, y / H)));
          var a = (front ? 0.35 + 0.65 * z : 0.12 + 0.18 * (1 + z)) * fade;
          var g = front ? Math.round(196 + 59 * z) : 196;
          var b = front ? Math.round(140 * z * z) : 0;
          ctx.beginPath();
          ctx.moveTo(prev[0], prev[1]);
          ctx.lineTo(p[0], p[1]);
          ctx.strokeStyle = "rgba(255," + g + "," + b + "," + a.toFixed(3) + ")";
          ctx.lineWidth = front ? 2.8 + 2 * z : 2.4;
          ctx.stroke();
        }
      }
      prev = p;
    }
  }

  function draw(pitch, phase) {
    ctx.clearRect(0, 0, W, H);
    ctx.shadowBlur = 0;
    strand(pitch, phase, false);               /* back side, dim */
    ctx.shadowColor = "rgba(255,196,0,0.45)";
    ctx.shadowBlur = 10;
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
