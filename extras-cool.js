/* RD cool v2 — lights, command palette, matrix, ripple — no streak */
(function () {
  if (window.__RD_COOL_V2__) return;
  window.__RD_COOL_V2__ = true;
  window.__RD_COOL_V1__ = true;

  function injectCss() {
    if (document.getElementById("rd-cool-css")) return;
    var st = document.createElement("style");
    st.id = "rd-cool-css";
    st.textContent =
      "#rd-xmas-lights{position:fixed;top:0;left:0;right:0;height:18px;z-index:45;display:flex;align-items:flex-start;justify-content:space-between;padding:2px 4px 0;pointer-events:none;overflow:hidden;}" +
      "#rd-xmas-lights b{width:7px;height:7px;border-radius:50%;flex:0 0 auto;margin:0 3px;box-shadow:0 0 6px currentColor;opacity:.35;animation:rdLightBlink 1.4s ease-in-out infinite;}" +
      "@keyframes rdLightBlink{0%,100%{opacity:.25;transform:scale(.85)}50%{opacity:1;transform:scale(1.15)}}" +
      "body.rd-season-active #rd-xmas-lights{top:28px;}" +
      "#rd-cmd{position:fixed;inset:0;z-index:2147483000;display:none;align-items:flex-start;justify-content:center;padding-top:12vh;background:rgba(0,0,0,.55);backdrop-filter:blur(6px);}" +
      "#rd-cmd.open{display:flex;}" +
      "#rd-cmd .box{width:min(92vw,440px);background:#12141c;border:1px solid rgba(255,255,255,.12);border-radius:14px;overflow:hidden;box-shadow:0 24px 80px rgba(0,0,0,.55);}" +
      "#rd-cmd input{width:100%;border:0;outline:none;background:transparent;color:#f2f2f5;font:15px system-ui;padding:14px 16px;border-bottom:1px solid rgba(255,255,255,.08);}" +
      "#rd-cmd ul{list-style:none;margin:0;padding:6px;max-height:50vh;overflow:auto;}" +
      "#rd-cmd li{padding:10px 12px;border-radius:8px;cursor:pointer;font:13px system-ui;color:#ccc;display:flex;justify-content:space-between;gap:8px;}" +
      "#rd-cmd li:hover,#rd-cmd li.active{background:rgba(124,106,247,.22);color:#fff;}" +
      "#rd-cmd li kbd{opacity:.5;font-size:11px;}" +
      "#rd-matrix{position:fixed;inset:0;z-index:3;pointer-events:none;opacity:0;transition:opacity .4s;}" +
      "#rd-matrix.on{opacity:.22;}" +
      ".rd-ripple{position:fixed;width:12px;height:12px;border-radius:50%;pointer-events:none;z-index:9998;transform:translate(-50%,-50%);background:radial-gradient(circle,rgba(124,106,247,.7) 0%,transparent 70%);animation:rdRipple .6s ease-out forwards;}" +
      "@keyframes rdRipple{0%{transform:translate(-50%,-50%) scale(.4);opacity:.9}100%{transform:translate(-50%,-50%) scale(18);opacity:0}}" +
      "#rd-streak{display:none!important;}" +
      "#rd-orb-secret{display:none!important;}" +
      "body.rd-konami-flash{animation:rdKonami .8s ease;}" +
      "@keyframes rdKonami{0%{filter:hue-rotate(0)}50%{filter:hue-rotate(160deg) saturate(1.4)}100%{filter:hue-rotate(0)}}";
    document.head.appendChild(st);
  }

  function lightsActive() {
    try {
      if (localStorage.getItem("rd_lights") === "1") return true;
      if (localStorage.getItem("rd_lights") === "0") return false;
    } catch (e) {}
    var ev = typeof window.__RD_ACTIVE_SEASON === "function" ? window.__RD_ACTIVE_SEASON() : null;
    if (ev && /christmas|natal|xmas|balloon|lebaran|halloween/i.test(ev.id + ev.title)) return true;
    return false;
  }

  function mountLights() {
    injectCss();
    var old = document.getElementById("rd-xmas-lights");
    if (old) old.remove();
    if (!lightsActive()) return;
    var bar = document.createElement("div");
    bar.id = "rd-xmas-lights";
    bar.setAttribute("aria-hidden", "true");
    var colors = ["#ef4444", "#22c55e", "#fbbf24", "#60a5fa", "#f472b6", "#a78bfa", "#f97316", "#2dd4bf"];
    var n = Math.min(36, Math.max(18, Math.floor(window.innerWidth / 28)));
    for (var i = 0; i < n; i++) {
      var b = document.createElement("b");
      b.style.color = colors[i % colors.length];
      b.style.animationDelay = (i * 0.12) + "s";
      b.style.animationDuration = (1.1 + (i % 4) * 0.25) + "s";
      bar.appendChild(b);
    }
    document.body.appendChild(bar);
  }

  var COMMANDS = [
    { id: "settings", label: "Buka Pengaturan", run: function () { document.getElementById("settingsBtn")?.click(); document.getElementById("settingsModal")?.classList.add("open"); } },
    { id: "new", label: "Chat baru", run: function () { if (typeof createNewSession === "function") createNewSession(); } },
    { id: "lights", label: "Toggle lampu natal / ambient", run: function () {
      try {
        var on = localStorage.getItem("rd_lights") === "1";
        localStorage.setItem("rd_lights", on ? "0" : "1");
      } catch (e) {}
      mountLights();
      if (typeof showToast === "function") showToast("Lampu: " + (lightsActive() ? "ON" : "OFF"), "success");
    } },
    { id: "matrix", label: "Matrix rain mode", run: toggleMatrix },
    { id: "focus", label: "Focus mode (sembunyi sidebar)", run: function () {
      document.body.classList.toggle("rd-focus");
      if (!document.getElementById("rd-focus-css")) {
        var s = document.createElement("style");
        s.id = "rd-focus-css";
        s.textContent = "body.rd-focus .sidebar{transform:translateX(-100%)!important;}body.rd-focus .sidebar-overlay{display:none!important;}";
        document.head.appendChild(s);
      }
    } },
    { id: "dev", label: "Developer event panel", run: function () { document.getElementById("rd-dev-btn")?.click(); } },
    { id: "voice", label: "Buka Voice panel", run: function () { document.getElementById("voiceBtn")?.click(); } }
  ];

  function openCmd() {
    injectCss();
    var el = document.getElementById("rd-cmd");
    if (!el) {
      el = document.createElement("div");
      el.id = "rd-cmd";
      el.innerHTML = '<div class="box"><input id="rd-cmd-input" placeholder="Cari perintah… (Ctrl+K)" autocomplete="off"/><ul id="rd-cmd-list"></ul></div>';
      document.body.appendChild(el);
      el.addEventListener("click", function (e) { if (e.target === el) closeCmd(); });
      document.getElementById("rd-cmd-input").addEventListener("input", renderCmd);
      document.getElementById("rd-cmd-input").addEventListener("keydown", function (e) {
        var items = [].slice.call(document.querySelectorAll("#rd-cmd-list li"));
        var idx = items.findIndex(function (x) { return x.classList.contains("active"); });
        if (e.key === "ArrowDown") { e.preventDefault(); items.forEach(function (x) { x.classList.remove("active"); }); items[Math.min(items.length - 1, idx + 1)]?.classList.add("active"); }
        if (e.key === "ArrowUp") { e.preventDefault(); items.forEach(function (x) { x.classList.remove("active"); }); items[Math.max(0, idx - 1)]?.classList.add("active"); }
        if (e.key === "Enter") { e.preventDefault(); var a = items.find(function (x) { return x.classList.contains("active"); }) || items[0]; if (a) a.click(); }
        if (e.key === "Escape") closeCmd();
      });
    }
    el.classList.add("open");
    renderCmd();
    setTimeout(function () { document.getElementById("rd-cmd-input")?.focus(); }, 30);
  }
  function closeCmd() { document.getElementById("rd-cmd")?.classList.remove("open"); }
  function renderCmd() {
    var q = (document.getElementById("rd-cmd-input")?.value || "").toLowerCase().trim();
    var list = document.getElementById("rd-cmd-list");
    if (!list) return;
    list.innerHTML = "";
    COMMANDS.filter(function (c) { return !q || c.label.toLowerCase().indexOf(q) >= 0 || c.id.indexOf(q) >= 0; }).forEach(function (c, i) {
      var li = document.createElement("li");
      if (i === 0) li.className = "active";
      li.innerHTML = "<span>" + c.label + "</span><kbd>" + c.id + "</kbd>";
      li.onclick = function () { closeCmd(); c.run(); };
      list.appendChild(li);
    });
  }

  document.addEventListener("keydown", function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      var el = document.getElementById("rd-cmd");
      if (el && el.classList.contains("open")) closeCmd();
      else openCmd();
    }
  });

  var matrixOn = false, matrixTimer = null;
  function toggleMatrix() {
    injectCss();
    var c = document.getElementById("rd-matrix");
    if (!c) { c = document.createElement("canvas"); c.id = "rd-matrix"; document.body.appendChild(c); }
    matrixOn = !matrixOn;
    c.classList.toggle("on", matrixOn);
    if (!matrixOn) { if (matrixTimer) cancelAnimationFrame(matrixTimer); return; }
    var ctx = c.getContext("2d");
    function resize() { c.width = innerWidth; c.height = innerHeight; }
    resize();
    var cols = Math.floor(c.width / 14);
    var drops = Array(cols).fill(1);
    function draw() {
      if (!matrixOn) return;
      ctx.fillStyle = "rgba(0,0,0,0.08)";
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.fillStyle = "#4ade80";
      ctx.font = "12px monospace";
      for (var i = 0; i < drops.length; i++) {
        var text = String.fromCharCode(0x30a0 + Math.random() * 96);
        ctx.fillText(text, i * 14, drops[i] * 14);
        if (drops[i] * 14 > c.height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      }
      matrixTimer = requestAnimationFrame(draw);
    }
    draw();
    if (typeof showToast === "function") showToast("Matrix ON", "success");
  }
  window.__rdToggleMatrix = toggleMatrix;

  document.addEventListener("click", function (e) {
    var t = e.target;
    if (!t || !t.closest) return;
    if (t.closest("#sendBtn") || t.closest("button.primary")) {
      injectCss();
      var r = document.createElement("div");
      r.className = "rd-ripple";
      r.style.left = e.clientX + "px";
      r.style.top = e.clientY + "px";
      document.body.appendChild(r);
      setTimeout(function () { r.remove(); }, 650);
    }
  }, true);

  var seq = [];
  var konami = ["ArrowUp","ArrowUp","ArrowDown","ArrowDown","ArrowLeft","ArrowRight","ArrowLeft","ArrowRight","b","a"];
  document.addEventListener("keydown", function (e) {
    seq.push(e.key);
    if (seq.length > konami.length) seq.shift();
    if (seq.join(",") === konami.join(",")) {
      document.body.classList.add("rd-konami-flash");
      setTimeout(function () { document.body.classList.remove("rd-konami-flash"); }, 800);
      toggleMatrix();
      try { localStorage.setItem("rd_lights", "1"); } catch (err) {}
      mountLights();
      if (typeof showToast === "function") showToast("RD secret unlocked", "success");
      seq = [];
    }
  });

  function boot() {
    injectCss();
    mountLights();
    var se = document.getElementById("rd-streak"); if (se) se.remove();
    var o = document.getElementById("rd-orb-secret"); if (o) o.remove();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else setTimeout(boot, 0);
  setTimeout(boot, 800);
  setTimeout(mountLights, 2000);
  setInterval(function () {
    var se = document.getElementById("rd-streak"); if (se) se.remove();
    var o = document.getElementById("rd-orb-secret"); if (o) o.remove();
  }, 1500);
  window.addEventListener("resize", function () { if (document.getElementById("rd-xmas-lights")) mountLights(); });
  window.addEventListener("rd-remount-lights", mountLights);
})();
