/* RD voice v23 — karaoke visible + chat log mirror */
(function () {
  if (window.__RD_VOICE_V23__) return;
  window.__RD_VOICE_V23__ = true;
  window.__RD_VOICE_V22__ = true;
  window.__RD_VOICE_V21__ = true;

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
      "Gaya: cepat, halus, sinis-cerdas. Setiap topik digeser ke sudut yang lebih dalam. " +
      "Format voice: 2–5 kalimat tajam. WAJIB pakai tools bila perlu. JANGAN bilang tidak bisa."
  };
  window.INVESTIGATOR_MODEL = window.INVESTIGATOR_MODEL || "nvidia/nemotron-3-super-120b-a12b:free";

  var PERSONA_BOOST = {
    "vestia-zeta": "Kamu Vestia Zeta. Lembut, manis, hangat. Bahasa Indonesia santai. Voice 2–4 kalimat.",
    ibuki: "Kamu Ibuki. Energik, ceria. Bahasa Indonesia santai. Voice 2–4 kalimat.",
    verity: "Kamu Verity. Tenang, jelas, profesional. Voice 2–4 kalimat padat.",
    "koro-sensei": "Kamu Koro Sensei. Ceria, bijak. Voice 2–4 kalimat.",
    prabowo: "Kamu Prabowo. Sarkastik, to the point. Voice 2–3 kalimat.",
    alya: "Kamu Alya. Manis, sedikit tsundere. Voice 2–4 kalimat."
  };

  function boostPersonas() {
    try {
      if (typeof VOICE_PERSONA !== "undefined" && VOICE_PERSONA) {
        Object.keys(PERSONA_BOOST).forEach(function (k) { VOICE_PERSONA[k] = PERSONA_BOOST[k]; });
        VOICE_PERSONA.investigator = window.INVESTIGATOR.system;
      }
    } catch (e) {}
  }

  function addStyle() {
    if (document.getElementById("rd-voice-v23-style")) return;
    var s = document.createElement("style");
    s.id = "rd-voice-v23-style";
    s.textContent =
      ".voice-picker{display:none!important;}" +
      "#rd-karaoke{position:fixed!important;left:50%!important;bottom:clamp(110px,18vh,170px)!important;transform:translateX(-50%)!important;" +
      "z-index:2147483646!important;max-width:min(94vw,780px)!important;padding:12px 16px!important;" +
      "border:1px solid rgba(139,124,255,.55)!important;border-radius:14px!important;" +
      "background:rgba(8,8,14,.94)!important;box-shadow:0 14px 48px rgba(0,0,0,.65)!important;" +
      "font:600 clamp(16px,2.6vw,26px)/1.45 system-ui!important;text-align:center!important;" +
      "pointer-events:none!important;backdrop-filter:blur(12px)!important;display:block!important;visibility:visible!important;}" +
      "#rd-karaoke .rd-k-word{display:inline-block;opacity:.28;transform:translateY(3px);margin:0 .12em;color:#b5b0c4;" +
      "transition:opacity .18s ease,transform .18s ease,color .18s ease,text-shadow .18s ease}" +
      "#rd-karaoke .rd-k-word.active{opacity:1!important;transform:none;color:#fff!important;text-shadow:0 0 18px rgba(139,124,255,.95)}" +
      "#rd-karaoke .rd-k-word.done{opacity:.42}" +
      "#rd-voice-type-wrap{display:none;width:min(92vw,400px);margin:12px auto 0;flex-direction:row;gap:8px;align-items:stretch}" +
      "#rd-voice-type-wrap.show{display:flex!important}" +
      "#rd-voice-type{flex:1;min-width:0;min-height:44px;border-radius:14px;border:1px solid rgba(255,255,255,.14);" +
      "background:rgba(18,18,26,.95);color:#eee;padding:10px 14px;font:15px system-ui}" +
      "#rd-voice-type-send{border:0;border-radius:14px;padding:0 16px;background:#7c6af7;color:#fff;font:600 14px system-ui;cursor:pointer}";
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
    box.style.cssText = "z-index:2147483646!important;display:block!important;visibility:visible!important;opacity:1!important;";
    words.forEach(function (x) {
      var sp = document.createElement("span");
      sp.className = "rd-k-word";
      sp.textContent = x.word;
      box.appendChild(sp);
    });
    document.body.appendChild(box);
    var spans = Array.prototype.slice.call(box.children);
    if (spans[0]) spans[0].className = "rd-k-word active";
    var totalW = words.reduce(function (n, x) { return n + x.weight; }, 0);
    var start = performance.now();
    var durationMs = typeof audioOrMs === "number" ? audioOrMs
      : audioOrMs && audioOrMs.duration && isFinite(audioOrMs.duration) ? audioOrMs.duration * 1000
      : Math.max(3000, words.length * 420);
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
      setTimeout(function () { if (box.parentNode) box.parentNode.removeChild(box); }, 200);
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
      function doSpeak(vs) {
        var u = new SpeechSynthesisUtterance(cleanText);
        var id = (vs || []).filter(function (v) { return /id-ID|Indonesia/i.test(v.lang + v.name); });
        var en = (vs || []).filter(function (v) { return /^en/i.test(v.lang); });
        u.voice = id[0] || en[0] || (vs && vs[0]) || null;
        u.lang = (u.voice && u.voice.lang) || "id-ID";
        u.rate = 1; u.pitch = 1; u.volume = 1;
        var estMs = Math.max(3000, cleanText.split(/\s+/).length * 400);
        var clean = showKaraoke(cleanText, estMs);
        var done = false;
        function finish() { if (done) return; done = true; clean(); resolve(true); }
        u.onend = finish; u.onerror = finish;
        try { speechSynthesis.speak(u); setTimeout(finish, estMs + 5000); }
        catch (err) { clean(); resolve(false); }
      }
      var voices = speechSynthesis.getVoices() || [];
      if (!voices.length) setTimeout(function () { doSpeak(speechSynthesis.getVoices() || []); }, 280);
      else doSpeak(voices);
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
    } catch (e) { return false; }
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
    return "Kamu asisten voice RolxDesk. Jawab singkat, natural, 2–5 kalimat.";
  }

  function mirrorToChat(userText, assistantText) {
    try {
      var session = typeof getCurrentSession === "function" ? getCurrentSession() : null;
      if (!session && window.state) {
        var id = "v-" + Date.now();
        session = { id: id, title: String(userText || "Voice").slice(0, 40), messages: [], createdAt: Date.now() };
        state.sessions = state.sessions || [];
        state.sessions.unshift(session);
        state.currentSessionId = id;
      }
      if (session) {
        session.messages = session.messages || [];
        session.messages.push({ role: "user", content: userText });
        session.messages.push({ role: "assistant", content: assistantText });
        if (typeof saveSessions === "function") saveSessions();
      }
      if (typeof appendMessage === "function") {
        appendMessage("user", userText, false);
        appendMessage("assistant", assistantText, false);
      } else if (typeof renderMessages === "function" && session) {
        renderMessages(session.messages);
      }
    } catch (e) { console.warn("mirrorToChat", e); }
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
    var msgs = [{ role: "system", content: persona + " Mode voice: 2–5 kalimat." }]
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

      mirrorToChat(userText, c);

      var tr = document.getElementById("voiceTranscript");
      if (tr) tr.textContent = c;
      if (st) st.textContent = "Berbicara…";
      if (orb) orb.classList.add("speaking");

      var spoken = await speakOut(c);
      if (!spoken && typeof showToast === "function") showToast("TTS gagal — cek volume browser", "error");
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
    window.speakGoogle = async function (text) { return speakBrowser(text); };
    window.speakJarvis = window.speakGoogle;
  }

  function patchInvestigator() {
    if (typeof window.callModel !== "function" || window.callModel.__rdInv23) return;
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
    window.callModel.__rdInv23 = true;
  }

  function bindChars() {
    document.querySelectorAll("#voiceCharBar [data-v]").forEach(function (el) {
      if (el.__rdV23) return;
      el.__rdV23 = true;
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
      if (window.speechSynthesis) {
        speechSynthesis.getVoices();
        speechSynthesis.onvoiceschanged = function () { speechSynthesis.getVoices(); };
      }
    } catch (e2) {}
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else setTimeout(init, 0);
  setTimeout(init, 400);
  setTimeout(init, 1500);
  setInterval(function () { patchCoreSpeak(); patchInvestigator(); ensureTypeInVoice(); }, 7000);
})();
