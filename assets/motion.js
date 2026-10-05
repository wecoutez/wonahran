// POP layer: drifting ground, pointer parallax on the collage, scroll drift,
// window reveals, card tilt, and videos that only play while on screen.
// Everything degrades to a still, finished page without JS or with reduced motion.
(function () {
  var doc = document.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var io = "IntersectionObserver" in window;
  doc.classList.add("js");

  /* soft ground */
  if (!document.querySelector(".bg")) {
    var bg = document.createElement("div");
    bg.className = "bg"; bg.setAttribute("aria-hidden", "true");
    bg.innerHTML = "<i></i><i></i><i></i>";
    document.body.insertBefore(bg, document.body.firstChild);
  }

  /* split display words into letters so they can drop in */
  document.querySelectorAll(".mh-word[data-split]").forEach(function (h) {
    var text = h.textContent.trim(), html = "", i = 0;
    h.setAttribute("aria-label", text);
    text.split("").forEach(function (c) {
      if (c === " ") { html += '<span class="sp" aria-hidden="true"> </span>'; return; }
      var r = (i % 2 ? 1 : -1) * (4 + (i * 7) % 9);
      html += '<span class="ch" aria-hidden="true" style="--i:' + i + ';--r:' + r + '">' + c + "</span>";
      i++;
    });
    h.innerHTML = '<span class="fit">' + html + "</span>";
  });

  /* size each display word so it spans its frame edge to edge */
  function fit() {
    document.querySelectorAll(".mh-word .fit").forEach(function (f) {
      var h = f.parentNode;
      h.style.fontSize = "";
      var w = f.getBoundingClientRect().width;
      if (!w) return;
      var cs = getComputedStyle(h);
      var room = h.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      h.style.fontSize = (parseFloat(cs.fontSize) * room / w * 0.995).toFixed(2) + "px";
    });
  }
  fit();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
  window.addEventListener("resize", fit);

  /* collage videos: play only when visible */
  var vids = [].slice.call(document.querySelectorAll(".tl video, .cs-vid"));
  if (reduce) {
    vids.forEach(function (v) { v.removeAttribute("autoplay"); v.pause(); });
  } else if (io && vids.length) {
    var vo = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        var v = e.target;
        if (e.isIntersecting) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
        else v.pause();
      });
    }, { threshold: 0.05 });
    vids.forEach(function (v) { vo.observe(v); });
  }

  /* window reveals */
  var rv = [].slice.call(document.querySelectorAll(".group, .span, .cta, .about, .cv, .mq, .cs-sec"));
  rv.forEach(function (el) {
    el.classList.add("rv");
    el.querySelectorAll(".card").forEach(function (c, k) { c.style.setProperty("--k", k); });
  });
  if (reduce || !io) {
    rv.forEach(function (el) { el.classList.add("in"); });
  } else {
    var ro = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add("in"); ro.unobserve(e.target);
      });
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0.06 });
    rv.forEach(function (el) { ro.observe(el); });
  }

  if (reduce) return;

  /* pointer parallax on the collage */
  var stage = document.querySelector(".mh-win, .am");
  var tiles = stage ? [].slice.call(stage.querySelectorAll(".tl")) : [];
  if (stage && fine && tiles.length) {
    var tx = 0, ty = 0, cx = 0, cy = 0, raf = 0;
    function loop() {
      cx += (tx - cx) * 0.08; cy += (ty - cy) * 0.08;
      stage.style.setProperty("--mx", cx.toFixed(2));
      stage.style.setProperty("--my", cy.toFixed(2));
      raf = Math.abs(tx - cx) + Math.abs(ty - cy) > 0.05 ? requestAnimationFrame(loop) : 0;
    }
    stage.addEventListener("pointermove", function (e) {
      var r = stage.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width - 0.5) * 36;
      ty = ((e.clientY - r.top) / r.height - 0.5) * 24;
      if (!raf) raf = requestAnimationFrame(loop);
    });
    stage.addEventListener("pointerleave", function () { tx = 0; ty = 0; if (!raf) raf = requestAnimationFrame(loop); });
  }

  /* scroll: the word lifts, the collage spreads */
  if (stage) {
    var ticking = false;
    function onScroll() {
      ticking = false;
      var h = stage.offsetHeight || 1;
      var p = Math.min(1, Math.max(0, window.scrollY / h));
      stage.style.setProperty("--sp", p.toFixed(3));
    }
    window.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
    }, { passive: true });
    onScroll();
  }

  /* card tilt */
  if (fine) {
    document.querySelectorAll(".group .card a").forEach(function (a) {
      var img = a.querySelector(".card-img");
      if (!img) return;
      a.addEventListener("pointermove", function (e) {
        var r = img.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        img.style.setProperty("--ty", (x * 10).toFixed(2) + "deg");
        img.style.setProperty("--tx", (-y * 10).toFixed(2) + "deg");
      });
      a.addEventListener("pointerleave", function () {
        img.style.setProperty("--ty", "0deg"); img.style.setProperty("--tx", "0deg");
      });
    });
  }
})();

/* side-by-side images share one height: each takes width in proportion to its ratio */
(function () {
  function fit(img) {
    var f = img.closest(".pair > .fig");
    if (f && img.naturalWidth) f.style.setProperty("--ar", (img.naturalWidth / img.naturalHeight).toFixed(4));
  }
  document.querySelectorAll(".pair > .fig img").forEach(function (img) {
    if (img.complete) fit(img); else img.addEventListener("load", function () { fit(img); });
  });
})();
