/* RolxDesk extras-ui v5.9 — NVIDIA Settings key, YouTuber, camera sidebar */
(function () {
  if (window.__RD_EXTRAS_UI59__) return;
  window.__RD_EXTRAS_UI59__ = true;
  window.__RD_EXTRAS_UI58__ = true;
  window.__RD_EXTRAS_UI57__ = true;

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
    if ($("#rd-ui59-css")) return;
    var s = document.createElement("style");
    s.id = "rd-ui59-css";
    s.textContent = [
      "#rd-cam-btn,#rd-ytuber-fab{display:none!important}",
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
      "#rd-nvidia-key-group label span{color:#76B900;font-size:11px}"
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
    panel.innerHTML = '<div class="rd-yp-card"><div style="display:flex;justify-content:space-between;align-items:center"><h2>YouTuber Upload</h2><button type="button" id="rd-yp-close">Tutup</button></div><p style="color:#999;font-size:13px;margin:0 0 12px">Pantau channel. Notifikasi video / live saat tab RD terbuka.</p><div class="rd-yp-row"><input id="rd-yp-input" placeholder="Nama channel" /><button type="button" class="primary" id="rd-yp-add">Tambah</button></div><div id="rd-yp-list"></div></div>';
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
        (c.lastTitle ? (c.lastLive ? "LIVE \u00b7 " : "VIDEO \u00b7 ") + String(c.lastTitle).slice(0, 48) : "Belum dicek") +
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
      var payload = JSON.stringify({ q: q, channel: true, action: "channel" });
      var r = await fetch("/api/yt-channel", { method: "POST", headers: { "Content-Type": "application/json" }, body: payload });
      var j = await r.json().catch(function () { return {}; });
      if (!r.ok || !j.channel) {
        r = await fetch("/api/yt-search", { method: "POST", headers: { "Content-Type": "application/json" }, body: payload });
        j = await r.json().catch(function () { return {}; });
      }
      if (!r.ok || !j.channel) throw new Error(j.error || "Channel tidak ketemu");
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
        var r = await fetch("/api/yt-channel", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ channelId: c.id, q: c.name, channel: true }) });
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
    addNav("rd-cam-nav", "Kamera (voice vision)", "camera", function () { ensureCamUI(); openCam(); });
    var fab = document.getElementById("rd-ytuber-fab"); if (fab) fab.remove();
    var cam = document.getElementById("rd-cam-btn"); if (cam) cam.remove();
  }

  var FREE_POOL = [
    { id: "qwen/qwen3.8-27b:free", name: "RD Qwen3.8 27B" },
    { id: "google/gemma-4-31b-it:free", name: "RD Gemma 4 31B" },
    { id: "nvidia/nemotron-3-super-120b-a12b:free", name: "RD Nemotron Super" },
    { id: "cohere/north-mini-code:free", name: "RD North Mini Code" },
    { id: "thinkingmachines/inkling:free", name: "RD Inkling" },
    { id: "openrouter/free", name: "RD Free Auto" }
  ];

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
    if (!fam.__rdHosted59) {
      fam.__rdHosted59 = true;
      fam.addEventListener("change", function () {
        if (fam.value === "hosted") {
          var ms = $("#modelSelect");
          if (!ms) return;
          fetch("/api/hosted-models").then(function (r) { return r.json(); }).then(function (j) {
            var list = (j.models && j.models.length) ? j.models : FREE_POOL;
            ms.innerHTML = list.map(function (m) { return '<option value="' + m.id + '">' + m.name + "</option>"; }).join("");
          }).catch(function () {
            ms.innerHTML = FREE_POOL.map(function (m) { return '<option value="' + m.id + '">' + m.name + "</option>"; }).join("");
          });
        }
      });
    }
  }

  function injectNvidiaSettings() {
    var body = document.querySelector("#settingsModal .modal-body");
    if (!body || document.getElementById("keyNvidia")) return;
    var google = body.querySelector("#keyGoogle");
    var group = document.createElement("div");
    group.className = "form-group";
    group.id = "rd-nvidia-key-group";
    group.innerHTML =
      '<label>NVIDIA API Key <span>(build.nvidia.com)</span></label>' +
      '<input type="password" id="keyNvidia" placeholder="nvapi-... / NVIDIA key" autocomplete="off" />' +
      '<p style="font-size:0.68rem;color:var(--text-muted);margin:6px 0 0">Family <b>Nvidia</b> pakai key ini (disimpan di browser). Hosted env terpisah.</p>';
    if (google && google.closest(".form-group")) google.closest(".form-group").after(group);
    else body.insertBefore(group, body.firstChild);
  }
  function loadNvidiaKeyIntoForm() {
    try {
      if (!window.state) return;
      state.keys = state.keys || {};
      if (!state.keys.nvidia) {
        var raw = JSON.parse(localStorage.getItem("rd_keys") || "{}");
        if (raw.nvidia) state.keys.nvidia = raw.nvidia;
      }
      var inp = document.getElementById("keyNvidia");
      if (inp && state.keys.nvidia) inp.value = state.keys.nvidia;
    } catch (e) {}
  }
  function saveNvidiaKeyFromForm() {
    try {
      var inp = document.getElementById("keyNvidia");
      var v = inp ? inp.value.trim() : "";
      if (!window.state) window.state = {};
      state.keys = state.keys || {};
      state.keys.nvidia = v;
      var all = {};
      try { all = JSON.parse(localStorage.getItem("rd_keys") || "{}"); } catch (e2) {}
      all.nvidia = v;
      localStorage.setItem("rd_keys", JSON.stringify(all));
    } catch (e) {}
  }
  function wireNvidiaSettings() {
    injectNvidiaSettings();
    loadNvidiaKeyIntoForm();
    var save = document.getElementById("saveSettings");
    if (save && !save.__rdNv) {
      save.__rdNv = true;
      save.addEventListener("click", function () { saveNvidiaKeyFromForm(); });
    }
    var openBtn = document.getElementById("settingsBtn");
    if (openBtn && !openBtn.__rdNv) {
      openBtn.__rdNv = true;
      openBtn.addEventListener("click", function () {
        setTimeout(function () { injectNvidiaSettings(); loadNvidiaKeyIntoForm(); }, 80);
      });
    }
    var modal = document.getElementById("settingsModal");
    if (modal && !modal.__rdNvObs) {
      modal.__rdNvObs = true;
      new MutationObserver(function () {
        if (modal.classList.contains("open")) {
          injectNvidiaSettings();
          loadNvidiaKeyIntoForm();
        }
      }).observe(modal, { attributes: true, attributeFilter: ["class"] });
    }
  }

  async function callNvidiaDirect(messages, modelId, apiKey, temp, maxTok) {
    var mid = String(modelId || "").replace(/^nv:/, "");
    var map = {
      "nvidia/nemotron-3-super-120b-a12b:free": "nvidia/llama-3.3-nemotron-super-49b-v1",
      "nvidia/nemotron-3-super-120b-a12b": "nvidia/llama-3.3-nemotron-super-49b-v1",
      "nvidia/nemotron-3.5-lightning:free": "nvidia/llama-3.3-nemotron-super-49b-v1"
    };
    if (map[mid]) mid = map[mid];
    if (!mid || mid === "custom") mid = "meta/llama-3.1-8b-instruct";
    var r = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: "Bearer " + apiKey, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        model: mid,
        messages: (messages || []).slice(-24).map(function (m) {
          return { role: m.role, content: typeof m.content === "string" ? m.content : JSON.stringify(m.content) };
        }),
        temperature: temp ?? 0.7,
        max_tokens: Math.min(maxTok || 2048, 4096),
        stream: false
      })
    });
    var data = await r.json().catch(function () { return {}; });
    if (!r.ok) {
      var msg = (data.error && (data.error.message || data.error)) || data.message || ("NVIDIA HTTP " + r.status);
      throw new Error(String(msg));
    }
    return data;
  }

  function patchCallModelNvidia() {
    if (typeof window.callModel !== "function" || window.callModel.__rdNv) return;
    var prev = window.callModel;
    window.callModel = async function (messages) {
      try {
        saveNvidiaKeyFromForm();
        var fam = (document.getElementById("familySelect") || {}).value || "";
        var model = (document.getElementById("modelSelect") || {}).value || "";
        var nvKey = (window.state && state.keys && state.keys.nvidia) || "";
        if (!nvKey) {
          try {
            var raw = JSON.parse(localStorage.getItem("rd_keys") || "{}");
            nvKey = raw.nvidia || "";
            if (nvKey && window.state) { state.keys = state.keys || {}; state.keys.nvidia = nvKey; }
          } catch (e0) {}
        }
        var wantNv = fam === "nvidia" || String(model).indexOf("nv:") === 0;
        if (wantNv && nvKey) {
          var temp = parseFloat((window.state && state.settings && state.settings.temperature) || 0.7);
          var maxTok = parseInt((window.state && state.settings && state.settings.maxTokens) || 2048, 10);
          if (typeof injectPersona === "function") {
            try { messages = injectPersona(typeof normalizeMessages === "function" ? normalizeMessages(messages) : messages); } catch (e1) {}
          }
          return await callNvidiaDirect(messages, model, nvKey, temp, maxTok);
        }
      } catch (e) {
        if (String(e.message || "").indexOf("NVIDIA") >= 0) throw e;
      }
      return prev.apply(this, arguments);
    };
    window.callModel.__rdNv = true;
  }

  function boot() {
    injectCSS();
    ensureCamUI();
    injectSidebarTools();
    injectHostedFamily();
    wireNvidiaSettings();
    patchCallModelNvidia();
    if (!window.__rdYtPoll) {
      window.__rdYtPoll = setInterval(pollYtubers, 180000);
      setTimeout(pollYtubers, 8000);
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else setTimeout(boot, 200);
  setTimeout(boot, 800);
  setTimeout(boot, 2000);
  setTimeout(function () {
    injectSidebarTools();
    injectHostedFamily();
    wireNvidiaSettings();
    patchCallModelNvidia();
  }, 4000);
})();
