// Scroll reveals for work cards + staggered fill for the discipline matrix.
// Everything degrades to the finished state if JS or IntersectionObserver is unavailable.
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var supported = 'IntersectionObserver' in window;

  var cards = document.querySelectorAll('.reveal');
  if (reduce || !supported) {
    cards.forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e, i) {
        if (!e.isIntersecting) return;
        var el = e.target;
        setTimeout(function () { el.classList.add('in'); }, i * 70);
        io.unobserve(el);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    cards.forEach(function (el) { io.observe(el); });
  }

  var mx = document.querySelector('.mx');
  if (!mx || reduce || !supported) return;

  mx.classList.add('anim');
  mx.querySelectorAll('.on .dot').forEach(function (d, i) {
    d.style.transitionDelay = (i * 45) + 'ms';
  });
  var mo = new IntersectionObserver(function (entries) {
    if (entries[0].isIntersecting) { mx.classList.add('lit'); mo.disconnect(); }
  }, { threshold: 0.25 });
  mo.observe(mx);
})();

/* language toggle */
(function () {
  var btn = document.querySelector(".lang");
  if (!btn) return;
  btn.addEventListener("click", function () {
    var next = document.documentElement.lang === "ko" ? "en" : "ko";
    document.documentElement.lang = next;
    localStorage.setItem("aw_lang", next);
  });
})();

/* gallery rails: arrows scroll one card; hidden when everything fits */
(function () {
  document.querySelectorAll(".rail").forEach(function (rail) {
    var list = rail.querySelector(".cards");
    var prev = rail.querySelector(".prev"), next = rail.querySelector(".next");
    if (!list || !prev || !next) return;
    function step() {
      var c = list.querySelector(".card");
      return c ? c.getBoundingClientRect().width + parseFloat(getComputedStyle(list).columnGap || 16) : 300;
    }
    function sync() {
      var max = list.scrollWidth - list.clientWidth;
      rail.classList.toggle("fits", max <= 2);
      prev.disabled = list.scrollLeft <= 2;
      next.disabled = list.scrollLeft >= max - 2;
    }
    prev.addEventListener("click", function () { list.scrollBy({ left: -step(), behavior: "smooth" }); });
    next.addEventListener("click", function () { list.scrollBy({ left: step(), behavior: "smooth" }); });
    list.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    sync();
  });
})();

/* hero film: sound toggle; stays paused for reduced motion */
(function () {
  var v = document.querySelector(".reel-video"), b = document.querySelector(".reel-sound");
  if (!v) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { v.removeAttribute("autoplay"); v.pause(); }
  if (!b) return;
  b.addEventListener("click", function () {
    var on = v.muted;
    v.muted = !on;
    if (on) v.play();
    b.setAttribute("aria-pressed", on ? "true" : "false");
    b.innerHTML = on ? '<span class="en">Sound off</span><span class="ko">소리 끄기</span>'
                     : '<span class="en">Sound on</span><span class="ko">소리 켜기</span>';
  });
})();

/* lightbox: every image on a project page opens large; arrows, keys and swipe move between them */
(function () {
  var sel = ".project .phero img, .project .fig img";
  var imgs = [].slice.call(document.querySelectorAll(sel));
  if (!imgs.length) return;

  var box = document.createElement("div");
  box.className = "lb"; box.hidden = true;
  box.setAttribute("role", "dialog"); box.setAttribute("aria-modal", "true"); box.setAttribute("aria-label", "Image viewer");
  box.innerHTML =
    '<button class="lb-close" type="button" aria-label="Close">Close</button>' +
    '<button class="lb-prev" type="button" aria-label="Previous image"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5m6-6-6 6 6 6"/></svg></button>' +
    '<figure class="lb-fig"><img alt=""><figcaption class="lb-cap"></figcaption></figure>' +
    '<button class="lb-next" type="button" aria-label="Next image"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg></button>' +
    '<p class="lb-count" aria-live="polite"></p>';
  document.body.appendChild(box);

  var big = box.querySelector(".lb-fig img"), cap = box.querySelector(".lb-cap"),
      count = box.querySelector(".lb-count"), closeBtn = box.querySelector(".lb-close");
  var list = [], i = 0, opener = null;

  function visible() { return imgs.filter(function (el) { return el.style.display !== "none" && el.naturalWidth !== 0; }); }
  function show(n) {
    i = (n + list.length) % list.length;
    var el = list[i];
    big.src = el.currentSrc || el.src; big.alt = el.alt || "";
    var c = el.closest("figure") && el.closest("figure").querySelector(".cap");
    cap.innerHTML = c ? c.innerHTML : ""; cap.hidden = !c;
    count.textContent = (i + 1) + " / " + list.length;
    box.classList.toggle("single", list.length < 2);
  }
  function open(el) {
    list = visible(); if (!list.length) return;
    opener = el; show(Math.max(0, list.indexOf(el)));
    box.hidden = false; document.documentElement.classList.add("lb-on");
    closeBtn.focus();
  }
  function close() {
    box.hidden = true; document.documentElement.classList.remove("lb-on");
    big.removeAttribute("src"); if (opener) opener.focus();
  }

  imgs.forEach(function (el) {
    el.classList.add("zoomable"); el.tabIndex = 0; el.setAttribute("role", "button");
    el.setAttribute("aria-label", (el.alt ? el.alt + " — " : "") + "view larger");
    el.addEventListener("click", function () { open(el); });
    el.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(el); } });
  });
  closeBtn.addEventListener("click", close);
  box.querySelector(".lb-prev").addEventListener("click", function () { show(i - 1); });
  box.querySelector(".lb-next").addEventListener("click", function () { show(i + 1); });
  box.addEventListener("click", function (e) { if (e.target === box || e.target.classList.contains("lb-fig")) close(); });
  document.addEventListener("keydown", function (e) {
    if (box.hidden) return;
    if (e.key === "Escape") close();
    else if (e.key === "ArrowLeft") show(i - 1);
    else if (e.key === "ArrowRight") show(i + 1);
    else if (e.key === "Tab") { // keep focus inside the viewer
      var f = [].slice.call(box.querySelectorAll("button")).filter(function (b) { return b.offsetParent; });
      var a = f[0], z = f[f.length - 1];
      if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
      else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
    }
  });
  var x0 = null;
  box.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; }, { passive: true });
  box.addEventListener("touchend", function (e) {
    if (x0 === null) return;
    var dx = e.changedTouches[0].clientX - x0; x0 = null;
    if (Math.abs(dx) > 40) show(i + (dx < 0 ? 1 : -1));
  });
})();
