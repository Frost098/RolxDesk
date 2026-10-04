/* RolxDesk extras-ui v5.1 — voice dedupe, camera, multi custom, browse fix */
(function () {
  if (window.__RD_EXTRAS_UI51__) return;
  window.__RD_EXTRAS_UI51__ = true;
  window.__RD_EXTRAS_UI50__ = true;

  function $(s, r) { return (r || document).querySelector(s); }

  function injectUiPolishCSS() {
    if ($("#rd-ui51-css")) return;
    var s = document.createElement("style");
    s.id = "rd-ui51-css";
    s.textContent = [
      ".messages, #messages { padding-left: max(14px, env(safe-area-inset-left)) !important; padding-right: max(14px, env(safe-area-inset-right)) !important; }",
      ".msg .bubble { max-width: min(90%, 620px) !important; }",
      "#rd-yt { right: max(14px, env(safe-area-inset-right)) !important; bottom: max(92px, env(safe-area-inset-bottom) + 76px) !important; }",
      "#rd-work { left: max(12px, env(safe-area-inset-left)) !important; right: max(12px, env(safe-area-inset-right)) !important; }",
      "#rd-voice-sub { position:fixed; left:50%; bottom:max(120px, env(safe-area-inset-bottom) + 110px); transform:translateX(-50%); z-index:10020; max-width:min(90vw,480px); padding:10px 16px; border-radius:14px; background:rgba(12,12,16,.94); border:1px solid #3a3a48; color:#eaeaf0; font:15px/1.45 system-ui,sans-serif; text-align:center; pointer-events:none; opacity:0; transition:opacity .25s ease; box-shadow:0 8px 28px rgba(0,0,0,.4); }",
      "#rd-voice-sub.show { opacity:1; }",
      "#rd-voice-sub .rd-sub-line { display:block; animation:rdSubIn .35s ease; }",
      "@keyframes rdSubIn { from { opacity:0; transform:translateY(6px);} to { opacity:1; transform:none;} }",
      "body.rd-sub-active #voiceTranscript { opacity:0.15 !important; }",
      ".rd-prov { display:inline-flex; align-items:center; margin-right:6px; }",
      ".rd-prov svg { width:16px; height:16px; display:block; }",
      "#rd-cam-btn { position:fixed; right:max(14px, env(safe-area-inset-right)); bottom:max(160px, env(safe-area-inset-bottom)+150px); z-index:10005; width:44px; height:44px; border-radius:50%; border:1px solid #3a3a48; background:rgba(18,18,22,.92); color:#eee; font-size:18px; cursor:pointer; box-shadow:0 4px 16px rgba(0,0,0,.35); }",
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

  function providerSvg(kind) {
    var k = String(kind || "").toLowerCase();
    if (/gemini|google/.test(k)) return '<svg viewBox="0 0 24 24"><defs><linearGradient id="rg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#4e8cff"/><stop offset="1" stop-color="#b06bff"/></linearGradient></defs><path fill="url(#rg)" d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z"/></svg>';
    if (/grok|xai/.test(k)) return '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="none" stroke="#e8e8e8" stroke-width="1.5"/><path d="M7 12h10M12 7v10" stroke="#e8e8e8" stroke-width="1.5" stroke-linecap="round"/></svg>';
    if (/manus/.test(k)) return '<svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="4" fill="none" stroke="#5eead4" stroke-width="1.6"/><path d="M8 12h8M12 8v8" stroke="#5eead4" stroke-width="1.6"/></svg>';
    if (/venice/.test(k)) return '<svg viewBox="0 0 24 24"><path d="M4 16c4-8 12-8 16 0" fill="none" stroke="#a78bfa" stroke-width="1.8"/><circle cx="12" cy="9" r="3" fill="#a78bfa"/></svg>';
    if (/custom|9router|router/.test(k)) return '<svg viewBox="0 0 24 24"><path d="M5 12h14M9 8l-4 4 4 4M15 8l4 4-4 4" fill="none" stroke="#34d399" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    if (/openrouter/.test(k)) return '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="#f59e0b" stroke-width="1.5"/><path d="M8 12a4 4 0 108 0" fill="none" stroke="#f59e0b" stroke-width="1.5"/></svg>';
    return '<svg viewBox="0 0 24 24"><text x="3" y="16" font-size="11" font-weight="700" fill="#a89cff">RD</text></svg>';
  }

  function decorateModelSelects() {
    try {
      var fam = document.getElementById("familySelect");
      var mod = document.getElementById("modelSelect");
      [fam, mod].forEach(function (sel) {
        if (!sel || sel.__rdIcon) return;
        sel.__rdIcon = true;
        var wrap = document.createElement("span");
        wrap.className = "rd-prov";
        wrap.id = "rd-prov-" + sel.id;
        wrap.innerHTML = providerSvg(sel.value || (fam && fam.value) || "custom");
        if (sel.parentNode) sel.parentNode.insertBefore(wrap, sel);
        sel.addEventListener("change", function () {
          var w = document.getElementById("rd-prov-" + sel.id);
          if (w) w.innerHTML = providerSvg(sel.value || (fam && fam.value));
        });
      });
    } catch (e) {}
  }

  function activeModelLabel() {
    try {
      var fam = (document.getElementById("familySelect") || {}).value || "?";
      var mod = (document.getElementById("modelSelect") || {}).value || "?";
      if (fam === "custom" || mod === "custom") {
        var cid = (document.getElementById("customModelId") && document.getElementById("customModelId").value) || localStorage.getItem("rd_custom_model") || mod;
        return "Custom / 9router · `" + cid + "`";
      }
      if (fam === "google") return "Google Gemini · `" + mod + "`";
      if (fam === "venice") return "Venice · `" + mod + "`";
      if (fam === "manus") return "Manus · `" + mod + "`";
      return fam + " · `" + mod + "`";
    } catch (e) { return "chip UI"; }
  }

  function forceModelHonesty(userText, assistantText) {
    var u = String(userText || "");
    if (!/(model\s*apa|pake\s*model|pakai\s*model|model\s*yang|jujur.*model|what\s*model)/i.test(u)) return assistantText;
    var honest = "Model aktif sekarang: **" + activeModelLabel() + "**.\n(Chip header = sumber kebenaran — bukan rahasia.)";
    var out = String(assistantText || "");
    if (/off-limits|tidak bisa dibahas|rahasia|internal sistem|gak bisa dibahas/i.test(out) || out.length < 8) return honest;
    if (!/model aktif|Custom|Gemini|OpenRouter|9router/i.test(out)) return honest + "\n\n" + out;
    return out;
  }

  function scrubBrowseStall(text) {
    var s = String(text || "");
    s = s.replace(/Tunggu hasil browse[^\n]*/gi, "");
    s = s.replace(/Liat konten situs dulu[^\n]*/gi, "");
    s = s.replace(/menunggu\s+hasil\s+browse[^\n]*/gi, "");
    s = s.replace(/\n{3,}/g, "\n\n").trim();
    return s;
  }

  function injectCustomIntoMulti() {
    try {
      var box = document.getElementById("multiModelChecks");
      if (!box) return;
      var cid = (document.getElementById("customModelId") && document.getElementById("customModelId").value) || localStorage.getItem("rd_custom_model") || "";
      var base = "";
      try { base = (window.state && state.keys && state.keys.customBase) || (JSON.parse(localStorage.getItem("rd_keys") || "{}").customBase) || ""; } catch (e) {}
      if (!cid && !base) return;
      var id = cid || "custom-default";
      if (box.querySelector('.multi-chip[data-family="custom"]')) return;
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "multi-chip rd-custom";
      btn.setAttribute("data-mid", id);
      btn.setAttribute("data-family", "custom");
      btn.title = "Custom / 9router: " + id;
      btn.textContent = ("9R " + id).slice(0, 26);
      btn.addEventListener("click", function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        btn.classList.toggle("on");
        var n = box.querySelectorAll(".multi-chip.on").length;
        var lab = document.getElementById("multiModeLabel");
        if (lab) {
          var mode = (document.getElementById("chatModeSelect") || {}).value;
          lab.textContent = (mode === "debate" ? "Peserta debat" : "Anggota tim") + " — terpilih: " + n + " (min 2)";
        }
      });
      box.insertBefore(btn, box.firstChild);
    } catch (e) {}
  }

  function patchMultiRender() {
    if (typeof window.renderMultiModelChecks === "function" && !window.renderMultiModelChecks.__rd51) {
      var orig = window.renderMultiModelChecks;
      window.renderMultiModelChecks = function () { orig(); injectCustomIntoMulti(); };
      window.renderMultiModelChecks.__rd51 = true;
    }
    injectCustomIntoMulti();
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
      var prev = document.getElementById("rd-paste-preview");
      if (!prev) {
        prev = document.createElement("div");
        prev.id = "rd-paste-preview";
        prev.style.cssText = "display:flex;gap:8px;flex-wrap:wrap;padding:6px 12px";
        var bar = document.querySelector(".composer, .input-bar, #composer") || (document.getElementById("userInput") && document.getElementById("userInput").parentNode);
        if (bar) bar.insertBefore(prev, bar.firstChild);
      }
      var img = document.createElement("img");
      img.src = dataUrl;
      img.style.cssText = "width:72px;height:72px;object-fit:cover;border-radius:10px;border:1px solid #333";
      prev.appendChild(img);
      stopCam();
      if (typeof showToast === "function") showToast("Foto siap dikirim (vision)", "success");
    } catch (e) {
      if (typeof showToast === "function") showToast("Capture gagal: " + (e.message || e), "error");
    }
  }

  function hookPasteImage() {
    if (document.__rdPaste51) return;
    document.__rdPaste51 = true;
    document.addEventListener("paste", function (e) {
      try {
        var items = e.clipboardData && e.clipboardData.items;
        if (!items) return;
        for (var i = 0; i < items.length; i++) {
          if (items[i].type && items[i].type.indexOf("image") === 0) {
            e.preventDefault();
            var file = items[i].getAsFile();
            if (!file) return;
            var reader = new FileReader();
            reader.onload = function () {
              var dataUrl = reader.result;
              if (window.state) {
                window.state._pendingImages = window.state._pendingImages || [];
                window.state._pendingImages.push({ mime: file.type || "image/png", data: String(dataUrl).split(",")[1] || "" });
                if (Array.isArray(window.state.pendingFiles)) try { window.state.pendingFiles.push(file); } catch (e2) {}
              }
              var prev = document.getElementById("rd-paste-preview");
              if (!prev) {
                prev = document.createElement("div");
                prev.id = "rd-paste-preview";
                prev.style.cssText = "display:flex;gap:8px;flex-wrap:wrap;padding:6px 12px";
                var bar = document.querySelector(".composer, .input-bar, #composer") || (document.getElementById("userInput") && document.getElementById("userInput").parentNode);
                if (bar) bar.insertBefore(prev, bar.firstChild);
              }
              var img = document.createElement("img");
              img.src = dataUrl;
              img.style.cssText = "width:72px;height:72px;object-fit:cover;border-radius:10px;border:1px solid #333";
              prev.appendChild(img);
              if (typeof showToast === "function") showToast("Gambar tempel — siap kirim", "success");
            };
            reader.readAsDataURL(file);
            return;
          }
        }
      } catch (err) {}
    }, true);
  }

  function ensureVoiceSub() {
    var el = document.getElementById("rd-voice-sub");
    if (el) return el;
    el = document.createElement("div");
    el.id = "rd-voice-sub";
    document.body.appendChild(el);
    return el;
  }
  function showSubLine(text) {
    document.body.classList.add("rd-sub-active");
    var el = ensureVoiceSub();
    el.innerHTML = '<span class="rd-sub-line"></span>';
    el.querySelector(".rd-sub-line").textContent = text;
    el.classList.add("show");
  }
  function hideSub() {
    document.body.classList.remove("rd-sub-active");
    var el = document.getElementById("rd-voice-sub");
    if (el) el.classList.remove("show");
  }
  function splitSentences(text) {
    var t = String(text || "").replace(/\*\*/g, "").replace(/\n+/g, " ").trim();
    t = t.replace(/Tools sandbox aktif:[^.]*\./gi, "").trim();
    var parts = t.split(/(?<=[.!?…])\s+/).filter(function (s) { return s.trim().length > 1; });
    if (!parts.length) parts = [t.slice(0, 160)];
    if (parts.length > 6) {
      var joined = [], buf = "";
      parts.forEach(function (p) {
        if ((buf + " " + p).length < 140) buf = (buf ? buf + " " : "") + p;
        else { if (buf) joined.push(buf); buf = p; }
      });
      if (buf) joined.push(buf);
      parts = joined.slice(0, 6);
    }
    return parts;
  }
  function patchSpeak() {
    if (typeof window.speakJarvis !== "function" || window.speakJarvis.__rd51) return;
    window.speakJarvis = async function (text) {
      var parts = splitSentences(text);
      var tr = document.getElementById("voiceTranscript");
      var prevTr = tr ? tr.textContent : "";
      if (tr) tr.textContent = "";
      if (!window.speechSynthesis) {
        for (var i = 0; i < parts.length; i++) {
          showSubLine(parts[i]);
          await new Promise(function (r) { setTimeout(r, Math.min(4000, 900 + parts[i].length * 35)); });
        }
        hideSub();
        if (tr) tr.textContent = parts.slice(0, 2).join(" ");
        return;
      }
      speechSynthesis.cancel();
      if (!speechSynthesis.getVoices().length) {
        await new Promise(function (r) {
          var t = setTimeout(r, 400);
          speechSynthesis.onvoiceschanged = function () { clearTimeout(t); r(); };
        });
      }
      for (var j = 0; j < parts.length; j++) {
        showSubLine(parts[j]);
        await new Promise(function (resolve) {
          var u = new SpeechSynthesisUtterance(parts[j].slice(0, 500));
          try {
            if (typeof pickJarvisVoice === "function") {
              var v = pickJarvisVoice();
              if (v) { u.voice = v; u.lang = v.lang || "en-GB"; }
            }
          } catch (e) {}
          u.rate = 0.92; u.pitch = 0.75;
          u.onend = resolve; u.onerror = resolve;
          speechSynthesis.speak(u);
        });
      }
      hideSub();
      if (tr) tr.textContent = parts.slice(0, 2).join(" ");
    };
    window.speakJarvis.__rd51 = true;
    if (typeof window.speakGoogle === "function") window.speakGoogle = function (t) { return window.speakJarvis(t); };
  }

  function patchHonestyAndBrowse() {
    if (typeof window.forceToolsFromUser === "function" && !window.forceToolsFromUser.__rd51) {
      var prev = window.forceToolsFromUser;
      window.forceToolsFromUser = function (ut, at) {
        return scrubBrowseStall(forceModelHonesty(ut, prev(ut, at)));
      };
      window.forceToolsFromUser.__rd51 = true;
    }
    if (typeof window.runAgentTags === "function" && !window.runAgentTags.__rd51scrub) {
      var ra = window.runAgentTags;
      window.runAgentTags = async function (content) {
        return scrubBrowseStall(await ra(content));
      };
      window.runAgentTags.__rd51scrub = true;
    }
  }

  try {
    if (typeof CONTINUITY === "string" && CONTINUITY.indexOf("JANGAN bilang tunggu hasil") === -1) {
      CONTINUITY += "\nSetelah Browse: LANGSUNG rangkum. JANGAN bilang tunggu hasil browse. Jangan bilang Kiro. Jujur soal model di chip.\n";
    }
  } catch (e) {}

  function boot() {
    injectUiPolishCSS();
    decorateModelSelects();
    hookPasteImage();
    patchSpeak();
    patchHonestyAndBrowse();
    patchMultiRender();
    ensureCamUI();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else setTimeout(boot, 200);
  setTimeout(boot, 1000);
  setTimeout(boot, 3000);
  setTimeout(patchMultiRender, 1500);
})();
