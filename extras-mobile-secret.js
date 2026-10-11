/* RD mobile secrets v2 */
(function () {
  if (window.__RD_MOBILE_SECRET_V2__) return;
  window.__RD_MOBILE_SECRET_V2__ = true;
  window.__RD_MOBILE_SECRET_V1__ = true;
  function toast(m, t) { if (typeof showToast === "function") showToast(m, t || "success"); }
  function injectCss() {
    if (document.getElementById("rd-msecret-css")) return;
    var st = document.createElement("style");
    st.id = "rd-msecret-css";
    st.textContent =
      "#rd-secret-sheet{position:fixed;left:0;right:0;bottom:0;z-index:2147483500;background:#12141c;border-radius:18px 18px 0 0;padding:12px 14px 28px;transform:translateY(110%);transition:transform .28s;max-height:75vh;overflow:auto;border-top:1px solid rgba(255,255,255,.12)}" +
      "#rd-secret-sheet.open{transform:translateY(0)}" +
      "#rd-secret-sheet .grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}" +
      "#rd-secret-sheet button{border:0;border-radius:12px;padding:14px 10px;font:600 13px system-ui;background:#1a1c24;color:#eee}" +
      "#rd-secret-backdrop{position:fixed;inset:0;z-index:2147483499;background:rgba(0,0,0,.45);display:none}" +
      "#rd-secret-backdrop.open{display:block}" +
      "#rd-orb-secret{position:fixed;bottom:72px;left:12px;z-index:35;width:42px;height:42px;border-radius:50%;border:0;background:linear-gradient(135deg,#7c6af7,#1a7f64);color:#fff;font:800 13px system-ui;opacity:.55}" +
      "body.rd-disco{animation:rdDisco 2s linear infinite}@keyframes rdDisco{to{filter:hue-rotate(360deg)}}" +
      "body.rd-invert{filter:invert(1) hue-rotate(180deg)}" +
      "#rd-confetti{position:fixed;inset:0;pointer-events:none;z-index:99990}#rd-confetti i{position:absolute;width:8px;height:8px;top:-12px;animation:rdConf 2.2s ease-in forwards}" +
      "@keyframes rdConf{to{transform:translateY(100vh) rotate(720deg);opacity:0}}" +
      "#rd-cam-wrap{position:fixed;inset:0;z-index:2147483600;background:#000;display:none;flex-direction:column}#rd-cam-wrap.open{display:flex}" +
      "#rd-cam-wrap video{flex:1;width:100%;object-fit:cover}#rd-cam-wrap .bar{display:flex;gap:8px;padding:12px;background:#111}" +
      "#rd-cam-wrap .bar button{flex:1;padding:14px;border:0;border-radius:12px;font-weight:700}" +
      ".rd-stamp{position:fixed;font-size:22px;pointer-events:none;animation:rdStamp .8s ease-out forwards;z-index:20}" +
      "@keyframes rdStamp{0%{transform:scale(2);opacity:0}40%{transform:scale(1);opacity:1}100%{opacity:0;transform:translateY(-18px)}}";
    document.head.appendChild(st);
  }
  function confetti() {
    injectCss();
    var layer = document.createElement("div"); layer.id = "rd-confetti";
    var colors = ["#ef4444","#22c55e","#60a5fa","#fbbf24","#a78bfa","#f472b6"];
    for (var i = 0; i < 40; i++) {
      var d = document.createElement("i");
      d.style.left = Math.random() * 100 + "%";
      d.style.background = colors[i % colors.length];
      d.style.animationDelay = Math.random() * 0.4 + "s";
      layer.appendChild(d);
    }
    document.body.appendChild(layer);
    setTimeout(function () { layer.remove(); }, 2400);
    toast("Boom");
  }
  var parallaxOn = false;
  function toggleParallax() {
    parallaxOn = !parallaxOn;
    if (parallaxOn) {
      window.addEventListener("deviceorientation", onOrient);
      toast("Parallax ON — miringkan HP");
    } else {
      window.removeEventListener("deviceorientation", onOrient);
      var main = document.querySelector(".main");
      if (main) main.style.transform = "";
      toast("Parallax OFF");
    }
  }
  function onOrient(e) {
    if (!parallaxOn) return;
    var x = Math.max(-1, Math.min(1, (e.gamma || 0) / 45));
    var y = Math.max(-1, Math.min(1, (e.beta || 45) / 45 - 1));
    var main = document.querySelector(".main") || document.getElementById("messages");
    if (main) main.style.transform = "translate(" + x * 8 + "px," + y * 6 + "px)";
  }
  function themeRoulette() {
    var h = [260, 160, 20, 340, 200, 40, 300][Math.floor(Math.random() * 7)];
    var a = "hsl(" + h + ",70%,58%)";
    var st = document.getElementById("rd-roulette-css") || document.createElement("style");
    st.id = "rd-roulette-css";
    st.textContent = "button.primary,#sendBtn{background:" + a + "!important}#rd-orb-secret{background:" + a + "!important}";
    document.head.appendChild(st);
    confetti();
    toast("Theme roulette");
  }
  function openCamera() {
    injectCss();
    var w = document.getElementById("rd-cam-wrap");
    if (!w) {
      w = document.createElement("div");
      w.id = "rd-cam-wrap";
      w.innerHTML = '<video id="rd-cam-video" playsinline autoplay muted></video><div class="bar"><button type="button" id="rd-cam-cancel" style="background:#333;color:#ccc">Batal</button><button type="button" id="rd-cam-shot" style="background:#7c6af7;color:#fff">Ambil</button></div>';
      document.body.appendChild(w);
      document.getElementById("rd-cam-cancel").onclick = closeCamera;
      document.getElementById("rd-cam-shot").onclick = captureCamera;
    }
    w.classList.add("open");
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false }).then(function (stream) {
      document.getElementById("rd-cam-video").srcObject = stream;
      window.__rdCamStream = stream;
    }).catch(function () { toast("Kamera ditolak", "error"); closeCamera(); });
  }
  function closeCamera() {
    try { if (window.__rdCamStream) window.__rdCamStream.getTracks().forEach(function (t) { t.stop(); }); } catch (e) {}
    document.getElementById("rd-cam-wrap")?.classList.remove("open");
  }
  function captureCamera() {
    var v = document.getElementById("rd-cam-video");
    if (!v) return;
    var c = document.createElement("canvas");
    c.width = v.videoWidth || 640; c.height = v.videoHeight || 480;
    c.getContext("2d").drawImage(v, 0, 0);
    c.toBlob(function (blob) {
      if (!blob) return;
      var file = new File([blob], "rd-snap-" + Date.now() + ".jpg", { type: "image/jpeg" });
      try {
        if (window.state && Array.isArray(state.pendingFiles)) { state.pendingFiles.push(file); toast("Foto di draft — kirim pesan"); }
        else { var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = file.name; a.click(); toast("Snap disimpan"); }
      } catch (e) { toast("Snap gagal", "error"); }
      closeCamera();
    }, "image/jpeg", 0.85);
  }
  document.addEventListener("click", function (e) {
    var t = e.target; if (!t || !t.closest) return;
    var msg = t.closest(".message"); if (!msg) return;
    var now = Date.now();
    if (msg.__rdLastTap && now - msg.__rdLastTap < 350) {
      injectCss();
      var s = document.createElement("span"); s.className = "rd-stamp";
      s.textContent = ["✨","🔥","💜","👀","🎯"][Math.floor(Math.random() * 5)];
      s.style.left = e.clientX + "px"; s.style.top = e.clientY + "px";
      document.body.appendChild(s); setTimeout(function () { s.remove(); }, 850);
    }
    msg.__rdLastTap = now;
  }, true);
  var actions = [
    { label: "Lampu natal", run: function () { try { localStorage.setItem("rd_lights", localStorage.getItem("rd_lights") === "1" ? "0" : "1"); } catch (e) {} window.dispatchEvent(new Event("rd-remount-lights")); toast("Lampu"); } },
    { label: "Disco", run: function () { document.body.classList.toggle("rd-disco"); toast("Disco"); } },
    { label: "Invert", run: function () { document.body.classList.toggle("rd-invert"); toast("Invert"); } },
    { label: "Confetti", run: confetti },
    { label: "Gravity parallax", run: toggleParallax },
    { label: "Theme roulette", run: themeRoulette },
    { label: "Kamera → chat", run: openCamera },
    { label: "UUID", run: function () { var id = window.rdToolUuid ? window.rdToolUuid() : String(Date.now()); try { navigator.clipboard.writeText(id); } catch (e) {} toast(id.slice(0, 18) + "…"); } },
    { label: "Install app", run: function () { if (window.__rdDeferredPrompt) window.__rdDeferredPrompt.prompt(); else toast("Chrome → Install app"); } }
  ];
  function openSheet() {
    injectCss();
    var bd = document.getElementById("rd-secret-backdrop");
    var sh = document.getElementById("rd-secret-sheet");
    if (!bd) { bd = document.createElement("div"); bd.id = "rd-secret-backdrop"; bd.onclick = closeSheet; document.body.appendChild(bd); }
    if (!sh) {
      sh = document.createElement("div"); sh.id = "rd-secret-sheet";
      sh.innerHTML = "<h3 style='margin:4px 0 12px;color:#fff'>RD Secret</h3><div class='grid'></div><p style='opacity:.55;font:12px system-ui;margin-top:12px'>Header 3× · tahan kirim · goyang · double-tap pesan · bola RD</p>";
      var grid = sh.querySelector(".grid");
      actions.forEach(function (a) { var b = document.createElement("button"); b.type = "button"; b.textContent = a.label; b.onclick = function () { a.run(); }; grid.appendChild(b); });
      document.body.appendChild(sh);
    }
    bd.classList.add("open"); sh.classList.add("open");
  }
  function closeSheet() {
    document.getElementById("rd-secret-backdrop")?.classList.remove("open");
    document.getElementById("rd-secret-sheet")?.classList.remove("open");
  }
  var taps = [];
  document.addEventListener("click", function (e) {
    var t = e.target; if (!t || !t.closest) return;
    if (!t.closest(".chat-header, .rd-mark, .sidebar-header, .brand")) return;
    var now = Date.now(); taps.push(now); taps = taps.filter(function (x) { return now - x < 900; });
    if (taps.length >= 3) { taps = []; openSheet(); toast("Secret unlocked"); }
  }, true);
  var pressTimer = null;
  document.addEventListener("touchstart", function (e) {
    var t = e.target; if (!t || !t.closest) return;
    if (!t.closest("#sendBtn, button.primary")) return;
    pressTimer = setTimeout(function () { confetti(); openSheet(); }, 800);
  }, { passive: true });
  document.addEventListener("touchend", function () { clearTimeout(pressTimer); });
  document.addEventListener("touchmove", function () { clearTimeout(pressTimer); });
  function mountOrb() {
    if (document.getElementById("rd-orb-secret")) return;
    injectCss();
    var b = document.createElement("button"); b.id = "rd-orb-secret"; b.type = "button"; b.textContent = "RD"; b.onclick = openSheet;
    document.body.appendChild(b);
  }
  var lastShake = 0;
  function onMotion(e) {
    var a = e.accelerationIncludingGravity; if (!a) return;
    var force = Math.abs(a.x || 0) + Math.abs(a.y || 0) + Math.abs(a.z || 0);
    if (force > 28 && Date.now() - lastShake > 1500) {
      lastShake = Date.now(); confetti();
      try { localStorage.setItem("rd_lights", localStorage.getItem("rd_lights") === "1" ? "0" : "1"); } catch (err) {}
      window.dispatchEvent(new Event("rd-remount-lights"));
      toast("Shake!");
    }
  }
  if (typeof DeviceMotionEvent !== "undefined" && typeof DeviceMotionEvent.requestPermission !== "function") {
    window.addEventListener("devicemotion", onMotion);
  }
  window.addEventListener("beforeinstallprompt", function (e) { e.preventDefault(); window.__rdDeferredPrompt = e; });
  function boot() { injectCss(); mountOrb(); if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(function () {}); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else setTimeout(boot, 0);
  setTimeout(boot, 1000);
})();
