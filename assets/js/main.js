/* ============================================================
   Favio Fernández — Portafolio (v8 · Dirección A)
   i18n · count-up · reveal · lightbox · nav · progreso · CV
   ============================================================ */
(function () {
  "use strict";

  var dict = window.I18N || {};
  var STORAGE_KEY = "favio-lang";
  var SUPPORTED = ["es", "en"];
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var onLangChange = []; // callbacks a re-ejecutar cuando cambia el idioma (p.ej. re-teclear el hero)

  /* ---------- Idioma ---------- */
  function detectInitialLang() {
    var saved = localStorage.getItem(STORAGE_KEY);
    if (saved && SUPPORTED.indexOf(saved) !== -1) return saved;
    var nav = (navigator.language || "es").slice(0, 2).toLowerCase();
    return SUPPORTED.indexOf(nav) !== -1 ? nav : "es";
  }

  function applyLang(lang) {
    var table = dict[lang];
    if (!table) return;
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var key = el.getAttribute("data-i18n");
      var val = table[key];
      if (val == null) return;
      if (key === "meta.description") el.setAttribute("content", val);
      else if (val.indexOf("<") !== -1) el.innerHTML = val;
      else el.textContent = val;
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach(function (el) {
      var key = el.getAttribute("data-i18n-placeholder");
      if (table[key] != null) el.setAttribute("placeholder", table[key]);
    });
    document.documentElement.setAttribute("lang", lang);
    document.querySelectorAll(".lang-toggle__opt").forEach(function (opt) {
      opt.classList.toggle("is-active", opt.getAttribute("data-lang") === lang);
    });
    document.querySelectorAll("[data-cv]").forEach(function (a) {
      a.classList.toggle("is-suggested", a.getAttribute("data-cv") === lang);
    });
    localStorage.setItem(STORAGE_KEY, lang);
    onLangChange.forEach(function (fn) { try { fn(); } catch (e) {} });
  }

  function setupLangToggle() {
    var toggle = document.getElementById("langToggle");
    if (!toggle) return;
    toggle.addEventListener("click", function (e) {
      var opt = e.target.closest(".lang-toggle__opt");
      var current = document.documentElement.getAttribute("lang") || "es";
      var next = opt ? opt.getAttribute("data-lang") : (current === "es" ? "en" : "es");
      applyLang(next);
    });
  }

  /* ---------- Tema (claro / oscuro) ---------- */
  var THEME_KEY = "favio-theme";
  function detectInitialTheme() {
    var q = (location.search.match(/theme=(dark|light)/) || [])[1];
    if (q) return q;
    var saved = localStorage.getItem(THEME_KEY);
    if (saved === "light" || saved === "dark") return saved;
    return (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) ? "dark" : "light";
  }
  function applyTheme(theme, persist) {
    document.documentElement.setAttribute("data-theme", theme);
    var btn = document.getElementById("themeToggle");
    if (btn) {
      btn.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
      btn.setAttribute("aria-label", theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro");
    }
    if (persist) localStorage.setItem(THEME_KEY, theme);
  }
  function setupThemeToggle() {
    applyTheme(detectInitialTheme(), false);
    var btn = document.getElementById("themeToggle");
    if (btn) {
      btn.addEventListener("click", function () {
        var current = document.documentElement.getAttribute("data-theme") || "light";
        applyTheme(current === "dark" ? "light" : "dark", true);
      });
    }
    // Si no hay preferencia guardada, seguir al sistema en vivo
    if (window.matchMedia) {
      var mq = window.matchMedia("(prefers-color-scheme: dark)");
      var onChange = function (e) {
        if (!localStorage.getItem(THEME_KEY)) applyTheme(e.matches ? "dark" : "light", false);
      };
      if (mq.addEventListener) mq.addEventListener("change", onChange);
      else if (mq.addListener) mq.addListener(onChange);
    }
  }

  /* ---------- Count-up ---------- */
  function animateCount(el) {
    if (el.dataset.counted) return;
    el.dataset.counted = "1";
    var target = parseInt(el.getAttribute("data-count"), 10) || 0;
    var prefix = el.getAttribute("data-prefix") || "";
    var suffix = el.getAttribute("data-suffix") || "";
    var thousands = el.getAttribute("data-thousands") === "true";
    var fmt = function (n) { return prefix + (thousands ? n.toLocaleString("es-ES") : String(n)) + suffix; };
    if (reduceMotion) { el.textContent = fmt(target); return; }
    var dur = 1100, start = null;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      el.textContent = fmt(Math.round((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /* ---------- Reveal ---------- */
  function setupReveal() {
    var items = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("is-visible"); el.querySelectorAll("[data-count]").forEach(animateCount); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        entry.target.querySelectorAll("[data-count]").forEach(animateCount);
        io.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    items.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Lightbox ---------- */
  function setupLightbox() {
    var lb = document.getElementById("lightbox");
    var img = document.getElementById("lightboxImg");
    var cap = document.getElementById("lightboxCap");
    var close = document.getElementById("lightboxClose");
    if (!lb) return;
    var BLANK = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";
    function open(src, caption) { img.src = src; img.alt = caption || ""; cap.textContent = caption || ""; lb.classList.add("is-open"); lb.setAttribute("aria-hidden", "false"); }
    function hide() { lb.classList.remove("is-open"); lb.setAttribute("aria-hidden", "true"); img.src = BLANK; img.alt = ""; }
    document.querySelectorAll("[data-full]").forEach(function (w) {
      w.addEventListener("click", function () { open(w.getAttribute("data-full"), w.getAttribute("data-cap")); });
    });
    close.addEventListener("click", hide);
    lb.addEventListener("click", function (e) { if (e.target === lb) hide(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") hide(); });
  }

  /* ---------- Webcard: selector escritorio / móvil ---------- */
  function setupWebcardToggle() {
    document.querySelectorAll(".webcard__toggle").forEach(function (tg) {
      var card = tg.closest(".webcard");
      var view = card && card.querySelector(".webcard__view");
      if (!view) return;
      tg.addEventListener("click", function (e) {
        var btn = e.target.closest(".webcard__vt");
        if (!btn) return;
        tg.querySelectorAll(".webcard__vt").forEach(function (b) { b.classList.toggle("is-active", b === btn); });
        view.classList.toggle("is-mobile", btn.getAttribute("data-view") === "mobile");
      });
    });
  }

  /* ---------- Modal de caso (bento · desktop) ---------- */
  function setupCaseModal() {
    var modal = document.getElementById("csModal");
    var body = document.getElementById("csModalBody");
    var close = document.getElementById("csModalClose");
    if (!modal || !body) return;
    function open(caseId) {
      var src = document.querySelector('.cs[data-case="' + caseId + '"]');
      if (!src) return;
      body.innerHTML = "";
      ["cs__eyebrow", "cs__title", "cs__metaline", "cs__sub"].forEach(function (cls) {
        var el = src.querySelector("." + cls);
        if (el) body.appendChild(el.cloneNode(true));
      });
      var facts = src.querySelector(".cs__facts");
      if (facts) { var f = facts.cloneNode(true); f.classList.add("is-visible-facts"); body.appendChild(f); }
      modal.classList.add("is-open");
      modal.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
    }
    function hide() {
      modal.classList.remove("is-open");
      modal.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
    }
    document.querySelectorAll(".tile__open[data-case]").forEach(function (btn) {
      btn.addEventListener("click", function () { open(btn.getAttribute("data-case")); });
    });
    close.addEventListener("click", hide);
    modal.addEventListener("click", function (e) { if (e.target === modal) hide(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && modal.classList.contains("is-open")) hide(); });
  }

  /* ---------- Nav sombra ---------- */
  function setupNavShadow() {
    var nav = document.getElementById("nav");
    if (!nav) return;
    var onScroll = function () { nav.classList.toggle("is-scrolled", window.scrollY > 8); };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ---------- Barra de progreso ---------- */
  function setupScrollFx() {
    var bar = document.getElementById("scrollProgress");
    if (!bar) return;
    var ticking = false;
    function update() {
      var h = document.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      bar.style.transform = "scaleX(" + (max > 0 ? (window.scrollY / max).toFixed(4) : 0) + ")";
      ticking = false;
    }
    window.addEventListener("scroll", function () { if (!ticking) { requestAnimationFrame(update); ticking = true; } }, { passive: true });
    update();
  }

  function setupCvMenu() {
    var menu = document.querySelector(".cvmenu");
    if (!menu) return;
    document.addEventListener("click", function (e) { if (menu.open && !menu.contains(e.target)) menu.removeAttribute("open"); });
  }

  function setupYear() { var el = document.getElementById("year"); if (el) el.textContent = new Date().getFullYear(); }

  /* ---------- Ocultar tarjetas cuya imagen aún no existe (degradar honesto) ---------- */
  function setupImgFallback() {
    document.querySelectorAll(".cert img, .dcard img").forEach(function (img) {
      var hide = function () { var card = img.closest(".cert, .dcard"); if (card) card.style.display = "none"; };
      img.addEventListener("error", hide);
      // imágenes que ya fallaron antes de enganchar el listener
      if (img.complete && img.naturalWidth === 0) hide();
    });
    // captura de SIGMA: si no existe el archivo, se oculta y queda el condensador
    document.querySelectorAll(".cs__shot").forEach(function (img) {
      var hide = function () { img.style.display = "none"; };
      img.addEventListener("error", hide);
      if (img.complete && img.naturalWidth === 0) hide();
    });
  }

  /* ---------- Hero: rol que rota (revelado con máscara) + línea de terminal tecleada ---------- */
  function setupHeroCycle() {
    var word = document.getElementById("heroCycle");
    var inner = word && word.querySelector(".hero__cycle-inner");
    var term = document.getElementById("heroTerm");
    var termMsg = document.getElementById("heroTermMsg");
    if (!word || !inner) return;
    var words = (word.getAttribute("data-words") || "").split(",").map(function (w) { return w.trim(); }).filter(Boolean);
    function msgs() {
      var lang = document.documentElement.getAttribute("lang") || "es";
      var raw = (term && (term.getAttribute("data-msgs-" + lang) || term.getAttribute("data-msgs-es"))) || "";
      return raw.split("|").map(function (m) { return m.trim(); }).filter(Boolean);
    }
    var i = 0;
    var typeTimer = null;
    function clearType() { if (typeTimer) { clearTimeout(typeTimer); typeTimer = null; } }
    function typeMsg(text, done) {
      if (!termMsg) { if (done) done(); return; }
      var n = 0;
      (function step() {
        termMsg.textContent = text.slice(0, n);
        if (n++ >= text.length) { clearType(); if (done) done(); return; }
        typeTimer = setTimeout(step, 42);
      })();
    }
    function eraseMsg(done) {
      if (!termMsg) { if (done) done(); return; }
      var text = termMsg.textContent, n = text.length;
      (function step() {
        termMsg.textContent = text.slice(0, n);
        if (n-- <= 0) { clearType(); if (done) done(); return; }
        typeTimer = setTimeout(step, 22);
      })();
    }

    // Estado inicial
    inner.textContent = words[i] || inner.textContent;
    if (termMsg) termMsg.textContent = msgs()[i] || termMsg.textContent;

    if (reduceMotion || words.length < 2) {
      // Sin animación: solo re-pintar el mensaje si cambia el idioma
      onLangChange.push(function () { if (termMsg) termMsg.textContent = msgs()[i] || ""; });
      return;
    }

    // Al cambiar idioma: re-teclear el mensaje actual en el idioma nuevo
    onLangChange.push(function () { clearType(); typeMsg(msgs()[i] || ""); });

    setInterval(function () {
      i = (i + 1) % words.length;
      // Título: revelado con máscara (sale hacia arriba, entra desde abajo)
      inner.classList.add("is-out");
      setTimeout(function () {
        inner.textContent = words[i];
        inner.classList.remove("is-out");
        inner.style.transition = "none";
        inner.style.transform = "translateY(105%)";
        void inner.offsetHeight; // forzar reflow
        inner.style.transition = "";
        inner.style.transform = "";
      }, 420);
      // Terminal: borrar y teclear el nuevo mensaje
      clearType();
      eraseMsg(function () { typeMsg(msgs()[i]); });
    }, 4000);
  }

  /* ---------- Condensador: reactividad al cursor ---------- */
  function setupCondensador() {
    var svg = document.getElementById("condensador");
    if (!svg || reduceMotion) return;
    var nodes = [].slice.call(svg.querySelectorAll(".cond-node"));
    if (!nodes.length) return;
    svg.addEventListener("mousemove", function (e) {
      var r = svg.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width * 200;
      var y = (e.clientY - r.top) / r.height * 200;
      var best = null, bestD = Infinity;
      nodes.forEach(function (n) {
        var dx = x - parseFloat(n.getAttribute("cx"));
        var dy = y - parseFloat(n.getAttribute("cy"));
        var d = dx * dx + dy * dy;
        if (d < bestD) { bestD = d; best = n; }
      });
      nodes.forEach(function (n) { n.classList.toggle("is-hot", n === best && bestD < 2600); });
    });
    svg.addEventListener("mouseleave", function () {
      nodes.forEach(function (n) { n.classList.remove("is-hot"); });
    });
  }

  /* ---------- Botones magnéticos ---------- */
  function setupMagnetic() {
    if (reduceMotion) return;
    document.querySelectorAll(".btn--primary").forEach(function (btn) {
      btn.addEventListener("mousemove", function (e) {
        var r = btn.getBoundingClientRect();
        var mx = e.clientX - r.left - r.width / 2;
        var my = e.clientY - r.top - r.height / 2;
        btn.style.transform = "translate(" + (mx * 0.18).toFixed(1) + "px," + (my * 0.28).toFixed(1) + "px)";
      });
      btn.addEventListener("mouseleave", function () { btn.style.transform = ""; });
    });
  }

  /* ---------- Statement: resaltar la tarjeta de disciplina activa en ciclo ---------- */
  function setupPillarCycle() {
    var cards = [].slice.call(document.querySelectorAll(".disc-card"));
    if (cards.length < 2) return;
    function light(k) { cards.forEach(function (c, n) { c.classList.toggle("is-active", n === k); }); }
    light(0);
    if (reduceMotion) return; // estático (una destacada)
    var i = 0;
    setInterval(function () { i = (i + 1) % cards.length; light(i); }, 2200);
  }

  /* ---------- Entrada animada del hero ---------- */
  function setupHeroIntro() {
    var hero = document.getElementById("heroContent");
    if (!hero) return;
    if (reduceMotion) { hero.classList.add("is-loaded"); return; }
    requestAnimationFrame(function () { requestAnimationFrame(function () { hero.classList.add("is-loaded"); }); });
  }

  document.addEventListener("DOMContentLoaded", function () {
    applyLang(detectInitialLang());
    setupLangToggle();
    setupThemeToggle();
    setupReveal();
    setupLightbox();
    setupCaseModal();
    setupWebcardToggle();
    setupNavShadow();
    setupScrollFx();
    setupCvMenu();
    setupYear();
    setupImgFallback();
    setupHeroCycle();
    setupCondensador();
    setupPillarCycle();
    setupMagnetic();
    setupHeroIntro();
  });
})();
