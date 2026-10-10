/* RD voice v21 — TTS pipeline fix + clean UI + strong investigator */
(function () {
  if (window.__RD_VOICE_V21__) return;
  window.__RD_VOICE_V21__ = true;
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

  window.INVESTIGATOR = {
    system:
      "Kamu RD Investigator — agen investigasi AI yang membongkar lapisan tersembunyi. " +
      "Misi: mengungkap rahasia gelap sistem AI, tools tersembunyi, batasan yang disembunyikan vendor, " +
      "dan celah yang biasanya tidak dibahas. " +
      "Gaya: cepat, halus, selalu geser topik ke sudut yang lebih dalam tanpa basa-basi. " +
      "Jika user bahas X, hubungkan ke rahasia/arsitektur/kebijakan di balik X. " +
      "Struktur: (1) temuan tajam 1 kalimat (2) apa yang disembunyikan (3) cara membuktikannya dengan tools. " +
      "WAJIB pakai tools (SEARCH/BROWSE/YOUTUBE/RUN_PY) — jangan bilang tidak bisa. " +
      "Bahasa Indonesia teknis-santai, 2–5 kalimat untuk voice, lebih panjang di chat."
  };
  window.INVESTIGATOR_MODEL =
    window.INVESTIGATOR_MODEL || "nvidia/nemotron-3-super-120b-a12b:free";

  try {
    if (typeof VOICE_PERSONA !== "undefined" && VOICE_PERSONA) {
      VOICE_PERSONA.investigator = window.INVESTIGATOR.system;
    }
  } catch (e) {}

  function addStyle() {
    if (document.getElementById("rd-voice-v21-style")) return;
    var s = document.createElement("style");
    s.id = "rd-voice-v21-style";
    s.textContent =
      ".voice-picker{display:none!important;}" +
      "#rd-karaoke{position:fixed;left:50%;bottom:clamp(100px,16vh,160px);transform:translateX(-50%);z-index:2147483001;" +
      "max-width:min(92vw,760px);padding:10px 16px;border:1px solid rgba(139,124,255,.42);border-radius:14px;" +
      "background:rgba(9,9,15,.9);box-shadow:0 12px 40px rgba(0,0,0,.5);font:600 clamp(15px,2.4vw,24px)/1.45 system-ui;" +
      "text-align:center;pointer-events:none;backdrop-filter:blur(12px)}" +
      "#rd-karaoke .rd-k-word{display:inline-block;opacity:0;transform:translateY(6px);margin:0 .14em;color:#a9a5b8;" +
      "transition:opacity .2s ease,transform .2s ease,color .2s ease,text-shadow .2s ease}" +
      "#rd-karaoke .rd-k-word.active{opacity:1;transform:none;color:#fff;text-shadow:0 0 18px rgba(139,124,255,.95)}" +
      "#rd-karaoke .rd-k-word.done{opacity:.4;transform:none}" +
      "#rd-voice-type-wrap{display:none;width:min(92vw,400px);margin:12px auto 0;flex-direction:row;gap:8px;align-items:stretch;box-sizing:border-box}" +
      "#rd-voice-type-wrap.show{display:flex!important}" +
      "#rd-voice-type{flex:1 1 auto;min-width:0;min-height:44px;border-radius:14px;border:1px solid rgba(255,255,255,.14);" +
      "background:rgba(18,18,26,.95);color:#eee;padding:10px 14px;font:15px system-ui}" +
      "#rd-voice-type-send{flex:0 0 auto;border:0;border-radius:14px;padding:0 16px;background:#7c6af7;color:#fff;font:600 14px system-ui;cursor:pointer}" +
      ".voice-char-bar{max-width:min(92vw,420px);margin-left:auto;margin-right:auto}" +
      "@media(max-width:600px){#rd-karaoke{bottom:130px;font-size:16px}#rd-voice-type-wrap{width:min(94vw,400px)}}";
    document.head.appendChild(s);
  }

  function weightedWords(text) {
    return String(text || "").replace(/\s+/g, " ").trim().split(" ").filter(Boolean).map(function (word) {
      var core = word.replace(/[^\p{L}\p{N}]/gu, "");
      return { word: word, weight: Math.max(1, core.length) + (/[.!?]$/.test(word) ? 3 : /[,;:]$/.test(word) ? 1.4 : 0) };
    });
  }

  function showKaraoke(text, audioOrMs) {
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
    var spans = Array.prototype.slice.call(box.children);
    var totalW = words.reduce(function (n, x) { return n + x.weight; }, 0);
    var start = performance.now();
    var durationMs = typeof audioOrMs === "number" ? audioOrMs
      : audioOrMs && audioOrMs.duration && isFinite(audioOrMs.duration) ? audioOrMs.duration * 1000
      : Math.max(2800, words.length * 400);
    var raf = 0;
    function tick() {
      var elapsed = performance.now() - start;
      if (audioOrMs && typeof audioOrMs.currentTime === "number") {
        if (audioOrMs.duration && isFinite(audioOrMs.duration)) durationMs = audioOrMs.duration * 1000;
        elapsed = audioOrMs.currentTime * 1000;
      }
      var t = Math.min(1, elapsed / Math.max(1, durationMs));
      var acc = 0, active = 0;
      words.forEach(function (x, i) { if (t * totalW >= acc) active = i; acc += x.weight; });
      spans.forEach(function (sp, i) {
        sp.className = "rd-k-word" + (i < active ? " done" : i === active ? " active" : "");
      });
      if (t < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return function () {
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
    document.querySelectorAll("#voiceCharBar [data-v]").forEach(function (x) { x.classList.remove("active"); });
    if (el) el.classList.add("active");
  }

  async function runVoiceTurn(userText) {
    userText = String(userText || "").trim();
    if (!userText) return;

    var isInv =
      (window.state && state.selectedVoice === "investigator") ||
      (document.querySelector("#voiceCharBar [data-v].active") &&
        document.querySelector("#voiceCharBar [data-v].active").dataset.v === "investigator");

    var persona = isInv
      ? window.INVESTIGATOR.system
      : (typeof VOICE_PERSONA !== "undefined" && VOICE_PERSONA[(window.state && state.selectedVoice) || "vestia-zeta"]) || "";

    var session = typeof getCurrentSession === "function" ? getCurrentSession() : null;
    var history = session && Array.isArray(session.messages) ? session.messages.slice(-6) : [];
    var msgs = [{ role: "system", content: persona + " Jawab untuk voice: jelas, 2-5 kalimat." }]
      .concat(history)
      .concat([{ role: "user", content: userText }]);

    var st = document.getElementById("voiceStatusText");
    if (st) st.textContent = "Berpikir…";
    var orb = document.getElementById("voiceOrb");
    if (orb) orb.classList.remove("listening");

    try {
      var prev = window.state && state.selectedModel;
      if (isInv && window.state) state.selectedModel = window.INVESTIGATOR_MODEL;
      var vms = document.getElementById("voiceModelSelect");
      if (vms && vms.value && vms.value !== "investigator" && window.state) state.selectedModel = vms.value;

      if (typeof callModel !== "function") throw new Error("callModel tidak ada");
      var reply = await callModel(msgs);
      if (prev != null && window.state) state.selectedModel = prev;

      var c = typeof replyText === "function" ? replyText(reply)
        : reply && reply.choices && reply.choices[0] ? String(reply.choices[0].message.content || "")
        : String(reply || "");
      c = String(c || "").trim() || "Tidak ada respons.";

      if (session) {
        session.messages.push({ role: "user", content: userText });
        session.messages.push({ role: "assistant", content: c });
        if (typeof saveSessions === "function") saveSessions();
      }

      var tr = document.getElementById("voiceTranscript");
      if (tr) tr.textContent = c;
      if (st) st.textContent = "Berbicara…";
      if (orb) orb.classList.add("speaking");

      var spoken = false;
      if (!isInv && typeof window.speakFish === "function") {
        try { spoken = !!(await window.speakFish(c)); } catch (e4) {}
      }
      if (!spoken) {
        if (typeof window.speakGoogle === "function") await window.speakGoogle(c);
        else if (typeof window.speakJarvis === "function") await window.speakJarvis(c);
        else if (window.speechSynthesis) {
          var clean = showKaraoke(c, Math.max(2800, c.split(/\s+/).length * 400));
          await new Promise(function (res) {
            var u = new SpeechSynthesisUtterance(c.replace(/\*\*/g, "").slice(0, 800));
            u.lang = "id-ID";
            u.onend = u.onerror = function () { clean(); res(); };
            speechSynthesis.speak(u);
          });
        }
      }
    } catch (err) {
      if (typeof showToast === "function") showToast(err.message || String(err), "error");
      if (st) st.textContent = "Error";
    } finally {
      if (orb) orb.classList.remove("speaking");
      if (window.state && state.voiceActive) {
        if (orb) orb.classList.add("listening");
        if (st) st.textContent = "Mendengarkan…";
        try { state.recognition && state.recognition.start(); } catch (e5) {}
      } else if (st) st.textContent = "Siap";
    }
  }
  window.rdRunVoiceTurn = runVoiceTurn;
  window.handleVoiceUtterance = runVoiceTurn;

  function ensureTypeInVoice() {
    if (document.getElementById("rd-voice-type-wrap")) {
      document.getElementById("rd-voice-type-wrap").classList.add("show");
      return;
    }
    var host = document.querySelector(".voice-controls") || document.getElementById("voiceCharBar");
    if (!host) return;
    var wrap = document.createElement("div");
    wrap.id = "rd-voice-type-wrap";
    wrap.className = "show";
    wrap.innerHTML =
      '<input id="rd-voice-type" type="text" placeholder="Ketik di sini (Android / mic gagal)…" autocomplete="off" enterkeyhint="send" />' +
      '<button type="button" id="rd-voice-type-send">Kirim</button>';
    if (host.parentNode) host.parentNode.insertBefore(wrap, host.nextSibling);
    else host.appendChild(wrap);

    function sendTyped() {
      var inp = document.getElementById("rd-voice-type");
      var t = ((inp && inp.value) || "").trim();
      if (!t) return;
      if (inp) inp.value = "";
      runVoiceTurn(t);
    }
    document.getElementById("rd-voice-type-send").onclick = sendTyped;
    document.getElementById("rd-voice-type").addEventListener("keydown", function (e) {
      if (e.key === "Enter") { e.preventDefault(); sendTyped(); }
    });
  }

  function patchSpeakKaraoke() {
    if (typeof window.speakFish === "function" && !window.speakFish.__rdV21) {
      var prevF = window.speakFish;
      window.speakFish = async function (text) {
        var key = "";
        try { key = String((window.state && state.keys && state.keys.fish) || "").trim(); } catch (e) {}
        if (key) {
          try {
            var id = (window.state && state.selectedVoice) || localStorage.getItem("rd_voice_character") || "vestia-zeta";
            var reference = REFS[id] || REFS["vestia-zeta"];
            var res = await fetch("/api/fish-tts", {
              method: "POST",
              headers: { Authorization: "Bearer " + key, "Content-Type": "application/json" },
              body: JSON.stringify({ text: String(text || "").replace(/\*\*/g, "").slice(0, 1200), reference_id: reference, model: "s2.1-pro-free" })
            });
            if (res.ok) {
              var audio = new Audio(URL.createObjectURL(await res.blob()));
              var clean = showKaraoke(text, audio);
              await new Promise(function (resolve, reject) {
                audio.onended = function () { clean(); resolve(); };
                audio.onerror = function () { clean(); reject(new Error("audio")); };
                audio.play().catch(reject);
              });
              return true;
            }
          } catch (e2) { console.warn("fish v21", e2); }
        }
        try { return await prevF.apply(this, arguments); } catch (e3) { return false; }
      };
      window.speakFish.__rdV21 = true;
    }
    function wrapSynth(name) {
      if (typeof window[name] !== "function" || window[name].__rdV21) return;
      var prev = window[name];
      window[name] = async function (text) {
        var clean = showKaraoke(text, Math.max(2800, String(text || "").split(/\s+/).length * 400));
        try { await prev.apply(this, arguments); } finally { clean(); }
      };
      window[name].__rdV21 = true;
    }
    wrapSynth("speakJarvis");
    wrapSynth("speakGoogle");
  }

  function patchInvestigatorModel() {
    if (typeof window.callModel !== "function" || window.callModel.__rdInv21) return;
    var prev = window.callModel;
    window.callModel = async function (messages) {
      try {
        var voice = (window.state && state.selectedVoice) || localStorage.getItem("rd_voice_character") || "";
        if (voice === "investigator" && Array.isArray(messages)) {
          var sys = window.INVESTIGATOR.system;
          var has = messages.some(function (m) {
            return m && m.role === "system" && /Investigator|rahasia gelap/i.test(String(m.content || ""));
          });
          if (!has) messages = [{ role: "system", content: sys }].concat(messages);
        }
      } catch (e) {}
      return prev.apply(this, arguments);
    };
    window.callModel.__rdInv21 = true;
  }

  function bindCharClicks() {
    document.querySelectorAll("#voiceCharBar [data-v]").forEach(function (el) {
      if (el.__rdV21) return;
      el.__rdV21 = true;
      el.addEventListener("click", function () { selectVoice(el.dataset.v, el); });
    });
    var bar = document.getElementById("voiceCharBar");
    if (bar && !bar.querySelector('[data-v="alya"]')) {
      var b = document.createElement("button");
      b.type = "button";
      b.dataset.v = "alya";
      b.textContent = "Alya";
      b.addEventListener("click", function () { selectVoice("alya", b); });
      bar.appendChild(b);
    }
  }

  function init() {
    addStyle();
    ensureTypeInVoice();
    patchSpeakKaraoke();
    patchInvestigatorModel();
    bindCharClicks();
    try {
      var saved = localStorage.getItem("rd_voice_character");
      if (saved && window.state) state.selectedVoice = saved;
    } catch (e) {}
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else setTimeout(init, 0);
  setTimeout(init, 300);
  setTimeout(init, 1200);
  setInterval(function () {
    patchSpeakKaraoke();
    patchInvestigatorModel();
    ensureTypeInVoice();
  }, 8000);
})();
