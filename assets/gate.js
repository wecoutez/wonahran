/* ------------------------------------------------------------------
   Access gate.

   Visitors leave an email address to continue. The address is posted to
   whatever endpoint you set below, so you get a record of who came in.

   1) ENDPOINT — where sign-ins are sent. Two easy options:

      Formspree      formspree.io → create a form, paste its
                     "https://formspree.io/f/xxxxxxx" URL here.
                     Sign-ins arrive as email. Free tier: 50 / month.

      Google Sheet   Apps Script → new project → a doPost(e) that appends
                     to a sheet → Deploy as Web App, access "Anyone".
                     Paste the /exec URL here. Free, unlimited, and you
                     get a spreadsheet you can sort.

      Leave it empty and the gate still works — it just records nothing.

   2) REQUIRE_PASSWORD — set true to also ask for a shared password.
      PASS_HASH is the SHA-256 of that password:
        printf 'yourpassword' | shasum -a 256

   This is a courtesy gate, not a lock. The pages are static files, so
   anyone determined can read them from the network tab. It keeps casual
   visitors out and tells you who walked in — nothing more.
------------------------------------------------------------------- */

(function () {
  var ENDPOINT = "https://formspree.io/f/xbgrdzlj";                 // <- paste your Formspree or Apps Script URL
  var REQUIRE_PASSWORD = false;      // <- true to also ask for a password
  var PASS_HASH = "2bcb43cbc8f6b7ef66331532881143fcbae60a879db3a8fb853f645bb24c2b3c";

  var KEY = "aw_access_v2";          // new key: previously stored logins no longer work
  var open = document.documentElement.classList;

  if (localStorage.getItem(KEY)) { open.remove("gated"); return; }

  function sha256(str) {
    return crypto.subtle.digest("SHA-256", new TextEncoder().encode(str))
      .then(function (h) {
        return Array.from(new Uint8Array(h))
          .map(function (b) { return b.toString(16).padStart(2, "0"); }).join("");
      });
  }

  function record(entry) {
    if (!ENDPOINT) return Promise.resolve();
    var appsScript = ENDPOINT.indexOf("script.google.com") !== -1;
    return fetch(ENDPOINT, {
      method: "POST",
      mode: appsScript ? "no-cors" : "cors",
      headers: appsScript
        ? { "Content-Type": "text/plain;charset=utf-8" }
        : { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(entry)
    }).catch(function () { /* never block entry on a logging failure */ });
  }

  function build() {
    var g = document.createElement("div");
    g.className = "gate";
    g.innerHTML =
      '<div class="gate-box">' +
        '<p class="gate-name">Ahran Won</p>' +
        '<p class="gate-note">' +
          '<span class="en">Selected work, shared privately. Leave your email to continue.</span>' +
          '<span class="ko">비공개로 공유되는 작업입니다. 이메일을 남기면 계속 볼 수 있습니다.</span>' +
        '</p>' +
        '<div class="gate-fields">' +
          '<input class="gate-input" type="text" name="name" autocomplete="name" ' +
            'aria-label="Name" placeholder="Name (optional)">' +
          '<input class="gate-input gate-email" type="email" name="email" ' +
            'autocomplete="email" inputmode="email" aria-label="Email" placeholder="Email">' +
          (REQUIRE_PASSWORD
            ? '<input class="gate-input gate-pass" type="password" ' +
              'autocomplete="current-password" aria-label="Password" placeholder="Password">'
            : '') +
          '<button class="gate-btn" type="button">' +
            '<span class="en">Continue</span><span class="ko">계속</span>' +
          '</button>' +
        '</div>' +
        '<p class="gate-err" role="alert" hidden></p>' +
        '<p class="gate-foot">' +
          '<span class="en">Questions? </span><span class="ko">문의는 </span>' +
          '<a href="mailto:awonjs@gmail.com">awonjs@gmail.com</a>' +
        '</p>' +
      '</div>';
    document.body.appendChild(g);

    var name  = g.querySelector('input[name="name"]');
    var email = g.querySelector(".gate-email");
    var pass  = g.querySelector(".gate-pass");
    var btn   = g.querySelector(".gate-btn");
    var err   = g.querySelector(".gate-err");
    var isKo  = function () { return document.documentElement.lang === "ko"; };
    email.focus();

    function fail(en, kr) {
      err.textContent = isKo() ? kr : en;
      err.hidden = false;
    }

    function enter() {
      localStorage.setItem(KEY, "1");
      open.remove("gated");
      g.remove();
    }

    function submit() {
      var value = email.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
        fail("That doesn\u2019t look like an email address.", "\uc774\uba54\uc77c \uc8fc\uc18c \ud615\uc2dd\uc774 \uc544\ub2d9\ub2c8\ub2e4.");
        email.focus();
        return;
      }
      btn.disabled = true;

      var entry = {
        email: value,
        name: name.value.trim(),
        page: location.pathname,
        referrer: document.referrer || "direct",
        at: new Date().toISOString()
      };

      if (REQUIRE_PASSWORD) {
        sha256(pass.value).then(function (h) {
          if (h !== PASS_HASH) {
            btn.disabled = false;
            fail("That password isn\u2019t right.", "\ube44\ubc00\ubc88\ud638\uac00 \ub9de\uc9c0 \uc54a\uc2b5\ub2c8\ub2e4.");
            pass.value = "";
            pass.focus();
            return;
          }
          record(entry).then(enter);
        });
      } else {
        record(entry).then(enter);
      }
    }

    btn.addEventListener("click", submit);
    g.addEventListener("keydown", function (e) {
      if (e.key === "Enter") submit();
      else err.hidden = true;
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", build);
  } else {
    build();
  }
})();
