/* Password gate.
   The password is never stored here — only a SHA-256 hash of it.
   To change the password, replace HASH below with the SHA-256 of your new one:
     macOS Terminal →  printf 'yourpassword' | shasum -a 256                  */

(function () {
  var HASH = "2bcb43cbc8f6b7ef66331532881143fcbae60a879db3a8fb853f645bb24c2b3c";
  var KEY = "aw_unlocked";

  if (localStorage.getItem(KEY) === HASH) {
    document.documentElement.classList.remove("gated");
    return;
  }

  function sha256(str) {
    var buf = new TextEncoder().encode(str);
    return crypto.subtle.digest("SHA-256", buf).then(function (h) {
      return Array.from(new Uint8Array(h))
        .map(function (b) { return b.toString(16).padStart(2, "0"); }).join("");
    });
  }

  function build() {
    var g = document.createElement("div");
    g.className = "gate";
    g.innerHTML =
      '<div class="gate-box">' +
        '<p class="gate-name">Ahran Won</p>' +
        '<p class="gate-note">This portfolio contains client work shared for review. ' +
          'Please enter the password you were given.</p>' +
        '<div class="gate-row">' +
          '<input class="gate-input" type="password" autocomplete="current-password" ' +
            'aria-label="Password" placeholder="Password">' +
          '<button class="gate-btn" type="button">Enter</button>' +
        '</div>' +
        '<p class="gate-err" role="alert" hidden>That password isn\u2019t right. Try again.</p>' +
        '<p class="gate-foot">No password? Write to ' +
          '<a href="mailto:awonjs@gmail.com">awonjs@gmail.com</a>.</p>' +
      '</div>';
    document.body.appendChild(g);

    var input = g.querySelector(".gate-input");
    var btn = g.querySelector(".gate-btn");
    var err = g.querySelector(".gate-err");
    input.focus();

    function submit() {
      sha256(input.value).then(function (h) {
        if (h === HASH) {
          localStorage.setItem(KEY, HASH);
          document.documentElement.classList.remove("gated");
          g.remove();
        } else {
          err.hidden = false;
          input.value = "";
          input.focus();
        }
      });
    }
    btn.addEventListener("click", submit);
    input.addEventListener("keydown", function (e) {
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
