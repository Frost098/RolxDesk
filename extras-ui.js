/* RolxDesk extras-ui v5.7 — cam in hamburger only, no floating orbs */
(function () {
  if (window.__RD_EXTRAS_UI57__) return;
  window.__RD_EXTRAS_UI57__ = true;
  window.__RD_EXTRAS_UI56__ = true;
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
    if ($("#rd-ui57-css")) return;
    var s = document.createElement("style");
    s.id = "rd-ui57-css";
    s.textContent = [
      "#rd-cam-btn{display:none!important}",
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
      "#rd-ytuber-fab{display:none!important}",
      ".rd-prov{display:inline-flex;align-items:center;margin-right:6px;vertical-align:middle}",
      ".rd-prov svg{width:18px;height:18px;display:block}"
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
      var b64 = (c.toDataURL("image/jpeg", 0.85).split(",")[1]) || "";
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

  function injectSidebarTools() {
    var nav = document.querySelector("#sidebar .sidebar-nav") || document.querySelector("aside.sidebar .sidebar-nav") || document.querySelector(".sidebar-nav");
    if (!nav) return;
    function addNav(id, label, panel, onClick) {
      if (document.getElementById(id)) return;
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "nav-item";
      btn.id = id;
      btn.setAttribute("data-panel", panel);
      btn.textContent = label;
      btn.onclick = function (e) { e.preventDefault(); e.stopPropagation(); onClick(); };
      var conn = nav.querySelector('[data-panel="connectors"]');
      var after = document.getElementById("rd-ytuber-nav") || conn;
      if (after && after.parentNode) after.parentNode.insertBefore(btn, after.nextSibling);
      else nav.appendChild(btn);
    }
    addNav("rd-ytuber-nav", "YouTuber Upload", "youtuber", openYtuberPanel);
    addNav("rd-cam-nav", "Kamera (voice vision)", "camera", function () {
      ensureCamUI();
      openCam();
    });
    var fab = document.getElementById("rd-ytuber-fab"); if (fab) fab.remove();
    var cam = document.getElementById("rd-cam-btn"); if (cam) cam.remove();
  }

  var FREE_POOL = [
    { id: "qwen/qwen3.8-27b:free", name: "RD Qwen3.8 27B" },
    { id: "google/gemma-4-31b-it:free", name: "RD Gemma 4 31B" },
    { id: "google/gemma-4-26b-a4b-it:free", name: "RD Gemma 4 26B" },
    { id: "nvidia/nemotron-3-super-120b-a12b:free", name: "RD Nemotron Super" },
    { id: "nvidia/nemotron-3.5-lightning:free", name: "RD Nemotron Lightning" },
    { id: "cohere/north-mini-code:free", name: "RD North Mini Code" },
    { id: "thinkingmachines/inkling:free", name: "RD Inkling" },
    { id: "openrouter/free", name: "RD Free Auto" }
  ];

  function patchBrokenModels() {
    try {
      if (typeof MODELS === "undefined") return;
      var REPL = {
        "nex-agi/nex-n2.5-mini:free": { id: "thinkingmachines/inkling:free", name: "Grok-like \u00b7 Inkling" },
        "nex-agi/nex-n2.5-pro:free": { id: "thinkingmachines/inkling:free", name: "Grok-like \u00b7 Inkling" },
        "nex-agi/nex-n2.5-mini": { id: "thinkingmachines/inkling:free", name: "Grok-like \u00b7 Inkling" },
        "deepseek/deepseek-r1:free": { id: "nvidia/nemotron-3-super-120b-a12b:free", name: "Reasoning \u00b7 Nemotron Super" },
        "deepseek/deepseek-chat:free": { id: "qwen/qwen3.8-27b:free", name: "Chat \u00b7 Qwen3.8" },
        "meta-llama/llama-3.3-70b-instruct:free": { id: "qwen/qwen3.8-27b:free", name: "Llama-like \u00b7 Qwen3.8" },
        "qwen/qwen-2.5-72b-instruct:free": { id: "qwen/qwen3.8-27b:free", name: "Qwen3.8 27B" },
        "google/gemma-3-27b-it:free": { id: "google/gemma-4-31b-it:free", name: "Gemma 4 31B" },
        "mistralai/mistral-small-3.1-24b-instruct:free": { id: "cohere/north-mini-code:free", name: "North Mini Code" }
      };
      Object.keys(MODELS).forEach(function (fam) {
        (MODELS[fam] || []).forEach(function (m) {
          var r = REPL[m.id];
          if (r) { m.id = r.id; m.name = r.name; }
        });
      });
      MODELS.hosted = FREE_POOL.slice();
      var ms = $("#modelSelect");
      if (ms) {
        var v = ms.value || "";
        if (REPL[v]) {
          ms.value = REPL[v].id;
          if (window.state) state.selectedModel = REPL[v].id;
        }
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
    try { if (typeof MODELS !== "undefined") MODELS.hosted = FREE_POOL.slice(); } catch (e) {}
    if (!fam.__rdHosted56) {
      fam.__rdHosted56 = true;
      fam.addEventListener("change", function () {
        if (fam.value === "hosted") {
          var ms = $("#modelSelect");
          if (!ms) return;
          ms.innerHTML = FREE_POOL.map(function (m) {
            return '<option value="' + m.id + '">' + m.name + "</option>";
          }).join("");
        }
      });
    }
  }

  function providerSvg(kind) {
    var k = String(kind || "").toLowerCase();
    if (/gemini|google|gemma/.test(k))
      return '<svg viewBox="0 0 24 24"><defs><linearGradient id="gm56" x1="0" y1="1" x2="1" y2="0"><stop stop-color="#1a73e8"/><stop offset="1" stop-color="#c58bff"/></linearGradient></defs><path fill="url(#gm56)" d="M12 1.5L14.2 9.5 22 12 14.2 14.5 12 22.5 9.8 14.5 2 12 9.8 9.5z"/></svg>';
    if (/grok|xai|inkling/.test(k))
      return '<svg viewBox="0 0 24 24"><path fill="#fff" d="M12 3.2c-3.8 0-6.8 2.6-6.8 6.2 0 2.4 1.3 4.5 3.4 5.5L6.2 20h2.6l2.2-4.2c.3.05.7.08 1 .08 3.8 0 6.8-2.6 6.8-6.2S15.8 3.2 12 3.2zm0 2.2c2.5 0 4.4 1.6 4.4 4s-1.9 4-4.4 4-4.4-1.6-4.4-4 1.9-4 4.4-4z"/><path stroke="#fff" stroke-width="1.6" stroke-linecap="round" d="M5 19.5L19 4.5"/></svg>';
    if (/claude|anthropic/.test(k))
      return '<svg viewBox="0 0 24 24"><g fill="#D97757"><circle cx="12" cy="12" r="9"/></g></svg>';
    if (/qwen/.test(k))
      return '<svg viewBox="0 0 24 24"><path fill="#5B5BD6" d="M12 2.5L18.5 6v5.5L12 15.5 5.5 11.5V6L12 2.5z"/></svg>';
    if (/nvidia|nemotron/.test(k))
      return '<svg viewBox="0 0 24 24"><path fill="#76B900" d="M2 12c3.5-5.5 8-7.5 10-7.5S18.5 6.5 22 12c-3.5 5.5-8 7.5-10 7.5S5.5 17.5 2 12z"/><ellipse cx="12" cy="12" rx="3.2" ry="3.5" fill="#111"/></svg>';
    if (/kimi|moonshot/.test(k))
      return '<svg viewBox="0 0 24 24"><path fill="#2B7FFF" d="M16.5 4.5c2.5 0 4.5 1.8 4.5 4.1 0 2.2-1.8 4-4.2 4.1l-.8.05-1.5 2.2 0-2.1c-2.3-.2-4-1.9-4-4.15 0-2.3 2-4.2 5.5-4.2z"/></svg>';
    if (/cohere|north/.test(k))
      return '<svg viewBox="0 0 24 24"><ellipse cx="13" cy="8" rx="7" ry="5.5" fill="#2d4a3e"/><circle cx="7" cy="16.5" r="3.2" fill="#f0745a"/><ellipse cx="16.5" cy="16" rx="5" ry="4" fill="#c9a0e8"/></svg>';
    if (/openrouter|hosted|rd free|free auto/.test(k))
      return '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="#f59e0b" stroke-width="1.8"/></svg>';
    return '<svg viewBox="0 0 24 24"><text x="4" y="16" font-size="10" font-weight="700" fill="#a89cff">RD</text></svg>';
  }

  function decorateModelSelects() {
    try {
      var fam = $("#familySelect");
      var mod = $("#modelSelect");
      [fam, mod].forEach(function (sel) {
        if (!sel || sel.__rdIcon56) return;
        sel.__rdIcon56 = true;
        var wrap = el("span", { class: "rd-prov", id: "rd-prov-" + sel.id });
        wrap.innerHTML = providerSvg(sel.value || (fam && fam.value) || "");
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
    injectSidebarTools();
    patchBrokenModels();
    injectHostedFamily();
    decorateModelSelects();
    if (!window.__rdYtPoll) {
      window.__rdYtPoll = setInterval(pollYtubers, 180000);
      setTimeout(pollYtubers, 8000);
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else setTimeout(boot, 200);
  setTimeout(boot, 800);
  setTimeout(boot, 2000);
  setTimeout(function () { injectSidebarTools(); injectHostedFamily(); patchBrokenModels(); decorateModelSelects(); }, 4000);
})();
