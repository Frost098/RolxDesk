/* RolxDesk extras-fix v6.6.1 — live NVIDIA model IDs + proxy (bukan OpenRouter) */
(function () {
  if (window.__RD_EXTRAS_FIX661__) return;
  window.__RD_EXTRAS_FIX661__ = true;
  window.__RD_PATCH_VERSION__ = "6.6.1";

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
      '<p style="font-size:11px;color:#888;margin:6px 0 0">Nvidia / Kimi / GLM / DeepSeek → integrate.api.nvidia.com (bukan OpenRouter).</p>';
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
    el.textContent = "RolxDesk patch v" + window.__RD_PATCH_VERSION__ + " · NVIDIA live IDs";
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

  // Katalog resmi dari integrate.api.nvidia.com/v1/models (okt 2026)
  var NV_CATALOG = {
    nvidia: [
      { id: "nvidia/nemotron-3-super-120b-a12b", name: "Nemotron 3 Super 120B" },
      { id: "nvidia/nemotron-3-ultra-550b-a55b", name: "Nemotron 3 Ultra 550B" },
      { id: "nvidia/nemotron-3.5-lightning-30b-a3b", name: "Nemotron 3.5 Lightning 30B" },
      { id: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning", name: "Nemotron 3 Nano Omni" },
      { id: "nvidia/nemotron-nano-3-30b-a3b", name: "Nemotron Nano 3 30B" },
      { id: "meta/muse-glimmer-30b", name: "Muse Glimmer 30B" },
      { id: "google/gemma-4-31b-it", name: "Gemma 4 31B" },
      { id: "openai/gpt-oss-20b", name: "GPT-OSS 20B" }
    ],
    kimi: [
      { id: "moonshotai/kimi-k3", name: "Kimi K3" },
      { id: "moonshotai/kimi-k2.6", name: "Kimi K2.6" }
    ],
    glm: [
      { id: "z-ai/glm-5.3", name: "GLM 5.3" },
      { id: "z-ai/glm-5.3-flash", name: "GLM 5.3 Flash" }
    ],
    deepseek: [{ id: "deepseek-ai/deepseek-v4.1-flash", name: "DeepSeek V4.1 Flash" }],
    qwen_nv: [] // tidak ada Qwen di katalog NVIDIA saat ini
  };

  function patchModelsCatalog() {
    try {
      if (typeof MODELS === "undefined") return;
      MODELS.nvidia = NV_CATALOG.nvidia.slice();
      MODELS.kimi = NV_CATALOG.kimi.slice();
      MODELS.glm = NV_CATALOG.glm.slice();
      MODELS.deepseek = NV_CATALOG.deepseek.slice();
      MODELS.qwen_nv = [];
      // Refresh dropdown kalau family nvidia-ish aktif
      var fam = currentFamily();
      var sel = document.getElementById("modelSelect");
      if (sel && NV_CATALOG[fam]) {
        var list = NV_CATALOG[fam];
        var cur = sel.value;
        sel.innerHTML = list
          .map(function (m) {
            return '<option value="' + m.id + '">' + m.name + "</option>";
          })
          .join("");
        var ids = list.map(function (m) {
          return m.id;
        });
        if (ids.indexOf(cur) >= 0) sel.value = cur;
        else if (list[0]) sel.value = list[0].id;
      }
    } catch (e) {}
  }

  function shouldUseNvidia(fam, model) {
    var f = String(fam || "").toLowerCase();
    var m = String(model || "").toLowerCase();
    if (f === "nvidia" || f === "kimi" || f === "glm" || f === "deepseek" || f === "qwen_nv") return true;
    if (/^nvidia\//.test(m)) return true;
    if (/^moonshotai\//.test(m)) return true;
    if (/^z-ai\//.test(m)) return true;
    if (/^deepseek-ai\//.test(m)) return true;
    if (/^meta\/muse-|^google\/gemma-4|^openai\/gpt-oss/.test(m)) return true;
    return false;
  }

  function resolveNvidiaModelId(modelId) {
    var m = String(modelId || "").trim().replace(/:free$/i, "");
    // Alias slug lama / salah → ID live
    var map = {
      "nvidia/nemotron-3.5-lightning": "nvidia/nemotron-3.5-lightning-30b-a3b",
      "nvidia/nemotron-3-nano-omni-30b-a3b": "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning",
      "deepseek-ai/deepseek-v4-pro-0813": "deepseek-ai/deepseek-v4.1-flash",
      "deepseek-ai/deepseek-v3.2": "deepseek-ai/deepseek-v4.1-flash",
      "deepseek-ai/deepseek-v4-flash": "deepseek-ai/deepseek-v4.1-flash",
      "z-ai/glm-5.2": "z-ai/glm-5.3",
      "z-ai/glm-4.7": "z-ai/glm-5.3",
      "z-ai/glm-5": "z-ai/glm-5.3",
      "z-ai/glm-5-3": "z-ai/glm-5.3",
      "z-ai/glm-5-3-flash": "z-ai/glm-5.3-flash",
      "z-ai/glm-5.3-flash": "z-ai/glm-5.3-flash",
      "moonshotai/kimi-k2": "moonshotai/kimi-k2.6",
      "meta/llama-3.3-70b-instruct": "nvidia/llama-3.1-nemotron-70b-instruct",
      "meta/llama-3.1-8b-instruct": "nvidia/nemotron-nano-3-30b-a3b"
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
      var hint = "";
      if (r.status === 404 || r.status === 410) {
        hint =
          " — model id tidak tersedia di NVIDIA (" +
          mid +
          "). Ganti model di dropdown (katalog v6.6.1).";
      }
      throw new Error((typeof msg === "string" ? msg : JSON.stringify(msg)) + hint);
    }
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
    if (window.callModel.__rdFix661) return;
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
        return await callNvidiaViaProxy(messages, model, nvKey, temp, maxTok);
      }
      return prev.apply(this, arguments);
    };
    window.callModel.__rdFix661 = true;
    window.callModel.__rdNv = true;
  }

  function boot() {
    patchSaveLoad();
    ensureNvInState();
    ensureNvidiaInput();
    injectVersionBadge();
    patchModelsCatalog();
    patchCallModel();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else setTimeout(boot, 50);
  setTimeout(boot, 400);
  setTimeout(boot, 1200);
  setTimeout(function () {
    patchModelsCatalog();
    patchCallModel();
  }, 2500);
  setInterval(function () {
    patchCallModel();
    ensureNvidiaInput();
    injectVersionBadge();
    patchModelsCatalog();
  }, 6000);

  // Saat user ganti family, refresh list model
  document.addEventListener(
    "change",
    function (e) {
      if (e.target && e.target.id === "familySelect") setTimeout(patchModelsCatalog, 30);
    },
    true
  );
})();
