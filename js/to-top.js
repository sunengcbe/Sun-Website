/* =========================================================
   BACK TO TOP — floating arrow, bottom right
   Appears as you get close to the bottom of the page; the gold ring
   around it fills up as you scroll. Click/tap = smooth scroll to top.
   ========================================================= */
(function () {
  "use strict";
  var btn = document.createElement("button");
  btn.type = "button";
  btn.className = "to-top";
  btn.setAttribute("aria-label", "Back to top");
  btn.innerHTML = '<span class="to-top-in" aria-hidden="true"><svg viewBox="0 0 24 24" width="20" height="20"><path d="M12 19V5M5.5 11.5 12 5l6.5 6.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg></span>';
  document.body.appendChild(btn);

  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var ticking = false;

  function update() {
    ticking = false;
    var doc = document.documentElement;
    var max = Math.max(1, doc.scrollHeight - window.innerHeight);
    var y = window.scrollY;
    var fromBottom = max - y;
    /* show once the visitor has scrolled a screen and is in the last part of the page */
    var show = y > window.innerHeight * 0.8 && (fromBottom < window.innerHeight * 1.2 || y / max > 0.7);
    btn.classList.toggle("show", show);
    btn.style.setProperty("--p", Math.min(100, Math.round(y / max * 100)) + "%");
  }

  window.addEventListener("scroll", function () {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });
  window.addEventListener("resize", update);
  update();

  btn.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
    btn.blur();
  });
})();
