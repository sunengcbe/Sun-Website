/* =========================================================
   SUN ENGINEERING WORKS — MAIN JAVASCRIPT
   ---------------------------------------------------------
   Contents
   1. Page Loader
   2. Sticky Header on Scroll
   3. Mobile Menu Toggle
   4. Active Nav Link on Scroll (Scroll Spy)
   5. Reveal-on-Scroll Animations (IntersectionObserver)
   6. Contact Form Submission (demo)
   ========================================================= */

(function () {
  "use strict";

  /* ===== 1. PAGE LOADER ===== */
  window.addEventListener("load", function () {
    var loader = document.getElementById("loader");
    if (loader) {
      setTimeout(function () { loader.classList.add("hidden"); }, 600);
    }
  });

  /* ===== 2. STICKY HEADER ON SCROLL ===== */
  var header = document.getElementById("header");
  function onScrollHeader() {
    if (!header) return;
    if (window.scrollY > 40) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }
  }
  window.addEventListener("scroll", onScrollHeader, { passive: true });
  onScrollHeader();

  /* ===== 3. MOBILE MENU TOGGLE ===== */
  var menuToggle = document.getElementById("menuToggle");
  var navLinks = document.getElementById("navLinks");

  if (menuToggle && navLinks) {
    menuToggle.addEventListener("click", function () {
      var isOpen = navLinks.classList.toggle("open");
      menuToggle.classList.toggle("open", isOpen);
      menuToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });

    /* Close menu when a link is clicked */
    navLinks.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        navLinks.classList.remove("open");
        menuToggle.classList.remove("open");
        menuToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ===== 4. ACTIVE NAV LINK ON SCROLL (SCROLL SPY — HOME PAGE ONLY) ===== */
  /* Interior pages set the active class directly in their HTML.
     Scroll spy is only needed on the home page where all sections coexist. */
  var sections = document.querySelectorAll("section[id]");
  var navLinkEls = document.querySelectorAll(".nav-link");

  if (sections.length > 2) {
    function setActiveLink() {
      var current = "";
      var scrollPos = window.scrollY + 120;
      sections.forEach(function (sec) {
        if (scrollPos >= sec.offsetTop) {
          current = sec.getAttribute("id");
        }
      });
      navLinkEls.forEach(function (link) {
        link.classList.remove("active");
        if (link.getAttribute("href") === "#" + current) {
          link.classList.add("active");
        }
      });
    }
    window.addEventListener("scroll", setActiveLink, { passive: true });
    setActiveLink();
  }

  /* ===== 5. REVEAL-ON-SCROLL ANIMATIONS ===== */
  var revealEls = document.querySelectorAll(".reveal");

  if ("IntersectionObserver" in window) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
    );
    revealEls.forEach(function (el) { observer.observe(el); });
  } else {
    /* Fallback: show everything */
    revealEls.forEach(function (el) { el.classList.add("visible"); });
  }

  /* ===== 6. CONTACT FORM SUBMISSION (sent by email via FormSubmit) ===== */
  var contactForm = document.getElementById("contactForm");
  var formSuccess = document.getElementById("formSuccess");
  var formError = document.getElementById("formError");

  if (contactForm) {
    var contactOpened = Date.now();
    contactForm.addEventListener("submit", function (e) {
      e.preventDefault();
      /* Spam guard: bots fill the hidden field or submit within a second or two.
         Pretend it worked so they don't retry, but send nothing. */
      var honey = contactForm.querySelector('input[name="_honey"]');
      if ((honey && honey.value) || Date.now() - contactOpened < 3000) {
        contactForm.reset();
        if (formSuccess) showMessage(formSuccess);
        return;
      }
      if (formSuccess) formSuccess.hidden = true;
      if (formError) formError.hidden = true;

      if (!contactForm.checkValidity()) {
        contactForm.reportValidity();
        return;
      }

      var button = contactForm.querySelector("button[type=submit]");
      var buttonText = button ? button.textContent : "";
      if (button) { button.disabled = true; button.textContent = "Sending..."; }

      fetch(contactForm.action, {
        method: "POST",
        headers: { "Accept": "application/json" },
        body: new FormData(contactForm)
      })
        .then(function (res) {
          return res.json().catch(function () { return {}; }).then(function (data) {
            /* First message before activation: FormSubmit holds it and emails an activation link. */
            if (data.message && /activat/i.test(data.message)) return;
            if (!res.ok || data.success === false || data.success === "false") {
              throw new Error(data.message || "Send failed");
            }
          });
        })
        .then(function () {
          contactForm.reset();
          showMessage(formSuccess);
        })
        .catch(function () {
          showMessage(formError);
        })
        .then(function () {
          if (button) { button.disabled = false; button.textContent = buttonText; }
        });
    });
  }

  function showMessage(el) {
    if (!el) return;
    el.hidden = false;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
  }
})();

document.addEventListener("DOMContentLoaded", () => {

    const helix = document.querySelector(".helix-track");

    if (!helix) return;

    const segments = 850;
    const helixWidth = window.innerWidth * 1.25;
    const radius = 250;

    for (let i = 0; i < segments; i++) {

        const segment = document.createElement("div");

        segment.classList.add("helix-segment");

        const progress = i / (segments - 1);

        const x = progress * helixWidth - helixWidth / 2;

        const angle = progress * Math.PI * 5;

        const y = Math.cos(angle) * radius;

        const z = Math.sin(angle) * radius;

        const rotation = angle * 170 / Math.PI;

        segment.style.transform = `
            translate3d(${x}px, ${y}px, ${z}px)
            rotateZ(${rotation}deg)
        `;

        helix.appendChild(segment);
    }

});