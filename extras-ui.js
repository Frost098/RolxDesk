/* RolxDesk extras-ui v5.5 — YTuber watch, camera, hosted free, SVG, model fix */
(function () {
  if (window.__RD_EXTRAS_UI55__) return;
  window.__RD_EXTRAS_UI55__ = true;

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
    if ($("#rd-ui55-css")) return;
    var s = document.createElement("style");
    s.id = "rd-ui55-css";
    s.textContent = [
      "#rd-cam-btn{position:fixed;top:max(12px,env(safe-area-inset-top));right:max(12px,env(safe-area-inset-right));z-index:10040;",
      "width:46px;height:46px;border-radius:50%;border:1px solid #5a5a68;background:rgba(20,20,28,.98);color:#fff;",
      "font-size:20px;cursor:pointer;box-shadow:0 4px 20px rgba(0,0,0,.55);display:flex!important;align-items:center;justify-content:center}",
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
      ".rd-prov{display:inline-flex;align-items:center;margin-right:6px;vertical-align:middle}",
      ".rd-prov svg{width:16px;height:16px;display:block}"
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
      _camStream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: _camFacing }, width: { ideal: 1280 }, height: { ideal: 720 } }
      });
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
  function loadYtubers() {
    try { return JSON.parse(localStorage.getItem(YTUBER_KEY) || "[]"); } catch (e) { return []; }
  }
  function saveYtubers(list) {
    localStorage.setItem(YTUBER_KEY, JSON.stringify(list.slice(0, 30)));
  }

  function ensureYtuberPanel() {
    if ($("#rd-ytuber-panel")) return;
    var panel = el("div", { id: "rd-ytuber-panel" });
    panel.innerHTML =
      '<div class="rd-yp-card">' +
      '<div style="display:flex;justify-content:space-between;align-items:center">' +
      "<h2>YouTuber Upload</h2>" +
      '<button type="button" id="rd-yp-close">Tutup</button></div>' +
      '<p style="color:#999;font-size:13px;margin:0 0 12px">Pantau channel. Saat tab RD terbuka, cek berkala & notifikasi browser (video / live).</p>' +
      '<div class="rd-yp-row"><input id="rd-yp-input" placeholder="Nama channel (contoh: DadyLocky)" />' +
      '<button type="button" class="primary" id="rd-yp-add">Tambah</button></div>' +
      '<div id="rd-yp-list"></div>' +
      '<p style="color:#666;font-size:12px;margin-top:12px">Notifikasi butuh izin browser. Jalan saat RD dibuka (bukan background OS penuh).</p>' +
      "</div>";
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
        (c.thumbnail ? '<img src="' + c.thumbnail + '" alt="" />' : '<div style="width:40px;height:40px;border-radius:50%;background:#333"></div>') +
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
      var r = await fetch("/api/yt-channel", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ q: q })
      });
      var j = await r.json();
      if (!r.ok || !j.channel) throw new Error(j.error || "Gagal");
      var list = loadYtubers();
      if (list.some(function (c) { return c.id === j.channel.id; })) {
        if (typeof showToast === "function") showToast("Sudah ada", "error");
        return;
      }
      list.unshift({
        id: j.channel.id, name: j.channel.name, thumbnail: j.channel.thumbnail || "", query: q,
        lastVideoId: j.latest && j.latest.id || "",
        lastTitle: j.latest && j.latest.title || "",
        lastLive: !!(j.latest && j.latest.isLive)
      });
      saveYtubers(list);
      if (input) input.value = "";
      renderYtuberList();
      if (typeof showToast === "function") showToast("Ditambah: " + j.channel.name, "success");
      requestNotifPermission();
    } catch (e) {
      if (typeof showToast === "function") showToast("Gagal: " + (e.message || e), "error");
    }
  }

  function requestNotifPermission() {
    try {
      if ("Notification" in window && Notification.permission === "default") Notification.requestPermission();
    } catch (e) {}
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
        var r = await fetch("/api/yt-channel", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ channelId: c.id, q: c.name })
        });
        var j = await r.json();
        if (!r.ok || !j.latest || !j.latest.id) continue;
        if (c.lastVideoId && c.lastVideoId !== j.latest.id) {
          var kind = j.latest.isLive ? "Livestream" : "Video baru";
          pushNotif(kind + " \u00b7 " + (j.channel.name || c.name), j.latest.title, "https://youtu.be/" + j.latest.id);
        }
        if (c.lastVideoId !== j.latest.id || c.lastTitle !== j.latest.title) {
          c.lastVideoId = j.latest.id;
          c.lastTitle = j.latest.title;
          c.lastLive = !!j.latest.isLive;
          c.thumbnail = j.channel.thumbnail || c.thumbnail;
          c.name = j.channel.name || c.name;
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
    requestNotifPermission();
  }

  function injectYtuberMenu() {
    if ($("#rd-ytuber-fab")) return;
    var fab = el("button", { id: "rd-ytuber-fab", type: "button", title: "YouTuber Upload" }, "\ud83d\udce1");
    fab.onclick = openYtuberPanel;
    document.body.appendChild(fab);
  }

  function patchBrokenModels() {
    try {
      if (typeof MODELS === "undefined") return;
      var REPL = {
        "nex-agi/nex-n2.5-mini:free": "openrouter/free",
        "nex-agi/nex-n2.5-pro:free": "openrouter/free",
        "nex-agi/nex-n2.5-mini": "openrouter/free"
      };
      Object.keys(MODELS).forEach(function (fam) {
        (MODELS[fam] || []).forEach(function (m) {
          if (REPL[m.id]) {
            m.id = REPL[m.id];
            if (/grok/i.test(m.name)) m.name = "Grok-style (free router)";
          }
        });
      });
      var ms = $("#modelSelect");
      if (ms && /nex-agi\/nex-n2/i.test(ms.value)) {
        ms.value = "openrouter/free";
        if (window.state) state.selectedModel = "openrouter/free";
      }
    } catch (e) {}
  }

  async function injectHostedRandom() {
    var FREE_POOL = [
      { id: "openrouter/free", name: "RD Free Auto" },
      { id: "google/gemma-3-27b-it:free", name: "RD Gemma" },
      { id: "deepseek/deepseek-r1:free", name: "RD DeepSeek R1" },
      { id: "meta-llama/llama-3.3-70b-instruct:free", name: "RD Llama 3.3" },
      { id: "qwen/qwen-2.5-72b-instruct:free", name: "RD Qwen 2.5" },
      { id: "mistralai/mistral-small-3.1-24b-instruct:free", name: "RD Mistral Small" }
    ];
    try {
      var r = await fetch("/api/hosted-models");
      var j = await r.json();
      var models = (j.hosted && j.models && j.models.length) ? j.models : FREE_POOL;
      var fam = $("#familySelect");
      if (fam && !fam.querySelector('option[value="hosted"]')) {
        var opt = document.createElement("option");
        opt.value = "hosted";
        opt.textContent = "RD Hosted (gratis)";
        fam.appendChild(opt);
      }
      function fillHosted() {
        var ms = $("#modelSelect");
        if (!ms) return;
        var pool = models.slice().sort(function () { return Math.random() - 0.5; });
        ms.innerHTML = pool.map(function (m) {
          return '<option value="' + m.id + '">' + m.name + "</option>";
        }).join("");
      }
      if (fam) {
        fam.addEventListener("change", function () { if (fam.value === "hosted") fillHosted(); });
        if (fam.value === "hosted") fillHosted();
      }
    } catch (e) {
      var fam2 = $("#familySelect");
      if (fam2 && !fam2.querySelector('option[value="hosted"]')) {
        var o = document.createElement("option");
        o.value = "hosted"; o.textContent = "RD Hosted (gratis)";
        fam2.appendChild(o);
      }
    }
  }

  function providerSvg(kind) {
    var k = String(kind || "").toLowerCase();
    if (/gemini|google/.test(k))
      return '<svg viewBox="0 0 24 24"><defs><linearGradient id="g55" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#4285F4"/><stop offset=".5" stop-color="#9B72CB"/><stop offset="1" stop-color="#D96570"/></linearGradient></defs><path fill="url(#g55)" d="M12 2l1.8 5.8L20 10l-5.5 2.2L12 18l-2.5-5.8L4 10l6.2-2.2z"/></svg>';
    if (/grok|xai/.test(k))
      return '<svg viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="#000"/><path d="M7 7l10 10M17 7L7 17" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/></svg>';
    if (/openrouter|hosted|free router|rd free/.test(k))
      return '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="#f59e0b" stroke-width="1.8"/><path d="M8 12h8M12 8v8" stroke="#f59e0b" stroke-width="1.8" stroke-linecap="round"/></svg>';
    if (/claude|anthropic/.test(k))
      return '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#D97757"/><path d="M8 13c1.5 2 6.5 2 8 0" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/></svg>';
    if (/venice/.test(k))
      return '<svg viewBox="0 0 24 24"><path d="M4 16c4-8 12-8 16 0" fill="none" stroke="#a78bfa" stroke-width="1.8"/><circle cx="12" cy="9" r="3" fill="#a78bfa"/></svg>';
    if (/manus/.test(k))
      return '<svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="4" fill="none" stroke="#5eead4" stroke-width="1.6"/></svg>';
    if (/custom|9router|router/.test(k))
      return '<svg viewBox="0 0 24 24"><path d="M5 12h14M9 8l-4 4 4 4M15 8l4 4-4 4" fill="none" stroke="#34d399" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    return '<svg viewBox="0 0 24 24"><text x="4" y="16" font-size="10" font-weight="700" fill="#a89cff">RD</text></svg>';
  }

  function decorateModelSelects() {
    try {
      var fam = $("#familySelect");
      var mod = $("#modelSelect");
      [fam, mod].forEach(function (sel) {
        if (!sel || sel.__rdIcon55) return;
        sel.__rdIcon55 = true;
        var wrap = el("span", { class: "rd-prov", id: "rd-prov-" + sel.id });
        wrap.innerHTML = providerSvg(sel.value || (fam && fam.value) || "hosted");
        if (sel.parentNode) sel.parentNode.insertBefore(wrap, sel);
        sel.addEventListener("change", function () {
          var w = $("#rd-prov-" + sel.id);
          if (w) w.innerHTML = providerSvg(sel.value || (fam && fam.value));
        });
      });
    } catch (e) {}
  }

  function boot() {
    injectCSS();
    ensureCamUI();
    injectYtuberMenu();
    patchBrokenModels();
    injectHostedRandom();
    decorateModelSelects();
    if (!window.__rdYtPoll) {
      window.__rdYtPoll = setInterval(pollYtubers, 180000);
      setTimeout(pollYtubers, 8000);
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else setTimeout(boot, 200);
  setTimeout(boot, 1000);
  setTimeout(boot, 3000);
  setTimeout(function () { injectYtuberMenu(); injectHostedRandom(); patchBrokenModels(); }, 5000);
})();
