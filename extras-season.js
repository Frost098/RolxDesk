/* RD season v6 — fixed dev panel + fish family */
(function () {
  if (window.__RD_SEASON_V6__) return;
  window.__RD_SEASON_V6__ = true;
  window.__RD_SEASON_V5__ = true;

  var DEV_PASS = "rddev";
  var OVERRIDE_KEY = "rd_season_override";
  var FISH_AGENT_ID = "4093e6030a994ab5b5f0dbbbd430e142";

  var EVENTS = [
    { id: "leif-squidward", title: "Leif Erikson & Ultah Squidward", body: "Teal clarinet mood — explorer + artist.", start: { m: 10, d: 9 }, end: { m: 10, d: 9 }, accent: "#2dd4bf", accent2: "#0d9488", bg: "#050a0a", panel: "#0c1616", particle: "note", bootGlow: "rgba(45,212,191,.55)", bannerIcon: "◆" },
    { id: "halloween-bb", title: "Halloween · Scaredy Pants", body: "Bikini Bottom gets spooky.", start: { m: 10, d: 31 }, end: { m: 11, d: 1 }, accent: "#f97316", accent2: "#7c3aed", bg: "#0a0608", panel: "#140e12", particle: "orb", bootGlow: "rgba(249,115,22,.5)", bannerIcon: "◆" },
    { id: "employee-brotherhood", title: "Persaudaraan Karyawan", body: "Krusty Krab crew solidarity.", start: { m: 11, d: 7 }, end: { m: 11, d: 7 }, accent: "#4ade80", accent2: "#16a34a", bg: "#060a07", panel: "#0e1610", particle: "dot", bootGlow: "rgba(74,222,128,.45)", bannerIcon: "◆" },
    { id: "bb-christmas", title: "Natal Bikini Bottom", body: "Christmas Who?", start: { m: 12, d: 24 }, end: { m: 12, d: 26 }, accent: "#ef4444", accent2: "#22c55e", bg: "#07090c", panel: "#10151a", particle: "snow", bootGlow: "rgba(239,68,68,.4)", bannerIcon: "◆" },
    { id: "free-balloon", title: "Hari Balon Gratis", body: "National Free Balloon Day.", start: { m: 12, d: 27 }, end: { m: 12, d: 27 }, accent: "#60a5fa", accent2: "#a78bfa", bg: "#06080c", panel: "#0e121a", particle: "bubble", bootGlow: "rgba(96,165,250,.45)", bannerIcon: "◆" },
    { id: "annoy-squidward", title: "Menjahili Squidward", body: "Annoy Squidward Day.", start: { m: 1, d: 15 }, end: { m: 1, d: 15 }, accent: "#c084fc", accent2: "#7e22ce", bg: "#09060f", panel: "#130e1a", particle: "note", bootGlow: "rgba(192,132,252,.5)", bannerIcon: "◆" },
    { id: "annoy-squidward-feb", title: "Menjahili Squidward", body: "Annoy Squidward Day.", start: { m: 2, d: 15 }, end: { m: 2, d: 15 }, accent: "#c084fc", accent2: "#7e22ce", bg: "#09060f", panel: "#130e1a", particle: "note", bootGlow: "rgba(192,132,252,.5)", bannerIcon: "◆" },
    { id: "ramadan-takjil", title: "Berburu Takjil", body: "Ramadan · aktif 18:00–05:00.", start: { m: 2, d: 18 }, end: { m: 3, d: 19 }, nightOnly: true, accent: "#a3e635", accent2: "#fbbf24", bg: "#070a06", panel: "#10160c", particle: "spark", bootGlow: "rgba(163,230,53,.4)", bannerIcon: "◆" },
    { id: "lebaran", title: "Lebaran", body: "Idul Fitri — minal aidin wal faizin.", start: { m: 3, d: 20 }, end: { m: 3, d: 22 }, accent: "#f8fafc", accent2: "#4ade80", bg: "#0a0c0a", panel: "#121816", particle: "spark", bootGlow: "rgba(248,250,252,.45)", bannerIcon: "◆" },
    { id: "bb-free-day", title: "Gratis Bikini Bottom", body: "Annual Free Day.", start: { m: 3, d: 8 }, end: { m: 3, d: 8 }, accent: "#fbbf24", accent2: "#f59e0b", bg: "#0a0805", panel: "#16120c", particle: "spark", bootGlow: "rgba(251,191,36,.45)", bannerIcon: "◆" },
    { id: "best-friends", title: "Sahabat Terbaik", body: "Best Friends Day.", start: { m: 6, d: 8 }, end: { m: 6, d: 8 }, accent: "#f472b6", accent2: "#fb923c", bg: "#0a0608", panel: "#161016", particle: "heart", bootGlow: "rgba(244,114,182,.45)", bannerIcon: "◆" },
    { id: "no-spongebob", title: "Tanpa SpongeBob", body: "Quiet day in Bikini Bottom.", start: { m: 8, d: 15 }, end: { m: 8, d: 15 }, accent: "#94a3b8", accent2: "#64748b", bg: "#080808", panel: "#121212", particle: "dot", bootGlow: "rgba(148,163,184,.35)", bannerIcon: "◆" },
    { id: "indonesia-17agustus", title: "Hari Kemerdekaan RI", body: "Merah Putih — aksen terkunci.", start: { m: 8, d: 17 }, end: { m: 8, d: 17 }, accent: "#e11d48", accent2: "#f8fafc", bg: "#0a0608", panel: "#160e12", particle: "flag", bootGlow: "rgba(225,29,72,.5)", bannerIcon: "◆", locked: true }
  ];

  function dayNum(m, d) { return m * 100 + d; }
  function inRange(nowM, nowD, start, end) {
    var n = dayNum(nowM, nowD), a = dayNum(start.m, start.d), b = dayNum(end.m, end.d);
    if (a <= b) return n >= a && n <= b;
    return n >= a || n <= b;
  }
  function nightWindowOk() { var h = new Date().getHours(); return h >= 18 || h < 5; }
  function readOverride() {
    try {
      var raw = localStorage.getItem(OVERRIDE_KEY);
      if (!raw) return null;
      var o = JSON.parse(raw);
      if (!o || !o.id) return null;
      if (o.until && Date.now() > o.until) { localStorage.removeItem(OVERRIDE_KEY); return null; }
      return o;
    } catch (e) { return null; }
  }
  function eventById(id) {
    for (var i = 0; i < EVENTS.length; i++) if (EVENTS[i].id === id) return EVENTS[i];
    return null;
  }
  function activeEvent() {
    var ov = readOverride();
    if (ov) {
      if (ov.id === "none") return null;
      var forced = eventById(ov.id);
      if (forced) return Object.assign({}, forced, { _dev: true });
    }
    var d = new Date(), m = d.getMonth() + 1, day = d.getDate();
    for (var i = 0; i < EVENTS.length; i++) {
      var ev = EVENTS[i];
      if (!inRange(m, day, ev.start, ev.end)) continue;
      if (ev.nightOnly && !nightWindowOk()) continue;
      return ev;
    }
    return null;
  }
  function seenKey(id, year) { return "rd_notif_seen_" + id + "_" + year; }
  function hasSeen(id, year) { try { return localStorage.getItem(seenKey(id, year)) === "1"; } catch (e) { return false; } }
  function markSeen(id, year) { try { localStorage.setItem(seenKey(id, year), "1"); } catch (e) {} }

  function injectBaseCss() {
    if (document.getElementById("rd-season-base-css")) return;
    var st = document.createElement("style");
    st.id = "rd-season-base-css";
    st.textContent =
      "#rd-dev-panel{position:fixed;inset:0;z-index:2147483646;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.62);padding:16px;}" +
      "#rd-dev-panel .box{width:min(92vw,380px);background:#12141a;border:1px solid rgba(255,255,255,.14);border-radius:16px;padding:16px;color:#eee;font:14px system-ui;box-shadow:0 20px 60px rgba(0,0,0,.5);}" +
      "#rd-dev-panel h3{margin:0 0 10px;font-size:15px;}" +
      "#rd-dev-panel select,#rd-dev-panel input{width:100%;margin:6px 0 10px;padding:10px 12px;border-radius:10px;border:1px solid rgba(255,255,255,.14);background:#0c0e14;color:#eee;font:14px system-ui;}" +
      "#rd-dev-panel .row{display:flex;gap:8px;margin-top:8px;}" +
      "#rd-dev-panel button{flex:1;border:0;border-radius:10px;padding:11px;font-weight:600;cursor:pointer;font:600 14px system-ui;}" +
      "#rd-dev-panel .go{background:#7c6af7;color:#fff;}" +
      "#rd-dev-panel .cancel{background:#2a2a32;color:#ccc;}" +
      "#rd-season-banner{position:fixed;top:0;left:0;right:0;z-index:40;display:flex;align-items:center;justify-content:center;gap:8px;padding:6px 12px;font:600 12px system-ui;color:#fff;pointer-events:none!important;user-select:none;}" +
      "#rd-season-particles{position:fixed;inset:0;z-index:2;pointer-events:none!important;overflow:hidden;}" +
      "#rd-season-particles i{position:absolute;pointer-events:none!important;border-radius:50%;opacity:.12;animation:rdParticle 12s linear infinite;}" +
      "@keyframes rdParticle{0%{transform:translateY(110vh) scale(.6);opacity:0}10%{opacity:.14}90%{opacity:.1}100%{transform:translateY(-12vh) scale(1.1);opacity:0}}" +
      ".sidebar,.main,.chat-header,.composer,.input-area,#messages,.message,.modal,.modal-content,#settingsModal,#voicePanel,.voice-panel,.voice-controls,#rd-voice-type-wrap{position:relative;z-index:5;}" +
      "body.rd-season-active{padding-top:28px!important;}";
    document.head.appendChild(st);
  }

  function applyTheme(ev) {
    injectBaseCss();
    var st = document.getElementById("rd-season-theme");
    if (!st) { st = document.createElement("style"); st.id = "rd-season-theme"; document.head.appendChild(st); }
    if (!ev) { st.textContent = ""; return; }
    var lock = ev.locked
      ? "html body button.primary,html body #sendBtn{background:#e11d48!important;color:#fff!important;}html body .chat-header{border-bottom-color:#e11d48!important;}"
      : "";
    st.textContent =
      ":root{--rd-season-accent:" + ev.accent + ";--rd-season-accent2:" + ev.accent2 + ";}" +
      "body{background:" + ev.bg + "!important;}" +
      "button.primary,#sendBtn,.btn-primary{background:" + ev.accent + "!important;}" +
      ".chat-header,.sidebar{border-color:" + ev.accent + "44!important;}" +
      "#rd-karaoke{border-color:" + ev.accent + "88!important;}" +
      "#rd-karaoke .rd-k-word.active{text-shadow:0 0 18px " + ev.bootGlow + "!important;}" +
      "#rd-season-banner{background:linear-gradient(90deg," + ev.accent + "dd," + ev.panel + "f2);}" +
      lock;
  }

  function banner(ev) {
    var old = document.getElementById("rd-season-banner");
    if (old) old.remove();
    if (!ev) { document.body.classList.remove("rd-season-active"); return; }
    var b = document.createElement("div");
    b.id = "rd-season-banner";
    b.setAttribute("aria-hidden", "true");
    b.style.pointerEvents = "none";
    var tag = ev._dev ? " <span style='opacity:.7'>[dev]</span>" : "";
    b.innerHTML = "<span style='opacity:.8'>" + (ev.bannerIcon || "◆") + "</span><span>" + ev.title + tag +
      "</span><span style='opacity:.7'>·</span><span style='font-weight:500;opacity:.9'>" + ev.body + "</span>";
    document.body.appendChild(b);
    document.body.classList.add("rd-season-active");
  }

  function particles(ev) {
    var old = document.getElementById("rd-season-particles");
    if (old) old.remove();
    if (!ev) return;
    var layer = document.createElement("div");
    layer.id = "rd-season-particles";
    layer.setAttribute("aria-hidden", "true");
    layer.style.pointerEvents = "none";
    var colors = [ev.accent, ev.accent2, "#ffffff"];
    for (var i = 0; i < 14; i++) {
      var s = document.createElement("i");
      var size = 4 + Math.random() * 10;
      s.style.width = size + "px"; s.style.height = size + "px";
      s.style.left = Math.random() * 100 + "%";
      s.style.background = colors[i % colors.length];
      s.style.animationDelay = Math.random() * 11 + "s";
      s.style.animationDuration = 9 + Math.random() * 8 + "s";
      s.style.pointerEvents = "none";
      if (ev.particle === "flag") {
        s.style.borderRadius = "1px"; s.style.height = size * 0.55 + "px";
        s.style.background = i % 2 === 0 ? "#e11d48" : "#f8fafc";
      } else if (ev.particle === "spark" || ev.particle === "note") s.style.borderRadius = "2px";
      layer.appendChild(s);
    }
    document.body.appendChild(layer);
  }

  function clearTheme() { applyTheme(null); banner(null); particles(null); }

  function notifyOnce(ev) {
    if (!ev || ev._dev) return;
    var y = new Date().getFullYear();
    if (hasSeen(ev.id, y)) return;
    if (typeof showToast === "function") { try { showToast(ev.title + " — " + ev.body, "success"); } catch (e) {} }
    function fire() {
      try {
        if (!("Notification" in window) || Notification.permission !== "granted") return;
        new Notification(ev.title, { body: ev.body, tag: "rd-season-" + ev.id + "-" + y, renotify: false });
      } catch (e3) {}
    }
    if ("Notification" in window) {
      if (Notification.permission === "granted") fire();
      else if (Notification.permission !== "denied") Notification.requestPermission().then(function (p) { if (p === "granted") fire(); });
    }
    markSeen(ev.id, y);
  }

  window.__RD_ACTIVE_SEASON = activeEvent;
  window.__RD_SEASON_EVENTS = EVENTS;

  function run() {
    injectBaseCss();
    var ev = activeEvent();
    if (!ev) { clearTheme(); return; }
    applyTheme(ev); banner(ev); particles(ev);
    setTimeout(function () { notifyOnce(ev); }, 1600);
  }

  function openDevPanel() {
    injectBaseCss();
    if (document.getElementById("rd-dev-panel")) return;
    var gate = prompt("Developer password:");
    if (gate !== DEV_PASS) {
      if (gate !== null && typeof showToast === "function") showToast("Password salah", "error");
      return;
    }
    var panel = document.createElement("div");
    panel.id = "rd-dev-panel";
    var opts = EVENTS.map(function (e) {
      return '<option value="' + e.id + '">' + e.title + " (" + e.start.m + "/" + e.start.d + "–" + e.end.m + "/" + e.end.d + ")</option>";
    }).join("");
    panel.innerHTML =
      '<div class="box" role="dialog" aria-label="Developer event UI">' +
      "<h3>Dev · Event UI (lokal)</h3>" +
      '<p style="opacity:.75;font-size:12px;margin:0 0 8px">Hanya browser ini. Tidak ke server. Auto-lock 2 jam.</p>' +
      "<label>Event</label>" +
      '<select id="rd-dev-event"><option value="none">— none (clear) —</option>' + opts + "</select>" +
      '<div class="row"><button type="button" class="cancel" id="rd-dev-cancel">Tutup</button>' +
      '<button type="button" class="go" id="rd-dev-apply">Terapkan</button></div>' +
      '<button type="button" class="cancel" id="rd-dev-clear" style="width:100%;margin-top:8px">Hapus override</button></div>';
    document.body.appendChild(panel);
    document.getElementById("rd-dev-cancel").onclick = function () { panel.remove(); };
    document.getElementById("rd-dev-clear").onclick = function () {
      localStorage.removeItem(OVERRIDE_KEY); panel.remove(); run();
      if (typeof showToast === "function") showToast("Override dihapus", "success");
    };
    document.getElementById("rd-dev-apply").onclick = function () {
      var id = document.getElementById("rd-dev-event").value;
      localStorage.setItem(OVERRIDE_KEY, JSON.stringify({ id: id, until: Date.now() + 2 * 3600 * 1000 }));
      panel.remove(); run();
      if (typeof showToast === "function") showToast("Event lokal: " + id, "success");
    };
    panel.addEventListener("click", function (e) { if (e.target === panel) panel.remove(); });
  }

  function injectDevBtn() {
    if (document.getElementById("rd-dev-btn")) return;
    var foot = document.querySelector(".sidebar-footer");
    if (!foot) return;
    var btn = document.createElement("button");
    btn.id = "rd-dev-btn"; btn.type = "button"; btn.className = "btn-secondary full";
    btn.textContent = "Developer"; btn.style.marginTop = "8px";
    btn.addEventListener("click", function (e) { e.preventDefault(); e.stopPropagation(); openDevPanel(); });
    foot.appendChild(btn);
  }

  function ensureFishFamily() {
    try {
      if (typeof MODELS !== "undefined") {
        MODELS.fish = MODELS.fish || [
          { id: "fish-agent:" + FISH_AGENT_ID, name: "Fish Agent (default)" },
          { id: "fish-agent-session", name: "Fish Agent · New Session" }
        ];
      }
      var sel = document.getElementById("familySelect");
      if (sel && !sel.querySelector('option[value="fish"]')) {
        var opt = document.createElement("option");
        opt.value = "fish";
        opt.textContent = "Fish Agent (AI voice)";
        sel.appendChild(opt);
      }
      if (typeof populateModels === "function" && sel && sel.value === "fish") populateModels();
    } catch (e) {}
  }

  window.createFishAgentSession = async function (agentId) {
    var key = "";
    try { key = String((window.state && state.keys && state.keys.fish) || "").trim(); } catch (e) {}
    if (!key) {
      try {
        var el = document.getElementById("keyFish");
        if (el && el.value) key = String(el.value).trim();
      } catch (e2) {}
    }
    if (!key) throw new Error("Fish Audio key belum diisi di Settings");
    var r = await fetch("/api/fish-agent", {
      method: "POST",
      headers: { Authorization: "Bearer " + key, "Content-Type": "application/json" },
      body: JSON.stringify({
        agent_id: agentId || FISH_AGENT_ID,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Jakarta"
      })
    });
    var j = await r.json().catch(function () { return {}; });
    if (!r.ok) throw new Error(j.error || j.message || "Fish agent HTTP " + r.status);
    try { window.__RD_FISH_SESSION = j; } catch (e3) {}
    return j;
  };

  function patchCallModelFish() {
    if (typeof window.callModel !== "function" || window.callModel.__rdFish) return;
    var prev = window.callModel;
    window.callModel = async function (messages) {
      var fam = "";
      try {
        var el = document.getElementById("familySelect");
        fam = el ? String(el.value || "") : "";
      } catch (e) {}
      var model = "";
      try {
        if (window.state && state.selectedModel) model = String(state.selectedModel);
        else {
          var ms = document.getElementById("modelSelect");
          if (ms) model = String(ms.value || "");
        }
      } catch (e2) {}

      if (fam === "fish" || /^fish-agent/i.test(model)) {
        var agentId = FISH_AGENT_ID;
        var m = String(model || "").match(/fish-agent:([a-f0-9]+)/i);
        if (m) agentId = m[1];
        var sess = await window.createFishAgentSession(agentId);
        var text =
          "**Fish Agent session dibuat.**\n\n" +
          "```json\n" + JSON.stringify(sess, null, 2) + "\n```\n\n" +
          "Session ini realtime (LiveKit). Token di atas siap dipakai client Fish Agent.\n" +
          "`session_id`: `" + (sess.session_id || "?") + "`";
        return { choices: [{ message: { role: "assistant", content: text } }] };
      }
      return prev.apply(this, arguments);
    };
    window.callModel.__rdFish = true;
  }

  function boot() {
    injectBaseCss();
    ensureFishFamily();
    injectDevBtn();
    patchCallModelFish();
    run();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else setTimeout(boot, 0);
  setTimeout(boot, 400);
  setTimeout(boot, 1200);
  setTimeout(boot, 2500);
  setInterval(function () {
    ensureFishFamily();
    injectDevBtn();
    patchCallModelFish();
  }, 8000);
  setInterval(run, 5 * 60 * 1000);
})();
