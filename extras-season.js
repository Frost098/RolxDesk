/* RD season v2 — 2-day window, rich themes, 17 Agustus locked */
(function () {
  if (window.__RD_SEASON_V2__) return;
  window.__RD_SEASON_V2__ = true;

  var EVENTS = [
    { id: "halloween-bb", month: 10, day: 31, title: "Halloween / Scaredy Pants", body: "Bikini Bottom takut-takutan.",
      motif: "🎃", bootLetters: ["🎃", "👻"], anim: "pulse-orange",
      theme: { accent: "#ff7a18", glow: "rgba(255,122,24,.5)", bg: "#0c0806", panel: "#1a100c" } },
    { id: "employee-brotherhood", month: 11, day: 7, title: "Hari Persaudaraan Karyawan", body: "Krusty Krab crew unite.",
      motif: "🍔", bootLetters: ["🍔", "💼"], anim: "bounce",
      theme: { accent: "#4ade80", glow: "rgba(74,222,128,.45)", bg: "#070c08", panel: "#101a12" } },
    { id: "bb-christmas", month: 12, day: 25, title: "Natal Bikini Bottom", body: "Christmas Who?",
      motif: "🎄", bootLetters: ["🎄", "⭐"], anim: "snow",
      theme: { accent: "#ef4444", glow: "rgba(34,197,94,.4)", bg: "#070a0c", panel: "#10161a" } },
    { id: "free-balloon", month: 12, day: 27, title: "Hari Balon Gratis", body: "National Free Balloon Day.",
      motif: "🎈", bootLetters: ["🎈", "🎈"], anim: "float",
      theme: { accent: "#60a5fa", glow: "rgba(96,165,250,.45)", bg: "#07080c", panel: "#10131a" } },
    { id: "annoy-squidward", month: 1, day: 15, title: "Hari Menjahili Squidward", body: "Annoy Squidward Day.",
      motif: "🦑", bootLetters: ["🦑", "😤"], anim: "shake",
      theme: { accent: "#c084fc", glow: "rgba(192,132,252,.5)", bg: "#0a0710", panel: "#140f1c" } },
    { id: "annoy-squidward-feb", month: 2, day: 15, title: "Hari Menjahili Squidward", body: "Annoy Squidward Day (Feb).",
      motif: "🦑", bootLetters: ["🦑", "🎵"], anim: "shake",
      theme: { accent: "#c084fc", glow: "rgba(192,132,252,.5)", bg: "#0a0710", panel: "#140f1c" } },
    { id: "bb-free-day", month: 3, day: 8, title: "Hari Gratis Bikini Bottom", body: "Annual Free Day.",
      motif: "🎁", bootLetters: ["🎁", "✨"], anim: "spark",
      theme: { accent: "#fbbf24", glow: "rgba(251,191,36,.45)", bg: "#0c0a06", panel: "#1a160e" } },
    { id: "best-friends", month: 6, day: 8, title: "Hari Sahabat Terbaik", body: "Best Friends Day.",
      motif: "🤝", bootLetters: ["⭐", "🍍"], anim: "heart",
      theme: { accent: "#f472b6", glow: "rgba(244,114,182,.45)", bg: "#0c070a", panel: "#1a1016" } },
    { id: "no-spongebob", month: 8, day: 15, title: "Hari Tanpa SpongeBob", body: "National No SpongeBob Day.",
      motif: "🔇", bootLetters: ["R", "D"], anim: "minimal",
      theme: { accent: "#94a3b8", glow: "rgba(148,163,184,.3)", bg: "#080808", panel: "#121212" } },
    { id: "leif-squidward", month: 10, day: 9, title: "Leif Erikson & Ultah Squidward", body: "Teal clarinet mood.",
      motif: "🧭", bootLetters: ["🦑", "⛵"], anim: "wave",
      theme: { accent: "#2dd4bf", glow: "rgba(45,212,191,.45)", bg: "#060c0c", panel: "#0e1818" } },
    { id: "indonesia-17agustus", month: 8, day: 17, title: "Hari Kemerdekaan RI", body: "Merah Putih — aksen terkunci.",
      motif: "🇮🇩", bootLetters: ["🇮🇩", "✊"], anim: "merah-putih", locked: true,
      theme: { accent: "#e11d48", glow: "rgba(225,29,72,.5)", bg: "#0a0608", panel: "#1a0e12", accent2: "#f8fafc" } }
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
      ? "html body button.primary,html body .btn-primary,html body #sendBtn{background:#e11d48!important;color:#fff!important;}" +
        "html body .rd-letter{color:#f8fafc!important;}"
      : "";
    st.textContent =
      ":root{--rd-season-accent:" + theme.accent + ";--rd-season-glow:" + theme.glow + ";}" +
      "body{background:" + theme.bg + "!important;}" +
      "#rd-boot{background:radial-gradient(ellipse 80% 60% at 50% 45%," + theme.panel + " 0%," + theme.bg + " 70%)!important;}" +
      ".rd-letter{text-shadow:0 0 40px " + theme.glow + "!important;}" +
      "button.primary,.btn-primary,#sendBtn{background:" + theme.accent + "!important;}" +
      "#rd-karaoke{border-color:" + theme.accent + "66!important;}" +
      "#rd-karaoke .rd-k-word.active{text-shadow:0 0 16px " + theme.glow + "!important;}" +
      lock +
      "#rd-season-motif{position:fixed;inset:0;pointer-events:none;z-index:99990;overflow:hidden;}" +
      "#rd-season-motif span{position:absolute;font-size:22px;opacity:.18;animation:rdMotifFloat 9s linear infinite;}" +
      "@keyframes rdMotifFloat{0%{transform:translateY(100vh) rotate(0)}100%{transform:translateY(-20vh) rotate(360deg)}}" +
      (ev.anim === "merah-putih"
        ? ".rd-letter.r{color:#e11d48!important;text-shadow:0 0 30px rgba(225,29,72,.7)!important;}" +
          ".rd-letter.d{color:#f8fafc!important;text-shadow:0 0 30px rgba(248,250,252,.5)!important;}"
        : "");
  }

  function decorateMotif(ev) {
    if (document.getElementById("rd-season-motif")) return;
    var layer = document.createElement("div");
    layer.id = "rd-season-motif";
    var emoji = ev.motif || "✨";
    if (emoji.length > 2) emoji = "✨";
    for (var i = 0; i < 12; i++) {
      var s = document.createElement("span");
      s.textContent = emoji;
      s.style.left = Math.random() * 100 + "%";
      s.style.animationDelay = Math.random() * 8 + "s";
      s.style.fontSize = 16 + Math.random() * 18 + "px";
      layer.appendChild(s);
    }
    document.body.appendChild(layer);
  }

  function tweakBoot(ev) {
    try {
      var r = document.querySelector(".rd-letter.r");
      var d = document.querySelector(".rd-letter.d");
      if (ev.bootLetters && ev.bootLetters.length >= 2) {
        if (r && ev.bootLetters[0].length <= 2) r.textContent = ev.bootLetters[0];
        if (d && ev.bootLetters[1].length <= 2) d.textContent = ev.bootLetters[1];
      }
      var status = document.getElementById("rd-boot-status");
      if (status) status.textContent = ev.title;
    } catch (e) {}
  }

  function notifyOnce(ev) {
    var t = todayParts();
    if (hasSeen(ev.id, t.y)) return;
    if (typeof showToast === "function") {
      try { showToast(ev.title + " — " + ev.body, "success"); } catch (e) {}
    }
    function fire() {
      try {
        if (!("Notification" in window) || Notification.permission !== "granted") return;
        var n = new Notification(ev.title, {
          body: ev.body,
          tag: "rd-season-" + ev.id + "-" + t.y,
          renotify: false
        });
        n.onclick = function () { try { window.focus(); } catch (e2) {} };
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

  function run() {
    var ev = activeEvent();
    if (!ev) return;
    applyTheme(ev);
    decorateMotif(ev);
    tweakBoot(ev);
    setTimeout(function () { notifyOnce(ev); }, 1400);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run);
  else setTimeout(run, 0);
  setTimeout(run, 800);
})();
