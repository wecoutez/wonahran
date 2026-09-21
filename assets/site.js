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
