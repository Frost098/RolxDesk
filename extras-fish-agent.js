/* RD Fish Agent v3 — @fishaudio/agent-client + webhook */
(function () {
  if (window.__RD_FISH_AGENT_V3__) return;
  window.__RD_FISH_AGENT_V3__ = true;
  var AGENT_ID = "4093e6030a994ab5b5f0dbbbd430e142";
  var session = null;
  var connecting = false;
  function toast(m, t) { if (typeof showToast === "function") showToast(m, t || "success"); }
  function injectCss() {
    if (document.getElementById("rd-fish-agent-css")) return;
    var s = document.createElement("style");
    s.id = "rd-fish-agent-css";
    s.textContent = "#rd-fish-panel{position:fixed;left:50%;bottom:18px;transform:translateX(-50%);z-index:2147483000;width:min(94vw,400px);background:rgba(12,12,18,.96);border:1px solid rgba(139,124,255,.45);border-radius:16px;padding:14px 16px;box-shadow:0 16px 48px rgba(0,0,0,.55);display:none;}#rd-fish-panel.open{display:block;}#rd-fish-panel h4{margin:0 0 6px;font:700 14px system-ui;color:#fff;display:flex;justify-content:space-between;align-items:center;}#rd-fish-panel .st{font:12px system-ui;color:#a8a4b8;margin-bottom:8px;min-height:16px;}#rd-fish-panel .log{font:11px system-ui;color:#c4b5fd;max-height:72px;overflow:auto;margin-bottom:8px;white-space:pre-wrap;}#rd-fish-panel .row{display:flex;gap:8px;flex-wrap:wrap;}#rd-fish-panel input{flex:1;min-width:120px;border:1px solid #333;border-radius:10px;padding:10px;background:#0a0a10;color:#eee;font:12px system-ui;}#rd-fish-panel button{border:0;border-radius:12px;padding:10px 12px;font:600 12px system-ui;cursor:pointer;}#rd-fish-panel .go{background:#7c6af7;color:#fff;}#rd-fish-panel .stop{background:#3a1a22;color:#f8a;}#rd-fish-panel .x{background:transparent;color:#888;padding:4px 8px;font-size:16px;}#rd-fish-panel .dot{width:8px;height:8px;border-radius:50%;display:inline-block;margin-right:6px;background:#666;}#rd-fish-panel.live .dot{background:#22c55e;box-shadow:0 0 8px #22c55e;animation:rdPulse 1s infinite;}@keyframes rdPulse{50%{opacity:.5}}#rd-fish-fab{position:fixed;bottom:72px;right:14px;z-index:40;border:0;border-radius:999px;padding:10px 14px;background:linear-gradient(135deg,#7c6af7,#3b82f6);color:#fff;font:700 12px system-ui;box-shadow:0 6px 20px rgba(0,0,0,.4);cursor:pointer;}";
    document.head.appendChild(s);
  }
  function getFishKey() {
    try { var k = (window.state && state.keys && state.keys.fish) || ""; if (k) return String(k).trim(); } catch (e) {}
    try { var el = document.getElementById("keyFish"); if (el && el.value) return String(el.value).trim(); } catch (e2) {}
    try { return String(localStorage.getItem("rd_fish_key") || "").trim(); } catch (e3) {}
    return "";
  }
  function setStatus(t) { var el = document.getElementById("rd-fish-status"); if (el) el.textContent = t; }
  function appendLog(t) {
    var el = document.getElementById("rd-fish-log");
    if (!el) return;
    el.textContent = (el.textContent ? el.textContent + "\n" : "") + t;
    el.scrollTop = el.scrollHeight;
  }
  function ensurePanel() {
    injectCss();
    if (document.getElementById("rd-fish-panel")) return;
    var p = document.createElement("div");
    p.id = "rd-fish-panel";
    p.innerHTML = "<h4><span><span class='dot'></span>Fish Agent</span><button type='button' class='x' id='rd-fish-close'>×</button></h4><div class='st' id='rd-fish-status'>Tekan Mulai — agent bicara via mic</div><div class='log' id='rd-fish-log'></div><div class='row' style='margin-bottom:8px'><input id='rd-fish-say' placeholder='Ketik agar agent jawab (bicara)...'/><button type='button' class='go' id='rd-fish-send'>Kirim</button></div><div class='row'><button type='button' class='go' id='rd-fish-start'>Mulai</button><button type='button' class='stop' id='rd-fish-stop'>Stop</button></div>";
    document.body.appendChild(p);
    document.getElementById("rd-fish-close").onclick = function () { stopAgent(); p.classList.remove("open"); };
    document.getElementById("rd-fish-start").onclick = function () { startAgent(); };
    document.getElementById("rd-fish-stop").onclick = function () { stopAgent(); };
    document.getElementById("rd-fish-send").onclick = function () { sendText(); };
    document.getElementById("rd-fish-say").addEventListener("keydown", function (e) { if (e.key === "Enter") sendText(); });
    if (!document.getElementById("rd-fish-fab")) {
      var fab = document.createElement("button");
      fab.id = "rd-fish-fab"; fab.type = "button"; fab.textContent = "Fish Agent";
      fab.onclick = function () { p.classList.add("open"); };
      document.body.appendChild(fab);
    }
  }
  async function loadAgentClient() {
    if (window.FishAgentClient && window.FishAgentClient.AgentSession) return window.FishAgentClient;
    var mod = await import("https://esm.sh/@fishaudio/agent-client@0.3.0");
    window.FishAgentClient = mod;
    return mod;
  }
  async function createSessionToken() {
    var key = getFishKey();
    var headers = { "Content-Type": "application/json" };
    if (key) headers.Authorization = "Bearer " + key;
    var r = await fetch("/api/fish-agent", {
      method: "POST", headers: headers,
      body: JSON.stringify({ agent_id: AGENT_ID, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Jakarta" })
    });
    var j = await r.json().catch(function () { return {}; });
    if (!r.ok) throw new Error(j.error || j.message || ("HTTP " + r.status));
    if (!j.token && !j.livekit_url && !j.session_id) throw new Error("Session token tidak lengkap");
    return j;
  }
  async function startAgent() {
    if (connecting) return;
    connecting = true;
    ensurePanel();
    document.getElementById("rd-fish-panel").classList.add("open");
    setStatus("Buat sesi agent…");
    try {
      var sessionToken = await createSessionToken();
      setStatus("Load Fish SDK…");
      var mod = await loadAgentClient();
      var AgentSession = mod.AgentSession || (mod.default && mod.default.AgentSession);
      if (!AgentSession || typeof AgentSession.start !== "function") throw new Error("AgentSession.start tidak ada");
      setStatus("Connect + mic…");
      session = await AgentSession.start({
        sessionToken: sessionToken,
        callbacks: {
          onUserTranscript: function (ev) { var t = (ev && (ev.text || ev.transcript)) || ""; if (t) appendLog("You: " + t); },
          onAgentResponse: function (ev) { var t = (ev && (ev.text || ev.transcript || ev.message)) || ""; if (t) { appendLog("Agent: " + t); setStatus("Agent bicara…"); } },
          onError: function (err) { setStatus("Error: " + (err && err.message ? err.message : err)); }
        }
      });
      document.getElementById("rd-fish-panel").classList.add("live");
      setStatus("Live — bicara atau ketik");
      toast("Fish Agent live");
      appendLog("Connected · " + AGENT_ID.slice(0, 8));
    } catch (e) {
      setStatus("Gagal: " + (e && e.message ? e.message : e));
      toast(String(e && e.message ? e.message : e), "error");
      appendLog("Fail: " + (e && e.message ? e.message : e));
    } finally { connecting = false; }
  }
  async function sendText() {
    var input = document.getElementById("rd-fish-say");
    var text = input && input.value ? input.value.trim() : "";
    if (!text) return;
    if (!session) { toast("Mulai agent dulu", "error"); return; }
    try {
      if (typeof session.sendUserMessage === "function") await session.sendUserMessage({ text: text, audio: true });
      else if (typeof session.sendText === "function") await session.sendText(text);
      else if (typeof session.send === "function") await session.send(text);
      else throw new Error("SDK tidak punya sendUserMessage");
      appendLog("You: " + text);
      if (input) input.value = "";
      setStatus("Menunggu jawaban agent…");
    } catch (e) { toast(String(e && e.message ? e.message : e), "error"); }
  }
  async function stopAgent() {
    try {
      if (session) {
        if (typeof session.stop === "function") await session.stop();
        else if (typeof session.end === "function") await session.end();
        else if (typeof session.disconnect === "function") await session.disconnect();
        else if (typeof session.close === "function") await session.close();
      }
    } catch (e) {}
    session = null;
    document.getElementById("rd-fish-panel")?.classList.remove("live");
    setStatus("Stop. Webhook: /api/fish-webhook");
  }
  window.rdStartFishAgent = startAgent;
  window.rdStopFishAgent = stopAgent;
  window.RD_FISH_AGENT_ID = AGENT_ID;
  window.RD_FISH_WEBHOOK = (location.origin || "") + "/api/fish-webhook";
  function boot() { ensurePanel(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else setTimeout(boot, 0);
  setTimeout(boot, 800);
})();
