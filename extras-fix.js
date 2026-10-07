/* RolxDesk extras-fix v6.7.0 — hosted-chat (no client key) + NVIDIA live IDs */
(function () {
  if (window.__RD_FIX_V67__) return;
  window.__RD_FIX_V67__ = true;
  window.__RD_FIX_V661__ = true;

  function readNvFromStorage() {
    try {
      var solo = localStorage.getItem("rd_nvidia_key") || "";
      if (solo && solo.trim()) return solo.trim();
      var all = JSON.parse(localStorage.getItem("rd_keys") || "{}");
      return String(all.nvidia || all.NVIDIA || all.nvidiaKey || "").trim();
    } catch (e) {
      return "";
    }
  }
  function writeNvToStorage(v) {
    v = String(v || "").trim();
    try {
      localStorage.setItem("rd_nvidia_key", v);
    } catch (e) {}
    try {
      var all = JSON.parse(localStorage.getItem("rd_keys") || "{}");
      all.nvidia = v;
      localStorage.setItem("rd_keys", JSON.stringify(all));
    } catch (e2) {}
    try {
      if (window.state && state.keys) state.keys.nvidia = v;
    } catch (e3) {}
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

  function ensureNvidiaInput() {
    var existing = document.getElementById("keyNvidia") || document.getElementById("rdNvidiaKey");
    if (existing) {
      var val = readNvFromStorage();
      if (val && !existing.value) existing.value = val;
      existing.addEventListener("change", function () {
        writeNvToStorage(existing.value);
      });
      existing.addEventListener("blur", function () {
        writeNvToStorage(existing.value);
      });
      document.querySelectorAll("#rd-nvidia-key-group").forEach(function (n) {
        if (!n.contains(existing)) n.remove();
      });
      return;
    }
    var host =
      document.getElementById("settingsBody") ||
      document.getElementById("settingsPanel") ||
      document.querySelector(".settings-body") ||
      document.querySelector("#drawer .drawer-body");
    if (!host) return;
    document.querySelectorAll("#rd-nvidia-key-group").forEach(function (n) {
      n.remove();
    });
    var group = document.createElement("div");
    group.id = "rd-nvidia-key-group";
    group.className = "settings-group";
    group.style.cssText = "margin:12px 0;padding:0 4px";
    group.innerHTML =
      '<label>NVIDIA API Key <span style="color:#76B900;font-size:11px">(build.nvidia.com)</span></label>' +
      '<input type="password" id="keyNvidia" placeholder="nvapi-..." autocomplete="off" style="width:100%;margin-top:4px" />' +
      '<p style="font-size:11px;color:#888;margin:6px 0 0">Opsional. Tanpa key ini, model NVIDIA user-side butuh key. Mode Hosted RD pakai key server (OpenRouter).</p>';
    host.appendChild(group);
    var inp = document.getElementById("keyNvidia");
    if (inp) {
      var val2 = readNvFromStorage();
      if (val2) inp.value = val2;
      inp.addEventListener("change", function () {
        writeNvToStorage(inp.value);
      });
      inp.addEventListener("blur", function () {
        writeNvToStorage(inp.value);
      });
    }
  }

  function injectVersionBadge() {
    var el = document.getElementById("rd-patch-ver");
    if (!el) {
      el = document.createElement("div");
      el.id = "rd-patch-ver";
      el.style.cssText =
        "font-size:11px;color:#7c6af7;margin:8px 0 4px;padding:0 4px;opacity:.9";
      var host =
        document.getElementById("settingsBody") ||
        document.getElementById("settingsPanel") ||
        document.querySelector(".settings-body");
      if (host) host.insertBefore(el, host.firstChild);
      else return;
    }
    el.textContent = "RolxDesk patch v6.7.0 · Hosted + NVIDIA";
  }

  function patchSaveLoad() {
    if (typeof window.saveSettings === "function" && !window.saveSettings.__rdNv67) {
      var prevSave = window.saveSettings;
      window.saveSettings = function () {
        var inp = document.getElementById("keyNvidia") || document.getElementById("rdNvidiaKey");
        if (inp) writeNvToStorage(inp.value);
        var r = prevSave.apply(this, arguments);
        ensureNvInState();
        return r;
      };
      window.saveSettings.__rdNv67 = true;
    }
    if (typeof window.loadSettings === "function" && !window.loadSettings.__rdNv67) {
      var prevLoad = window.loadSettings;
      window.loadSettings = function () {
        var r = prevLoad.apply(this, arguments);
        ensureNvInState();
        var inp = document.getElementById("keyNvidia") || document.getElementById("rdNvidiaKey");
        var v = readNvFromStorage();
        if (inp && v) inp.value = v;
        return r;
      };
      window.loadSettings.__rdNv67 = true;
    }
  }

  function currentFamily() {
    try {
      var el = document.getElementById("familySelect");
      return el ? String(el.value || "") : "";
    } catch (e) {
      return "";
    }
  }
  function currentModel() {
    try {
      if (window.state && state.selectedModel) return String(state.selectedModel);
      var el = document.getElementById("modelSelect");
      return el ? String(el.value || "") : "";
    } catch (e) {
      return "";
    }
  }

  var NV_CATALOG = {
    nvidia: [
      { id: "nvidia/nemotron-3.5-lightning-30b-a3b", name: "Nemotron 3.5 Lightning 30B" },
      { id: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning", name: "Nemotron 3 Nano Omni" },
      { id: "nvidia/nemotron-nano-3-30b-a3b", name: "Nemotron Nano 3 30B" }
    ],
    kimi: [{ id: "moonshotai/kimi-k2.6", name: "Kimi K2.6 (NVIDIA)" }],
    glm: [
      { id: "z-ai/glm-5.3", name: "GLM 5.3" },
      { id: "z-ai/glm-5.3-flash", name: "GLM 5.3 Flash" }
    ],
    deepseek: [{ id: "deepseek-ai/deepseek-v4.1-flash", name: "DeepSeek V4.1 Flash" }]
  };

  function patchModelsCatalog() {
    try {
      if (typeof MODELS === "undefined") return;
      MODELS.nvidia = NV_CATALOG.nvidia.slice();
      MODELS.kimi = NV_CATALOG.kimi.slice();
      MODELS.glm = NV_CATALOG.glm.slice();
      MODELS.deepseek = NV_CATALOG.deepseek.slice();
    } catch (e) {}
  }

  async function loadHostedModels() {
    try {
      var r = await fetch("/api/hosted-chat");
      var j = await r.json();
      if (!r.ok || !j.models) return;
      if (typeof MODELS === "undefined") return;
      MODELS.hosted = j.models.map(function (m) {
        return { id: m.id, name: m.name || m.id };
      });
      var sel = document.getElementById("familySelect");
      if (sel && !sel.querySelector('option[value="hosted"]')) {
        var opt = document.createElement("option");
        opt.value = "hosted";
        opt.textContent = "Hosted RD (tanpa API key)";
        sel.appendChild(opt);
      }
    } catch (e) {}
  }

  function shouldUseNvidia(fam, model) {
    var f = String(fam || "").toLowerCase();
    var m = String(model || "");
    if (f === "hosted") return false;
    if (f === "nvidia" || f === "kimi" || f === "glm" || f === "deepseek" || f === "qwen_nv") return true;
    if (/^nvidia\//.test(m) && f !== "persona") return true;
    if (/^moonshotai\/|^z-ai\/|^deepseek-ai\//.test(m) && f !== "persona") return true;
    return false;
  }

  function resolveNvidiaModelId(id) {
    var map = {
      "nvidia/nemotron-3.5-lightning": "nvidia/nemotron-3.5-lightning-30b-a3b",
      "moonshotai/kimi-k3": "moonshotai/kimi-k2.6",
      "z-ai/glm-5-3": "z-ai/glm-5.3",
      "z-ai/glm-5-3-flash": "z-ai/glm-5.3-flash"
    };
    var s = String(id || "").replace(/:free$/i, "");
    return map[s] || s;
  }

  async function callNvidiaViaProxy(messages, modelId, apiKey, temp, maxTok) {
    var mid = resolveNvidiaModelId(modelId);
    var r = await fetch("/api/openai-compat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        baseUrl: "https://integrate.api.nvidia.com/v1",
        apiKey: apiKey,
        subPath: "/chat/completions",
        body: {
          model: mid,
          messages: messages,
          temperature: temp,
          max_tokens: maxTok,
          stream: false
        }
      })
    });
    var j = await r.json().catch(function () {
      return {};
    });
    if (!r.ok) throw new Error(j.error || j.message || "NVIDIA HTTP " + r.status);
    return j;
  }

  async function callHosted(messages, modelId, temp, maxTok) {
    var r = await fetch("/api/hosted-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: modelId || "openrouter/free",
        messages: messages,
        temperature: temp,
        max_tokens: maxTok
      })
    });
    var j = await r.json().catch(function () {
      return {};
    });
    if (!r.ok) throw new Error(j.error || j.message || "Hosted HTTP " + r.status);
    return j;
  }

  function clientOpenRouterKey() {
    try {
      if (window.state && state.keys && state.keys.openrouter) return String(state.keys.openrouter).trim();
    } catch (e) {}
    try {
      var el = document.getElementById("keyOpenRouter");
      if (el && el.value) return String(el.value).trim();
    } catch (e2) {}
    return "";
  }

  function patchCallModel() {
    if (typeof window.callModel !== "function") return;
    if (window.callModel.__rdFix67) return;
    var prev = window.callModel;
    window.callModel = async function (messages) {
      var fam = currentFamily();
      var model = currentModel();
      var nvKey = ensureNvInState() || readNvFromStorage();
      try {
        var inp = document.getElementById("keyNvidia") || document.getElementById("rdNvidiaKey");
        if (inp && String(inp.value || "").trim()) {
          writeNvToStorage(inp.value);
          nvKey = String(inp.value).trim();
        }
      } catch (e0) {}

      var temp = 0.7;
      var maxTok = 2048;
      try {
        if (window.state && state.settings) {
          temp = parseFloat(state.settings.temperature ?? 0.7);
          maxTok = parseInt(state.settings.maxTokens ?? 2048, 10);
        }
      } catch (e1) {}

      // 1) NVIDIA family + user key
      if (shouldUseNvidia(fam, model)) {
        if (!nvKey) {
          // fallback hosted if model ends with :free or is openrouter-style
          if (/:free$/i.test(model) || fam === "hosted") {
            return await callHosted(messages, model, temp, maxTok);
          }
          throw new Error(
            "NVIDIA API Key belum diisi. Settings → NVIDIA API Key, atau pilih family Hosted RD."
          );
        }
        return await callNvidiaViaProxy(messages, model, nvKey, temp, maxTok);
      }

      // 2) Hosted family — selalu server key
      if (fam === "hosted") {
        return await callHosted(messages, model || "openrouter/free", temp, maxTok);
      }

      // 3) OpenRouter families tanpa client key → hosted
      var orKey = clientOpenRouterKey();
      if (!orKey) {
        // Persona / gpt / qwen dll tanpa key user → server OPENROUTER_API_KEY
        var mid = model || "openrouter/free";
        if (!/:free$/i.test(mid) && mid.indexOf("/") > 0) {
          // coba tetap kirim; allowlist server akan filter
        }
        try {
          return await callHosted(messages, mid, temp, maxTok);
        } catch (he) {
          // kalau model tidak di allowlist, error jelas
          throw new Error(
            (he && he.message) ||
              "Hosted gagal. Isi OpenRouter key di Settings atau pilih model Hosted RD."
          );
        }
      }

      return prev.apply(this, arguments);
    };
    window.callModel.__rdFix67 = true;
    window.callModel.__rdFix661 = true;
  }

  function boot() {
    patchSaveLoad();
    ensureNvInState();
    ensureNvidiaInput();
    injectVersionBadge();
    patchModelsCatalog();
    patchCallModel();
    loadHostedModels();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else setTimeout(boot, 50);
  setTimeout(boot, 400);
  setTimeout(boot, 1200);
  setTimeout(function () {
    patchModelsCatalog();
    patchCallModel();
    loadHostedModels();
  }, 2500);
  setInterval(function () {
    patchCallModel();
    ensureNvidiaInput();
    injectVersionBadge();
  }, 6000);

  document.addEventListener(
    "change",
    function (e) {
      if (e.target && e.target.id === "familySelect") {
        setTimeout(patchModelsCatalog, 30);
        setTimeout(loadHostedModels, 50);
      }
    },
    true
  );
})();
