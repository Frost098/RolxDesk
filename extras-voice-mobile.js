/* RD mobile voice hardener v1 */
(function () {
  if (window.__RD_VOICE_MOBILE_FIX__) return;
  window.__RD_VOICE_MOBILE_FIX__ = true;
  var isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || "");
  if (!isMobile) return;

  function restartRec() {
    try {
      if (!window.state || !state.voiceActive || !state.recognition) return;
      state.recognition.start();
    } catch (e) {
      setTimeout(function () {
        try {
          if (window.state && state.voiceActive && state.recognition) state.recognition.start();
        } catch (e2) {}
      }, 280);
    }
  }

  function harden() {
    if (!window.state || !state.recognition || state.recognition.__rdMobileHard) return;
    var r = state.recognition;
    r.__rdMobileHard = true;
    try {
      r.continuous = false;
      r.interimResults = true;
      r.maxAlternatives = 3;
      if (!r.lang) r.lang = "id-ID";
    } catch (e) {}

    var prevEnd = r.onend;
    r.onend = function (ev) {
      try {
        if (typeof prevEnd === "function") prevEnd.call(r, ev);
      } catch (e) {}
      if (window.state && state.voiceActive) setTimeout(restartRec, 220);
    };

    var prevErr = r.onerror;
    r.onerror = function (ev) {
      try {
        if (typeof prevErr === "function") prevErr.call(r, ev);
      } catch (e) {}
      var code = (ev && ev.error) || "";
      if (code === "not-allowed" || code === "service-not-allowed") {
        if (window.state) state.voiceActive = false;
        if (typeof showToast === "function")
          showToast("Mic diblokir. Izinkan mikrofon di gembok URL.", "error");
        return;
      }
      if (code === "network" && typeof showToast === "function")
        showToast("Speech butuh jaringan (Google STT).", "error");
      if (window.state && state.voiceActive && code !== "not-allowed")
        setTimeout(restartRec, 400);
    };
  }

  var tries = 0;
  var iv = setInterval(function () {
    tries++;
    if (window.state && state.recognition) harden();
    if (tries > 50) clearInterval(iv);
  }, 400);

  document.addEventListener(
    "click",
    function (e) {
      var t = e.target;
      if (!t || !t.closest) return;
      if (!t.closest("#voiceStart")) return;
      setTimeout(function () {
        harden();
        restartRec();
      }, 500);
    },
    true
  );

  function wrapSpeak(name) {
    var fn = window[name];
    if (typeof fn !== "function" || fn.__rdMobileMuteRec) return;
    window[name] = async function () {
      try {
        if (window.state && state.recognition && state.voiceActive) {
          try {
            state.recognition.stop();
          } catch (e) {}
        }
      } catch (e2) {}
      var ok = await fn.apply(this, arguments);
      setTimeout(restartRec, 320);
      return ok;
    };
    window[name].__rdMobileMuteRec = true;
  }
  setTimeout(function () {
    wrapSpeak("rdSpeakOut");
    wrapSpeak("speakFish");
    wrapSpeak("speakGoogle");
    wrapSpeak("speakJarvis");
  }, 800);
})();
