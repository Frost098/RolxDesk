/* RolxDesk extras-fix v6.6.0 — NVIDIA via proxy (bukan OpenRouter) + single key UI + version */
(function () {
  if (window.__RD_EXTRAS_FIX660__) return;
  window.__RD_EXTRAS_FIX660__ = true;
  window.__RD_PATCH_VERSION__ = "6.6.0";

  function readNvFromStorage() {
    try {
      var solo = localStorage.getItem("rd_nvidia_key") || "";
      if (solo) return String(solo).trim();
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
      if (window.state) {
        state.keys = state.keys || {};
        state.keys.nvidia = v;
      }
    } catch (e3) {}
  }
  function ensureNvInState() {
    var from = readNvFromStorage();
    try {
      if (window.state) {
        state.keys = state.keys || {};
        if (from) state.keys.nvidia = from;
        return String(state.keys.nvidia || from || "").trim();
      }
    } catch (e) {}
    return from;
  }

  function ensureNvidiaInput() {
    var existing = document.getElementById("keyNvidia") || document.getElementById("rdNvidiaKey");
    if (existing) {
      var k0 = readNvFromStorage();
      if (k0 && !String(existing.value || "").trim()) existing.value = k0;
      if (!existing.__rdNvBound) {
        existing.__rdNvBound = true;
        var save0 = function () {
          writeNvToStorage(existing.value);
        };
        existing.addEventListener("change", save0);
        existing.addEventListener("blur", save0);
        existing.addEventListener("input", function () {
          clearTimeout(existing.__rdNvT);
          existing.__rdNvT = setTimeout(save0, 400);
        });
      }
      document.querySelectorAll("#rd-nvidia-key-group").forEach(function (n) {
        if (!n.contains(existing)) {
          try {
            n.remove();
          } catch (e) {}
        }
      });
      return existing;
    }
    var body =
      document.querySelector("#settingsModal .modal-body") ||
      document.querySelector("#settingsModal .modal-content");
    if (!body) return null;
    document.querySelectorAll("#rd-nvidia-key-group").forEach(function (n) {
      try {
        n.remove();
      } catch (e) {}
    });
    var group = document.createElement("div");
    group.id = "rd-nvidia-key-group";
    group.className = "form-group";
    group.style.marginTop = "12px";
    group.innerHTML =
      '<label>NVIDIA API Key <span style="color:#76B900;font-size:11px">(build.nvidia.com)</span></label>' +
      '<input type="password" id="keyNvidia" placeholder="nvapi-..." autocomplete="off" style="width:100%;margin-top:4px" />' +
      '<p style="font-size:11px;color:#888;margin:6px 0 0">Family Nvidia / Kimi / GLM / Qwen NVIDIA / DeepSeek → integrate.api.nvidia.com (bukan OpenRouter).</p>';
    body.appendChild(group);
    var inp = document.getElementById("keyNvidia");
    if (inp) {
      var k2 = readNvFromStorage();
      if (k2) inp.value = k2;
      if (!inp.__rdNvBound) {
        inp.__rdNvBound = true;
        var save = function () {
          writeNvToStorage(inp.value);
        };
        inp.addEventListener("change", save);
        inp.addEventListener("blur", save);
        inp.addEventListener("input", function () {
          clearTimeout(inp.__rdNvT);
          inp.__rdNvT = setTimeout(save, 400);
        });
      }
    }
    return inp;
  }

  function injectVersionBadge() {
    var body =
      document.querySelector("#settingsModal .modal-body") ||
      document.querySelector("#settingsModal");
    if (!body) return;
    var el = document.getElementById("rd-patch-version");
    if (!el) {
      el = document.createElement("p");
      el.id = "rd-patch-version";
      el.style.cssText = "font-size:11px;color:#7c6af7;margin:14px 0 4px;opacity:.95";
      body.appendChild(el);
    }
    el.textContent = "RolxDesk patch v" + window.__RD_PATCH_VERSION__ + " · NVIDIA via proxy";
  }

  function patchSaveLoad() {
    if (typeof window.saveSettings === "function" && !window.saveSettings.__rdNv66) {
      var prevSave = window.saveSettings;
      window.saveSettings = function () {
        var inp = document.getElementById("keyNvidia") || document.getElementById("rdNvidiaKey");
        var typed = inp ? String(inp.value || "").trim() : "";
        var before = typed || readNvFromStorage();
        var r = prevSave.apply(this, arguments);
        if (before) writeNvToStorage(before);
        ensureNvidiaInput();
        injectVersionBadge();
        return r;
      };
      window.saveSettings.__rdNv66 = true;
    }
    if (typeof window.loadSettings === "function" && !window.loadSettings.__rdNv66) {
      var prevLoad = window.loadSettings;
      window.loadSettings = function () {
        var r = prevLoad.apply(this, arguments);
        ensureNvInState();
        var inp = ensureNvidiaInput();
        var k = readNvFromStorage();
        if (inp && k) inp.value = k;
        injectVersionBadge();
        return r;
      };
      window.loadSettings.__rdNv66 = true;
    }
  }

  function currentFamily() {
    try {
      var el = document.getElementById("familySelect");
      if (el && el.value) return String(el.value).toLowerCase();
    } catch (e) {}
    return "";
  }
  function currentModel() {
    try {
      var el = document.getElementById("modelSelect");
      if (el && el.value) return String(el.value);
    } catch (e) {}
    try {
      if (window.state && state.selectedModel) return String(state.selectedModel);
    } catch (e2) {}
    return "";
  }

  /** Model/family yang WAJIB lewat NVIDIA key, bukan OpenRouter */
  function shouldUseNvidia(fam, model) {
    var f = String(fam || "").toLowerCase();
    var m = String(model || "").toLowerCase();
    if (f === "nvidia" || f === "kimi" || f === "glm" || f === "qwen_nv" || f === "deepseek") return true;
    if (/^nvidia\//.test(m)) return true;
    if (/^moonshotai\//.test(m) || /kimi-k3|kimi-k2/.test(m)) return true;
    if (/^z-ai\//.test(m) || /^glm-/.test(m)) return true;
    if (/^deepseek-ai\//.test(m)) return true;
    if (f === "qwen" && /qwen2\.5-7b|qwen3-next|qwen3\.5-122b|qwen3-coder-480b/.test(m) && m.indexOf(":free") < 0)
      return true;
    return false;
  }

  function resolveNvidiaModelId(modelId) {
    var m = String(modelId || "").trim();
    // OpenRouter free slug → NVIDIA slug
    m = m.replace(/:free$/i, "");
    var map = {
      "nvidia/nemotron-3-super-120b-a12b": "nvidia/nemotron-3-super-120b-a12b",
      "nvidia/nemotron-3.5-lightning": "nvidia/nemotron-3.5-lightning",
      "nvidia/nemotron-3-ultra-550b-a55b": "nvidia/nemotron-3-ultra-550b-a55b",
      "moonshotai/kimi-k3": "moonshotai/kimi-k3",
      "moonshotai/kimi-k2.6": "moonshotai/kimi-k2.6",
      "z-ai/glm-5.2": "z-ai/glm-5.2",
      "z-ai/glm-4.7": "z-ai/glm-4.7",
      "z-ai/glm-5-3": "z-ai/glm-5-3",
      "z-ai/glm-5-3-flash": "z-ai/glm-5-3-flash"
    };
    if (map[m]) return map[m];
    return m;
  }

  async function callNvidiaViaProxy(messages, modelId, apiKey, temp, maxTok) {
    var mid = resolveNvidiaModelId(modelId);
    var payload = {
      model: mid,
      messages: messages,
      temperature: typeof temp === "number" ? temp : 0.7,
      max_tokens: typeof maxTok === "number" ? maxTok : 2048,
      stream: false
    };
    var r = await fetch("/api/openai-compat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        baseUrl: "https://integrate.api.nvidia.com/v1",
        apiKey: apiKey,
        path: "/chat/completions",
        method: "POST",
        body: payload
      })
    });
    var data = await r.json().catch(function () {
      return {};
    });
    if (!r.ok) {
      var msg =
        (data && data.error && (data.error.message || data.error)) ||
        data.message ||
        data.error ||
        "NVIDIA proxy HTTP " + r.status;
      throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
    }
    // Normalisasi ke string seperti callModel core
    if (typeof data === "string") return data;
    if (data.choices && data.choices[0]) {
      var c = data.choices[0].message || data.choices[0];
      if (typeof c === "string") return c;
      if (c && c.content != null) return c.content;
    }
    if (data.content) return data.content;
    return data;
  }

  function patchCallModel() {
    if (typeof window.callModel !== "function") return;
    // Selalu re-wrap paling luar agar tidak ke OpenRouter
    if (window.callModel.__rdFix660) return;
    var prev = window.callModel;
    window.callModel = async function (messages) {
      var fam = currentFamily();
      var model = currentModel();
      var nvKey = ensureNvInState() || readNvFromStorage();
      // Simpan key dari form kalau user baru ngetik
      try {
        var inp = document.getElementById("keyNvidia") || document.getElementById("rdNvidiaKey");
        if (inp && String(inp.value || "").trim()) {
          writeNvToStorage(inp.value);
          nvKey = String(inp.value).trim();
        }
      } catch (e0) {}

      if (shouldUseNvidia(fam, model)) {
        if (!nvKey) {
          throw new Error(
            "NVIDIA API Key belum diisi. Settings → NVIDIA API Key (build.nvidia.com), lalu Simpan."
          );
        }
        var temp = 0.7;
        var maxTok = 2048;
        try {
          if (window.state && state.settings) {
            temp = parseFloat(state.settings.temperature ?? 0.7);
            maxTok = parseInt(state.settings.maxTokens ?? 2048, 10);
          }
        } catch (e1) {}
        // JANGAN fallback ke OpenRouter
        return await callNvidiaViaProxy(messages, model, nvKey, temp, maxTok);
      }
      return prev.apply(this, arguments);
    };
    window.callModel.__rdFix660 = true;
    window.callModel.__rdNv = true;
  }

  function recolorAvatars() {
    try {
      document.querySelectorAll("[data-model], .model-chip, .avatar, .model-avatar, img[alt]").forEach(function (n) {
        var t = (n.getAttribute("data-model") || n.getAttribute("alt") || n.textContent || "").toLowerCase();
        var color = null;
        if (/grok|xai/.test(t)) color = "#e8e8e8";
        else if (/gemini|google/.test(t)) color = "#8ab4f8";
        else if (/claude|anthropic/.test(t)) color = "#d4a27f";
        else if (/cohere|north/.test(t)) color = "#39594d";
        else if (/qwen/.test(t)) color = "#6366f1";
        else if (/kimi|moonshot/.test(t)) color = "#c0c0c0";
        else if (/glm|z-ai/.test(t)) color = "#3b82f6";
        else if (/nemotron|nvidia/.test(t)) color = "#76B900";
        else if (/deepseek/.test(t)) color = "#4d6bfe";
        if (color && n.querySelector) {
          n.querySelectorAll("svg, path, circle").forEach(function (s) {
            try {
              if (s.getAttribute("fill") !== "none") s.setAttribute("fill", color);
              s.style.color = color;
            } catch (e) {}
          });
        }
      });
    } catch (e) {}
  }

  function boot() {
    patchSaveLoad();
    ensureNvInState();
    ensureNvidiaInput();
    injectVersionBadge();
    patchCallModel();
    recolorAvatars();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else setTimeout(boot, 50);
  setTimeout(boot, 400);
  setTimeout(boot, 1200);
  setTimeout(boot, 3000);
  setInterval(function () {
    patchCallModel();
    ensureNvidiaInput();
    injectVersionBadge();
  }, 5000);
})();
