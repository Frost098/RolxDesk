/* RD season v1 — Bikini Bottom calendar themes + one-shot notifications */
(function () {
  if (window.__RD_SEASON_V1__) return;
  window.__RD_SEASON_V1__ = true;

  var EVENTS = [
    {
      id: "halloween-bb",
      month: 10,
      day: 31,
      title: "Hari Halloween / Scaredy Pants",
      body: "Bikini Bottom mode: gelap, oranye, dan sedikit menakut-nakuti.",
      theme: { accent: "#ff7a18", glow: "rgba(255,122,24,.45)", bg: "#0c0806", panel: "#1a100c" }
    },
    {
      id: "employee-brotherhood",
      month: 11,
      day: 7,
      title: "Hari Persaudaraan Karyawan",
      body: "Employee Brotherhood Day — Krusty Krab energy.",
      theme: { accent: "#4ade80", glow: "rgba(74,222,128,.4)", bg: "#070c08", panel: "#101a12" }
    },
    {
      id: "bb-christmas",
      month: 12,
      day: 25,
      title: "Hari Natal Bikini Bottom",
      body: "Christmas Who? — salju pixel & lampu merah-hijau.",
      theme: { accent: "#ef4444", glow: "rgba(34,197,94,.35)", bg: "#070a0c", panel: "#10161a" }
    },
    {
      id: "free-balloon",
      month: 12,
      day: 27,
      title: "Hari Balon Gratis",
      body: "National Free Balloon Day — UI lebih ringan & berwarna.",
      theme: { accent: "#60a5fa", glow: "rgba(96,165,250,.4)", bg: "#07080c", panel: "#10131a" }
    },
    {
      id: "annoy-squidward",
      month: 1,
      day: 15,
      title: "Hari Menjahili Squidward",
      body: "Annoy Squidward Day (Jan) — slightly chaotic purple.",
      theme: { accent: "#c084fc", glow: "rgba(192,132,252,.45)", bg: "#0a0710", panel: "#140f1c" }
    },
    {
      id: "annoy-squidward-feb",
      month: 2,
      day: 15,
      title: "Hari Menjahili Squidward",
      body: "Annoy Squidward Day (Feb).",
      theme: { accent: "#c084fc", glow: "rgba(192,132,252,.45)", bg: "#0a0710", panel: "#140f1c" }
    },
    {
      id: "bb-free-day",
      month: 3,
      day: 8,
      title: "Hari Gratis Tahunan Bikini Bottom",
      body: "Bikini Bottom Annual Free Day.",
      theme: { accent: "#fbbf24", glow: "rgba(251,191,36,.4)", bg: "#0c0a06", panel: "#1a160e" }
    },
    {
      id: "best-friends",
      month: 6,
      day: 8,
      title: "Hari Sahabat Terbaik",
      body: "Best Friends Day — SpongeBob & Patrick vibes.",
      theme: { accent: "#f472b6", glow: "rgba(244,114,182,.4)", bg: "#0c070a", panel: "#1a1016" }
    },
    {
      id: "no-spongebob",
      month: 8,
      day: 15,
      title: "Hari Tanpa SpongeBob",
      body: "National No SpongeBob Day — tema minimalis tenang.",
      theme: { accent: "#94a3b8", glow: "rgba(148,163,184,.3)", bg: "#080808", panel: "#121212" }
    },
    {
      id: "leif-squidward",
      month: 10,
      day: 9,
      title: "Hari Leif Erikson & Ulang Tahun Squidward",
      body: "Leif Erikson Day + Squidward birthday — teal clarinet mood.",
      theme: { accent: "#2dd4bf", glow: "rgba(45,212,191,.4)", bg: "#060c0c", panel: "#0e1818" }
    }
  ];

  function todayParts() {
    var d = new Date();
    return { y: d.getFullYear(), m: d.getMonth() + 1, day: d.getDate() };
  }
  function seenKey(id, year) { return "rd_notif_seen_" + id + "_" + year; }
  function hasSeen(id, year) {
    try { return localStorage.getItem(seenKey(id, year)) === "1"; } catch (e) { return false; }
  }
  function markSeen(id, year) {
    try { localStorage.setItem(seenKey(id, year), "1"); } catch (e) {}
  }

  function applyTheme(theme) {
    if (!theme) return;
    var st = document.getElementById("rd-season-theme");
    if (!st) {
      st = document.createElement("style");
      st.id = "rd-season-theme";
      document.head.appendChild(st);
    }
    st.textContent =
      ":root{--rd-season-accent:" + theme.accent + ";--rd-season-glow:" + theme.glow + ";}" +
      "body{background:" + theme.bg + "!important;}" +
      "#rd-boot{background:radial-gradient(ellipse 80% 60% at 50% 45%," + theme.panel + " 0%," + theme.bg + " 70%)!important;}" +
      ".rd-letter{text-shadow:0 0 40px " + theme.glow + "!important;}" +
      "button.primary,.btn-primary,#sendBtn{background:" + theme.accent + "!important;}" +
      "#rd-karaoke{border-color:" + theme.accent + "66!important;}" +
      "#rd-karaoke .rd-k-word.active{text-shadow:0 0 16px " + theme.glow + "!important;}";
  }

  function notifyOnce(ev) {
    var t = todayParts();
    if (hasSeen(ev.id, t.y)) return;

    if (typeof showToast === "function") {
      try { showToast(ev.title + " — " + ev.body, "success"); } catch (e) {}
    }

    function fireBrowser() {
      try {
        if (!("Notification" in window)) return;
        if (Notification.permission !== "granted") return;
        var n = new Notification(ev.title, {
          body: ev.body,
          tag: "rd-season-" + ev.id + "-" + t.y,
          renotify: false,
          silent: false
        });
        n.onclick = function () { try { window.focus(); } catch (e2) {} };
      } catch (e3) {}
    }

    if ("Notification" in window) {
      if (Notification.permission === "granted") fireBrowser();
      else if (Notification.permission !== "denied") {
        Notification.requestPermission().then(function (p) {
          if (p === "granted") fireBrowser();
        });
      }
    }

    markSeen(ev.id, t.y);
  }

  function run() {
    var t = todayParts();
    var hit = null;
    for (var i = 0; i < EVENTS.length; i++) {
      if (EVENTS[i].month === t.m && EVENTS[i].day === t.day) {
        hit = EVENTS[i];
        break;
      }
    }
    if (!hit) return;
    applyTheme(hit.theme);
    setTimeout(function () { notifyOnce(hit); }, 1200);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run);
  else setTimeout(run, 0);
})();
