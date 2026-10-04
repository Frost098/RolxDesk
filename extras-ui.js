/* RolxDesk extras-ui v5.0 */
(function () {
  if (window.__RD_EXTRAS_UI50__) return;
  window.__RD_EXTRAS_UI50__ = true;
  function $(s, r) { return (r || document).querySelector(s); }
  function injectUiPolishCSS() {
    if ($("#rd-ui50-css")) return;
    var s = document.createElement("style");
    s.id = "rd-ui50-css";
    s.textContent = [
      ".messages, #messages { padding-left: max(14px, env(safe-area-inset-left)) !important; padding-right: max(14px, env(safe-area-inset-right)) !important; }",
      ".msg .bubble { max-width: min(90%, 620px) !important; }",
      "#rd-yt { right: max(14px, env(safe-area-inset-right)) !important; bottom: max(92px, env(safe-area-inset-bottom) + 76px) !important; }",
      "#rd-work { left: max(12px, env(safe-area-inset-left)) !important; right: max(12px, env(safe-area-inset-right)) !important; }",
      ".composer, .input-bar, #composer { padding-left: max(12px, env(safe-area-inset-left)) !important; padding-right: max(12px, env(safe-area-inset-right)) !important; }",
      "#rd-voice-sub { position:fixed; left:50%; bottom:max(108px, env(safe-area-inset-bottom) + 96px); transform:translateX(-50%); z-index:10020; max-width:min(92vw,520px); padding:10px 16px; border-radius:14px; background:rgba(12,12,16,.92); border:1px solid #3a3a48; color:#eaeaf0; font:15px/1.45 system-ui,sans-serif; text-align:center; pointer-events:none; opacity:0; transition:opacity .25s ease; box-shadow:0 8px 28px rgba(0,0,0,.4); }",
      "#rd-voice-sub.show { opacity:1; }",
      "#rd-voice-sub .rd-sub-line { display:block; animation:rdSubIn .35s ease; }",
      "@keyframes rdSubIn { from { opacity:0; transform:translateY(6px);} to { opacity:1; transform:none;} }",
      ".rd-prov { display:inline-flex; align-items:center; margin-right:6px; }",
      ".rd-prov svg { width:16px; height:16px; display:block; }"
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
      var w1 = document.getElementById("rd-prov-familySelect");
      if (w1 && fam) w1.innerHTML = providerSvg(fam.value);
      var w2 = document.getElementById("rd-prov-modelSelect");
      if (w2) w2.innerHTML = providerSvg((fam && fam.value) || (mod && mod.value));
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
  function hookPasteImage() {
    if (document.__rdPaste50) return;
    document.__rdPaste50 = true;
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
    var el = ensureVoiceSub();
    el.innerHTML = '<span class="rd-sub-line"></span>';
    el.querySelector(".rd-sub-line").textContent = text;
    el.classList.add("show");
  }
  function hideSub() {
    var el = document.getElementById("rd-voice-sub");
    if (el) el.classList.remove("show");
  }
  function splitSentences(text) {
    var t = String(text || "").replace(/\*\*/g, "").replace(/\n+/g, " ").trim();
    var parts = t.split(/(?<=[.!?…])\s+/).filter(function (s) { return s.trim().length > 1; });
    if (!parts.length) parts = [t.slice(0, 160)];
    return parts;
  }
  function patchSpeak() {
    if (typeof window.speakJarvis !== "function" || window.speakJarvis.__rd50) return;
    window.speakJarvis = async function (text) {
      var parts = splitSentences(text);
      if (!window.speechSynthesis) {
        for (var i = 0; i < parts.length; i++) {
          showSubLine(parts[i]);
          await new Promise(function (r) { setTimeout(r, Math.min(4000, 900 + parts[i].length * 35)); });
        }
        hideSub();
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
    };
    window.speakJarvis.__rd50 = true;
    if (typeof window.speakGoogle === "function") window.speakGoogle = function (t) { return window.speakJarvis(t); };
  }
  function patchHonesty() {
    if (typeof window.forceToolsFromUser !== "function" || window.forceToolsFromUser.__rd50h) return;
    var prev = window.forceToolsFromUser;
    window.forceToolsFromUser = function (ut, at) { return forceModelHonesty(ut, prev(ut, at)); };
    window.forceToolsFromUser.__rd50h = true;
  }
  try {
    if (typeof CONTINUITY === "string" && CONTINUITY.indexOf("Jujur soal model") === -1) {
      CONTINUITY += "\nJujur soal model: sebutkan family + model ID di chip. Jangan bilang off-limits. Jangan bilang kamu Kiro.\n";
    }
  } catch (e) {}
  function boot() {
    injectUiPolishCSS();
    decorateModelSelects();
    hookPasteImage();
    patchSpeak();
    patchHonesty();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else setTimeout(boot, 200);
  setTimeout(boot, 1000);
  setTimeout(boot, 3000);
})();
