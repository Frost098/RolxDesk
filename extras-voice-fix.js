/* RD voice-fix v114 — HARD force Fish TTS, sync key, never silent Google */
(function () {
  if (window.__RD_VOICE_FIX_114__) return;
  window.__RD_VOICE_FIX_114__ = true;

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

  function toast(m, t) {
    if (typeof showToast === "function") showToast(m, t || "success");
    else console.log("[RD]", m);
  }

  function normId(id) {
    id = String(id || "zeta").toLowerCase().trim().replace(/\s+/g, "-");
    if (id === "vestia" || id === "vestia-zeta") return "zeta";
    if (id === "koro" || id === "koro_sensei" || id === "korosensei") return "koro-sensei";
    return id;
  }

  function currentRef() {
    var id = "zeta";
    try {
      id = normId((window.state && state.selectedVoice) || localStorage.getItem("rd_voice_character") || "zeta");
    } catch (e) {}
    if (id === "investigator") id = "zeta";
    var ref = REFS[id] || REFS.zeta;
    try {
      localStorage.setItem("rd_fish_reference", ref);
      localStorage.setItem("rd_voice_character", id);
    } catch (e2) {}
    return ref;
  }

  function syncFishKey() {
    var key = "";
    try {
      var el = document.getElementById("keyFish");
      if (el && el.value && el.value.trim()) key = el.value.trim();
    } catch (e) {}
    if (!key) {
      try { key = String(localStorage.getItem("rd_fish_key") || "").trim(); } catch (e2) {}
    }
    if (!key) {
      try { key = String((window.state && state.keys && state.keys.fish) || "").trim(); } catch (e3) {}
    }
    if (key) {
      try {
        if (!window.state) window.state = {};
        if (!state.keys) state.keys = {};
        state.keys.fish = key;
        localStorage.setItem("rd_fish_key", key);
        var el2 = document.getElementById("keyFish");
        if (el2 && !el2.value) el2.value = key;
      } catch (e4) {}
    }
    return key;
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
      "#rd-karaoke .rd-k-word{display:none;}" +
      "#rd-karaoke .rd-k-word.active{display:inline-block!important;color:#fff!important;animation:rdWordIn .18s ease forwards;text-shadow:0 0 20px rgba(139,124,255,.95)}" +
      "#rd-karaoke .rd-k-word.done{display:none!important;}" +
      "@keyframes rdWordIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}" +
      "#rd-streak,#rd-orb-secret{display:none!important;}" +
      "#rd-fish-status-bar{position:fixed;top:8px;left:50%;transform:translateX(-50%);z-index:99999;font:600 11px system-ui;" +
      "background:rgba(0,0,0,.75);color:#c4b5fd;padding:4px 10px;border-radius:999px;pointer-events:none;display:none}" +
      "#rd-fish-status-bar.show{display:block}";
    document.head.appendChild(s);
  }

  function statusBar(msg) {
    injectStyle();
    var el = document.getElementById("rd-fish-status-bar");
    if (!el) {
      el = document.createElement("div");
      el.id = "rd-fish-status-bar";
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(el.__t);
    el.__t = setTimeout(function () { el.classList.remove("show"); }, 4000);
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

  var speaking = false;
  async function speakFishForced(text) {
    syncFishKey();
    var key = syncFishKey();
    var t = cleanText(text);
    if (!t || speaking) return false;
    speaking = true;
    statusBar("Fish TTS…");
    try {
      var ref = currentRef();
      var headers = { "Content-Type": "application/json" };
      if (key) headers.Authorization = "Bearer " + key;
      var res = await fetch("/api/fish-tts", {
        method: "POST",
        headers: headers,
        body: JSON.stringify({ text: t.slice(0, 1200), reference_id: ref, model: "s2.1-pro-free" })
      });
      if (!res.ok) {
        var errJ = {};
        try { errJ = await res.json(); } catch (e) {}
        var msg = errJ.error || errJ.detail || ("HTTP " + res.status);
        statusBar("Fish gagal: " + String(msg).slice(0, 80));
        toast("Fish TTS gagal: " + String(msg).slice(0, 100), "error");
        speaking = false;
        return false;
      }
      var used = res.headers.get("X-RD-Fish-Model") || "fish";
      statusBar("Fish OK (" + used + ")");
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
      statusBar("Fish error: " + (e && e.message ? e.message : e));
      toast("Fish error: " + (e && e.message ? e.message : e), "error");
      speaking = false;
      return false;
    }
  }

  window.speakFish = speakFishForced;
  window.rdSpeakOut = speakFishForced;
  window.rdShowKaraoke = showKaraoke;

  if (!window.__RD_FETCH_FISH_114__) {
    window.__RD_FETCH_FISH_114__ = true;
    var _fetch = window.fetch.bind(window);
    window.fetch = async function (input, init) {
      var url = typeof input === "string" ? input : (input && input.url) || "";
      init = init || {};
      if (/\/api\/fish-tts\b/.test(url)) {
        syncFishKey();
        try {
          var body = {};
          if (typeof init.body === "string") body = JSON.parse(init.body || "{}");
          body.reference_id = currentRef();
          body.model = body.model || "s2.1-pro-free";
          body.text = cleanText(body.text || "").slice(0, 1200);
          var headers = Object.assign({}, init.headers || {}, { "Content-Type": "application/json" });
          var k = syncFishKey();
          if (k) headers.Authorization = "Bearer " + k;
          init = Object.assign({}, init, { method: "POST", body: JSON.stringify(body), headers: headers });
        } catch (e) {}
      }
      return _fetch(input, init);
    };
  }

  function patchSS() {
    if (!window.speechSynthesis || speechSynthesis.__rd114) return;
    var orig = speechSynthesis.speak.bind(speechSynthesis);
    speechSynthesis.speak = function (utterance) {
      var text = utterance && utterance.text ? String(utterance.text) : "";
      syncFishKey();
      if (text && text.length > 1) {
        try { speechSynthesis.cancel(); } catch (e) {}
        speakFishForced(text).then(function (ok) {
          if (!ok) { try { orig(utterance); } catch (e2) {} }
        });
        return;
      }
      return orig(utterance);
    };
    speechSynthesis.__rd114 = true;
  }
  patchSS();
  setInterval(patchSS, 1500);
  setInterval(syncFishKey, 1000);

  document.addEventListener("change", function (e) {
    if (e.target && e.target.id === "keyFish") {
      var v = (e.target.value || "").trim();
      if (v) {
        try {
          localStorage.setItem("rd_fish_key", v);
          if (!window.state) window.state = {};
          if (!state.keys) state.keys = {};
          state.keys.fish = v;
        } catch (err) {}
        toast("Fish key tersimpan", "success");
      }
    }
  });
  document.addEventListener("input", function (e) {
    if (e.target && e.target.id === "keyFish") {
      var v = (e.target.value || "").trim();
      if (v) {
        try {
          localStorage.setItem("rd_fish_key", v);
          if (window.state) {
            if (!state.keys) state.keys = {};
            state.keys.fish = v;
          }
        } catch (err) {}
      }
    }
  });

  setTimeout(function () {
    try {
      var saved = localStorage.getItem("rd_fish_key") || "";
      var el = document.getElementById("keyFish");
      if (saved && el && !el.value) el.value = saved;
      syncFishKey();
    } catch (e) {}
  }, 1500);

  injectStyle();
  syncFishKey();
  currentRef();
  console.log("[RD] voice-fix v114 active — Fish forced");
})();
