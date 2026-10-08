/* RolxDesk extras-fix v6.8.1 — restored; Google direct + hosted */
(function () {
  if (window.__RD_FIX_V681__) return;
  window.__RD_FIX_V681__ = true;

  function readNvFromStorage() {
    try {
      var solo = localStorage.getItem("rd_nvidia_key") || "";
      if (solo && solo.trim()) return solo.trim();
      var all = JSON.parse(localStorage.getItem("rd_keys") || "{}");
      return String(all.nvidia || all.NVIDIA || all.nvidiaKey || "").trim();
    } catch (e) { return ""; }
  }
  function ensureNvInState() {
    try {
      if (window.state && state.keys) {
        var from = readNvFromStorage();
        if (from) state.keys.nvidia = from;
        return String(state.keys.nvidia || from || "").trim();
      }
    } catch (e) {}
    return readNvFromStorage();
  }
  function injectVersionBadge() {
    var el = document.getElementById("rd-patch-ver");
    if (!el) {
      el = document.createElement("div");
      el.id = "rd-patch-ver";
      el.style.cssText = "font-size:11px;color:#7c6af7;margin:8px 0 4px;padding:0 4px;opacity:.9";
      var host = document.getElementById("settingsBody") || document.getElementById("settingsPanel") || document.querySelector(".settings-body");
      if (host) host.insertBefore(el, host.firstChild); else return;
    }
    el.textContent = "RolxDesk patch v6.8.1 · restored";
  }
  function currentFamily() {
    try { var el = document.getElementById("familySelect"); return el ? String(el.value || "") : ""; } catch (e) { return ""; }
  }
  function currentModel() {
    try {
      if (window.state && state.selectedModel) return String(state.selectedModel);
      var el = document.getElementById("modelSelect");
      return el ? String(el.value || "") : "";
    } catch (e) { return ""; }
  }
  function clientOpenRouterKey() {
    try { if (window.state && state.keys && state.keys.openrouter) return String(state.keys.openrouter).trim(); } catch (e) {}
    try { var el = document.getElementById("keyOpenRouter"); if (el && el.value) return String(el.value).trim(); } catch (e2) {}
    return "";
  }
  function getKey(name) {
    try { if (window.state && state.keys && state.keys[name]) return String(state.keys[name]).trim(); } catch (e) {}
    try {
      var map = { google: "keyGoogle", venice: "keyVenice", nvidia: "keyNvidia" };
      var el = document.getElementById(map[name] || "");
      if (el && el.value) return String(el.value).trim();
    } catch (e2) {}
    if (name === "nvidia") return readNvFromStorage();
    return "";
  }
  function shouldUseNvidia(fam, model) {
    var f = String(fam || "").toLowerCase();
    var m = String(model || "");
    if (f === "hosted" || f === "google") return false;
    if (f === "nvidia" || f === "kimi" || f === "glm" || f === "deepseek") return true;
    if (/^nvidia\//.test(m) || /^moonshotai\//.test(m) || /^z-ai\//.test(m) || /^deepseek-ai\//.test(m)) return true;
    return false;
  }
  async function callNvidiaViaProxy(messages, modelId, apiKey, temp, maxTok) {
    var mid = String(modelId || "").replace(/:free$/i, "");
    var r = await fetch("/api/openai-compat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        baseUrl: "https://integrate.api.nvidia.com/v1",
        apiKey: apiKey,
        subPath: "/chat/completions",
        body: { model: mid, messages: messages, temperature: temp, max_tokens: maxTok, stream: false }
      })
    });
    var j = await r.json().catch(function () { return {}; });
    if (!r.ok) throw new Error(j.error || j.message || "NVIDIA HTTP " + r.status);
    return j;
  }
  async function callHosted(messages, modelId, temp, maxTok) {
    var r = await fetch("/api/hosted-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: modelId || "openrouter/free", messages: messages, temperature: temp, max_tokens: maxTok })
    });
    var j = await r.json().catch(function () { return {}; });
    if (!r.ok) throw new Error(j.error || j.message || "Hosted HTTP " + r.status);
    if (j && Array.isArray(j.choices)) return j;
    if (j && j.content) return { choices: [{ message: { role: "assistant", content: String(j.content) } }] };
    return j;
  }
  async function callGoogleDirect(messages, model, apiKey, temp, maxTok) {
    var mid = model || "gemini-2.0-flash";
    var gmap = {
      "gemini-3.8-flash": "gemini-2.5-flash",
      "gemini-3.5-flash": "gemini-2.5-flash",
      "gemini-3.5-flash-lite": "gemini-2.0-flash-lite",
      "gemini-2.5-flash": "gemini-2.5-flash"
    };
    if (gmap[mid]) mid = gmap[mid];
    var contents = [];
    for (var i = 0; i < messages.length; i++) {
      var m = messages[i];
      if (m.role === "system") continue;
      contents.push({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: String(m.content || "") }] });
    }
    var url = "https://generativelanguage.googleapis.com/v1beta/models/" + encodeURIComponent(mid) + ":generateContent?key=" + encodeURIComponent(apiKey);
    var gr = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: contents, generationConfig: { temperature: temp, maxOutputTokens: maxTok } })
    });
    var gj = await gr.json().catch(function () { return {}; });
    if (!gr.ok) throw new Error(String((gj.error && gj.error.message) || gj.message || "Google HTTP " + gr.status));
    var text = "";
    try { text = gj.candidates[0].content.parts.map(function (p) { return p.text || ""; }).join(""); } catch (e1) {}
    return { choices: [{ message: { role: "assistant", content: text || "(kosong)" } }] };
  }
  function patchCallModel() {
    if (typeof window.callModel !== "function") return;
    if (window.callModel.__rdFix681) return;
    var prev = window.callModel;
    window.callModel = async function (messages) {
      var fam = currentFamily();
      var model = currentModel();
      var temp = 0.7, maxTok = 2048;
      try {
        if (window.state && state.settings) {
          temp = parseFloat(state.settings.temperature ?? 0.7);
          maxTok = parseInt(state.settings.maxTokens ?? 2048, 10);
        }
      } catch (e1) {}

      if (fam === "google" || /^gemini/i.test(model)) {
        var gkey = getKey("google");
        if (!gkey) throw new Error("Google AI Studio API Key belum diisi di Settings.");
        if (typeof callGoogle === "function") {
          try { return await callGoogle(messages, model, gkey, temp, maxTok); } catch (e) {}
        }
        return await callGoogleDirect(messages, model, gkey, temp, maxTok);
      }
      if (fam === "venice" || fam === "manus" || fam === "custom" || fam === "9router") {
        return prev.apply(this, arguments);
      }
      if (shouldUseNvidia(fam, model)) {
        var nvKey = ensureNvInState() || getKey("nvidia");
        if (!nvKey) {
          if (/:free$/i.test(model) || fam === "hosted") return await callHosted(messages, model, temp, maxTok);
          throw new Error("NVIDIA API Key belum diisi, atau pilih Hosted RD.");
        }
        return await callNvidiaViaProxy(messages, model, nvKey, temp, maxTok);
      }
      if (fam === "hosted") return await callHosted(messages, model || "openrouter/free", temp, maxTok);
      if (!clientOpenRouterKey()) return await callHosted(messages, model || "openrouter/free", temp, maxTok);
      return prev.apply(this, arguments);
    };
    window.callModel.__rdFix681 = true;
  }
  async function loadHostedModels() {
    try {
      var r = await fetch("/api/hosted-chat");
      var j = await r.json();
      if (!r.ok || !j.models || typeof MODELS === "undefined") return;
      MODELS.hosted = j.models.map(function (m) { return { id: m.id, name: m.name || m.id }; });
      var sel = document.getElementById("familySelect");
      if (sel && !sel.querySelector('option[value="hosted"]')) {
        var opt = document.createElement("option");
        opt.value = "hosted";
        opt.textContent = "Hosted RD (tanpa API key)";
        sel.appendChild(opt);
      }
    } catch (e) {}
  }
  function boot() {
    ensureNvInState();
    injectVersionBadge();
    patchCallModel();
    loadHostedModels();
  }
  setTimeout(boot, 50);
  setTimeout(boot, 400);
  setTimeout(boot, 1200);
  setInterval(function () { patchCallModel(); injectVersionBadge(); }, 6000);
})();
