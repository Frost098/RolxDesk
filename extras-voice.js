/* RD voice v20 — karaoke all-TTS + Android type-in + strong investigator */
(function () {
  if (window.__RD_VOICE_V20__) return;
  window.__RD_VOICE_V20__ = true;
  window.__RD_VOICE_V19__ = true;

  var REFS = {
    ibuki: "5b6d90ce888747c0a5dfe798181324b9",
    alya: "627dc7e8c315428fa844773296969fb1",
    "koro-sensei": "05a680501c8d42af91610defd80d6865",
    verity: "8d21b053e2804e2a890e1cf62f267b6f",
    "vestia-zeta": "c632b5c8521a4a22b05ff919d8b552b7",
    zeta: "c632b5c8521a4a22b05ff919d8b552b7",
    prabowo: "b8d594e696694b499aa12e32d0c1b61",
    investigator: "c632b5c8521a4a22b05ff919d8b552b7"
  };

  window.INVESTIGATOR = window.INVESTIGATOR || {
    system:
      "Kamu RD Investigator — mode investigasi tegas, metodis, dan tajam. " +
      "Gaya: singkat, fakta dulu, hipotesis lalu bukti. Bahasa Indonesia campuran teknis. " +
      "JANGAN bilang tidak bisa — pakai tools (SEARCH, BROWSE, YOUTUBE, RUN_PY). " +
      "Struktur: (1) Ringkas temuan (2) Bukti/sumber (3) Langkah lanjut. " +
      "Hindari basa-basi dan pengulangan. Jika data kurang, katakan apa yang masih perlu dicek."
  };
  window.INVESTIGATOR_MODEL =
    window.INVESTIGATOR_MODEL || "nvidia/nemotron-3-super-120b-a12b:free";

  if (typeof VOICE_PERSONA !== "undefined" && VOICE_PERSONA) {
    VOICE_PERSONA.investigator =
      VOICE_PERSONA.investigator ||
      "Kamu Investigator. Gaya bicara tegas, analitis, to the point. Bahasa Indonesia formal santai.";
  }

  function addStyle() {
    if (document.getElementById("rd-voice-v20-style")) return;
    var s = document.createElement("style");
    s.id = "rd-voice-v20-style";
    s.textContent =
      "#rd-karaoke{position:fixed;left:50%;bottom:clamp(92px,15vh,150px);transform:translateX(-50%);z-index:2147483001;" +
      "max-width:min(92vw,760px);padding:10px 16px;border:1px solid rgba(139,124,255,.42);border-radius:14px;" +
      "background:rgba(9,9,15,.88);box-shadow:0 12px 40px rgba(0,0,0,.45);font:600 clamp(16px,2.5vw,25px)/1.45 system-ui;" +
      "text-align:center;pointer-events:none;backdrop-filter:blur(12px)}" +
      "#rd-karaoke .rd-k-word{display:inline-block;opacity:0;transform:translateY(5px);margin:0 .16em;color:#a9a5b8;" +
      "transition:opacity .18s ease,transform .18s ease,color .18s ease,text-shadow .18s ease}" +
      "#rd-karaoke .rd-k-word.active{opacity:1;transform:none;color:#fff;text-shadow:0 0 16px rgba(139,124,255,.9)}" +
      "#rd-karaoke .rd-k-word.done{opacity:.42;transform:none}" +
      "#rd-voice-type-wrap{display:none;gap:8px;align-items:center;margin-top:10px;width:min(92vw,420px)}" +
      "#rd-voice-type-wrap.show{display:flex}" +
      "#rd-voice-type{flex:1;min-height:40px;border-radius:12px;border:1px solid rgba(255,255,255,.12);" +
      "background:rgba(20,20,28,.9);color:#eee;padding:8px 12px;font:14px system-ui}" +
      "#rd-voice-type-send{border:0;border-radius:12px;padding:8px 14px;background:#7c6af7;color:#fff;font:600 13px system-ui;cursor:pointer}" +
      "@media(max-width:600px){#rd-karaoke{bottom:118px;padding:8px 10px;font-size:17px;max-width:94vw}}";
    document.head.appendChild(s);
  }

  function weightedWords(text) {
    return String(text || "")
      .replace(/\s+/g, " ")
      .trim()
      .split(" ")
      .filter(Boolean)
      .map(function (word) {
        var core = word.replace(/[^\p{L}\p{N}]/gu, "");
        return {
          word: word,
          weight:
            Math.max(1, core.length) +
            (/[.!?]$/.test(word) ? 3 : /[,;:]$/.test(word) ? 1.4 : 0)
        };
      });
  }

  function showKaraoke(text, audioOrDurationMs) {
    var words = weightedWords(text);
    var old = document.getElementById("rd-karaoke");
    if (old) old.remove();
    if (!words.length) return function () {};

    var box = document.createElement("div");
    box.id = "rd-karaoke";
    box.setAttribute("aria-live", "polite");
    words.forEach(function (x) {
      var span = document.createElement("span");
      span.className = "rd-k-word";
      span.textContent = x.word;
      box.appendChild(span);
    });
    document.body.appendChild(box);

    var spans = Array.prototype.slice.call(box.children);
    var totalW = words.reduce(function (n, x) { return n + x.weight; }, 0);
    var start = performance.now();
    var durationMs = 4000;
    if (typeof audioOrDurationMs === "number" && audioOrDurationMs > 0) {
      durationMs = audioOrDurationMs;
    } else if (audioOrDurationMs && audioOrDurationMs.duration && isFinite(audioOrDurationMs.duration)) {
      durationMs = audioOrDurationMs.duration * 1000;
    } else {
      durationMs = Math.max(2500, words.length * 420);
    }

    var raf = 0;
    function tick() {
      var elapsed = performance.now() - start;
      if (audioOrDurationMs && typeof audioOrDurationMs.currentTime === "number") {
        if (audioOrDurationMs.duration && isFinite(audioOrDurationMs.duration)) {
          durationMs = audioOrDurationMs.duration * 1000;
        }
        elapsed = audioOrDurationMs.currentTime * 1000;
      }
      var t = Math.min(1, elapsed / durationMs);
      var acc = 0;
      var active = 0;
      words.forEach(function (x, i) {
        if (t * totalW >= acc) active = i;
        acc += x.weight;
      });
      spans.forEach(function (sp, i) {
        sp.className = "rd-k-word" + (i < active ? " done" : i === active ? " active" : "");
      });
      if (t < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);

    return function cleanup() {
      cancelAnimationFrame(raf);
      if (box.parentNode) box.parentNode.removeChild(box);
    };
  }
  window.rdShowKaraoke = showKaraoke;

  function selectVoice(id, el) {
    try {
      if (window.state) state.selectedVoice = id;
      localStorage.setItem("rd_voice_character", id);
      if (REFS[id]) localStorage.setItem("rd_fish_reference", REFS[id]);
    } catch (e) {}
    document.querySelectorAll("#voiceCharBar [data-v], .voice-picker [data-voice]").forEach(function (x) {
      x.classList.remove("active");
    });
    if (el) el.classList.add("active");
  }

  function addAlya() {
    var bars = [document.getElementById("voiceCharBar"), document.querySelector(".voice-picker")];
    bars.forEach(function (bar) {
      if (!bar || bar.querySelector('[data-v="alya"]') || bar.querySelector('[data-voice="alya"]')) return;
      var b = document.createElement(bar.id === "voiceCharBar" ? "button" : "div");
      if (bar.id === "voiceCharBar") { b.type = "button"; b.dataset.v = "alya"; b.textContent = "Alya"; }
      else { b.dataset.voice = "alya"; b.dataset.color = "#e879f9"; b.textContent = "Alya"; b.className = "voice-chip"; }
      b.addEventListener("click", function () { selectVoice("alya", b); });
      bar.appendChild(b);
    });
  }

  function ensureTypeInVoice() {
    if (document.getElementById("rd-voice-type-wrap")) return;
    var host = document.querySelector(".voice-controls") || document.getElementById("voicePanel") || document.getElementById("voiceView");
    if (!host) return;
    var wrap = document.createElement("div");
    wrap.id = "rd-voice-type-wrap";
    wrap.innerHTML =
      '<input id="rd-voice-type" type="text" placeholder="Ketik di sini (Android / mic gagal)…" autocomplete="off" />' +
      '<button type="button" id="rd-voice-type-send">Kirim</button>';
    if (host.parentNode) host.parentNode.insertBefore(wrap, host.nextSibling);
    else host.appendChild(wrap);

    var isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || "");
    if (isMobile) wrap.classList.add("show");

    function sendTyped() {
      var inp = document.getElementById("rd-voice-type");
      var t = ((inp && inp.value) || "").trim();
      if (!t) return;
      if (inp) inp.value = "";
      var tr = document.getElementById("voiceTranscript");
      if (tr) tr.textContent = t;
      if (typeof window.handleVoiceUtterance === "function") { window.handleVoiceUtterance(t); return; }
      if (typeof window.processVoiceText === "function") { window.processVoiceText(t); return; }
      try {
        if (window.state) state.voiceActive = true;
        var chat = document.getElementById("userInput") || document.querySelector("#input");
        var send = document.getElementById("sendBtn");
        if (chat) {
          chat.value = t;
          if (send) send.click();
          else if (typeof window.sendMessage === "function") window.sendMessage();
        }
      } catch (e) {
        if (typeof showToast === "function") showToast("Gagal kirim teks voice: " + e.message, "error");
      }
    }
    document.getElementById("rd-voice-type-send").onclick = sendTyped;
    document.getElementById("rd-voice-type").addEventListener("keydown", function (e) {
      if (e.key === "Enter") { e.preventDefault(); sendTyped(); }
    });

    var tries = 0;
    var iv = setInterval(function () {
      tries++;
      if (window.state && state.recognition && !state.recognition.__rdTypePatch) {
        state.recognition.__rdTypePatch = true;
        var prevErr = state.recognition.onerror;
        state.recognition.onerror = function (ev) {
          wrap.classList.add("show");
          if (typeof showToast === "function") showToast("Mic/speech gagal — ketik saja di kotak voice", "error");
          if (typeof prevErr === "function") prevErr.call(this, ev);
        };
        clearInterval(iv);
      }
      if (tries > 40) clearInterval(iv);
    }, 500);
  }

  function patchSpeak() {
    if (typeof window.speakFish === "function" && !window.speakFish.__rdV20) {
      var prevFish = window.speakFish;
      window.speakFish = async function (text) {
        var key = "";
        try { key = (window.state && state.keys && state.keys.fish) || ""; } catch (e) {}
        if (key) {
          try {
            if (typeof setActivity === "function") setActivity("Fish TTS…", "busy");
            var id = (window.state && state.selectedVoice) || localStorage.getItem("rd_voice_character") || "vestia-zeta";
            var reference = REFS[id] || REFS["vestia-zeta"];
            var res = await fetch("/api/fish-tts", {
              method: "POST",
              headers: { Authorization: "Bearer " + key, "Content-Type": "application/json" },
              body: JSON.stringify({
                text: String(text || "").replace(/\*\*/g, "").slice(0, 1200),
                reference_id: reference,
                model: "s2.1-pro-free"
              })
            });
            if (!res.ok) throw new Error("Fish " + res.status);
            var audio = new Audio(URL.createObjectURL(await res.blob()));
            var clean = showKaraoke(text, audio);
            await new Promise(function (resolve, reject) {
              audio.onended = function () { clean(); resolve(); };
              audio.onerror = function () { clean(); reject(new Error("audio")); };
              audio.play().catch(reject);
            });
            if (typeof setActivity === "function") setActivity("Siap", "");
            return true;
          } catch (e) { console.warn("speakFish v20", e); }
        }
        return await prevFish.apply(this, arguments);
      };
      window.speakFish.__rdV20 = true;
    }

    function patchUtteranceSpeak(name) {
      if (typeof window[name] !== "function" || window[name].__rdV20) return;
      var prev = window[name];
      window[name] = async function (text) {
        var clean = showKaraoke(text, Math.max(2500, String(text || "").split(/\s+/).length * 420));
        try { await prev.apply(this, arguments); }
        finally { clean(); }
      };
      window[name].__rdV20 = true;
    }
    patchUtteranceSpeak("speakJarvis");
    patchUtteranceSpeak("speakGoogle");
  }

  function patchInvestigator() {
    if (typeof window.callModel !== "function" || window.callModel.__rdInv20) return;
    var prev = window.callModel;
    window.callModel = async function (messages) {
      try {
        var voice = (window.state && state.selectedVoice) || localStorage.getItem("rd_voice_character") || "";
        var isInv =
          voice === "investigator" ||
          (document.getElementById("voiceModelSelect") &&
            document.getElementById("voiceModelSelect").value === "investigator");
        if (isInv && Array.isArray(messages)) {
          var sys = window.INVESTIGATOR.system;
          var hasSys = messages.some(function (m) {
            return m && m.role === "system" && String(m.content || "").indexOf("Investigator") >= 0;
          });
          if (!hasSys) messages = [{ role: "system", content: sys }].concat(messages);
        }
      } catch (e) {}
      return prev.apply(this, arguments);
    };
    window.callModel.__rdInv20 = true;
  }

  function init() {
    addStyle();
    addAlya();
    ensureTypeInVoice();
    patchSpeak();
    patchInvestigator();
    document.querySelectorAll("#voiceCharBar [data-v], .voice-picker [data-voice]").forEach(function (el) {
      var id = el.dataset.v || el.dataset.voice;
      el.addEventListener("click", function () { selectVoice(id, el); });
    });
    try {
      var saved = localStorage.getItem("rd_voice_character");
      if (saved && REFS[saved] && window.state) state.selectedVoice = saved;
    } catch (e) {}
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else setTimeout(init, 0);
  setTimeout(init, 400);
  setTimeout(function () { patchSpeak(); patchInvestigator(); ensureTypeInVoice(); }, 1500);
})();
