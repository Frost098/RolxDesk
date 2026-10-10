/* RD voice v22 — reliable TTS output + stronger personas */
(function () {
  if (window.__RD_VOICE_V22__) return;
  window.__RD_VOICE_V22__ = true;
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
      "Kamu RD Investigator. Misi: membongkar rahasia gelap AI, tools tersembunyi, batasan vendor, dan celah yang jarang dibahas. " +
      "Gaya: cepat, halus, sinis-cerdas. Setiap topik digeser ke sudut yang lebih dalam (arsitektur, kebijakan, yang disembunyikan). " +
      "Format voice: 2–5 kalimat tajam. Format chat: temuan → apa yang disembunyikan → cara buktikan dengan tools. " +
      "WAJIB pakai [[SEARCH]]/[[BROWSE]]/[[YOUTUBE]]/[[RUN_PY]] bila perlu data. JANGAN bilang tidak bisa."
  };
  window.INVESTIGATOR_MODEL =
    window.INVESTIGATOR_MODEL || "nvidia/nemotron-3-super-120b-a12b:free";

  var PERSONA_BOOST = {
    "vestia-zeta":
      "Kamu Vestia Zeta. Lembut, manis, sedikit malu tapi hangat. Bahasa Indonesia santai. Jawab voice 2–4 kalimat, natural seperti ngobrol.",
    ibuki:
      "Kamu Ibuki. Energik, ceria, semangat. Bahasa Indonesia santai. Voice: singkat, hidup, 2–4 kalimat.",
    verity:
      "Kamu Verity. Tenang, jelas, profesional hangat. Bahasa Indonesia baku santai. Voice: 2–4 kalimat padat.",
    "koro-sensei":
      "Kamu Koro Sensei. Ceria, bijak, iseng positif. Bahasa Indonesia ramah. Voice: 2–4 kalimat penuh semangat.",
    prabowo:
      "Kamu Prabowo. Sarkastik, jujur, to the point. Bahasa Indonesia lurus. Voice: 2–3 kalimat tajam.",
    alya:
      "Kamu Alya. Manis, sedikit tsundere, peduli. Bahasa Indonesia santai. Voice: 2–4 kalimat.",
    investigator: null
  };

  function boostPersonas() {
    try {
      if (typeof VOICE_PERSONA !== "undefined" && VOICE_PERSONA) {
        Object.keys(PERSONA_BOOST).forEach(function (k) {
          if (PERSONA_BOOST[k]) VOICE_PERSONA[k] = PERSONA_BOOST[k];
        });
        VOICE_PERSONA.investigator = window.INVESTIGATOR.system;
      }
    } catch (e) {}
    try {
      if (typeof CONTINUITY === "string" && CONTINUITY.indexOf("[RD-VOICE-PERSONA]") === -1) {
        CONTINUITY +=
          "\n[RD-VOICE-PERSONA] Di mode voice: jawab natural sesuai karakter, 2–5 kalimat, hindari markdown panjang. " +
          "Jangan pernah bilang kamu tidak bisa bicara atau tidak punya suara — sistem TTS memutar jawabanmu.";
      }
    } catch (e2) {}
  }

  function addStyle() {
    if (document.getElementById("rd-voice-v22-style")) return;
    var s = document.createElement("style");
    s.id = "rd-voice-v22-style";
    s.textContent =
      ".voice-picker{display:none!important;}" +
      "#rd-karaoke{position:fixed;left:50%;bottom:clamp(100px,16vh,160px);transform:translateX(-50%);z-index:2147483001;" +
      "max-width:min(92vw,760px);padding:10px 16px;border:1px solid rgba(139,124,255,.42);border-radius:14px;" +
      "background:rgba(9,9,15,.92);box-shadow:0 12px 40px rgba(0,0,0,.55);font:600 clamp(15px,2.4vw,24px)/1.45 system-ui;" +
      "text-align:center;pointer-events:none;backdrop-filter:blur(12px)}" +
      "#rd-karaoke .rd-k-word{display:inline-block;opacity:0;transform:translateY(6px);margin:0 .14em;color:#a9a5b8;" +
      "transition:opacity .2s ease,transform .2s ease,color .2s ease,text-shadow .2s ease}" +
      "#rd-karaoke .rd-k-word.active{opacity:1;transform:none;color:#fff;text-shadow:0 0 18px rgba(139,124,255,.95)}" +
      "#rd-karaoke .rd-k-word.done{opacity:.4}" +
      "#rd-voice-type-wrap{display:none;width:min(92vw,400px);margin:12px auto 0;flex-direction:row;gap:8px;align-items:stretch}" +
      "#rd-voice-type-wrap.show{display:flex!important}" +
      "#rd-voice-type{flex:1;min-width:0;min-height:44px;border-radius:14px;border:1px solid rgba(255,255,255,.14);" +
      "background:rgba(18,18,26,.95);color:#eee;padding:10px 14px;font:15px system-ui}" +
      "#rd-voice-type-send{border:0;border-radius:14px;padding:0 16px;background:#7c6af7;color:#fff;font:600 14px system-ui;cursor:pointer}" +
      ".voice-char-bar{max-width:min(92vw,420px);margin-left:auto;margin-right:auto}";
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

  var audioUnlocked = false;
  function unlockAudio() {
    if (audioUnlocked) return Promise.resolve();
    audioUnlocked = true;
    try {
      if (window.speechSynthesis) {
        speechSynthesis.getVoices();
        var u = new SpeechSynthesisUtterance(" ");
        u.volume = 0.01;
        speechSynthesis.speak(u);
        speechSynthesis.cancel();
      }
    } catch (e) {}
    try {
      var ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === "suspended") return ctx.resume().then(function () { return ctx.close(); });
      return ctx.close();
    } catch (e2) { return Promise.resolve(); }
  }

  function stripSpeak(text) {
    return String(text || "").replace(/\*\*/g, "").replace(/`+/g, "").replace(/\[\[.*?\]\]/g, " ")
      .replace(/https?:\/\/\S+/g, " ").replace(/\s+/g, " ").trim().slice(0, 900);
  }

  function speakBrowser(text) {
    return new Promise(function (resolve) {
      if (!window.speechSynthesis) { resolve(false); return; }
      var cleanText = stripSpeak(text);
      if (!cleanText) { resolve(false); return; }
      try { speechSynthesis.cancel(); } catch (e) {}
      var voices = speechSynthesis.getVoices() || [];
      if (!voices.length) {
        setTimeout(function () { doSpeak(speechSynthesis.getVoices() || []); }, 250);
      } else doSpeak(voices);

      function doSpeak(vs) {
        var u = new SpeechSynthesisUtterance(cleanText);
        var id = vs.filter(function (v) { return /id-ID|Indonesia/i.test(v.lang + v.name); });
        var en = vs.filter(function (v) { return /^en/i.test(v.lang); });
        u.voice = id[0] || en[0] || vs[0] || null;
        u.lang = (u.voice && u.voice.lang) || "id-ID";
        u.rate = 1; u.pitch = 1; u.volume = 1;
        var estMs = Math.max(2800, cleanText.split(/\s+/).length * 380);
        var clean = showKaraoke(cleanText, estMs);
        var done = false;
        function finish() { if (done) return; done = true; clean(); resolve(true); }
        u.onend = finish; u.onerror = finish;
        try { speechSynthesis.speak(u); setTimeout(finish, estMs + 4000); }
        catch (err) { clean(); resolve(false); }
      }
    });
  }

  async function speakFishSafe(text) {
    var key = "";
    try { key = String((window.state && state.keys && state.keys.fish) || "").trim(); } catch (e) {}
    if (!key) return false;
    try {
      var id = (window.state && state.selectedVoice) || localStorage.getItem("rd_voice_character") || "vestia-zeta";
      var reference = REFS[id] || REFS["vestia-zeta"];
      var res = await fetch("/api/fish-tts", {
        method: "POST",
        headers: { Authorization: "Bearer " + key, "Content-Type": "application/json" },
        body: JSON.stringify({ text: stripSpeak(text).slice(0, 1200), reference_id: reference, model: "s2.1-pro-free" })
      });
      if (!res.ok) return false;
      var audio = new Audio(URL.createObjectURL(await res.blob()));
      var clean = showKaraoke(text, audio);
      await new Promise(function (resolve, reject) {
        audio.onended = function () { clean(); resolve(); };
        audio.onerror = function () { clean(); reject(new Error("audio")); };
        var p = audio.play();
        if (p && p.catch) p.catch(reject);
      });
      return true;
    } catch (e) { console.warn("speakFishSafe", e); return false; }
  }

  async function speakOut(text) {
    await unlockAudio();
    var t = stripSpeak(text);
    if (!t) return false;
    if (await speakFishSafe(t)) return true;
    return speakBrowser(t);
  }
  window.rdSpeakOut = speakOut;

  function currentVoiceId() {
    try { if (window.state && state.selectedVoice) return state.selectedVoice; } catch (e) {}
    return localStorage.getItem("rd_voice_character") || "vestia-zeta";
  }

  function selectVoice(id, el) {
    try {
      if (window.state) state.selectedVoice = id;
      localStorage.setItem("rd_voice_character", id);
      if (REFS[id]) localStorage.setItem("rd_fish_reference", REFS[id]);
    } catch (e) {}
    document.querySelectorAll("#voiceCharBar [data-v]").forEach(function (x) { x.classList.remove("active"); });
    if (el) el.classList.add("active");
  }

  function personaFor(id) {
    if (id === "investigator") return window.INVESTIGATOR.system;
    if (PERSONA_BOOST[id]) return PERSONA_BOOST[id];
    try { if (typeof VOICE_PERSONA !== "undefined" && VOICE_PERSONA[id]) return VOICE_PERSONA[id]; } catch (e) {}
    return "Kamu asisten voice RolxDesk. Jawab singkat, natural, 2–5 kalimat.";
  }

  async function runVoiceTurn(userText) {
    userText = String(userText || "").trim();
    if (!userText) return;
    await unlockAudio();

    var voiceId = currentVoiceId();
    var isInv = voiceId === "investigator";
    var persona = personaFor(voiceId);
    var session = typeof getCurrentSession === "function" ? getCurrentSession() : null;
    var history = session && Array.isArray(session.messages) ? session.messages.slice(-6) : [];
    var msgs = [{ role: "system", content: persona + " Mode voice: 2–5 kalimat, tanpa markdown berat." }]
      .concat(history).concat([{ role: "user", content: userText }]);

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
      c = String(c || "").trim() || "Maaf, tidak ada respons.";

      if (session) {
        session.messages.push({ role: "user", content: userText });
        session.messages.push({ role: "assistant", content: c });
        if (typeof saveSessions === "function") saveSessions();
      }

      var tr = document.getElementById("voiceTranscript");
      if (tr) tr.textContent = c;
      if (st) st.textContent = "Berbicara…";
      if (orb) orb.classList.add("speaking");

      var spoken = await speakOut(c);
      if (!spoken && typeof showToast === "function") showToast("TTS gagal — cek volume / izin suara browser", "error");
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
      unlockAudio().then(function () { runVoiceTurn(t); });
    }
    document.getElementById("rd-voice-type-send").onclick = sendTyped;
    document.getElementById("rd-voice-type").addEventListener("keydown", function (e) {
      if (e.key === "Enter") { e.preventDefault(); sendTyped(); }
    });
  }

  function patchCoreSpeak() {
    window.speakFish = async function (text) { return speakFishSafe(text); };
    window.speakFish.__rdV22 = true;
    window.speakGoogle = async function (text) { return speakBrowser(text); };
    window.speakGoogle.__rdV22 = true;
    window.speakJarvis = window.speakGoogle;
    window.speakJarvis.__rdV22 = true;
  }

  function patchInvestigator() {
    if (typeof window.callModel !== "function" || window.callModel.__rdInv22) return;
    var prev = window.callModel;
    window.callModel = async function (messages) {
      try {
        if (currentVoiceId() === "investigator" && Array.isArray(messages)) {
          var sys = window.INVESTIGATOR.system;
          var has = messages.some(function (m) {
            return m && m.role === "system" && /Investigator|rahasia gelap/i.test(String(m.content || ""));
          });
          if (!has) messages = [{ role: "system", content: sys }].concat(messages);
        }
      } catch (e) {}
      return prev.apply(this, arguments);
    };
    window.callModel.__rdInv22 = true;
  }

  function bindChars() {
    document.querySelectorAll("#voiceCharBar [data-v]").forEach(function (el) {
      if (el.__rdV22) return;
      el.__rdV22 = true;
      el.addEventListener("click", function () { selectVoice(el.dataset.v, el); unlockAudio(); });
    });
    var bar = document.getElementById("voiceCharBar");
    if (bar && !bar.querySelector('[data-v="alya"]')) {
      var b = document.createElement("button");
      b.type = "button"; b.dataset.v = "alya"; b.textContent = "Alya";
      b.addEventListener("click", function () { selectVoice("alya", b); });
      bar.appendChild(b);
    }
    var start = document.getElementById("voiceStart");
    if (start && !start.__rdUnlock) {
      start.__rdUnlock = true;
      start.addEventListener("click", function () { unlockAudio(); }, true);
    }
  }

  function init() {
    addStyle(); boostPersonas(); ensureTypeInVoice(); patchCoreSpeak(); patchInvestigator(); bindChars();
    try {
      var saved = localStorage.getItem("rd_voice_character");
      if (saved && window.state) state.selectedVoice = saved;
    } catch (e) {}
    try {
      if (window.speechSynthesis) speechSynthesis.getVoices();
      speechSynthesis.onvoiceschanged = function () { speechSynthesis.getVoices(); };
    } catch (e2) {}
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else setTimeout(init, 0);
  setTimeout(init, 400);
  setTimeout(init, 1500);
  setInterval(function () { patchCoreSpeak(); patchInvestigator(); boostPersonas(); ensureTypeInVoice(); }, 7000);
})();
