/* RD season v3 — rich boot/theme, 2-day window, clear icons */
(function () {
  if (window.__RD_SEASON_V3__) return;
  window.__RD_SEASON_V3__ = true;

  var EVENTS = [
    { id: "halloween-bb", month: 10, day: 31, title: "Halloween", body: "Scaredy Pants mode.",
      motif: "🎃", boot: ["🎃", "👻"], iconHint: "labu",
      theme: { accent: "#ff7a18", glow: "rgba(255,122,24,.55)", bg: "#0c0806", panel: "#1a100c" } },
    { id: "employee-brotherhood", month: 11, day: 7, title: "Persaudaraan Karyawan", body: "Krusty Krab crew.",
      motif: "🍔", boot: ["🍔", "🍟"], iconHint: "burger",
      theme: { accent: "#4ade80", glow: "rgba(74,222,128,.5)", bg: "#070c08", panel: "#101a12" } },
    { id: "bb-christmas", month: 12, day: 25, title: "Natal Bikini Bottom", body: "Christmas Who?",
      motif: "🎄", boot: ["🎄", "⭐"], iconHint: "tree",
      theme: { accent: "#ef4444", glow: "rgba(34,197,94,.45)", bg: "#070a0c", panel: "#10161a" } },
    { id: "free-balloon", month: 12, day: 27, title: "Balon Gratis", body: "Free Balloon Day.",
      motif: "🎈", boot: ["🎈", "🎈"], iconHint: "balloon",
      theme: { accent: "#60a5fa", glow: "rgba(96,165,250,.5)", bg: "#07080c", panel: "#10131a" } },
    { id: "annoy-squidward", month: 1, day: 15, title: "Menjahili Squidward", body: "Annoy Squidward Day.",
      motif: "🦑", boot: ["🦑", "🎵"], iconHint: "squid",
      theme: { accent: "#c084fc", glow: "rgba(192,132,252,.55)", bg: "#0a0710", panel: "#140f1c" } },
    { id: "annoy-squidward-feb", month: 2, day: 15, title: "Menjahili Squidward", body: "Annoy Squidward Day.",
      motif: "🦑", boot: ["🦑", "😤"], iconHint: "squid",
      theme: { accent: "#c084fc", glow: "rgba(192,132,252,.55)", bg: "#0a0710", panel: "#140f1c" } },
    { id: "bb-free-day", month: 3, day: 8, title: "Gratis Bikini Bottom", body: "Annual Free Day.",
      motif: "🎁", boot: ["🎁", "✨"], iconHint: "gift",
      theme: { accent: "#fbbf24", glow: "rgba(251,191,36,.5)", bg: "#0c0a06", panel: "#1a160e" } },
    { id: "best-friends", month: 6, day: 8, title: "Sahabat Terbaik", body: "Best Friends Day.",
      motif: "🍍", boot: ["⭐", "🍍"], iconHint: "star",
      theme: { accent: "#f472b6", glow: "rgba(244,114,182,.5)", bg: "#0c070a", panel: "#1a1016" } },
    { id: "no-spongebob", month: 8, day: 15, title: "Tanpa SpongeBob", body: "Quiet day.",
      motif: "🔇", boot: ["R", "D"], iconHint: "mute",
      theme: { accent: "#94a3b8", glow: "rgba(148,163,184,.35)", bg: "#080808", panel: "#121212" } },
    { id: "leif-squidward", month: 10, day: 9, title: "Leif Erikson & Ultah Squidward", body: "Teal clarinet mood.",
      motif: "⛵", boot: ["🦑", "⛵"], iconHint: "ship",
      theme: { accent: "#2dd4bf", glow: "rgba(45,212,191,.5)", bg: "#060c0c", panel: "#0e1818" } },
    { id: "indonesia-17agustus", month: 8, day: 17, title: "Hari Kemerdekaan RI", body: "Merah Putih terkunci.",
      motif: "🚩", boot: ["🔴", "⚪"], iconHint: "flag", locked: true,
      theme: { accent: "#e11d48", glow: "rgba(225,29,72,.55)", bg: "#0a0608", panel: "#1a0e12" } }
  ];

  function todayParts() {
    var d = new Date();
    return { y: d.getFullYear(), m: d.getMonth() + 1, day: d.getDate() };
  }

  function activeEvent() {
    var t = todayParts();
    for (var i = 0; i < EVENTS.length; i++) {
      var ev = EVENTS[i];
      var start = new Date(t.y, ev.month - 1, ev.day).getTime();
      var end = start + 2 * 24 * 60 * 60 * 1000;
      var now = new Date(t.y, t.m - 1, t.day).getTime();
      if (now >= start && now < end) return ev;
    }
    return null;
  }

  function seenKey(id, year) { return "rd_notif_seen_" + id + "_" + year; }
  function hasSeen(id, year) {
    try { return localStorage.getItem(seenKey(id, year)) === "1"; } catch (e) { return false; }
  }
  function markSeen(id, year) {
    try { localStorage.setItem(seenKey(id, year), "1"); } catch (e) {}
  }

  function applyTheme(ev) {
    var theme = ev.theme;
    var st = document.getElementById("rd-season-theme");
    if (!st) {
      st = document.createElement("style");
      st.id = "rd-season-theme";
      document.head.appendChild(st);
    }
    var lock = ev.locked
      ? "html body button.primary,html body #sendBtn{background:#e11d48!important;color:#fff!important;}"
      : "";
    st.textContent =
      ":root{--rd-season-accent:" + theme.accent + ";--rd-season-glow:" + theme.glow + ";}" +
      "body{background:" + theme.bg + "!important;}" +
      "button.primary,#sendBtn,.btn-primary{background:" + theme.accent + "!important;}" +
      ".chat-header,.sidebar{border-color:" + theme.accent + "33!important;}" +
      "#rd-karaoke{border-color:" + theme.accent + "88!important;}" +
      "#rd-karaoke .rd-k-word.active{text-shadow:0 0 18px " + theme.glow + "!important;color:#fff!important;}" +
      "#rd-season-banner{position:fixed;top:0;left:0;right:0;z-index:2147483640;display:flex;align-items:center;justify-content:center;gap:8px;" +
      "padding:6px 12px;font:600 12px system-ui;color:#fff;background:linear-gradient(90deg," + theme.accent + "cc," + theme.panel + "ee);" +
      "backdrop-filter:blur(8px);pointer-events:none;}" +
      "#rd-season-motif{position:fixed;inset:0;pointer-events:none;z-index:1;overflow:hidden;}" +
      "#rd-season-motif i{position:absolute;opacity:.14;font-style:normal;animation:rdFloat 10s linear infinite;font-size:20px;}" +
      "@keyframes rdFloat{0%{transform:translateY(105vh) rotate(0)}100%{transform:translateY(-10vh) rotate(320deg)}}" +
      lock;
  }

  function banner(ev) {
    if (document.getElementById("rd-season-banner")) return;
    var b = document.createElement("div");
    b.id = "rd-season-banner";
    b.innerHTML = "<span>" + (ev.motif || "✨") + "</span><span>" + ev.title + "</span><span>·</span><span>" + ev.body + "</span>";
    document.body.appendChild(b);
    var st = document.createElement("style");
    st.textContent = "body{padding-top:28px!important;}";
    document.head.appendChild(st);
  }

  function motifs(ev) {
    if (document.getElementById("rd-season-motif")) return;
    var layer = document.createElement("div");
    layer.id = "rd-season-motif";
    var em = ev.motif || "✨";
    for (var i = 0; i < 10; i++) {
      var s = document.createElement("i");
      s.textContent = em;
      s.style.left = Math.random() * 100 + "%";
      s.style.animationDelay = (Math.random() * 9) + "s";
      s.style.fontSize = 14 + Math.random() * 16 + "px";
      layer.appendChild(s);
    }
    document.body.appendChild(layer);
  }

  function swapIcons(ev) {
    try {
      var settingsBtn = document.getElementById("settingsBtn");
      if (settingsBtn && !settingsBtn.dataset.season) {
        settingsBtn.dataset.season = "1";
        settingsBtn.title = (settingsBtn.title || "Settings") + " · " + ev.title;
      }
      var orb = document.getElementById("voiceOrb");
      if (orb) orb.style.boxShadow = "0 0 48px " + ev.theme.glow;
      var c = document.createElement("canvas");
      c.width = 64; c.height = 64;
      var ctx = c.getContext("2d");
      ctx.fillStyle = ev.theme.bg;
      ctx.fillRect(0, 0, 64, 64);
      ctx.font = "48px serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(ev.motif || "R", 32, 36);
      var link = document.querySelector("link[rel*='icon']") || document.createElement("link");
      link.rel = "icon";
      link.href = c.toDataURL("image/png");
      if (!link.parentNode) document.head.appendChild(link);
    } catch (e) {}
  }

  function notifyOnce(ev) {
    var t = todayParts();
    if (hasSeen(ev.id, t.y)) return;
    if (typeof showToast === "function") {
      try { showToast(ev.motif + " " + ev.title + " — " + ev.body, "success"); } catch (e) {}
    }
    function fire() {
      try {
        if (!("Notification" in window) || Notification.permission !== "granted") return;
        new Notification(ev.title, { body: ev.body, tag: "rd-season-" + ev.id + "-" + t.y, renotify: false });
      } catch (e3) {}
    }
    if ("Notification" in window) {
      if (Notification.permission === "granted") fire();
      else if (Notification.permission !== "denied") {
        Notification.requestPermission().then(function (p) { if (p === "granted") fire(); });
      }
    }
    markSeen(ev.id, t.y);
  }

  window.__RD_ACTIVE_SEASON = activeEvent;

  function run() {
    var ev = activeEvent();
    if (!ev) return;
    applyTheme(ev);
    banner(ev);
    motifs(ev);
    swapIcons(ev);
    setTimeout(function () { notifyOnce(ev); }, 1500);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run);
  else setTimeout(run, 0);
  setTimeout(run, 600);
  setTimeout(run, 2000);
})();
