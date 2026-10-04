/* RolxDesk extras-ui v5.3 — camera visible, mobile speech, multi custom */
(function () {
  if (window.__RD_EXTRAS_UI53__) return;
  window.__RD_EXTRAS_UI53__ = true;
  window.__RD_EXTRAS_UI50__ = true;

  function $(s, r) { return (r || document).querySelector(s); }

  function injectUiPolishCSS() {
    if ($("#rd-ui53-css")) return;
    var s = document.createElement("style");
    s.id = "rd-ui53-css";
    s.textContent = [
      ".messages, #messages { padding-left: max(14px, env(safe-area-inset-left)) !important; padding-right: max(14px, env(safe-area-inset-right)) !important; }",
      ".msg .bubble { max-width: min(90%, 620px) !important; }",
      "#rd-work { left: max(12px, env(safe-area-inset-left)) !important; right: max(12px, env(safe-area-inset-right)) !important; }",
      "#rd-voice-sub { position:fixed; left:50%; bottom:max(120px, env(safe-area-inset-bottom) + 110px); transform:translateX(-50%); z-index:10020; max-width:min(90vw,480px); padding:10px 16px; border-radius:14px; background:rgba(12,12,16,.94); border:1px solid #3a3a48; color:#eaeaf0; font:15px/1.45 system-ui,sans-serif; text-align:center; pointer-events:none; opacity:0; transition:opacity .25s ease; }",
      "#rd-voice-sub.show { opacity:1; }",
      "body.rd-sub-active #voiceTranscript { opacity:0.15 !important; }",
      "#rd-cam-btn { position:fixed; right:max(14px, env(safe-area-inset-right)); bottom:max(170px, env(safe-area-inset-bottom)+160px); z-index:10025; width:48px; height:48px; border-radius:50%; border:1px solid #4a4a58; background:rgba(18,18,22,.96); color:#eee; font-size:20px; cursor:pointer; box-shadow:0 4px 18px rgba(0,0,0,.5); display:flex!important; align-items:center; justify-content:center; }",
      "#rd-cam-panel { position:fixed; inset:0; z-index:10030; background:rgba(0,0,0,.85); display:none; flex-direction:column; align-items:center; justify-content:center; gap:12px; padding:16px; }",
      "#rd-cam-panel.show { display:flex; }",
      "#rd-cam-panel video { max-width:min(96vw,480px); max-height:60vh; border-radius:12px; background:#000; }",
      "#rd-cam-panel .rd-cam-actions { display:flex; gap:10px; flex-wrap:wrap; justify-content:center; }",
      "#rd-cam-panel button { padding:10px 16px; border-radius:10px; border:1px solid #444; background:#1a1a22; color:#eee; cursor:pointer; font:13px system-ui; }",
      "#rd-cam-panel button.primary { background:#1a7f64; border-color:#1a7f64; }",
      ".multi-chip.rd-custom { outline:1px solid #34d399; }"
    ].join("\n");
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
    if (document.getElementById("rd-cam-btn")) return;
    var btn = document.createElement("button");
    btn.id = "rd-cam-btn";
    btn.type = "button";
    btn.title = "Kamera (vision)";
    btn.textContent = "\ud83d\udcf7";
    btn.onclick = function () { openCam(); };
    document.body.appendChild(btn);
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
      else alert("Kamera gagal: " + (e.message || e));
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
      if (typeof showToast === "function") showToast("Foto siap dikirim (vision)", "success");
    } catch (e) {
      if (typeof showToast === "function") showToast("Capture gagal", "error");
    }
  }

  function injectCustomIntoMulti() {
    try {
      var box = document.getElementById("multiModelChecks");
      if (!box) return;
      var cid = (document.getElementById("customModelId") && document.getElementById("customModelId").value) || localStorage.getItem("rd_custom_model") || "";
      if (!cid) return;
      if (box.querySelector('.multi-chip[data-family="custom"]')) return;
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "multi-chip rd-custom";
      btn.setAttribute("data-mid", cid);
      btn.setAttribute("data-family", "custom");
      btn.textContent = ("9R " + cid).slice(0, 26);
      btn.addEventListener("click", function (ev) {
        ev.preventDefault();
        btn.classList.toggle("on");
      });
      box.insertBefore(btn, box.firstChild);
    } catch (e) {}
  }

  function patchMultiRender() {
    if (typeof window.renderMultiModelChecks === "function" && !window.renderMultiModelChecks.__rd53) {
      var orig = window.renderMultiModelChecks;
      window.renderMultiModelChecks = function () { orig(); injectCustomIntoMulti(); };
      window.renderMultiModelChecks.__rd53 = true;
    }
    injectCustomIntoMulti();
  }

  function patchMobileSpeech() {
    try {
      var isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || "");
      if (!isMobile) return;
      var origStart = window.startVoiceSession;
      if (typeof origStart === "function" && !origStart.__rd53) {
        window.startVoiceSession = async function () {
          try {
            var stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(function (t) { t.stop(); });
          } catch (e) {
            if (typeof showToast === "function") showToast("Izinkan mikrofon dulu (mobile)", "error");
          }
          var ret = await origStart.apply(this, arguments);
          try {
            if (window.state && state.recognition) {
              state.recognition.continuous = true;
              state.recognition.interimResults = true;
              try { state.recognition.lang = "id-ID"; } catch (e2) {}
            }
          } catch (e3) {}
          return ret;
        };
        window.startVoiceSession.__rd53 = true;
      }
    } catch (e) {}
  }

  function boot() {
    injectUiPolishCSS();
    ensureCamUI();
    patchMultiRender();
    patchMobileSpeech();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else setTimeout(boot, 200);
  setTimeout(boot, 1000);
  setTimeout(boot, 3000);
})();
