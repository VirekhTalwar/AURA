/* Aura Technical Solutions - Site JS
   Minimal, framework-free interactions + GSAP animations
*/

(function () {
  "use strict";

  function qs(sel, root) {
    return (root || document).querySelector(sel);
  }
  function qsa(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  function setYear() {
    var el = qs("[data-year]");
    if (el) el.textContent = String(new Date().getFullYear());
  }

  function initMobileNav() {
    var btn = qs("#navToggle");
    var panel = qs("#mobilePanel");
    if (!btn || !panel) return;

    function setOpen(open) {
      panel.classList.toggle("open", open);
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    }

    btn.addEventListener("click", function () {
      var isOpen = panel.classList.contains("open");
      setOpen(!isOpen);
    });

    qsa("a", panel).forEach(function (a) {
      a.addEventListener("click", function () {
        setOpen(false);
      });
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") setOpen(false);
    });
  }

  function initHeaderScroll() {
    var header = qs(".site-header");
    if (!header) return;

    var lastY = window.scrollY || 0;
    var ticking = false;

    function onScroll() {
      var y = window.scrollY || 0;
      header.classList.toggle("scrolled", y > 10);

      var goingDown = y > lastY;
      header.classList.toggle("nav-hidden", goingDown && y > 160);

      lastY = y;
      ticking = false;
    }

    window.addEventListener(
      "scroll",
      function () {
        if (!ticking) {
          ticking = true;
          window.requestAnimationFrame(onScroll);
        }
      },
      { passive: true }
    );

    onScroll();
  }

  function scrollToEl(el) {
    if (!el) return;
    var reduceMotion =
      window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    var header = qs(".site-header");
    var headerH = header ? header.getBoundingClientRect().height : 0;
    var y = window.scrollY + el.getBoundingClientRect().top - headerH - 12;

    window.scrollTo({ top: Math.max(0, y), behavior: reduceMotion ? "auto" : "smooth" });
  }

  function initSmoothAnchors() {
    qsa('a[href^="#"]').forEach(function (a) {
      var href = a.getAttribute("href") || "";
      if (href === "#" || href.length < 2) return;

      a.addEventListener("click", function (e) {
        var id = href.slice(1);
        var target = document.getElementById(id);
        if (!target) return;

        e.preventDefault();
        scrollToEl(target);

        // Improve UX for the contact section
        if (id === "contact") {
          window.setTimeout(function () {
            var focusEl = qs("#name");
            if (focusEl && typeof focusEl.focus === "function") {
              focusEl.focus({ preventScroll: true });
            }
          }, 450);
        }
      });
    });
  }

  function initFormValidation() {
    var form = qs("#contactForm");
    if (!form) return;

    var status = qs("#formStatus");
    var submitBtn = qs("button[type=submit]", form);

    function showError(id, msg) {
      var el = qs("#" + id);
      if (!el) return;
      el.textContent = msg;
      el.classList.toggle("show", Boolean(msg));
    }

    function setStatus(msg, isError) {
      if (!status) return;
      status.textContent = msg;
      status.classList.toggle("is-error", Boolean(isError));
      status.classList.toggle("is-ok", !isError);
      status.hidden = !msg;
    }

    function validate() {
      var name = qs("#name").value.trim();
      var email = qs("#email").value.trim();
      var project = qs("#project").value.trim();
      var budget = qs("#budget").value.trim();

      var ok = true;
      showError("errName", "");
      showError("errEmail", "");
      showError("errProject", "");

      if (name.length < 2) {
        showError("errName", "Please enter your name.");
        ok = false;
      }

      var emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      if (!emailOk) {
        showError("errEmail", "Please enter a valid email address.");
        ok = false;
      }

      if (project.length < 12) {
        showError("errProject", "Tell us a bit more (at least 12 characters).");
        ok = false;
      }

      if (!budget) {
        // optional field: do nothing
      }

      setStatus("", false);
      return ok;
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      if (!validate()) {
        setStatus("Please fix the highlighted fields.", true);
        return;
      }

      var nameVal = qs("#name").value.trim();
      var emailVal = qs("#email").value.trim();
      var budgetVal = qs("#budget").value.trim();
      var projectVal = qs("#project").value.trim();

      var serviceId = (form.getAttribute("data-emailjs-service") || "").trim();
      var templateId = (form.getAttribute("data-emailjs-template") || "").trim();
      var publicKey = (form.getAttribute("data-emailjs-publickey") || "").trim();

      var canEmailJs = Boolean(serviceId && templateId && publicKey && window.emailjs);

      if (canEmailJs) {
        if (submitBtn) submitBtn.disabled = true;
        setStatus("Sending…", false);
        scrollToEl(status);

        try {
          window.emailjs.init({ publicKey: publicKey });
        } catch (_) {
          if (submitBtn) submitBtn.disabled = false;
          setStatus("Email service failed to initialize. Please use the Email link or WhatsApp.", true);
          return;
        }

        window.emailjs
          .send(serviceId, templateId, {
            from_name: nameVal,
            from_email: emailVal,
            budget: budgetVal,
            message: projectVal,
            reply_to: emailVal,
          })
          .then(
            function () {
              setStatus("Message sent successfully. We’ll get back to you soon.", false);
              scrollToEl(status);
              form.reset();
              if (submitBtn) submitBtn.disabled = false;
            },
            function () {
              setStatus("Could not send via email service. Please use the Email link or WhatsApp.", true);
              scrollToEl(status);
              if (submitBtn) submitBtn.disabled = false;
            }
          );
        return;
      }

      setStatus(
        "Your message is ready. Use the Email link to send it (or WhatsApp for faster replies).",
        false
      );
      scrollToEl(status);

      try {
        var name = encodeURIComponent(nameVal);
        var email = encodeURIComponent(emailVal);
        var budget = encodeURIComponent(budgetVal);
        var project = encodeURIComponent(projectVal);

        var subject = encodeURIComponent("Website project inquiry — Aura Technical Solutions");
        var body =
          "Name: " +
          name +
          "\nEmail: " +
          email +
          "\nBudget: " +
          budget +
          "\n\nProject Details:\n" +
          project;

        var mailto = "mailto:hello@auratechsolutions.com?subject=" + subject + "&body=" + body;
        var emailLink = qs("#emailDraftLink");
        if (emailLink) emailLink.setAttribute("href", mailto);
      } catch (_) {
        // ignore
      }
    });

    qsa("input, textarea", form).forEach(function (el) {
      el.addEventListener("blur", validate);
    });
  }

  function initAnimations() {
    var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    if (!window.gsap) return;

    if (window.ScrollTrigger) {
      window.gsap.registerPlugin(window.ScrollTrigger);
    }

    // Page load overlay
    var loader = qs("#pageLoader");
    if (loader) {
      window.gsap.to(loader, {
        opacity: 0,
        duration: 0.6,
        ease: "power2.out",
        delay: 0.15,
        onComplete: function () {
          loader.remove();
        },
      });
    }

    // Hero reveal
    var hero = qs(".hero");
    if (hero) {
      var items = qsa("[data-hero]", hero);
      window.gsap.from(items, {
        y: 18,
        opacity: 0,
        duration: 0.9,
        ease: "power3.out",
        stagger: 0.08,
        delay: 0.15,
      });
    }

    // Scroll reveals
    if (window.ScrollTrigger) {
      qsa(".js-reveal").forEach(function (el) {
        window.gsap.from(el, {
          y: 22,
          opacity: 0,
          duration: 0.9,
          ease: "power3.out",
          scrollTrigger: {
            trigger: el,
            start: "top 82%",
          },
        });
      });

      // Subtle parallax
      qsa("[data-parallax]").forEach(function (el) {
        var amount = Number(el.getAttribute("data-parallax")) || 10;
        window.gsap.to(el, {
          yPercent: amount,
          ease: "none",
          scrollTrigger: {
            trigger: el,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        });
      });
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    setYear();
    initMobileNav();
    initHeaderScroll();
    initSmoothAnchors();
    initFormValidation();
    initAnimations();
  });
})();
