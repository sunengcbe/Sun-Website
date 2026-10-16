/* =========================================================
   GET A QUOTE — four-step wizard
   - Thread profile morphs to the chosen thread form
   - Live range check (green / amber); out-of-range can still be sent
   - Send by email (FormSubmit) or open WhatsApp with the details
   ========================================================= */
(function () {
  "use strict";

  var form = document.getElementById("quoteForm");
  if (!form) return;

  var $ = function (id) { return document.getElementById(id); };
  var D = form.dataset;
  var R = {
    diaMin: +D.diaMin, diaMax: +D.diaMax,
    pitchMin: +D.pitchMin, pitchMax: +D.pitchMax,
    tpiMin: +D.tpiMin, tpiMax: +D.tpiMax,
    hrcMax: +D.hrcMax
  };
  var OUT = D.out;

  /* ---------- 1. Thread profile morph ---------- */
  var FORMS = {
    Metric:      { a: 60, c: 0.125,  r: 0.25,   k: 0 },
    Unified:     { a: 60, c: 0.125,  r: 0.15,   k: 0.03 },
    Whitworth:   { a: 55, c: 0,      r: 0,      k: 0.14 },
    Acme:        { a: 29, c: 0.3707, r: 0.3707, k: 0 },
    Trapezoidal: { a: 30, c: 0.366,  r: 0.366,  k: 0 }
  };
  var path = $("qwPath"), angleEl = $("qwAngle"), nameEl = $("qwFormName");
  var cur = Object.assign({}, FORMS.Metric), from = null, to = null, t0 = 0, shift = 0;
  var P = 100, BASE = 132, SCALE = 105;
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function profile(p) {
    var half = (1 - p.c - p.r) / 2;
    var h = half / Math.tan(p.a * Math.PI / 360);
    var pts = [], x = -P * 2 + shift;
    while (x < 680 + P * 2) {
      var y0 = BASE, y1 = BASE - h * SCALE * (p.a < 40 ? 1.6 : 1);
      pts.push([x, y0], [x + p.r * P / 2, y0],
               [x + (p.r / 2 + half) * P, y1], [x + (p.r / 2 + half + p.c) * P, y1],
               [x + (p.r / 2 + 2 * half + p.c) * P, y0], [x + P, y0]);
      x += P;
    }
    var d = "M" + pts[0][0].toFixed(1) + "," + pts[0][1].toFixed(1), R0 = p.k * P;
    for (var i = 1; i < pts.length - 1; i++) {
      var a = pts[i - 1], b = pts[i], c = pts[i + 1];
      var l1 = Math.hypot(b[0] - a[0], b[1] - a[1]), l2 = Math.hypot(c[0] - b[0], c[1] - b[1]);
      if (R0 <= 0.5 || l1 < 0.5 || l2 < 0.5) { d += "L" + b[0].toFixed(1) + "," + b[1].toFixed(1); continue; }
      var r1 = Math.min(R0, l1 / 2), r2 = Math.min(R0, l2 / 2);
      var p1 = [b[0] - (b[0] - a[0]) * r1 / l1, b[1] - (b[1] - a[1]) * r1 / l1];
      var p2 = [b[0] + (c[0] - b[0]) * r2 / l2, b[1] + (c[1] - b[1]) * r2 / l2];
      d += "L" + p1[0].toFixed(1) + "," + p1[1].toFixed(1) +
           "Q" + b[0].toFixed(1) + "," + b[1].toFixed(1) + " " + p2[0].toFixed(1) + "," + p2[1].toFixed(1);
    }
    return d;
  }
  function ease(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
  function frame(ts) {
    if (!reduceMotion) shift = (shift + 0.35) % P;
    if (to) {
      var t = Math.min(1, (ts - t0) / 700), e = ease(t);
      ["a", "c", "r", "k"].forEach(function (k) { cur[k] = from[k] + (to[k] - from[k]) * e; });
      if (t >= 1) to = null;
    }
    if (path) path.setAttribute("d", profile(cur));
    if (angleEl) angleEl.textContent = Math.round(cur.a) + "°";
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  function morph(name) {
    if (!FORMS[name]) return;
    nameEl.textContent = name;
    from = Object.assign({}, cur); to = FORMS[name]; t0 = performance.now();
  }

  form.querySelectorAll('input[name="Thread form"]').forEach(function (radio) {
    radio.addEventListener("change", function () { morph(radio.value); clearError("Thread form"); });
  });

  /* ---------- 2. Units and range checks ---------- */
  function unit() { return form.querySelector('input[name="Units"]:checked').value; }
  function toMm(v) { return unit() === "inch" ? v * 25.4 : v; }

  function note(el, value, ok, hint) {
    if (value === "" || isNaN(value)) { el.className = "qw-note"; el.textContent = hint; return null; }
    el.className = "qw-note " + (ok ? "qw-ok" : "qw-warn");
    el.innerHTML = ok ? '<i class="fas fa-check-circle"></i> Within our range'
                      : '<i class="fas fa-exclamation-triangle"></i> ' + escapeHtml(OUT);
    return ok;
  }

  function checkRanges() {
    var out = [];
    var inch = unit() === "inch";
    var d = parseFloat($("qwDia").value);
    if (note($("qwDiaNote"), d, toMm(d) >= R.diaMin && toMm(d) <= R.diaMax,
      inch ? "Our range: " + (R.diaMin / 25.4).toFixed(2) + "–" + (R.diaMax / 25.4).toFixed(2) + " in (" + R.diaMin + "–" + R.diaMax + " mm)"
           : "Our range: " + R.diaMin + "–" + R.diaMax + " mm") === false) out.push("diameter");

    var p = parseFloat($("qwPitch").value), pOk;
    if (inch) pOk = note($("qwPitchNote"), p, p >= R.tpiMin && p <= R.tpiMax, "Our range: " + R.tpiMin + " to " + R.tpiMax + " TPI");
    else pOk = note($("qwPitchNote"), p, p >= R.pitchMin && p <= R.pitchMax, "Our range: " + R.pitchMin + "–" + R.pitchMax + " mm pitch");
    if (pOk === false) out.push("pitch");

    var unknown = $("qwHrcUnknown").checked;
    $("qwHrc").disabled = unknown;
    if (unknown) { $("qwHrcNote").className = "qw-note"; $("qwHrcNote").textContent = "No problem, we'll check the material."; }
    else if (note($("qwHrcNote"), parseFloat($("qwHrc").value), parseFloat($("qwHrc").value) <= R.hrcMax,
      "We roll up to " + R.hrcMax + " HRC") === false) out.push("hardness");

    form.querySelector('input[name="Range check"]').value =
      out.length ? "Outside usual range: " + out.join(", ") : "Within usual range";
    return out;
  }

  ["qwDia", "qwPitch", "qwHrc", "qwHrcUnknown"].forEach(function (id) { $(id).addEventListener("input", checkRanges); });
  form.querySelectorAll('input[name="Units"]').forEach(function (radio) {
    radio.addEventListener("change", function () {
      var inch = unit() === "inch";
      form.querySelectorAll(".qw-unit").forEach(function (s) { s.textContent = inch ? "inch" : "mm"; });
      $("qwPitchLabel").textContent = inch ? "4. Threads per inch (TPI)" : "4. Pitch (mm)";
      $("qwPitch").placeholder = inch ? "8" : "2.5";
      $("qwDia").placeholder = inch ? "0.75" : "20";
      checkRanges();
    });
  });

  /* ---------- 3. Validation ---------- */
  function errorEl(key) { return form.querySelector('.qw-error[data-for="' + key + '"]'); }
  function setError(key, msg) { var el = errorEl(key); if (el) el.textContent = msg; return false; }
  function clearError(key) { var el = errorEl(key); if (el) el.textContent = ""; }
  function noteError(el, msg) { el.className = "qw-note qw-bad"; el.textContent = msg; return false; }

  form.querySelectorAll("input").forEach(function (input) {
    input.addEventListener("input", function () {
      ["Material", "Quantity", "attachment", "contact"].forEach(clearError);
      $("qwError").hidden = true;
    });
  });

  function validStep(step) {
    if (step === 1) {
      if (!form.querySelector('input[name="Thread form"]:checked')) return setError("Thread form", "Choose a thread form");
      if (!(parseFloat($("qwDia").value) > 0)) { $("qwDia").focus(); return noteError($("qwDiaNote"), "Enter a diameter"); }
      if (!(parseFloat($("qwPitch").value) > 0)) { $("qwPitch").focus(); return noteError($("qwPitchNote"), "Enter the pitch"); }
    }
    if (step === 2) {
      if (!$("qwMat").value.trim()) { $("qwMat").focus(); return setError("Material", "Enter the material"); }
      if (!$("qwHrcUnknown").checked && $("qwHrc").value === "") { $("qwHrc").focus(); return noteError($("qwHrcNote"), "Enter the hardness or tick Don't know"); }
    }
    if (step === 3) {
      if (!(parseInt($("qwQty").value, 10) > 0)) { $("qwQty").focus(); return setError("Quantity", "Enter a quantity"); }
      var f = $("qwFile").files[0];
      if (f && f.size > 10 * 1024 * 1024) return setError("attachment", "This file is larger than 10 MB. Choose a smaller photo or PDF.");
    }
    if (step === 4) {
      if (!$("qwName").value.trim()) { $("qwName").focus(); return setError("contact", "Enter your name"); }
      var email = $("qwEmail").value.trim();
      if (!$("qwPhone").value.trim() && !email) return setError("contact", "Enter a phone number or email");
      if (email && !/^\S+@\S+\.\S+$/.test(email)) { $("qwEmail").focus(); return setError("contact", "Check the email address"); }
    }
    return true;
  }

  /* ---------- 4. Steps ---------- */
  var sections = form.querySelectorAll(".qw-section");
  var N = sections.length, step = 1;
  form.classList.add("qw-js");

  function show() {
    sections.forEach(function (s) { s.hidden = +s.dataset.step !== step; });
    $("qwCount").textContent = "Step " + step + " of " + N;
    $("qwBar").style.width = (step / N * 100) + "%";
    $("qwBack").style.visibility = step === 1 ? "hidden" : "visible";
    $("qwNext").style.display = step === N ? "none" : "";
    if (step === N) {
      var out = checkRanges();
      $("qwSummaryNote").className = "qw-note " + (out.length ? "qw-warn" : "qw-ok");
      $("qwSummaryNote").innerHTML = out.length
        ? '<i class="fas fa-exclamation-triangle"></i> Some values are outside our usual range. We\'ll check and reply.'
        : '<i class="fas fa-check-circle"></i> Everything is within our usual rolling range.';
    }
  }
  function scrollToForm() { form.scrollIntoView({ behavior: "smooth", block: "start" }); }

  $("qwNext").addEventListener("click", function () { if (validStep(step)) { step++; show(); scrollToForm(); } });
  $("qwBack").addEventListener("click", function () { step--; show(); scrollToForm(); });
  form.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && e.target.tagName === "INPUT" && step < N) { e.preventDefault(); $("qwNext").click(); }
  });

  /* ---------- 5. Sending ---------- */
  function value(name) { var el = form.querySelector('[name="' + name + '"]'); return el ? el.value.trim() : ""; }
  function message() {
    var inch = unit() === "inch";
    var f = $("qwFile").files[0];
    return [
      "Quote request from website",
      "Thread form: " + (form.querySelector('input[name="Thread form"]:checked') || {}).value,
      "Thread: " + (value("Thread") || "-"),
      "Diameter: " + value("Diameter") + (inch ? " in" : " mm"),
      "Pitch: " + value("Pitch") + (inch ? " TPI" : " mm"),
      "Material: " + value("Material"),
      "Hardness: " + ($("qwHrcUnknown").checked ? "not known" : value("Hardness HRC") + " HRC"),
      "Quantity: " + value("Quantity") + " pcs",
      f ? "Photo/drawing: I'll send it in this chat" : "Photo/drawing: none",
      "Company: " + (value("Company") || "-"),
      "Name: " + value("name"),
      "Phone: " + (value("Phone") || "-"),
      "Email: " + (value("email") || "-"),
      value("Range check")
    ].join("\n");
  }

  $("qwWaBtn").addEventListener("click", function () {
    if (!validStep(4)) return;
    window.open("https://wa.me/" + D.whatsapp + "?text=" + encodeURIComponent(message()), "_blank", "noopener");
  });

  function done() {
    form.reset();
    checkRanges();
    $("qwFormName").textContent = "Choose a thread form";
    step = 1; show();
    $("qwSuccess").hidden = false;
    $("qwSuccess").scrollIntoView({ behavior: "smooth", block: "center" });
  }

  form.addEventListener("submit", function (e) {
    if (!validStep(4)) { e.preventDefault(); return; }
    checkRanges();
    $("qwError").hidden = true;

    /* With a photo/drawing: normal form post (attachments need it), then come back here. */
    if ($("qwFile").files.length) {
      form.querySelector('input[name="_next"]').value = location.href.split(/[?#]/)[0] + "?sent=1";
      return;
    }

    /* Without attachment: send in the background and stay on the page. */
    e.preventDefault();
    var btn = $("qwEmailBtn"), label = btn.innerHTML;
    btn.disabled = true; btn.textContent = "Sending...";
    var data = new FormData(form);
    data.delete("attachment");
    data.delete("_next");
    fetch(D.ajax, { method: "POST", headers: { "Accept": "application/json" }, body: data })
      .then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (json) {
          if (json.message && /activat/i.test(json.message)) return;
          if (!res.ok || json.success === false || json.success === "false") throw new Error("send failed");
        });
      })
      .then(done)
      .catch(function () { $("qwError").hidden = false; })
      .then(function () { btn.disabled = false; btn.innerHTML = label; });
  });

  function escapeHtml(s) {
    return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; });
  }

  /* Back from a normal post (with attachment) */
  if (/[?&]sent=1/.test(location.search)) {
    $("qwSuccess").hidden = false;
    history.replaceState(null, "", location.pathname);
  }

  checkRanges();
  show();
})();
