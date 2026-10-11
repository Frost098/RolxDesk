/* RD mobile secrets v1 — tap / long-press / shake */
(function () {
  if (window.__RD_MOBILE_SECRET_V1__) return;
  window.__RD_MOBILE_SECRET_V1__ = true;

  function toast(m, t) {
    if (typeof showToast === "function") showToast(m, t || "success");
  }

  function injectCss() {
    if (document.getElementById("rd-msecret-css")) return;
    var st = document.createElement("style");
    st.id = "rd-msecret-css";
    st.textContent =
      "#rd-secret-sheet{position:fixed;left:0;right:0;bottom:0;z-index:2147483500;background:#12141c;border-top:1px solid rgba(255,255,255,.12);border-radius:18px 18px 0 0;padding:12px 14px 28px;transform:translateY(110%);transition:transform .28s cubic-bezier(.2,.9,.2,1);max-height:70vh;overflow:auto;}" +
      "#rd-secret-sheet.open{transform:translateY(0);}" +
      "#rd-secret-sheet h3{margin:4px 0 12px;font:700 15px system-ui;color:#fff;}" +
      "#rd-secret-sheet .grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;}" +
      "#rd-secret-sheet button{border:0;border-radius:12px;padding:14px 10px;font:600 13px system-ui;background:#1a1c24;color:#eee;cursor:pointer;}" +
      "#rd-secret-sheet button:active{transform:scale(.97);}" +
      "#rd-secret-sheet .hint{opacity:.55;font:12px system-ui;margin-top:12px;line-height:1.4;}" +
      "#rd-secret-backdrop{position:fixed;inset:0;z-index:2147483499;background:rgba(0,0,0,.45);display:none;}" +
      "#rd-secret-backdrop.open{display:block;}" +
      "#rd-orb-secret{position:fixed;bottom:72px;left:12px;z-index:35;width:42px;height:42px;border-radius:50%;border:0;background:linear-gradient(135deg,#7c6af7,#1a7f64);color:#fff;font:800 13px system-ui;box-shadow:0 6px 20px rgba(0,0,0,.4);opacity:.55;}" +
      "#rd-orb-secret:active{opacity:1;transform:scale(1.08);}" +
      "body.rd-disco{animation:rdDisco 2s linear infinite;}" +
      "@keyframes rdDisco{0%{filter:hue-rotate(0)}100%{filter:hue-rotate(360deg)}}" +
      "body.rd-invert{filter:invert(1) hue-rotate(180deg);}" +
      "#rd-confetti{position:fixed;inset:0;pointer-events:none;z-index:99990;overflow:hidden;}" +
      "#rd-confetti i{position:absolute;width:8px;height:8px;top:-12px;animation:rdConf 2.2s ease-in forwards;}" +
      "@keyframes rdConf{0%{transform:translateY(0) rotate(0);opacity:1}100%{transform:translateY(100vh) rotate(720deg);opacity:0}}";
    document.head.appendChild(st);
  }

  function confetti() {
    injectCss();
    var layer = document.createElement("div");
    layer.id = "rd-confetti";
    var colors = ["#ef4444", "#22c55e", "#60a5fa", "#fbbf24", "#a78bfa", "#f472b6"];
    for (var i = 0; i < 40; i++) {
      var d = document.createElement("i");
      d.style.left = Math.random() * 100 + "%";
      d.style.background = colors[i % colors.length];
      d.style.animationDelay = Math.random() * 0.4 + "s";
      d.style.borderRadius = Math.random() > 0.5 ? "50%" : "2px";
      layer.appendChild(d);
    }
    document.body.appendChild(layer);
    setTimeout(function () { layer.remove(); }, 2400);
    toast("Boom");
  }

  var actions = [
    { id: "lights", label: "Lampu natal", run: function () {
      try {
        var on = localStorage.getItem("rd_lights") === "1";
        localStorage.setItem("rd_lights", on ? "0" : "1");
      } catch (e) {}
      window.dispatchEvent(new Event("rd-remount-lights"));
      var bar = document.getElementById("rd-xmas-lights");
      if (!bar && localStorage.getItem("rd_lights") === "1") {
        var d = document.createElement("div");
        d.id = "rd-xmas-lights";
        d.style.cssText = "position:fixed;top:0;left:0;right:0;height:16px;z-index:45;display:flex;pointer-events:none";
        for (var i = 0; i < 24; i++) {
          var b = document.createElement("b");
          b.style.cssText = "width:7px;height:7px;border-radius:50%;margin:2px 3px;background:hsl(" + (i * 40) + ",90%,60%);box-shadow:0 0 6px currentColor";
          d.appendChild(b);
        }
        document.body.appendChild(d);
      } else if (bar && localStorage.getItem("rd_lights") !== "1") bar.remove();
      toast("Lampu " + (localStorage.getItem("rd_lights") === "1" ? "ON" : "OFF"));
    } },
    { id: "disco", label: "Disco mode", run: function () {
      document.body.classList.toggle("rd-disco");
      toast(document.body.classList.contains("rd-disco") ? "Disco ON" : "Disco OFF");
    } },
    { id: "invert", label: "Invert UI", run: function () {
      document.body.classList.toggle("rd-invert");
      toast("Invert toggled");
    } },
    { id: "confetti", label: "Confetti", run: confetti },
    { id: "focus", label: "Focus mode", run: function () {
      document.body.classList.toggle("rd-focus");
      if (!document.getElementById("rd-focus-css")) {
        var s = document.createElement("style");
        s.id = "rd-focus-css";
        s.textContent = "body.rd-focus .sidebar{transform:translateX(-100%)!important;}";
        document.head.appendChild(s);
      }
      toast("Focus mode");
    } },
    { id: "install", label: "Install app", run: function () {
      if (window.__rdDeferredPrompt) window.__rdDeferredPrompt.prompt();
      else toast("Chrome: menu → Install app / Add to Home");
    } }
  ];

  function openSheet() {
    injectCss();
    var bd = document.getElementById("rd-secret-backdrop");
    var sh = document.getElementById("rd-secret-sheet");
    if (!bd) {
      bd = document.createElement("div");
      bd.id = "rd-secret-backdrop";
      bd.onclick = closeSheet;
      document.body.appendChild(bd);
    }
    if (!sh) {
      sh = document.createElement("div");
      sh.id = "rd-secret-sheet";
      sh.innerHTML = "<h3>RD Secret</h3><div class='grid'></div><p class='hint'>Ketuk header 3× · tahan tombol kirim · goyang HP · atau ketuk bola RD kiri bawah</p>";
      var grid = sh.querySelector(".grid");
      actions.forEach(function (a) {
        var b = document.createElement("button");
        b.type = "button";
        b.textContent = a.label;
        b.onclick = function () { a.run(); };
        grid.appendChild(b);
      });
      document.body.appendChild(sh);
    }
    bd.classList.add("open");
    sh.classList.add("open");
  }
  function closeSheet() {
    document.getElementById("rd-secret-backdrop")?.classList.remove("open");
    document.getElementById("rd-secret-sheet")?.classList.remove("open");
  }

  var taps = [];
  document.addEventListener("click", function (e) {
    var t = e.target;
    if (!t || !t.closest) return;
    if (!t.closest(".chat-header, .rd-mark, .sidebar-header, .brand")) return;
    var now = Date.now();
    taps.push(now);
    taps = taps.filter(function (x) { return now - x < 900; });
    if (taps.length >= 3) { taps = []; openSheet(); toast("Secret unlocked"); }
  }, true);

  var pressTimer = null;
  document.addEventListener("touchstart", function (e) {
    var t = e.target;
    if (!t || !t.closest) return;
    if (!t.closest("#sendBtn, button.primary")) return;
    pressTimer = setTimeout(function () { confetti(); openSheet(); }, 800);
  }, { passive: true });
  document.addEventListener("touchend", function () { clearTimeout(pressTimer); });
  document.addEventListener("touchmove", function () { clearTimeout(pressTimer); });

  function mountOrb() {
    if (document.getElementById("rd-orb-secret")) return;
    injectCss();
    var b = document.createElement("button");
    b.id = "rd-orb-secret";
    b.type = "button";
    b.textContent = "RD";
    b.onclick = openSheet;
    document.body.appendChild(b);
  }

  var lastShake = 0;
  function onMotion(e) {
    var a = e.accelerationIncludingGravity;
    if (!a) return;
    var force = Math.abs(a.x || 0) + Math.abs(a.y || 0) + Math.abs(a.z || 0);
    if (force > 28 && Date.now() - lastShake > 1500) {
      lastShake = Date.now();
      confetti();
      try {
        localStorage.setItem("rd_lights", localStorage.getItem("rd_lights") === "1" ? "0" : "1");
      } catch (err) {}
      window.dispatchEvent(new Event("rd-remount-lights"));
      toast("Shake!");
    }
  }
  if (typeof DeviceMotionEvent !== "undefined" && typeof DeviceMotionEvent.requestPermission !== "function") {
    window.addEventListener("devicemotion", onMotion);
  }

  window.addEventListener("beforeinstallprompt", function (e) {
    e.preventDefault();
    window.__rdDeferredPrompt = e;
  });

  function boot() {
    injectCss();
    mountOrb();
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(function () {});
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else setTimeout(boot, 0);
  setTimeout(boot, 1000);
})();
