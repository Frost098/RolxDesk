/* RolxDesk extras-fix v6.5.0 — single NVIDIA key UI + openai-compat proxy + SVG */
(function () {
  if (window.__RD_EXTRAS_FIX650__) return;
  window.__RD_EXTRAS_FIX650__ = true;
  window.__RD_EXTRAS_FIX642__ = true;

  function readNvFromStorage() {
    try {
      var solo = localStorage.getItem("rd_nvidia_key") || "";
      if (solo) return String(solo).trim();
      var all = JSON.parse(localStorage.getItem("rd_keys") || "{}");
      return all.nvidia || all.NVIDIA || all.nvidiaKey || "";
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
    try {
      var k = (window.state && state.keys && state.keys.nvidia) || "";
      if (k) return String(k).trim();
    } catch (e) {}
    var from = readNvFromStorage();
    if (from && window.state) {
      try {
        state.keys = state.keys || {};
        state.keys.nvidia = from;
      } catch (e2) {}
    }
    return from || "";
  }

  function ensureNvidiaInput() {
    // Satu input saja — jangan dobel di luar panel
    var existing = document.getElementById("keyNvidia") || document.getElementById("rdNvidiaKey");
    if (existing) {
      var k0 = readNvFromStorage();
      if (k0 && !existing.value) existing.value = k0;
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
      // Hapus group dobel dari extras-fix sebelumnya
      var orphan = document.getElementById("rd-nvidia-key-group");
      if (orphan && !orphan.contains(existing) && existing.id === "keyNvidia") {
        try {
          orphan.remove();
        } catch (e) {}
      }
      // Hapus semua group ekstra selain yang berisi existing
      document.querySelectorAll("#rd-nvidia-key-group").forEach(function (n) {
        if (!n.contains(existing)) {
          try {
            n.remove();
          } catch (e2) {}
        }
      });
      return existing;
    }
    var body =
      document.querySelector("#settingsModal .modal-body") ||
      document.querySelector("#settingsModal .modal-content") ||
      null;
    if (!body) return null; // jangan append ke body/root — nunggu panel buka
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
      '<p style="font-size:11px;color:#888;margin:6px 0 0">Family Nvidia / Kimi / GLM / Qwen NVIDIA / DeepSeek pakai key ini.</p>';
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

  function patchSaveLoad() {
    if (typeof window.saveSettings === "function" && !window.saveSettings.__rdNv) {
      var prevSave = window.saveSettings;
      window.saveSettings = function () {
        var inp = document.getElementById("keyNvidia") || document.getElementById("rdNvidiaKey");
        var typed = inp ? String(inp.value || "").trim() : "";
        var before = typed || readNvFromStorage();
        var r = prevSave.apply(this, arguments);
        if (before) writeNvToStorage(before);
        else {
          ensureNvInState();
          try {
            var all = JSON.parse(localStorage.getItem("rd_keys") || "{}");
            if (!all.nvidia) {
              var solo = localStorage.getItem("rd_nvidia_key") || "";
              if (solo) {
                all.nvidia = solo;
                localStorage.setItem("rd_keys", JSON.stringify(all));
              }
            }
          } catch (e) {}
        }
        ensureNvidiaInput();
        return r;
      };
      window.saveSettings.__rdNv = true;
    }
    if (typeof window.loadSettings === "function" && !window.loadSettings.__rdNv) {
      var prevLoad = window.loadSettings;
      window.loadSettings = function () {
        var r = prevLoad.apply(this, arguments);
        ensureNvInState();
        var inp = ensureNvidiaInput();
        var k = readNvFromStorage();
        if (inp && k) inp.value = k;
        return r;
      };
      window.loadSettings.__rdNv = true;
    }
    if (!window.__rdLsPatch) {
      window.__rdLsPatch = true;
      var rawSet = localStorage.setItem.bind(localStorage);
      localStorage.setItem = function (key, val) {
        if (key === "rd_keys") {
          try {
            var obj = JSON.parse(val || "{}");
            var keep = obj.nvidia || localStorage.getItem("rd_nvidia_key") || "";
            if (keep && !obj.nvidia) {
              obj.nvidia = keep;
              val = JSON.stringify(obj);
            }
            if (obj.nvidia) {
              try {
                rawSet("rd_nvidia_key", obj.nvidia);
              } catch (e0) {}
            }
          } catch (e) {}
        }
        return rawSet(key, val);
      };
    }
  }

  // ---- rest of previous routing (proxy NVIDIA via openai-compat) kept minimal ----
  function isNvidiaFamily(fam, model) {
    var f = String(fam || "").toLowerCase();
    var m = String(model || "").toLowerCase();
    if (f === "nvidia" || f === "kimi" || f === "glm" || f === "qwen_nv" || f === "deepseek") return true;
    if (f === "nvidia" && m.indexOf(":free") < 0) return true;
    if (/^nvidia\//i.test(m) && m.indexOf(":free") < 0) return true;
    if (/^moonshotai\/kimi/i.test(m)) return true;
    if (/^z-ai\/glm/i.test(m)) return true;
    return false;
  }

  async function callNvidiaViaProxy(messages, modelId, apiKey, temp, maxTok) {
    var r = await fetch("/api/openai-compat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        baseUrl: "https://integrate.api.nvidia.com/v1",
        apiKey: apiKey,
        model: modelId,
        messages: messages,
        temperature: temp,
        max_tokens: maxTok
      })
    });
    var data = await r.json().catch(function () {
      return {};
    });
    if (!r.ok) {
      var msg =
        (data.error && (data.error.message || data.error)) ||
        data.message ||
        "NVIDIA HTTP " + r.status;
      throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
    }
    return data;
  }

  function patchCallModel() {
    if (typeof window.callModel !== "function" || window.callModel.__rdFix650) return;
    var prev = window.callModel;
    window.callModel = async function (messages, model, fam, temp, maxTok) {
      var nvKey = ensureNvInState() || readNvFromStorage();
      if (isNvidiaFamily(fam, model) && nvKey) {
        try {
          return await callNvidiaViaProxy(messages, model, nvKey, temp, maxTok);
        } catch (e) {
          throw e;
        }
      }
      return prev.apply(this, arguments);
    };
    window.callModel.__rdFix650 = true;
    window.callModel.__rdNv = true;
  }

  function recolorAvatars() {
    try {
      document.querySelectorAll("[data-model], .model-chip, .avatar, .model-avatar, img[alt]").forEach(function (n) {
        var t = (n.getAttribute("data-model") || n.getAttribute("alt") || n.textContent || "").toLowerCase();
        var color = null;
        if (/grok|xai/.test(t)) color = "#fff";
        else if (/gemini|google/.test(t)) color = "#8ab4f8";
        else if (/claude|anthropic/.test(t)) color = "#d4a27f";
        else if (/cohere/.test(t)) color = "#39594d";
        else if (/qwen/.test(t)) color = "#6366f1";
        else if (/kimi|moonshot/.test(t)) color = "#1a1a1a";
        else if (/glm|z-ai/.test(t)) color = "#3b82f6";
        else if (/nemotron|nvidia/.test(t)) color = "#76B900";
        else if (/deepseek/.test(t)) color = "#4d6bfe";
        else if (/north/.test(t)) color = "#a78bfa";
        if (color && n.tagName === "svg") n.style.color = color;
        if (color && n.querySelector) {
          n.querySelectorAll("svg, path, circle").forEach(function (s) {
            try {
              s.style.fill = s.style.fill === "none" ? "none" : color;
              s.setAttribute("fill", s.getAttribute("fill") === "none" ? "none" : color);
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
    patchCallModel();
    recolorAvatars();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else setTimeout(boot, 100);
  setTimeout(boot, 600);
  setTimeout(boot, 1500);
  setInterval(function () {
    ensureNvidiaInput();
    recolorAvatars();
  }, 4000);
  try {
    new MutationObserver(function () {
      recolorAvatars();
    }).observe(document.documentElement, { childList: true, subtree: true });
  } catch (e) {}
})();
