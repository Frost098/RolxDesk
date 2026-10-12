/* RD voice-fix v115 — Astra-style Fish (server key) + one-word karaoke only */
(function () {
  if (window.__RD_VOICE_FIX_115__) return;
  window.__RD_VOICE_FIX_115__ = true;

  var REFS = {
    ibuki: "5b6d90ce888747c0a5dfe798181324b9",
    alya: "627dc7e8c315428fa844773296969fb1",
    "koro-sensei": "05a680501c8d42af91610defd80d6865",
    korosensei: "05a680501c8d42af91610defd80d6865",
    verity: "8d21b053e2804e2a890e1cf62f267b6f",
    "vestia-zeta": "c632b5c8521a4a22b05ff919d8b552b7",
    zeta: "c632b5c8521a4a22b05ff919d8b552b7",
    vestia: "c632b5c8521a4a22b05ff919d8b552b7",
    prabowo: "b8d594e696694b499aa12e32d0c1b61"
  };

  function toast(m, t) {
    if (typeof showToast === "function") showToast(m, t || "success");
  }

  function normId(id) {
    id = String(id || "zeta").toLowerCase().trim().replace(/\s+/g, "-");
    if (id === "vestia-zeta") return "zeta";
    if (id === "koro" || id === "koro_sensei" || id === "korosensei") return "koro-sensei";
    if (id === "investigator") return "zeta";
    return id;
  }

  function currentRef() {
    var id = "zeta";
    try {
      id = normId((window.state && state.selectedVoice) || localStorage.getItem("rd_voice_character") || "zeta");
    } catch (e) {}
    try {
      var chip = document.querySelector("#voiceCharBar .voice-chip.active, #voiceCharBar [data-v].active");
      if (chip) {
        var d = chip.getAttribute("data-v") || chip.getAttribute("data-voice") || chip.textContent;
        if (d) id = normId(d);
      }
    } catch (e2) {}
    var ref = REFS[id] || REFS.zeta;
    try {
      localStorage.setItem("rd_fish_reference", ref);
      localStorage.setItem("rd_voice_character", id);
      if (window.state) state.selectedVoice = id;
    } catch (e3) {}
    return ref;
  }

  function syncFishKey() {
    var key = "";
    try {
      var el = document.getElementById("keyFish");
      if (el && el.value.trim()) key = el.value.trim();
    } catch (e) {}
    if (!key) try { key = String(localStorage.getItem("rd_fish_key") || "").trim(); } catch (e2) {}
    if (!key) try { key = String((window.state && state.keys && state.keys.fish) || "").trim(); } catch (e3) {}
    if (key) {
      try {
        if (!window.state) window.state = {};
        if (!state.keys) state.keys = {};
        state.keys.fish = key;
        localStorage.setItem("rd_fish_key", key);
      } catch (e4) {}
    }
    return key;
  }

  function cleanText(t) {
    return String(t || "").replace(/```[\s\S]*?```/g, " ").replace(/[*_~`#>]/g, " ").replace(/\([^)]*\)/g, " ").replace(/\s+/g, " ").trim();
  }

  function injectStyle() {
    ["rd-voice-v23-style", "rd-voice-v25-style", "rd-voice-v26-style", "rd-voice-v115-style"].forEach(function (id) {
      var n = document.getElementById(id);
      if (n) n.remove();
    });
    var s = document.createElement("style");
    s.id = "rd-voice-v115-style";
    s.textContent =
      "#rd-karaoke{position:fixed!important;left:50%!important;bottom:clamp(100px,16vh,160px)!important;" +
      "transform:translateX(-50%)!important;z-index:2147483646!important;max-width:min(92vw,420px)!important;" +
      "padding:16px 20px!important;border:1px solid rgba(139,124,255,.55)!important;border-radius:16px!important;" +
      "background:rgba(8,8,14,.95)!important;box-shadow:0 16px 50px rgba(0,0,0,.65)!important;" +
      "font:700 clamp(20px,4.2vw,30px)/1.35 system-ui!important;text-align:center!important;" +
      "pointer-events:none!important;display:block!important;min-height:1.4em;}" +
      "#rd-karaoke .rd-k-word{display:none!important;opacity:0!important;visibility:hidden!important;" +
      "width:0!important;height:0!important;overflow:hidden!important;margin:0!important;padding:0!important;}" +
      "#rd-karaoke .rd-k-word.active{display:inline!important;opacity:1!important;visibility:visible!important;" +
      "width:auto!important;height:auto!important;color:#fff!important;" +
      "text-shadow:0 0 22px rgba(139,124,255,.95),0 0 6px rgba(255,255,255,.4)!important;" +
      "animation:rdWordIn .16s ease forwards!important;}" +
      "#rd-karaoke .rd-k-word.done{display:none!important;opacity:0!important;visibility:hidden!important;}" +
      "@keyframes rdWordIn{from{opacity:0;transform:translateY(10px) scale(.92)}to{opacity:1;transform:none}}" +
      "body.rd-fish-speaking #voiceTranscript{opacity:0!important;height:0!important;min-height:0!important;overflow:hidden!important;margin:0!important;}" +
      "#rd-streak,#rd-orb-secret{display:none!important;}" +
      "#rd-fish-status-bar{position:fixed;top:8px;left:50%;transform:translateX(-50%);z-index:99999;font:600 11px system-ui;" +
      "background:rgba(0,0,0,.8);color:#c4b5fd;padding:5px 12px;border-radius:999px;pointer-events:none;display:none}" +
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
    el.__t = setTimeout(function () { el.classList.remove("show"); }, 4500);
  }

  function showKaraoke(text, audioOrMs) {
    injectStyle();
    document.body.classList.add("rd-fish-speaking");
    var words = cleanText(text).split(" ").filter(Boolean);
    var old = document.getElementById("rd-karaoke");
    if (old) old.remove();
    if (!words.length) return function () { document.body.classList.remove("rd-fish-speaking"); };
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
      return Math.max(1, w.replace(/[^\p{L}\p{N}]/gu, "").length) + (/[.!?]$/.test(w) ? 2.5 : 0);
    });
    var totalW = weights.reduce(function (a, b) { return a + b; }, 0) || 1;
    var start = performance.now();
    var durationMs = typeof audioOrMs === "number" ? audioOrMs : Math.max(2200, words.length * 340);
    var raf = 0, last = -1;
    function dur() {
      if (audioOrMs && typeof audioOrMs === "object" && audioOrMs.duration > 0 && isFinite(audioOrMs.duration))
        durationMs = audioOrMs.duration * 1000;
    }
    function paint(i) {
      for (var k = 0; k < spans.length; k++)
        spans[k].className = k === i ? "rd-k-word active" : k < i ? "rd-k-word done" : "rd-k-word";
    }
    function tick() {
      dur();
      var elapsed = performance.now() - start;
      if (audioOrMs && typeof audioOrMs === "object" && typeof audioOrMs.currentTime === "number")
        elapsed = audioOrMs.currentTime * 1000;
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
        setTimeout(kick, 600);
      }
    } else {
      paint(0);
      raf = requestAnimationFrame(tick);
    }
    return function () {
      cancelAnimationFrame(raf);
      document.body.classList.remove("rd-fish-speaking");
      setTimeout(function () { if (box.parentNode) box.remove(); }, 180);
    };
  }

  var speaking = false;
  async function speakFishForced(text) {
    var t = cleanText(text);
    if (!t || speaking) return false;
    speaking = true;
    injectStyle();
    statusBar("Fish TTS…");
    try {
      var tr = document.getElementById("voiceTranscript");
      if (tr) tr.textContent = "";
    } catch (e) {}
    try {
      var key = syncFishKey();
      var ref = currentRef();
      var headers = { "Content-Type": "application/json" };
      if (key) headers.Authorization = "Bearer " + key;
      var res = await fetch("/api/fish-tts", {
        method: "POST",
        headers: headers,
        body: JSON.stringify({ text: t.slice(0, 3000), reference_id: ref, format: "mp3", model: "s2.1-pro-free" })
      });
      if (!res.ok) {
        var errJ = {};
        try { errJ = await res.json(); } catch (e2) {}
        var msg = errJ.error || errJ.detail || ("HTTP " + res.status);
        statusBar("Fish gagal: " + String(msg).slice(0, 90));
        toast("Fish gagal: " + String(msg).slice(0, 120), "error");
        speaking = false;
        return false;
      }
      statusBar("Fish OK · " + (res.headers.get("X-RD-Fish-Model") || "fish"));
      var blob = await res.blob();
      if (!blob.size) { statusBar("Fish: audio kosong"); speaking = false; return false; }
      var audio = new Audio(URL.createObjectURL(blob));
      await new Promise(function (resolve) {
        if (audio.readyState >= 1) return resolve();
        audio.addEventListener("loadedmetadata", resolve, { once: true });
        setTimeout(resolve, 900);
      });
      var stop = showKaraoke(t, audio);
      await new Promise(function (resolve, reject) {
        audio.onended = function () { stop(); resolve(); };
        audio.onerror = function () { stop(); reject(new Error("play fail")); };
        var p = audio.play();
        if (p && p.catch) p.catch(reject);
      });
      speaking = false;
      return true;
    } catch (e) {
      statusBar("Fish error: " + (e && e.message ? e.message : e));
      toast("Fish error: " + (e && e.message ? e.message : e), "error");
      speaking = false;
      document.body.classList.remove("rd-fish-speaking");
      return false;
    }
  }

  window.speakFish = speakFishForced;
  window.rdSpeakOut = speakFishForced;
  window.rdShowKaraoke = showKaraoke;

  if (!window.__RD_FETCH_FISH_115__) {
    window.__RD_FETCH_FISH_115__ = true;
    var _fetch = window.fetch.bind(window);
    window.fetch = async function (input, init) {
      var url = typeof input === "string" ? input : (input && input.url) || "";
      init = init || {};
      if (/\/api\/fish-tts\b/.test(url)) {
        try {
          var body = {};
          if (typeof init.body === "string") body = JSON.parse(init.body || "{}");
          body.reference_id = currentRef();
          body.format = "mp3";
          body.text = cleanText(body.text || "").slice(0, 3000);
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
    if (!window.speechSynthesis || speechSynthesis.__rd115) return;
    var orig = speechSynthesis.speak.bind(speechSynthesis);
    speechSynthesis.speak = function (utterance) {
      var text = utterance && utterance.text ? String(utterance.text) : "";
      if (text && text.length > 1) {
        try { speechSynthesis.cancel(); } catch (e) {}
        speakFishForced(text).then(function (ok) {
          if (!ok) {
            statusBar("Fallback browser TTS (Fish gagal)");
            try { orig(utterance); } catch (e2) {}
          }
        });
        return;
      }
      return orig(utterance);
    };
    speechSynthesis.__rd115 = true;
  }
  patchSS();
  setInterval(patchSS, 1200);
  setInterval(function () { syncFishKey(); injectStyle(); }, 2000);

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

  injectStyle();
  syncFishKey();
  currentRef();
  console.log("[RD] voice-fix v115 — Astra-style Fish + one-word karaoke");
})();
