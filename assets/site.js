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
