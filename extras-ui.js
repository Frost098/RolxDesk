/* RolxDesk extras-ui v5.5b — sidebar YouTuber, hosted family, smart model map */
(function () {
  if (window.__RD_EXTRAS_UI55B__) return;
  window.__RD_EXTRAS_UI55B__ = true;
  window.__RD_EXTRAS_UI55__ = true;
  window.__RD_EXTRAS_UI54__ = true;
  window.__RD_EXTRAS_UI53__ = true;

  function $(s, r) { return (r || document).querySelector(s); }
  function el(t, a, h) {
    var n = document.createElement(t);
    if (a) Object.entries(a).forEach(function (kv) {
      var k = kv[0], v = kv[1];
      if (k === "style" && typeof v === "object") Object.assign(n.style, v);
      else if (k.startsWith("on") && typeof v === "function") n.addEventListener(k.slice(2), v);
      else n.setAttribute(k, v);
    });
    if (h != null) n.innerHTML = h;
    return n;
  }

  function injectCSS() {
    if ($("#rd-ui55b-css")) return;
    var s = document.createElement("style");
    s.id = "rd-ui55b-css";
    s.textContent = [
      "#rd-cam-btn{position:fixed;top:max(12px,env(safe-area-inset-top));right:max(12px,env(safe-area-inset-right));z-index:10040;width:46px;height:46px;border-radius:50%;border:1px solid #5a5a68;background:rgba(20,20,28,.98);color:#fff;font-size:20px;cursor:pointer;box-shadow:0 4px 20px rgba(0,0,0,.55);display:flex!important;align-items:center;justify-content:center}",
      "#rd-cam-panel{position:fixed;inset:0;z-index:10050;background:rgba(0,0,0,.88);display:none;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:16px}",
      "#rd-cam-panel.show{display:flex}",
      "#rd-cam-panel video{max-width:min(96vw,480px);max-height:60vh;border-radius:12px;background:#000}",
      "#rd-cam-panel .rd-cam-actions{display:flex;gap:10px;flex-wrap:wrap;justify-content:center}",
      "#rd-cam-panel button{padding:10px 16px;border-radius:10px;border:1px solid #444;background:#1a1a22;color:#eee;cursor:pointer;font:13px system-ui}",
      "#rd-cam-panel button.primary{background:#1a7f64;border-color:#1a7f64}",
      "#rd-ytuber-panel{position:fixed;inset:0;z-index:10045;background:rgba(8,8,12,.92);display:none;align-items:center;justify-content:center;padding:16px}",
      "#rd-ytuber-panel.show{display:flex}",
      "#rd-ytuber-panel .rd-yp-card{width:min(520px,96vw);max-height:min(88vh,720px);overflow:auto;background:#14141a;border:1px solid #333;border-radius:16px;padding:16px 18px;color:#e8e8ee;font:14px/1.45 system-ui}",
      "#rd-ytuber-panel h2{margin:0 0 12px;font-size:1.15rem}",
      "#rd-ytuber-panel .rd-yp-row{display:flex;gap:8px;margin-bottom:12px}",
      "#rd-ytuber-panel input{flex:1;padding:10px 12px;border-radius:10px;border:1px solid #3a3a48;background:#0e0e14;color:#eee}",
      "#rd-ytuber-panel button{padding:10px 14px;border-radius:10px;border:1px solid #444;background:#22222c;color:#eee;cursor:pointer}",
      "#rd-ytuber-panel button.primary{background:#6c5ce7;border-color:#6c5ce7}",
      "#rd-ytuber-panel .rd-yp-item{display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid #2a2a34}",
      "#rd-ytuber-panel .rd-yp-item img{width:40px;height:40px;border-radius:50%;object-fit:cover;background:#222}",
      "#rd-ytuber-panel .rd-yp-item .meta{flex:1;min-width:0}",
      "#rd-ytuber-panel .rd-yp-item .meta b{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
      "#rd-ytuber-panel .rd-yp-item .meta span{font-size:12px;color:#999}",
      "#rd-ytuber-panel .rd-yp-item .del{background:transparent;border:0;color:#f66;font-size:18px}",
      "#rd-ytuber-fab{position:fixed;top:max(12px,env(safe-area-inset-top));right:max(64px,env(safe-area-inset-right)+52px);z-index:10040;width:46px;height:46px;border-radius:50%;border:1px solid #5a5a68;background:rgba(20,20,28,.98);color:#fff;font-size:18px;cursor:pointer;box-shadow:0 4px 20px rgba(0,0,0,.55)}",
      "#rd-ytuber-nav.nav-item{display:block;width:100%;text-align:left}"
    ].join("");
    document.head.appendChild(s);
  }

  var _camStream = null, _camFacing = "environment";
  function stopCam() {
    try { if (_camStream) _camStream.getTracks().forEach(function (t) { t.stop(); }); } catch (e) {}
    _camStream = null;
    var p = $("#rd-cam-panel"); if (p) p.classList.remove("show");
  }
  function ensureCamUI() {
    var old = $("#rd-cam-btn"); if (old) old.remove();
    var btn = el("button", { id: "rd-cam-btn", type: "button", title: "Kamera" }, "\ud83d\udcf7");
    btn.onclick = openCam;
    document.body.appendChild(btn);
    if (!$("#rd-cam-panel")) {
      var panel = el("div", { id: "rd-cam-panel" });
      panel.innerHTML = '<video id="rd-cam-video" autoplay playsinline muted></video><div class="rd-cam-actions"><button type="button" id="rd-cam-flip">Ganti</button><button type="button" class="primary" id="rd-cam-shot">Ambil foto</button><button type="button" id="rd-cam-close">Tutup</button></div>';
      document.body.appendChild(panel);
      $("#rd-cam-close").onclick = stopCam;
      $("#rd-cam-flip").onclick = function () { _camFacing = _camFacing === "user" ? "environment" : "user"; openCam(); };
      $("#rd-cam-shot").onclick = captureCam;
    }
  }
  async function openCam() {
    ensureCamUI();
    try {
      if (_camStream) _camStream.getTracks().forEach(function (t) { t.stop(); });
      _camStream = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: { ideal: _camFacing }, width: { ideal: 1280 }, height: { ideal: 720 } } });
      $("#rd-cam-video").srcObject = _camStream;
      $("#rd-cam-panel").classList.add("show");
    } catch (e) {
      if (typeof showToast === "function") showToast("Kamera: " + (e.message || e), "error");
    }
  }
  function captureCam() {
    try {
      var video = $("#rd-cam-video");
      if (!video || !video.videoWidth) return;
      var c = document.createElement("canvas");
      c.width = video.videoWidth; c.height = video.videoHeight;
      c.getContext("2d").drawImage(video, 0, 0);
      var dataUrl = c.toDataURL("image/jpeg", 0.85);
      var b64 = dataUrl.split(",")[1] || "";
      if (window.state) {
        state._pendingImages = state._pendingImages || [];
        state._pendingImages.push({ mime: "image/jpeg", data: b64 });
        if (Array.isArray(state.pendingFiles)) {
          try {
            var bin = atob(b64), arr = new Uint8Array(bin.length);
            for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
            state.pendingFiles.push(new File([new Blob([arr], { type: "image/jpeg" })], "camera.jpg", { type: "image/jpeg" }));
          } catch (e2) {}
        }
      }
      stopCam();
      if (typeof showToast === "function") showToast("Foto siap dikirim", "success");
    } catch (e) {}
  }

  var YTUBER_KEY = "rd_youtubers_v1";
  function loadYtubers() { try { return JSON.parse(localStorage.getItem(YTUBER_KEY) || "[]"); } catch (e) { return []; } }
  function saveYtubers(list) { localStorage.setItem(YTUBER_KEY, JSON.stringify(list.slice(0, 30))); }

  function ensureYtuberPanel() {
    if ($("#rd-ytuber-panel")) return;
    var panel = el("div", { id: "rd-ytuber-panel" });
    panel.innerHTML = '<div class="rd-yp-card"><div style="display:flex;justify-content:space-between;align-items:center"><h2>YouTuber Upload</h2><button type="button" id="rd-yp-close">Tutup</button></div><p style="color:#999;font-size:13px;margin:0 0 12px">Pantau channel. Notifikasi video / live saat tab RD terbuka.</p><div class="rd-yp-row"><input id="rd-yp-input" placeholder="Nama channel (contoh: DadyLocky)" /><button type="button" class="primary" id="rd-yp-add">Tambah</button></div><div id="rd-yp-list"></div></div>';
    document.body.appendChild(panel);
    $("#rd-yp-close").onclick = function () { panel.classList.remove("show"); };
    panel.addEventListener("click", function (e) { if (e.target === panel) panel.classList.remove("show"); });
    $("#rd-yp-add").onclick = addYtuber;
    $("#rd-yp-input").addEventListener("keydown", function (e) { if (e.key === "Enter") addYtuber(); });
  }

  function renderYtuberList() {
    var box = $("#rd-yp-list");
    if (!box) return;
    var list = loadYtubers();
    if (!list.length) { box.innerHTML = '<p style="color:#777">Belum ada channel.</p>'; return; }
    box.innerHTML = list.map(function (c, i) {
      return '<div class="rd-yp-item">' +
        (c.thumbnail ? '<img src="' + c.thumbnail + '" alt="" referrerpolicy="no-referrer" />' : '<div style="width:40px;height:40px;border-radius:50%;background:#333"></div>') +
        '<div class="meta"><b>' + (c.name || c.query) + '</b><span>' +
        (c.lastTitle ? (c.lastLive ? "\ud83d\udd34 LIVE \u00b7 " : "\ud83c\udfac ") + String(c.lastTitle).slice(0, 48) : "Belum dicek") +
        '</span></div><button type="button" class="del" data-del="' + i + '">\u00d7</button></div>';
    }).join("");
    box.querySelectorAll("[data-del]").forEach(function (b) {
      b.onclick = function () {
        var list2 = loadYtubers();
        list2.splice(parseInt(b.getAttribute("data-del"), 10), 1);
        saveYtubers(list2);
        renderYtuberList();
      };
    });
  }

  async function addYtuber() {
    var input = $("#rd-yp-input");
    var q = (input && input.value || "").trim();
    if (!q) return;
    if (typeof showToast === "function") showToast("Mencari channel\u2026", "info");
    try {
      var r = await fetch("/api/yt-channel", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ q: q }) });
      var j = await r.json();
      if (!r.ok || !j.channel) throw new Error(j.error || "Gagal");
      var list = loadYtubers();
      if (list.some(function (c) { return c.id === j.channel.id; })) {
        if (typeof showToast === "function") showToast("Sudah ada", "error");
        return;
      }
      list.unshift({
        id: j.channel.id, name: j.channel.name, thumbnail: j.channel.thumbnail || "", query: q,
        lastVideoId: (j.latest && j.latest.id) || "", lastTitle: (j.latest && j.latest.title) || "", lastLive: !!(j.latest && j.latest.isLive)
      });
      saveYtubers(list);
      if (input) input.value = "";
      renderYtuberList();
      if (typeof showToast === "function") showToast("Ditambah: " + j.channel.name, "success");
      try { if ("Notification" in window && Notification.permission === "default") Notification.requestPermission(); } catch (eN) {}
    } catch (e) {
      if (typeof showToast === "function") showToast("Gagal: " + (e.message || e), "error");
    }
  }

  function pushNotif(title, body, url) {
    try {
      if (!("Notification" in window) || Notification.permission !== "granted") {
        if (typeof showToast === "function") showToast(title + " \u2014 " + body, "success");
        return;
      }
      var n = new Notification(title, { body: body, tag: "rd-yt-" + (url || title) });
      n.onclick = function () { window.focus(); if (url) window.open(url, "_blank"); n.close(); };
    } catch (e) {
      if (typeof showToast === "function") showToast(title + ": " + body, "success");
    }
  }

  async function pollYtubers() {
    var list = loadYtubers();
    if (!list.length) return;
    var changed = false;
    for (var i = 0; i < list.length; i++) {
      var c = list[i];
      try {
        var r = await fetch("/api/yt-channel", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ channelId: c.id, q: c.name }) });
        var j = await r.json();
        if (!r.ok || !j.latest || !j.latest.id) continue;
        if (c.lastVideoId && c.lastVideoId !== j.latest.id) {
          pushNotif((j.latest.isLive ? "Livestream" : "Video baru") + " \u00b7 " + (j.channel.name || c.name), j.latest.title, "https://youtu.be/" + j.latest.id);
        }
        if (c.lastVideoId !== j.latest.id || c.lastTitle !== j.latest.title) {
          c.lastVideoId = j.latest.id; c.lastTitle = j.latest.title; c.lastLive = !!j.latest.isLive;
          c.thumbnail = j.channel.thumbnail || c.thumbnail; c.name = j.channel.name || c.name;
          changed = true;
        }
      } catch (e) {}
    }
    if (changed) {
      saveYtubers(list);
      if ($("#rd-ytuber-panel") && $("#rd-ytuber-panel").classList.contains("show")) renderYtuberList();
    }
  }

  function openYtuberPanel() {
    ensureYtuberPanel();
    renderYtuberList();
    $("#rd-ytuber-panel").classList.add("show");
  }

  function injectYtuberMenu() {
    var nav = document.querySelector("#sidebar .sidebar-nav") || document.querySelector("aside.sidebar .sidebar-nav") || document.querySelector(".sidebar-nav");
    if (nav && !document.getElementById("rd-ytuber-nav")) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "nav-item";
      btn.id = "rd-ytuber-nav";
      btn.setAttribute("data-panel", "youtuber");
      btn.textContent = "YouTuber Upload";
      btn.onclick = function (e) { e.preventDefault(); e.stopPropagation(); openYtuberPanel(); };
      var conn = nav.querySelector('[data-panel="connectors"]');
      if (conn && conn.parentNode) conn.parentNode.insertBefore(btn, conn.nextSibling);
      else nav.appendChild(btn);
    }
    if (!document.getElementById("rd-ytuber-fab")) {
      var fab = el("button", { id: "rd-ytuber-fab", type: "button", title: "YouTuber Upload" }, "\ud83d\udce1");
      fab.onclick = openYtuberPanel;
      document.body.appendChild(fab);
    }
  }

  function patchBrokenModels() {
    try {
      if (typeof MODELS === "undefined") return;
      var REPL = {
        "nex-agi/nex-n2.5-mini:free": { id: "deepseek/deepseek-r1:free", name: "Grok-like \u00b7 DeepSeek R1" },
        "nex-agi/nex-n2.5-pro:free": { id: "deepseek/deepseek-r1:free", name: "Grok-like \u00b7 DeepSeek R1" },
        "nex-agi/nex-n2.5-mini": { id: "deepseek/deepseek-r1:free", name: "Grok-like \u00b7 DeepSeek R1" }
      };
      Object.keys(MODELS).forEach(function (fam) {
        (MODELS[fam] || []).forEach(function (m) {
          var r = REPL[m.id];
          if (r) { m.id = r.id; m.name = r.name; }
        });
      });
      MODELS.hosted = [
        { id: "openrouter/free", name: "RD Free Auto" },
        { id: "deepseek/deepseek-r1:free", name: "RD DeepSeek R1" },
        { id: "google/gemma-3-27b-it:free", name: "RD Gemma" },
        { id: "meta-llama/llama-3.3-70b-instruct:free", name: "RD Llama 3.3" },
        { id: "qwen/qwen-2.5-72b-instruct:free", name: "RD Qwen 2.5" }
      ];
      var ms = $("#modelSelect");
      if (ms && /nex-agi\/nex-n2/i.test(ms.value)) {
        ms.value = "deepseek/deepseek-r1:free";
        if (window.state) state.selectedModel = "deepseek/deepseek-r1:free";
      }
    } catch (e) {}
  }

  function injectHostedFamily() {
    var fam = $("#familySelect");
    if (!fam) return;
    if (!fam.querySelector('option[value="hosted"]')) {
      var opt = document.createElement("option");
      opt.value = "hosted";
      opt.textContent = "RD Hosted (gratis)";
      var custom = fam.querySelector('option[value="custom"]');
      if (custom) fam.insertBefore(opt, custom);
      else fam.appendChild(opt);
    }
    try {
      if (typeof MODELS !== "undefined" && !MODELS.hosted) {
        MODELS.hosted = [
          { id: "openrouter/free", name: "RD Free Auto" },
          { id: "deepseek/deepseek-r1:free", name: "RD DeepSeek R1" },
          { id: "google/gemma-3-27b-it:free", name: "RD Gemma" },
          { id: "meta-llama/llama-3.3-70b-instruct:free", name: "RD Llama 3.3" },
          { id: "qwen/qwen-2.5-72b-instruct:free", name: "RD Qwen 2.5" }
        ];
      }
    } catch (e) {}
  }

  function boot() {
    injectCSS();
    ensureCamUI();
    injectYtuberMenu();
    patchBrokenModels();
    injectHostedFamily();
    if (!window.__rdYtPoll) {
      window.__rdYtPoll = setInterval(pollYtubers, 180000);
      setTimeout(pollYtubers, 8000);
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else setTimeout(boot, 200);
  setTimeout(boot, 800);
  setTimeout(boot, 2000);
  setTimeout(function () { injectYtuberMenu(); injectHostedFamily(); patchBrokenModels(); }, 4000);
})();
