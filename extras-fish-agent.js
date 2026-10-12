/* RD Fish Agent v2 — agent_id user, session JSON langsung connect */
(function () {
  if (window.__RD_FISH_AGENT_V2__) return;
  window.__RD_FISH_AGENT_V2__ = true;

  var AGENT_ID = "4093e6030a994ab5b5f0dbbbd430e142";
  var room = null;
  var connecting = false;

  function toast(m, t) {
    if (typeof showToast === "function") showToast(m, t || "success");
  }

  function injectCss() {
    if (document.getElementById("rd-fish-agent-css")) return;
    var s = document.createElement("style");
    s.id = "rd-fish-agent-css";
    s.textContent =
      "#rd-fish-panel{position:fixed;left:50%;bottom:18px;transform:translateX(-50%);z-index:2147483000;" +
      "width:min(94vw,380px);background:rgba(12,12,18,.96);border:1px solid rgba(139,124,255,.45);" +
      "border-radius:16px;padding:14px 16px;box-shadow:0 16px 48px rgba(0,0,0,.55);display:none;}" +
      "#rd-fish-panel.open{display:block;}" +
      "#rd-fish-panel h4{margin:0 0 6px;font:700 14px system-ui;color:#fff;display:flex;justify-content:space-between;align-items:center;}" +
      "#rd-fish-panel .st{font:12px system-ui;color:#a8a4b8;margin-bottom:10px;min-height:16px;}" +
      "#rd-fish-panel .row{display:flex;gap:8px;}" +
      "#rd-fish-panel button{flex:1;border:0;border-radius:12px;padding:12px;font:600 13px system-ui;cursor:pointer;}" +
      "#rd-fish-panel .go{background:#7c6af7;color:#fff;}" +
      "#rd-fish-panel .stop{background:#3a1a22;color:#f8a;}" +
      "#rd-fish-panel .x{background:transparent;color:#888;flex:0;padding:4px 8px;font-size:16px;}" +
      "#rd-fish-panel .dot{width:8px;height:8px;border-radius:50%;display:inline-block;margin-right:6px;background:#666;}" +
      "#rd-fish-panel.live .dot{background:#22c55e;box-shadow:0 0 8px #22c55e;animation:rdPulse 1s infinite;}" +
      "@keyframes rdPulse{50%{opacity:.5}}" +
      "#rd-fish-fab{position:fixed;bottom:72px;right:14px;z-index:40;border:0;border-radius:999px;" +
      "padding:10px 14px;background:linear-gradient(135deg,#7c6af7,#3b82f6);color:#fff;font:700 12px system-ui;box-shadow:0 6px 20px rgba(0,0,0,.4);cursor:pointer;}";
    document.head.appendChild(s);
  }

  function getFishKey() {
    try {
      var k = (window.state && state.keys && state.keys.fish) || "";
      if (k) return String(k).trim();
    } catch (e) {}
    try {
      var el = document.getElementById("keyFish");
      if (el && el.value) return String(el.value).trim();
    } catch (e2) {}
    try { return String(localStorage.getItem("rd_fish_key") || "").trim(); } catch (e3) {}
    return "";
  }

  function ensurePanel() {
    injectCss();
    if (document.getElementById("rd-fish-panel")) return;
    var p = document.createElement("div");
    p.id = "rd-fish-panel";
    p.innerHTML =
      "<h4><span><span class='dot'></span>Fish Agent</span>" +
      "<button type='button' class='x' id='rd-fish-close'>×</button></h4>" +
      "<div class='st' id='rd-fish-status'>Agent " + AGENT_ID.slice(0, 8) + "… — tekan Mulai</div>" +
      "<div class='row'>" +
      "<button type='button' class='go' id='rd-fish-start'>Mulai</button>" +
      "<button type='button' class='stop' id='rd-fish-stop'>Stop</button></div>";
    document.body.appendChild(p);
    document.getElementById("rd-fish-close").onclick = function () { stopAgent(); p.classList.remove("open"); };
    document.getElementById("rd-fish-start").onclick = function () { startAgent(); };
    document.getElementById("rd-fish-stop").onclick = function () { stopAgent(); };
    if (!document.getElementById("rd-fish-fab")) {
      var fab = document.createElement("button");
      fab.id = "rd-fish-fab";
      fab.type = "button";
      fab.textContent = "Fish Agent";
      fab.onclick = function () { p.classList.add("open"); };
      document.body.appendChild(fab);
    }
  }

  function setStatus(t) {
    var el = document.getElementById("rd-fish-status");
    if (el) el.textContent = t;
  }

  function loadLiveKit() {
    return new Promise(function (resolve, reject) {
      if (window.LivekitClient || window.LiveKitClient) return resolve(window.LivekitClient || window.LiveKitClient);
      var s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/livekit-client@2.9.5/dist/livekit-client.umd.min.js";
      s.onload = function () { resolve(window.LivekitClient || window.LiveKitClient); };
      s.onerror = function () { reject(new Error("Gagal muat LiveKit")); };
      document.head.appendChild(s);
    });
  }

  async function connectSession(session) {
    if (!session || !session.token || !session.livekit_url) throw new Error("Session tidak lengkap");
    ensurePanel();
    document.getElementById("rd-fish-panel").classList.add("open");
    setStatus("Connect LiveKit…");
    if (room) { try { await room.disconnect(); } catch (e) {} room = null; }
    var LK = await loadLiveKit();
    if (!LK || !LK.Room) throw new Error("LiveKit SDK tidak ada");
    room = new LK.Room({
      adaptiveStream: true,
      dynacast: true,
      audioCaptureDefaults: { echoCancellation: true, noiseSuppression: true }
    });
    room.on(LK.RoomEvent.TrackSubscribed, function (track) {
      if (track.kind === "audio" || (LK.Track && track.kind === LK.Track.Kind.Audio)) {
        var el = track.attach();
        el.setAttribute("data-rd-fish-audio", "1");
        document.body.appendChild(el);
        setStatus("Agent bicara…");
      }
    });
    room.on(LK.RoomEvent.TrackUnsubscribed, function (track) {
      track.detach().forEach(function (el) { el.remove(); });
    });
    room.on(LK.RoomEvent.Disconnected, function () {
      setStatus("Terputus");
      document.getElementById("rd-fish-panel")?.classList.remove("live");
      room = null;
    });
    await room.connect(session.livekit_url, session.token);
    await room.localParticipant.setMicrophoneEnabled(true);
    document.getElementById("rd-fish-panel")?.classList.add("live");
    setStatus("Live · " + String(session.session_id || AGENT_ID).slice(0, 18));
    toast("Fish Agent live");
  }

  async function createSession() {
    var key = getFishKey();
    var headers = { "Content-Type": "application/json" };
    if (key) headers.Authorization = "Bearer " + key;
    var r = await fetch("/api/fish-agent", {
      method: "POST",
      headers: headers,
      body: JSON.stringify({ agent_id: AGENT_ID })
    });
    var j = await r.json().catch(function () { return {}; });
    if (!r.ok) throw new Error(j.error || j.message || ("HTTP " + r.status));
    if (!j.token || !j.livekit_url) throw new Error("Session tidak lengkap");
    return j;
  }

  async function startAgent() {
    if (connecting) return;
    connecting = true;
    ensurePanel();
    document.getElementById("rd-fish-panel").classList.add("open");
    setStatus("Buat sesi…");
    try {
      var session = await createSession();
      await connectSession(session);
    } catch (e) {
      setStatus("Gagal: " + (e && e.message ? e.message : e));
      toast(String(e && e.message ? e.message : e), "error");
    } finally {
      connecting = false;
    }
  }

  async function stopAgent() {
    try { if (room) await room.disconnect(); } catch (e) {}
    room = null;
    document.querySelectorAll("[data-rd-fish-audio]").forEach(function (el) { el.remove(); });
    document.getElementById("rd-fish-panel")?.classList.remove("live");
    setStatus("Stop. Tekan Mulai lagi.");
  }

  function parseSessionJson(text) {
    if (!text || typeof text !== "string") return null;
    if (text.indexOf("livekit_url") < 0 || text.indexOf("token") < 0) return null;
    try {
      var j = JSON.parse(text.trim());
      if (j.livekit_url && j.token) return j;
    } catch (e) {}
    var m = text.match(/\{[\s\S]*"livekit_url"[\s\S]*"token"[\s\S]*\}/);
    if (m) {
      try {
        var j2 = JSON.parse(m[0]);
        if (j2.livekit_url && j2.token) return j2;
      } catch (e2) {}
    }
    return null;
  }

  function handleMaybeSessionText(text) {
    var session = parseSessionJson(text);
    if (!session) return false;
    ensurePanel();
    document.getElementById("rd-fish-panel").classList.add("open");
    setStatus("Session terdeteksi — connect…");
    connectSession(session).catch(function (e) {
      setStatus("Gagal connect: " + (e && e.message ? e.message : e));
    });
    return true;
  }

  function scrubAndConnect() {
    document.querySelectorAll(".message, .msg, [class*='message'], pre, code").forEach(function (n) {
      var t = n.textContent || "";
      if (t.length > 80 && t.indexOf("livekit_url") >= 0 && t.indexOf("session_id") >= 0) {
        if (handleMaybeSessionText(t))
          n.textContent = "Fish Agent session → connect otomatis.";
      }
    });
  }

  if (typeof window.appendMessage === "function" && !window.appendMessage.__rdFishV2) {
    var prev = window.appendMessage;
    window.appendMessage = function (msg) {
      try {
        var c = msg && (msg.content || msg.text || "");
        if (typeof c === "string" && parseSessionJson(c)) {
          handleMaybeSessionText(c);
          msg = Object.assign({}, msg, { content: "Fish Agent session → connect. Panel Fish Agent." });
        }
      } catch (e) {}
      return prev.apply(this, arguments);
    };
    window.appendMessage.__rdFishV2 = true;
  }

  if (!window.__RD_FISH_FETCH_V2__) {
    window.__RD_FISH_FETCH_V2__ = true;
    var _fetch = window.fetch.bind(window);
    window.fetch = async function (input, init) {
      var url = typeof input === "string" ? input : (input && input.url) || "";
      var res = await _fetch(input, init);
      if (/\/api\/fish-agent\b/.test(url) && res.ok) {
        try {
          var j = await res.clone().json();
          if (j && j.token && j.livekit_url) {
            window.__RD_LAST_FISH_SESSION = j;
            ensurePanel();
            document.getElementById("rd-fish-panel")?.classList.add("open");
            connectSession(j).catch(function () { setStatus("Session siap — tekan Mulai"); });
          }
        } catch (e) {}
      }
      return res;
    };
  }

  window.rdStartFishAgent = startAgent;
  window.rdStopFishAgent = stopAgent;
  window.rdConnectFishSession = connectSession;
  window.RD_FISH_AGENT_ID = AGENT_ID;

  function boot() {
    ensurePanel();
    setInterval(scrubAndConnect, 1500);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else setTimeout(boot, 0);
  setTimeout(boot, 1000);
})();
