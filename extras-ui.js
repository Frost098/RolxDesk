/* RolxDesk extras-ui v5.4 — camera left + mobile mic stability */
(function () {
  if (window.__RD_EXTRAS_UI54__) return;
  window.__RD_EXTRAS_UI54__ = true;

  function $(s, r) { return (r || document).querySelector(s); }

  function injectCSS() {
    if ($("#rd-ui54-css")) return;
    var s = document.createElement("style");
    s.id = "rd-ui54-css";
    s.textContent = [
      "#rd-cam-btn{position:fixed;left:max(12px,env(safe-area-inset-left));bottom:max(88px,env(safe-area-inset-bottom)+80px);z-index:10025;",
      "width:48px;height:48px;border-radius:50%;border:1px solid #4a4a58;background:rgba(18,18,22,.96);color:#eee;",
      "font-size:20px;cursor:pointer;box-shadow:0 4px 18px rgba(0,0,0,.5);display:flex!important;align-items:center;justify-content:center}",
      "#rd-cam-panel{position:fixed;inset:0;z-index:10030;background:rgba(0,0,0,.85);display:none;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:16px}",
      "#rd-cam-panel.show{display:flex}",
      "#rd-cam-panel video{max-width:min(96vw,480px);max-height:60vh;border-radius:12px;background:#000}",
      "#rd-cam-panel .rd-cam-actions{display:flex;gap:10px;flex-wrap:wrap;justify-content:center}",
      "#rd-cam-panel button{padding:10px 16px;border-radius:10px;border:1px solid #444;background:#1a1a22;color:#eee;cursor:pointer;font:13px system-ui}",
      "#rd-cam-panel button.primary{background:#1a7f64;border-color:#1a7f64}",
      ".multi-chip.rd-custom{outline:1px solid #34d399}"
    ].join("");
    document.head.appendChild(s);
  }

  var _camStream = null;
  var _camFacing = "environment";

  function stopCam() {
    try { if (_camStream) _camStream.getTracks().forEach(function (t) { t.stop(); }); } catch (e) {}
    _camStream = null;
    var panel = document.getElementById("rd-cam-panel");
    if (panel) panel.classList.remove("show");
  }

  function ensureCamUI() {
    var old = document.getElementById("rd-cam-btn");
    if (old) old.remove();
    var btn = document.createElement("button");
    btn.id = "rd-cam-btn";
    btn.type = "button";
    btn.title = "Kamera (vision)";
    btn.textContent = "\ud83d\udcf7";
    btn.onclick = function () { openCam(); };
    document.body.appendChild(btn);
    if (!document.getElementById("rd-cam-panel")) {
      var panel = document.createElement("div");
      panel.id = "rd-cam-panel";
      panel.innerHTML = '<video id="rd-cam-video" autoplay playsinline muted></video><div class="rd-cam-actions"><button type="button" id="rd-cam-flip">Ganti kamera</button><button type="button" class="primary" id="rd-cam-shot">Ambil foto</button><button type="button" id="rd-cam-close">Tutup</button></div>';
      document.body.appendChild(panel);
      document.getElementById("rd-cam-close").onclick = stopCam;
      document.getElementById("rd-cam-flip").onclick = function () {
        _camFacing = _camFacing === "user" ? "environment" : "user";
        openCam();
      };
      document.getElementById("rd-cam-shot").onclick = captureCam;
    }
  }

  async function openCam() {
    ensureCamUI();
    var panel = document.getElementById("rd-cam-panel");
    var video = document.getElementById("rd-cam-video");
    try {
      if (_camStream) _camStream.getTracks().forEach(function (t) { t.stop(); });
      _camStream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: _camFacing }, width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      video.srcObject = _camStream;
      panel.classList.add("show");
    } catch (e) {
      if (typeof showToast === "function") showToast("Kamera: " + (e.message || e), "error");
    }
  }

  function captureCam() {
    try {
      var video = document.getElementById("rd-cam-video");
      if (!video || !video.videoWidth) return;
      var canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext("2d").drawImage(video, 0, 0);
      var dataUrl = canvas.toDataURL("image/jpeg", 0.85);
      var b64 = dataUrl.split(",")[1] || "";
      if (window.state) {
        window.state._pendingImages = window.state._pendingImages || [];
        window.state._pendingImages.push({ mime: "image/jpeg", data: b64 });
        if (Array.isArray(window.state.pendingFiles)) {
          try {
            var bin = atob(b64);
            var arr = new Uint8Array(bin.length);
            for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
            window.state.pendingFiles.push(new File([new Blob([arr], { type: "image/jpeg" })], "camera.jpg", { type: "image/jpeg" }));
          } catch (e2) {}
        }
      }
      stopCam();
      if (typeof showToast === "function") showToast("Foto siap dikirim", "success");
    } catch (e) {}
  }

  function patchMobileSpeech() {
    var isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || "");
    if (!isMobile || window.__rdMicPatch54) return;
    window.__rdMicPatch54 = true;
    var lastStart = 0;
    function safeStartRec() {
      if (!window.state || !state.voiceActive || !state.recognition) return;
      if (Date.now() - lastStart < 1200) return;
      lastStart = Date.now();
      try { state.recognition.start(); } catch (e) {}
    }
    var origStart = window.startVoiceSession;
    if (typeof origStart !== "function") return;
    window.startVoiceSession = async function () {
      try {
        var stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(function (t) { t.stop(); });
        if (window.state) state.micGranted = true;
      } catch (e) {
        if (typeof showToast === "function") showToast("Mic mobile ditolak — izinkan di gembok URL", "error");
        return;
      }
      var ret = await origStart.apply(this, arguments);
      try {
        if (window.state && state.recognition) {
          state.recognition.continuous = false;
          state.recognition.interimResults = true;
          state.recognition.lang = "id-ID";
          var prevEnd = state.recognition.onend;
          state.recognition.onend = function (ev) {
            if (state.voiceActive && !state.isStreaming) setTimeout(safeStartRec, 600);
            if (typeof prevEnd === "function") try { prevEnd.call(this, ev); } catch (e2) {}
          };
          var prevErr = state.recognition.onerror;
          state.recognition.onerror = function (e) {
            var err = (e && e.error) || "";
            if (err === "aborted" || err === "no-speech") {
              if (state.voiceActive) setTimeout(safeStartRec, 800);
              return;
            }
            if (err === "not-allowed") {
              if (typeof showToast === "function") showToast("Mic diblokir browser mobile", "error");
              if (typeof stopVoiceSession === "function") stopVoiceSession();
              return;
            }
            if (typeof prevErr === "function") try { prevErr.call(this, e); } catch (e3) {}
          };
        }
      } catch (e4) {}
      return ret;
    };
  }

  function boot() {
    injectCSS();
    ensureCamUI();
    patchMobileSpeech();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else setTimeout(boot, 200);
  setTimeout(boot, 1000);
  setTimeout(boot, 3000);
})();
