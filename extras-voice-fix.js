/* RD voice-fix v111 — karaoke word-by-word + Fish refs */
(function () {
  if (window.__RD_VOICE_FIX_111__) return;
  window.__RD_VOICE_FIX_111__ = true;

  var REFS = {
    ibuki: "5b6d90ce888747c0a5dfe798181324b9",
    alya: "627dc7e8c315428fa844773296969fb1",
    "koro-sensei": "05a680501c8d42af91610defd80d6865",
    korosensei: "05a680501c8d42af91610defd80d6865",
    verity: "8d21b053e2804e2a890e1cf62f267b6f",
    "vestia-zeta": "c632b5c8521a4a22b05ff919d8b552b7",
    zeta: "c632b5c8521a4a22b05ff919d8b552b7",
    prabowo: "b8d594e696694b499aa12e32d0c1b61"
  };
  try { window.RD_FISH_REFS = Object.assign(window.RD_FISH_REFS || {}, REFS); } catch (e) {}

  function injectStyle() {
    var old = document.getElementById("rd-voice-v25-style");
    if (old) old.remove();
    var s = document.createElement("style");
    s.id = "rd-voice-v25-style";
    s.textContent =
      "#rd-karaoke{position:fixed!important;left:50%!important;bottom:clamp(110px,18vh,170px)!important;transform:translateX(-50%)!important;" +
      "z-index:2147483646!important;max-width:min(94vw,780px)!important;padding:14px 18px!important;" +
      "border:1px solid rgba(139,124,255,.5)!important;border-radius:14px!important;" +
      "background:rgba(8,8,14,.94)!important;box-shadow:0 14px 48px rgba(0,0,0,.65)!important;" +
      "font:600 clamp(18px,3vw,28px)/1.5 system-ui!important;text-align:center!important;" +
      "pointer-events:none!important;backdrop-filter:blur(12px)!important;display:block!important;}" +
      "#rd-karaoke .rd-k-word{display:none;opacity:0;}" +
      "#rd-karaoke .rd-k-word.active{display:inline-block!important;opacity:1!important;color:#fff!important;" +
      "animation:rdWordIn .2s ease forwards;text-shadow:0 0 20px rgba(139,124,255,.95),0 0 8px rgba(255,255,255,.35)}" +
      "#rd-karaoke .rd-k-word.done{display:none!important;opacity:0!important;}" +
      "@keyframes rdWordIn{from{opacity:0;transform:translateY(8px) scale(.94)}to{opacity:1;transform:none}}" +
      "#rd-streak,#rd-orb-secret{display:none!important;}";
    document.head.appendChild(s);
  }

  function weightedWords(text) {
    return String(text || "").replace(/\s+/g, " ").trim().split(" ").filter(Boolean).map(function (word) {
      var core = word.replace(/[^\p{L}\p{N}]/gu, "");
      return { word: word, weight: Math.max(1, core.length) + (/[.!?]$/.test(word) ? 3 : /[,;:]$/.test(word) ? 1.4 : 0) };
    });
  }

  function showKaraoke(text, audioOrMs) {
    injectStyle();
    var words = weightedWords(text);
    var old = document.getElementById("rd-karaoke");
    if (old) old.remove();
    if (!words.length) return function () {};
    var box = document.createElement("div");
    box.id = "rd-karaoke";
    words.forEach(function (x) {
      var sp = document.createElement("span");
      sp.className = "rd-k-word";
      sp.textContent = x.word;
      box.appendChild(sp);
    });
    document.body.appendChild(box);
    var spans = [].slice.call(box.children);
    var totalW = words.reduce(function (n, x) { return n + x.weight; }, 0) || 1;
    var start = performance.now();
    var durationMs = typeof audioOrMs === "number" ? audioOrMs : Math.max(2800, words.length * 380);
    var raf = 0;
    var last = -1;

    function resolveDur() {
      if (audioOrMs && typeof audioOrMs === "object" && audioOrMs.duration && isFinite(audioOrMs.duration) && audioOrMs.duration > 0) {
        durationMs = audioOrMs.duration * 1000;
      }
    }
    function paint(active) {
      spans.forEach(function (sp, i) {
        if (i === active) sp.className = "rd-k-word active";
        else if (i < active) sp.className = "rd-k-word done";
        else sp.className = "rd-k-word";
      });
    }
    function tick() {
      resolveDur();
      var elapsed = performance.now() - start;
      if (audioOrMs && typeof audioOrMs === "object" && typeof audioOrMs.currentTime === "number") {
        elapsed = audioOrMs.currentTime * 1000;
      }
      var t = Math.min(0.999, elapsed / Math.max(1, durationMs));
      var acc = 0, active = 0;
      for (var i = 0; i < words.length; i++) {
        acc += words[i].weight;
        if (t * totalW >= acc) active = Math.min(words.length - 1, i + 1);
        else { active = i; break; }
      }
      if (active !== last) { last = active; paint(active); }
      if (t < 0.999 && !(audioOrMs && audioOrMs.ended)) raf = requestAnimationFrame(tick);
    }

    if (audioOrMs && typeof audioOrMs === "object" && typeof audioOrMs.addEventListener === "function") {
      var kicked = false;
      function kick() {
        if (kicked) return;
        kicked = true;
        resolveDur();
        start = performance.now();
        if (audioOrMs.currentTime) start = performance.now() - audioOrMs.currentTime * 1000;
        paint(0);
        raf = requestAnimationFrame(tick);
      }
      if (audioOrMs.readyState >= 1 && audioOrMs.duration) kick();
      else {
        audioOrMs.addEventListener("loadedmetadata", kick, { once: true });
        audioOrMs.addEventListener("playing", kick, { once: true });
        setTimeout(kick, 900);
      }
    } else {
      paint(0);
      raf = requestAnimationFrame(tick);
    }

    return function () {
      cancelAnimationFrame(raf);
      setTimeout(function () { if (box.parentNode) box.remove(); }, 250);
    };
  }

  window.rdShowKaraoke = showKaraoke;

  async function speakFishFixed(text) {
    var key = "";
    try { key = String((window.state && state.keys && state.keys.fish) || "").trim(); } catch (e) {}
    if (!key) {
      try {
        var el = document.getElementById("keyFish");
        if (el && el.value) key = String(el.value).trim();
      } catch (e2) {}
    }
    if (!key) return false;
    var id = "zeta";
    try {
      id = String((window.state && state.selectedVoice) || localStorage.getItem("rd_voice_character") || "zeta").toLowerCase().replace(/\s+/g, "-");
    } catch (e3) {}
    if (id === "vestia-zeta" || id === "vestia") id = "zeta";
    if (id === "koro" || id === "koro_sensei") id = "koro-sensei";
    var reference = REFS[id] || REFS.zeta;
    if (!reference) return false;

    var cleanText = String(text || "").replace(/[*_`#>\-]+/g, " ").replace(/\s+/g, " ").trim();
    if (!cleanText) return false;

    try {
      var res = await fetch("/api/fish-tts", {
        method: "POST",
        headers: { Authorization: "Bearer " + key, "Content-Type": "application/json" },
        body: JSON.stringify({
          text: cleanText.slice(0, 1200),
          reference_id: reference,
          model: "s2.1-pro-free"
        })
      });
      if (!res.ok) return false;
      var blob = await res.blob();
      var audio = new Audio(URL.createObjectURL(blob));
      await new Promise(function (resolve) {
        if (audio.readyState >= 1) return resolve();
        audio.addEventListener("loadedmetadata", resolve, { once: true });
        audio.addEventListener("error", resolve, { once: true });
        setTimeout(resolve, 1200);
      });
      var stop = showKaraoke(cleanText, audio);
      await new Promise(function (resolve, reject) {
        audio.onended = function () { stop(); resolve(); };
        audio.onerror = function () { stop(); reject(new Error("audio")); };
        var p = audio.play();
        if (p && p.catch) p.catch(function (err) { stop(); reject(err); });
      });
      return true;
    } catch (e) {
      return false;
    }
  }

  function patchSpeak() {
    window.speakFish = speakFishFixed;
    if (typeof window.rdSpeakOut === "function" && !window.rdSpeakOut.__rdFix111) {
      var prev = window.rdSpeakOut;
      window.rdSpeakOut = async function (text) {
        try { if (window.speechSynthesis) speechSynthesis.cancel(); } catch (e) {}
        if (await speakFishFixed(text)) return true;
        var t = String(text || "").replace(/[*_`#>\-]+/g, " ").replace(/\s+/g, " ").trim();
        if (!t || !window.speechSynthesis) return prev.apply(this, arguments);
        return new Promise(function (resolve) {
          var u = new SpeechSynthesisUtterance(t);
          u.lang = "id-ID";
          var est = Math.max(2800, t.split(/\s+/).length * 400);
          var stop = showKaraoke(t, est);
          u.onend = function () { stop(); resolve(true); };
          u.onerror = function () { stop(); resolve(false); };
          try { speechSynthesis.speak(u); } catch (e2) { stop(); resolve(false); }
        });
      };
      window.rdSpeakOut.__rdFix111 = true;
    }
  }

  patchSpeak();
  setInterval(patchSpeak, 2500);
  injectStyle();
  setInterval(function () {
    var se = document.getElementById("rd-streak"); if (se) se.remove();
    var o = document.getElementById("rd-orb-secret"); if (o) o.remove();
  }, 1200);
})();
