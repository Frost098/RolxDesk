/* RD season v4 — non-blocking overlays, RD letters kept, rich per-event themes */
(function () {
  if (window.__RD_SEASON_V4__) return;
  window.__RD_SEASON_V4__ = true;

  var EVENTS = [
    {
      id: "leif-squidward", month: 10, day: 9,
      title: "Leif Erikson & Ultah Squidward",
      body: "Teal clarinet mood — explorer + artist.",
      accent: "#2dd4bf", accent2: "#0d9488", bg: "#050a0a", panel: "#0c1616",
      particle: "note", bootGlow: "rgba(45,212,191,.55)", bannerIcon: "◆"
    },
    {
      id: "halloween-bb", month: 10, day: 31,
      title: "Halloween · Scaredy Pants",
      body: "Bikini Bottom gets spooky.",
      accent: "#f97316", accent2: "#7c3aed", bg: "#0a0608", panel: "#140e12",
      particle: "orb", bootGlow: "rgba(249,115,22,.5)", bannerIcon: "◆"
    },
    {
      id: "employee-brotherhood", month: 11, day: 7,
      title: "Persaudaraan Karyawan",
      body: "Krusty Krab crew solidarity.",
      accent: "#4ade80", accent2: "#16a34a", bg: "#060a07", panel: "#0e1610",
      particle: "dot", bootGlow: "rgba(74,222,128,.45)", bannerIcon: "◆"
    },
    {
      id: "bb-christmas", month: 12, day: 25,
      title: "Natal Bikini Bottom",
      body: "Christmas Who?",
      accent: "#ef4444", accent2: "#22c55e", bg: "#07090c", panel: "#10151a",
      particle: "snow", bootGlow: "rgba(239,68,68,.4)", bannerIcon: "◆"
    },
    {
      id: "free-balloon", month: 12, day: 27,
      title: "Hari Balon Gratis",
      body: "National Free Balloon Day.",
      accent: "#60a5fa", accent2: "#a78bfa", bg: "#06080c", panel: "#0e121a",
      particle: "bubble", bootGlow: "rgba(96,165,250,.45)", bannerIcon: "◆"
    },
    {
      id: "annoy-squidward", month: 1, day: 15,
      title: "Menjahili Squidward",
      body: "Annoy Squidward Day.",
      accent: "#c084fc", accent2: "#7e22ce", bg: "#09060f", panel: "#130e1a",
      particle: "note", bootGlow: "rgba(192,132,252,.5)", bannerIcon: "◆"
    },
    {
      id: "annoy-squidward-feb", month: 2, day: 15,
      title: "Menjahili Squidward",
      body: "Annoy Squidward Day.",
      accent: "#c084fc", accent2: "#7e22ce", bg: "#09060f", panel: "#130e1a",
      particle: "note", bootGlow: "rgba(192,132,252,.5)", bannerIcon: "◆"
    },
    {
      id: "bb-free-day", month: 3, day: 8,
      title: "Gratis Bikini Bottom",
      body: "Annual Free Day.",
      accent: "#fbbf24", accent2: "#f59e0b", bg: "#0a0805", panel: "#16120c",
      particle: "spark", bootGlow: "rgba(251,191,36,.45)", bannerIcon: "◆"
    },
    {
      id: "best-friends", month: 6, day: 8,
      title: "Sahabat Terbaik",
      body: "Best Friends Day.",
      accent: "#f472b6", accent2: "#fb923c", bg: "#0a0608", panel: "#161016",
      particle: "heart", bootGlow: "rgba(244,114,182,.45)", bannerIcon: "◆"
    },
    {
      id: "no-spongebob", month: 8, day: 15,
      title: "Tanpa SpongeBob",
      body: "Quiet day in Bikini Bottom.",
      accent: "#94a3b8", accent2: "#64748b", bg: "#080808", panel: "#121212",
      particle: "dot", bootGlow: "rgba(148,163,184,.35)", bannerIcon: "◆"
    },
    {
      id: "indonesia-17agustus", month: 8, day: 17,
      title: "Hari Kemerdekaan RI",
      body: "Merah Putih — aksen terkunci.",
      accent: "#e11d48", accent2: "#f8fafc", bg: "#0a0608", panel: "#160e12",
      particle: "flag", bootGlow: "rgba(225,29,72,.5)", bannerIcon: "◆", locked: true
    }
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
      var end = start + 2 * 86400000;
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
    var st = document.getElementById("rd-season-theme");
    if (!st) {
      st = document.createElement("style");
      st.id = "rd-season-theme";
      document.head.appendChild(st);
    }
    var lock = ev.locked
      ? "html body button.primary,html body #sendBtn{background:#e11d48!important;color:#fff!important;}" +
        "html body .chat-header{border-bottom-color:#e11d48!important;}"
      : "";
    st.textContent =
      ":root{--rd-season-accent:" + ev.accent + ";--rd-season-accent2:" + ev.accent2 + ";}" +
      "body{background:" + ev.bg + "!important;}" +
      "button.primary,#sendBtn,.btn-primary{background:" + ev.accent + "!important;}" +
      ".chat-header,.sidebar{border-color:" + ev.accent + "44!important;}" +
      "#rd-karaoke{border-color:" + ev.accent + "88!important;}" +
      "#rd-karaoke .rd-k-word.active{text-shadow:0 0 18px " + ev.bootGlow + "!important;}" +
      "#rd-season-banner{" +
      "position:fixed;top:0;left:0;right:0;z-index:40;" +
      "display:flex;align-items:center;justify-content:center;gap:8px;" +
      "padding:6px 12px;font:600 12px system-ui;color:#fff;" +
      "background:linear-gradient(90deg," + ev.accent + "dd," + ev.panel + "f2);" +
      "backdrop-filter:blur(8px);pointer-events:none!important;user-select:none;}" +
      "#rd-season-particles{" +
      "position:fixed;inset:0;z-index:2;pointer-events:none!important;overflow:hidden;}" +
      "#rd-season-particles i{" +
      "position:absolute;pointer-events:none!important;border-radius:50%;opacity:.12;" +
      "animation:rdParticle 12s linear infinite;}" +
      "@keyframes rdParticle{" +
      "0%{transform:translateY(110vh) scale(.6);opacity:0}" +
      "10%{opacity:.14}90%{opacity:.1}" +
      "100%{transform:translateY(-12vh) scale(1.1);opacity:0}}" +
      ".sidebar,.main,.chat-header,.composer,.input-area,#messages," +
      ".message,.modal,.modal-content,#settingsModal," +
      "#voicePanel,.voice-panel,.voice-controls,#rd-voice-type-wrap{" +
      "position:relative;z-index:5;}" +
      "body.rd-season-active{padding-top:28px!important;}" +
      lock;
  }

  function banner(ev) {
    var old = document.getElementById("rd-season-banner");
    if (old) old.remove();
    var b = document.createElement("div");
    b.id = "rd-season-banner";
    b.setAttribute("aria-hidden", "true");
    b.style.pointerEvents = "none";
    b.innerHTML =
      "<span style='opacity:.8'>" + (ev.bannerIcon || "◆") + "</span><span>" +
      ev.title + "</span><span style='opacity:.7'>·</span><span style='font-weight:500;opacity:.9'>" +
      ev.body + "</span>";
    document.body.appendChild(b);
    document.body.classList.add("rd-season-active");
  }

  function particles(ev) {
    var old = document.getElementById("rd-season-particles");
    if (old) old.remove();
    var layer = document.createElement("div");
    layer.id = "rd-season-particles";
    layer.setAttribute("aria-hidden", "true");
    layer.style.pointerEvents = "none";
    var colors = [ev.accent, ev.accent2, "#ffffff"];
    for (var i = 0; i < 14; i++) {
      var s = document.createElement("i");
      var size = 4 + Math.random() * 10;
      s.style.width = size + "px";
      s.style.height = size + "px";
      s.style.left = Math.random() * 100 + "%";
      s.style.background = colors[i % colors.length];
      s.style.animationDelay = Math.random() * 11 + "s";
      s.style.animationDuration = 9 + Math.random() * 8 + "s";
      s.style.pointerEvents = "none";
      if (ev.particle === "note") { s.style.borderRadius = "2px"; }
      else if (ev.particle === "flag") {
        s.style.borderRadius = "1px";
        s.style.height = size * 0.55 + "px";
        s.style.background = i % 2 === 0 ? "#e11d48" : "#f8fafc";
      } else if (ev.particle === "spark") {
        s.style.borderRadius = "1px";
        s.style.width = size * 0.4 + "px";
      }
      layer.appendChild(s);
    }
    document.body.appendChild(layer);
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
    if (!ev) {
      document.body.classList.remove("rd-season-active");
      var b = document.getElementById("rd-season-banner");
      if (b) b.remove();
      var p = document.getElementById("rd-season-particles");
      if (p) p.remove();
      return;
    }
    applyTheme(ev);
    banner(ev);
    particles(ev);
    setTimeout(function () { notifyOnce(ev); }, 1600);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run);
  else setTimeout(run, 0);
  setTimeout(run, 500);
  setTimeout(run, 2000);
})();
