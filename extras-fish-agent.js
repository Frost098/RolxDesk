/* RD Fish Agent — real LiveKit session, never dump JSON to chat */
(function () {
  if (window.__RD_FISH_AGENT_V1__) return;
  window.__RD_FISH_AGENT_V1__ = true;

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
      "border-radius:16px;padding:14px 16px;box-shadow:0 16px 48px rgba(0,0,0,.55);backdrop-filter:blur(12px);display:none;}" +
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
      "padding:10px 14px;background:linear-gradient(135deg,#7c6af7,#3b82f6);color:#fff;font:700 12px system-ui;" +
      "box-shadow:0 6px 20px rgba(0,0,0,.4);cursor:pointer;}" +
      "#rd-fish-fab:active{transform:scale(.97)}";
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
    try {
      return String(localStorage.getItem("rd_fish_key") || "").trim();
    } catch (e3) {}
    return "";
  }

  function ensurePanel() {
    injectCss();
    if (document.getElementById("rd-fish-panel")) return;
    var p = document.createElement("div");
    p.id = "rd-fish-panel";
    p.innerHTML =
      "<h4><span><span class='dot'></span>Fish Agent</span>" +
      "<button type='button' class='x' id='rd-fish-close' aria-label='Tutup'>×</button></h4>" +
      "<div class='st' id='rd-fish-status'>Siap. Tekan Mulai untuk bicara real-time.</div>" +
      "<div class='row'>" +
      "<button type='button' class='go' id='rd-fish-start'>Mulai</button>" +
      "<button type='button' class='stop' id='rd-fish-stop'>Stop</button>" +
      "</div>";
    document.body.appendChild(p);
    document.getElementById("rd-fish-close").onclick = function () {
      stopAgent();
      p.classList.remove("open");
    };
    document.getElementById("rd-fish-start").onclick = function () { startAgent(); };
    document.getElementById("rd-fish-stop").onclick = function () { stopAgent(); };

    if (!document.getElementById("rd-fish-fab")) {
      var fab = document.createElement("button");
      fab.id = "rd-fish-fab";
      fab.type = "button";
      fab.textContent = "Fish Agent";
      fab.onclick = function () {
        p.classList.add("open");
      };
      document.body.appendChild(fab);
    }
  }

  function setStatus(t) {
    var el = document.getElementById("rd-fish-status");
    if (el) el.textContent = t;
  }

  function loadLiveKit() {
    return new Promise(function (resolve, reject) {
      if (window.LivekitClient || window.LiveKitClient) {
        return resolve(window.LivekitClient || window.LiveKitClient);
      }
      var s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/livekit-client@2.9.5/dist/livekit-client.umd.min.js";
      s.onload = function () {
        resolve(window.LivekitClient || window.LiveKitClient);
      };
      s.onerror = function () { reject(new Error("Gagal muat LiveKit SDK")); };
      document.head.appendChild(s);
    });
  }

  async function createSession() {
    var key = getFishKey();
    if (!key) throw new Error("Isi Fish API key di Settings dulu");
    var r = await fetch("/api/fish-agent", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + key,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ agent_id: AGENT_ID })
    });
    var j = await r.json().catch(function () { return {}; });
    if (!r.ok) throw new Error(j.error || j.message || ("HTTP " + r.status));
    if (!j.token || !j.livekit_url) throw new Error("Session tidak lengkap dari Fish");
    return j;
  }

  async function startAgent() {
    if (connecting || room) return;
    ensurePanel();
    document.getElementById("rd-fish-panel").classList.add("open");
    connecting = true;
    setStatus("Membuat sesi Fish Agent…");
    try {
      var session = await createSession();
      setStatus("Menyambung LiveKit…");
      var LK = await loadLiveKit();
      if (!LK || !LK.Room) throw new Error("LiveKit SDK tidak tersedia");

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
          setStatus("Agent berbicara…");
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
      setStatus("Live — bicara sekarang.");
      toast("Fish Agent live");
    } catch (e) {
      setStatus("Gagal: " + (e && e.message ? e.message : e));
      toast(String(e && e.message ? e.message : e), "error");
      await stopAgent();
    } finally {
      connecting = false;
    }
  }

  async function stopAgent() {
    try {
      if (room) await room.disconnect();
    } catch (e) {}
    room = null;
    document.querySelectorAll("[data-rd-fish-audio]").forEach(function (el) { el.remove(); });
    document.getElementById("rd-fish-panel")?.classList.remove("live");
    setStatus("Dihentikan. Tekan Mulai lagi bila perlu.");
  }

  function looksLikeFishSession(text) {
    if (!text || typeof text !== "string") return false;
    return (
      text.indexOf("livekit_url") >= 0 &&
      text.indexOf("session_id") >= 0 &&
      (text.indexOf("fish-agent") >= 0 || text.indexOf("sess_") >= 0)
    );
  }

  function scrubFishJsonFromChat() {
    try {
      var nodes = document.querySelectorAll(".message .content, .message-content, .msg-content, pre, code");
      nodes.forEach(function (n) {
        var t = n.textContent || "";
        if (looksLikeFishSession(t) && t.length > 80) {
          n.textContent = "Fish Agent session dibuat — buka panel Fish Agent (kanan bawah) lalu Mulai.";
          ensurePanel();
          document.getElementById("rd-fish-panel")?.classList.add("open");
        }
      });
    } catch (e) {}
  }

  function patchAppend() {
    if (typeof window.appendMessage === "function" && !window.appendMessage.__rdFish) {
      var prev = window.appendMessage;
      window.appendMessage = function (msg) {
        try {
          var c = msg && (msg.content || msg.text || "");
          if (typeof c === "string" && looksLikeFishSession(c)) {
            ensurePanel();
            document.getElementById("rd-fish-panel")?.classList.add("open");
            setStatus("Sesi terdeteksi. Tekan Mulai untuk bicara.");
            msg = Object.assign({}, msg, {
              content: "Fish Agent siap. Pakai panel **Fish Agent** (kanan bawah) → Mulai. Token tidak ditampilkan di chat."
            });
          }
        } catch (e) {}
        return prev.apply(this, arguments);
      };
      window.appendMessage.__rdFish = true;
    }
  }

  window.rdStartFishAgent = startAgent;
  window.rdStopFishAgent = stopAgent;

  function boot() {
    ensurePanel();
    patchAppend();
    setInterval(patchAppend, 2000);
    setInterval(scrubFishJsonFromChat, 1500);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else setTimeout(boot, 0);
  setTimeout(boot, 1200);
})();
