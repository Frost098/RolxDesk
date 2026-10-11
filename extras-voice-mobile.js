/* RD mobile voice hardener v2 — recreate SR, status, silence watchdog */
(function () {
  if (window.__RD_VOICE_MOBILE_V2__) return;
  window.__RD_VOICE_MOBILE_V2__ = true;
  window.__RD_VOICE_MOBILE_FIX__ = true;

  var isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || "");
  var lastHeard = 0;
  var watchTimer = null;

  function setStatus(t) {
    var el = document.getElementById("voiceStatusText") || document.getElementById("voiceStatus");
    if (el) el.textContent = t;
  }

  function restartRec() {
    try {
      if (!window.state || !state.voiceActive) return;
      if (!state.recognition) return;
      state.recognition.start();
      setStatus("Mendengarkan…");
    } catch (e) {
      setTimeout(function () {
        try {
          if (window.state && state.voiceActive && state.recognition) state.recognition.start();
        } catch (e2) {}
      }, 300);
    }
  }

  function silenceWatch() {
    if (watchTimer) clearInterval(watchTimer);
    lastHeard = Date.now();
    watchTimer = setInterval(function () {
      if (!window.state || !state.voiceActive) return;
      if (Date.now() - lastHeard > 10000) {
        lastHeard = Date.now();
        setStatus("Belum terdengar — bicara lebih dekat / ketik di bawah");
        if (typeof showToast === "function") {
          showToast("Mic belum menangkap suara. Coba ketik, atau cek izin mic + jaringan.", "error");
        }
        try {
          if (state.recognition) {
            try { state.recognition.onend = null; state.recognition.stop(); } catch (e) {}
            state.recognition = null;
          }
        } catch (e3) {}
        ensureRecognition(true);
        restartRec();
      }
    }, 4000);
  }

  function ensureRecognition(forceNew) {
    if (!window.state) return null;
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setStatus("Browser tidak support speech — pakai ketik");
      if (typeof showToast === "function") showToast("Pakai Chrome + ketik di kolom voice", "error");
      return null;
    }
    if (forceNew || !state.recognition) {
      try {
        if (state.recognition) {
          try { state.recognition.onend = null; state.recognition.stop(); } catch (e) {}
        }
      } catch (e2) {}
      var r = new SR();
      r.lang = "id-ID";
      r.continuous = false;
      r.interimResults = true;
      r.maxAlternatives = 5;
      r.onresult = function (e) {
        lastHeard = Date.now();
        var finalText = "", interim = "";
        for (var i = e.resultIndex; i < e.results.length; i++) {
          var best = e.results[i][0];
          var t = (best && best.transcript) || "";
          if (e.results[i].isFinal) finalText += t;
          else interim += t;
        }
        var el = document.getElementById("voiceTranscript");
        if (el) el.textContent = (finalText || interim || "…").trim();
        if (interim) setStatus("Mendengar: " + interim.slice(0, 50));
        if (finalText.trim() && state.voiceActive) {
          setStatus("Memproses…");
          try { r.stop(); } catch (e3) {}
          var text = finalText.trim();
          if (typeof handleVoiceUserSpeech === "function") handleVoiceUserSpeech(text);
          else if (typeof window.rdRunVoiceTurn === "function") window.rdRunVoiceTurn(text);
          else if (typeof window.handleVoiceUtterance === "function") window.handleVoiceUtterance(text);
        }
      };
      r.onerror = function (ev) {
        var code = (ev && ev.error) || "";
        setStatus("Mic: " + code);
        if (code === "not-allowed" || code === "service-not-allowed") {
          state.voiceActive = false;
          if (typeof showToast === "function")
            showToast("Mic diblokir — izinkan di gembok URL, pakai Chrome", "error");
          return;
        }
        if (code === "network" && typeof showToast === "function")
          showToast("Speech butuh internet (Google STT)", "error");
        if (state.voiceActive && code !== "not-allowed") setTimeout(restartRec, 400);
      };
      r.onend = function () {
        if (state.voiceActive) setTimeout(restartRec, 250);
      };
      r.onstart = function () {
        lastHeard = Date.now();
        setStatus("Mendengarkan…");
      };
      state.recognition = r;
    }
    return state.recognition;
  }

  async function warmMic() {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return false;
      var stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true }
      });
      stream.getTracks().forEach(function (t) { t.stop(); });
      if (window.state) {
        state.micGranted = true;
        try { sessionStorage.setItem("rd_mic", "1"); } catch (e) {}
      }
      return true;
    } catch (err) {
      setStatus("Mic ditolak");
      if (typeof showToast === "function")
        showToast("Izinkan mikrofon di gembok URL, lalu Start lagi", "error");
      return false;
    }
  }

  document.addEventListener(
    "click",
    function (e) {
      var t = e.target;
      if (!t || !t.closest) return;
      if (!t.closest("#voiceStart")) return;
      if (!isMobile) return;
      setTimeout(async function () {
        if (!window.state || !state.voiceActive) return;
        setStatus("Siapkan mic…");
        var ok = await warmMic();
        if (!ok) return;
        ensureRecognition(true);
        silenceWatch();
        restartRec();
        setStatus("Mendengarkan… bicara sekarang");
      }, 350);
    },
    true
  );

  var tries = 0;
  var iv = setInterval(function () {
    tries++;
    if (window.state && state.voiceActive) {
      if (!state.recognition || !state.recognition.__rdMobileHard) {
        var r = ensureRecognition(false);
        if (r) r.__rdMobileHard = true;
      }
    }
    if (tries > 60) clearInterval(iv);
  }, 500);

  function wrapSpeak(name) {
    var fn = window[name];
    if (typeof fn !== "function" || fn.__rdMobileMuteRec) return;
    window[name] = async function () {
      try {
        if (window.state && state.recognition && state.voiceActive) {
          try { state.recognition.stop(); } catch (e) {}
        }
      } catch (e2) {}
      var ok = await fn.apply(this, arguments);
      setTimeout(restartRec, 350);
      return ok;
    };
    window[name].__rdMobileMuteRec = true;
  }
  setTimeout(function () {
    ["rdSpeakOut", "speakFish", "speakGoogle", "speakJarvis"].forEach(wrapSpeak);
  }, 1000);

  setInterval(function () {
    if (!isMobile) return;
    var w = document.getElementById("rd-voice-type-wrap");
    if (w) w.classList.add("show");
  }, 2000);
})();
