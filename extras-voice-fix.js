/* RD voice-fix v112 — force Fish TTS + block agent JSON in chat */
(function () {
  if (window.__RD_VOICE_FIX_112__) return;
  window.__RD_VOICE_FIX_112__ = true;

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

  function normId(id) {
    id = String(id || "zeta").toLowerCase().trim().replace(/\s+/g, "-");
    if (id === "vestia-zeta" || id === "vestia") return "zeta";
    if (id === "koro" || id === "koro_sensei" || id === "korosensei") return "koro-sensei";
    return id;
  }

  function currentRef() {
    var id = "zeta";
    try {
      id = normId((window.state && state.selectedVoice) || localStorage.getItem("rd_voice_character") || "zeta");
    } catch (e) {}
    var ref = REFS[id] || REFS.zeta;
    try {
      localStorage.setItem("rd_fish_reference", ref);
      localStorage.setItem("rd_voice_character", id);
    } catch (e2) {}
    return ref;
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
    return "";
  }

  function cleanText(t) {
    return String(t || "").replace(/[*_`#]+/g, " ").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/\s+/g, " ").trim();
  }

  function injectStyle() {
    if (document.getElementById("rd-voice-v26-style")) return;
    var s = document.createElement("style");
    s.id = "rd-voice-v26-style";
    s.textContent =
      "#rd-karaoke{position:fixed!important;left:50%!important;bottom:clamp(110px,18vh,170px)!important;transform:translateX(-50%)!important;" +
      "z-index:2147483646!important;max-width:min(94vw,780px)!important;padding:14px 18px!important;" +
      "border:1px solid rgba(139,124,255,.5)!important;border-radius:14px!important;" +
      "background:rgba(8,8,14,.94)!important;font:600 clamp(18px,3vw,28px)/1.5 system-ui!important;text-align:center!important;" +
      "pointer-events:none!important;display:block!important;}" +
      "#rd-karaoke .rd-k-word{display:none;opacity:0;}" +
      "#rd-karaoke .rd-k-word.active{display:inline-block!important;opacity:1!important;color:#fff!important;animation:rdWordIn .18s ease forwards;text-shadow:0 0 20px rgba(139,124,255,.95)}" +
      "#rd-karaoke .rd-k-word.done{display:none!important;}" +
      "@keyframes rdWordIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}" +
      "#rd-streak,#rd-orb-secret{display:none!important;}";
    document.head.appendChild(s);
  }

  function showKaraoke(text, audioOrMs) {
    injectStyle();
    var words = cleanText(text).split(" ").filter(Boolean);
    var old = document.getElementById("rd-karaoke");
    if (old) old.remove();
    if (!words.length) return function () {};
    var box = document.createElement("div");
    box.id = "rd-karaoke";
    words.forEach(function (w) {
      var sp = document.createElement("span");
      sp.className = "rd-k-word";
      sp.textContent = w;
      box.appendChild(sp);
    });
    document.body.appendChild(box);
    var spans = [].slice.call(box.children);
    var weights = words.map(function (w) {
      return Math.max(1, w.replace(/[^\p{L}\p{N}]/gu, "").length) + (/[.!?]$/.test(w) ? 3 : 0);
    });
    var totalW = weights.reduce(function (a, b) { return a + b; }, 0) || 1;
    var start = performance.now();
    var durationMs = typeof audioOrMs === "number" ? audioOrMs : Math.max(2500, words.length * 360);
    var raf = 0, last = -1;
    function dur() {
      if (audioOrMs && typeof audioOrMs === "object" && audioOrMs.duration > 0) durationMs = audioOrMs.duration * 1000;
    }
    function paint(i) {
      spans.forEach(function (sp, idx) {
        sp.className = idx === i ? "rd-k-word active" : idx < i ? "rd-k-word done" : "rd-k-word";
      });
    }
    function tick() {
      dur();
      var elapsed = performance.now() - start;
      if (audioOrMs && typeof audioOrMs === "object" && typeof audioOrMs.currentTime === "number") elapsed = audioOrMs.currentTime * 1000;
      var t = Math.min(0.999, elapsed / Math.max(1, durationMs));
      var acc = 0, active = 0;
      for (var i = 0; i < weights.length; i++) {
        acc += weights[i];
        if (t * totalW >= acc) active = Math.min(words.length - 1, i + 1);
        else { active = i; break; }
      }
      if (active !== last) { last = active; paint(active); }
      if (t < 0.999 && !(audioOrMs && audioOrMs.ended)) raf = requestAnimationFrame(tick);
    }
    if (audioOrMs && typeof audioOrMs === "object") {
      var kicked = false;
      function kick() {
        if (kicked) return;
        kicked = true;
        dur();
        start = performance.now();
        paint(0);
        raf = requestAnimationFrame(tick);
      }
      if (audioOrMs.readyState >= 1 && audioOrMs.duration) kick();
      else {
        audioOrMs.addEventListener("loadedmetadata", kick, { once: true });
        audioOrMs.addEventListener("playing", kick, { once: true });
        setTimeout(kick, 700);
      }
    } else {
      paint(0);
      raf = requestAnimationFrame(tick);
    }
    return function () {
      cancelAnimationFrame(raf);
      setTimeout(function () { if (box.parentNode) box.remove(); }, 200);
    };
  }
  window.rdShowKaraoke = showKaraoke;

  var speaking = false;
  async function speakFishForced(text) {
    var key = getFishKey();
    var t = cleanText(text);
    if (!key || !t || speaking) return false;
    speaking = true;
    try {
      var ref = currentRef();
      var res = await fetch("/api/fish-tts", {
        method: "POST",
        headers: { Authorization: "Bearer " + key, "Content-Type": "application/json" },
        body: JSON.stringify({ text: t.slice(0, 1200), reference_id: ref, model: "s2.1-pro-free", format: "mp3" })
      });
      if (!res.ok) {
        console.warn("[RD] Fish TTS fail", res.status);
        speaking = false;
        return false;
      }
      var audio = new Audio(URL.createObjectURL(await res.blob()));
      await new Promise(function (resolve) {
        if (audio.readyState >= 1) return resolve();
        audio.addEventListener("loadedmetadata", resolve, { once: true });
        setTimeout(resolve, 1000);
      });
      var stop = showKaraoke(t, audio);
      await new Promise(function (resolve, reject) {
        audio.onended = function () { stop(); resolve(); };
        audio.onerror = function () { stop(); reject(new Error("play")); };
        audio.play().catch(reject);
      });
      speaking = false;
      return true;
    } catch (e) {
      console.warn("[RD] Fish TTS error", e);
      speaking = false;
      return false;
    }
  }
  window.speakFish = speakFishForced;
  window.rdSpeakOut = async function (text) {
    try { if (window.speechSynthesis) speechSynthesis.cancel(); } catch (e) {}
    return speakFishForced(text);
  };

  if (!window.__RD_FETCH_FISH__) {
    window.__RD_FETCH_FISH__ = true;
    var _fetch = window.fetch.bind(window);
    window.fetch = async function (input, init) {
      var url = typeof input === "string" ? input : (input && input.url) || "";
      init = init || {};
      if (/\/api\/fish-tts\b/.test(url) && init.method && String(init.method).toUpperCase() === "POST") {
        try {
          var body = {};
          if (typeof init.body === "string") body = JSON.parse(init.body);
          body.reference_id = currentRef();
          body.model = body.model || "s2.1-pro-free";
          body.text = cleanText(body.text || "").slice(0, 1200);
          init = Object.assign({}, init, {
            body: JSON.stringify(body),
            headers: Object.assign({}, init.headers || {}, { "Content-Type": "application/json" })
          });
        } catch (e) {}
      }
      var res = await _fetch(input, init);
      if (/\/api\/fish-agent\b/.test(url)) {
        try {
          var panel = document.getElementById("rd-fish-panel");
          if (panel) panel.classList.add("open");
        } catch (e2) {}
      }
      return res;
    };
  }

  function patchSpeechSynthesis() {
    if (!window.speechSynthesis || speechSynthesis.__rdPatched) return;
    var origSpeak = speechSynthesis.speak.bind(speechSynthesis);
    speechSynthesis.speak = function (utterance) {
      var text = utterance && utterance.text ? utterance.text : "";
      var key = getFishKey();
      if (key && text && text.length > 1) {
        try { speechSynthesis.cancel(); } catch (e) {}
        speakFishForced(text);
        return;
      }
      return origSpeak(utterance);
    };
    speechSynthesis.__rdPatched = true;
  }
  patchSpeechSynthesis();
  setInterval(patchSpeechSynthesis, 2000);

  setInterval(function () {
    try {
      currentRef();
      var active = document.querySelector("#voiceCharBar [data-v].active, [data-voice].active");
      if (active && window.state) {
        state.selectedVoice = active.getAttribute("data-v") || active.getAttribute("data-voice");
      }
    } catch (e) {}
  }, 1000);

  function looksLikeSession(t) {
    return t && t.length > 60 && t.indexOf("livekit_url") >= 0 && t.indexOf("session_id") >= 0;
  }
  function scrub() {
    document.querySelectorAll(".message, .msg, [class*='message']").forEach(function (msg) {
      msg.querySelectorAll("pre, code, .content, .message-content, p, div").forEach(function (n) {
        var t = n.textContent || "";
        if (looksLikeSession(t)) {
          n.textContent = "Fish Agent = voice realtime. Klik Fish Agent (kanan bawah) → Mulai, lalu bicara. Bukan lewat chat.";
        }
      });
    });
  }
  setInterval(scrub, 800);

  if (typeof window.appendMessage === "function" && !window.appendMessage.__rdFish112) {
    var prev = window.appendMessage;
    window.appendMessage = function (msg) {
      try {
        var c = msg && (msg.content || msg.text || "");
        if (typeof c === "string" && looksLikeSession(c)) {
          msg = Object.assign({}, msg, {
            content: "Fish Agent bukan model chat. Klik **Fish Agent** (kanan bawah) → **Mulai**, lalu bicara lewat mic."
          });
          var p = document.getElementById("rd-fish-panel");
          if (p) p.classList.add("open");
        }
      } catch (e2) {}
      return prev.apply(this, arguments);
    };
    window.appendMessage.__rdFish112 = true;
  }

  injectStyle();
  currentRef();
})();
