/* RolxDesk extras-fix v6.2 — Grok slug, icons, version, Cosmos gen */
(function () {
  if (window.__RD_EXTRAS_FIX62__) return;
  window.__RD_EXTRAS_FIX62__ = true;
  window.__RD_EXTRAS_FIX61__ = true;

  var RD_VERSION = "6.2.0";

  var DEAD = {
    "nex-agi/nex-n2.5-mini:free": "qwen/qwen3.8-27b:free",
    "nex-agi/nex-n2.5-mini": "qwen/qwen3.8-27b:free",
    "nex-agi/nex-n2.5-pro:free": "qwen/qwen3.8-27b:free",
    "nex-agi/nex-n2.5-pro": "nvidia/nemotron-3-super-120b-a12b:free"
  };

  function remap(id) {
    var s = String(id || "");
    if (DEAD[s]) return DEAD[s];
    if (/nex-agi\/nex-n2/i.test(s)) return "qwen/qwen3.8-27b:free";
    return s;
  }

  function injectIconCSS() {
    if (document.getElementById("rd-fix62-css")) return;
    var s = document.createElement("style");
    s.id = "rd-fix62-css";
    s.textContent = [
      '.msg-avatar[data-persona="grok-4"], .chip-avatar.grok { background:#111!important;border:1px solid #333;color:#eee!important; }',
      "#rd-version-badge{font-size:11px;color:#888;margin-top:8px;padding:6px 0;border-top:1px solid #2a2a34}",
      "#rd-version-badge b{color:#a89cff}"
    ].join("");
    document.head.appendChild(s);
  }

  function patchIcons() {
    try {
      if (typeof ICONS === "undefined") return;
      ICONS.grok =
        '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' +
        '<path d="M12 2l1.2 6.5L18 4.5 14.5 9.5 22 12l-7.5 2.5L18 19.5 13.2 15.5 12 22l-1.2-6.5L6 19.5l3.5-5L2 12l7.5-2.5L6 4.5l4.8 4z"/>' +
        "</svg>";
      ICONS.north =
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">' +
        '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5A5.5 5.5 0 1 0 15.5 15.5" stroke-linecap="round"/>' +
        "</svg>";
      if (ICONS.cohere === undefined) ICONS.cohere = ICONS.north;
    } catch (e) {}
  }

  function patchCatalog() {
    try {
      if (typeof MODELS === "undefined") return;
      MODELS.persona = [
        { id: "nvidia/nemotron-3-super-120b-a12b:free", name: "Claude Sonnet", persona: "claude-sonnet" },
        { id: "cohere/north-mini-code:free", name: "Claude Haiku", persona: "claude-haiku" },
        { id: "cohere/north-mini-code:free", name: "GPT-4o", persona: "gpt-4o" },
        { id: "liquid/lfm-2.5-2.6b:free", name: "GPT-4o mini", persona: "gpt-4o-mini" },
        { id: "qwen/qwen3.8-27b:free", name: "Grok 4", persona: "grok-4" },
        { id: "moonshotai/kimi-k3", name: "Kimi K3", persona: "kimi-k3" }
      ];
      MODELS.gpt = [
        { id: "cohere/north-mini-code:free", name: "North Mini Code" },
        { id: "qwen/qwen3.8-27b:free", name: "Qwen3.8 27B" },
        { id: "liquid/lfm-2.5-2.6b:free", name: "LFM2.5 2.6B" },
        { id: "openrouter/free", name: "OpenRouter Free Router" }
      ];
      MODELS.other = (MODELS.other || []).filter(function (m) {
        return !/nex-agi/i.test(m.id);
      });
      if (!MODELS.other.some(function (m) { return /qwen3\.8-27b:free/.test(m.id); })) {
        MODELS.other.unshift({ id: "qwen/qwen3.8-27b:free", name: "Qwen3.8 27B" });
      }
    } catch (e) {}
  }

  function northMsg(messages, model, fam) {
    if (String(fam) === "persona") return messages;
    if (!/north-mini-code/i.test(String(model || ""))) return messages;
    var hint =
      "Kamu asisten coding North Mini Code (Cohere) di RolxDesk. Bukan Grok, bukan Claude, bukan GPT. Jawab langsung. Kalau ditanya siapa kamu: North Mini Code.";
    if (!Array.isArray(messages)) return messages;
    var out = messages.slice();
    var has = false;
    for (var i = 0; i < out.length; i++) {
      if (out[i] && out[i].role === "system") {
        var c = out[i].content || "";
        if (typeof c === "string" && c.indexOf("North Mini Code") < 0) {
          out[i] = { role: "system", content: hint + "\n" + c };
        }
        has = true;
        break;
      }
    }
    if (!has) out.unshift({ role: "system", content: hint });
    return out;
  }

  function fixSelectedModel() {
    try {
      var ms = document.getElementById("modelSelect");
      if (ms && ms.value) {
        var fixed = remap(ms.value);
        if (fixed !== ms.value) {
          var opt = document.createElement("option");
          opt.value = fixed;
          opt.textContent = (ms.options[ms.selectedIndex] && ms.options[ms.selectedIndex].text) || fixed;
          opt.selected = true;
          ms.appendChild(opt);
          ms.value = fixed;
        }
      }
      if (window.state) {
        if (state.selectedModel) state.selectedModel = remap(state.selectedModel);
        if (state.settings && state.settings.model) state.settings.model = remap(state.settings.model);
      }
    } catch (e) {}
  }

  function patchFetchRemap() {
    if (window.__rdFetchRemap62) return;
    window.__rdFetchRemap62 = true;
    var orig = window.fetch;
    window.fetch = function (input, init) {
      try {
        var url = typeof input === "string" ? input : (input && input.url) || "";
        if (/openrouter\.ai|\/api\/chat|openai-compat/i.test(url) && init && init.body && typeof init.body === "string") {
          var body = JSON.parse(init.body);
          if (body && body.model) {
            var m2 = remap(body.model);
            if (m2 !== body.model) {
              body.model = m2;
              init = Object.assign({}, init, { body: JSON.stringify(body) });
            }
          }
        }
      } catch (e) {}
      return orig.apply(this, arguments);
    };
  }

  function patchCallModel() {
    if (typeof window.callModel !== "function") return;
    if (window.callModel.__rdFix62) return;
    var prev = window.callModel;
    window.callModel = async function (messages) {
      fixSelectedModel();
      try {
        var ms = document.getElementById("modelSelect");
        var fam = (document.getElementById("familySelect") || {}).value || "";
        messages = northMsg(messages, ms && ms.value, fam);
      } catch (e) {}
      return prev.apply(this, arguments);
    };
    window.callModel.__rdFix62 = true;
    window.callModel.__rdFix61 = true;
  }

  function injectVersion() {
    var body = document.querySelector("#settingsModal .modal-body");
    if (!body) return;
    var el = document.getElementById("rd-version-badge");
    if (!el) {
      el = document.createElement("div");
      el.id = "rd-version-badge";
      body.appendChild(el);
    }
    el.innerHTML = "RolxDesk <b>v" + RD_VERSION + "</b> · extras-fix 6.2 · Cosmos ON";
  }

  async function cosmosGenerate(prompt, mode) {
    var key = "";
    try {
      key = (window.state && state.keys && state.keys.nvidia) || "";
      if (!key) {
        var raw = JSON.parse(localStorage.getItem("rd_keys") || "{}");
        key = raw.nvidia || "";
      }
    } catch (e) {}
    if (!key) throw new Error("Isi NVIDIA API Key di Settings dulu (Cosmos butuh key).");

    mode = mode === "video" ? "text2video" : "text2image";
    var payload = {
      model_mode: mode,
      prompt: String(prompt || "").slice(0, 2000),
      seed: Math.floor(Math.random() * 1e6)
    };
    if (mode === "text2video") {
      payload.resolution = "480_16_9";
      payload.num_frames = 25;
      payload.num_inference_steps = 25;
      payload.fps = 24;
    }

    var r = await fetch("https://ai.api.nvidia.com/v1/cosmos/nvidia/cosmos3-nano", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + key,
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify(payload)
    });
    var data = await r.json().catch(function () { return {}; });
    if (!r.ok) {
      var msg = (data.error && (data.error.message || data.error)) || data.message || ("Cosmos HTTP " + r.status);
      throw new Error(String(msg));
    }
    return data;
  }

  function showMediaResult(kind, b64) {
    try {
      var box = document.querySelector("#chatBox, .chat-messages, #messages");
      if (!box) return;
      var wrap = document.createElement("div");
      wrap.className = "msg assistant";
      wrap.style.cssText = "margin:10px 12px;padding:10px;border-radius:12px;background:#1a1a22;max-width:92%";
      if (kind === "image") {
        wrap.innerHTML =
          "<div style=\"font-size:12px;color:#999;margin-bottom:6px\">Cosmos3-Nano · image</div>" +
          '<img alt="cosmos" style="max-width:100%;border-radius:8px" src="data:image/jpeg;base64,' + b64 + '" />';
      } else {
        wrap.innerHTML =
          "<div style=\"font-size:12px;color:#999;margin-bottom:6px\">Cosmos3-Nano · video</div>" +
          '<video controls playsinline style="max-width:100%;border-radius:8px" src="data:video/mp4;base64,' + b64 + '"></video>';
      }
      box.appendChild(wrap);
      box.scrollTop = box.scrollHeight;
    } catch (e) {}
  }

  async function handleCosmosTags(text) {
    if (!text) return text;
    var out = text;
    var imgRe = /\[\[COSMOS_IMG:\s*([^\]]+)\]\]/gi;
    var vidRe = /\[\[COSMOS_VID:\s*([^\]]+)\]\]/gi;
    var imgs = text.match(imgRe) || [];
    for (var i = 0; i < imgs.length; i++) {
      var mm = /\[\[COSMOS_IMG:\s*([^\]]+)\]\]/i.exec(imgs[i]);
      if (!mm) continue;
      try {
        if (typeof showToast === "function") showToast("Cosmos image…", "info");
        var data = await cosmosGenerate(mm[1].trim(), "image");
        var b64 = data.b64_image || data.image;
        if (b64) {
          b64 = String(b64).replace(/^data:image\/\w+;base64,/, "");
          showMediaResult("image", b64);
          out = out.split(imgs[i]).join("\n*(Cosmos image dihasilkan)*\n");
        } else {
          out = out.split(imgs[i]).join("\n*(Cosmos: no b64_image)*\n");
        }
      } catch (e) {
        out = out.split(imgs[i]).join("\n**Cosmos image error:** " + (e.message || e) + "\n");
      }
    }
    var vids = text.match(vidRe) || [];
    for (var j = 0; j < vids.length; j++) {
      var mv = /\[\[COSMOS_VID:\s*([^\]]+)\]\]/i.exec(vids[j]);
      if (!mv) continue;
      try {
        if (typeof showToast === "function") showToast("Cosmos video… (bisa lama)", "info");
        var data2 = await cosmosGenerate(mv[1].trim(), "video");
        var b64v = data2.b64_video || data2.video;
        if (b64v) {
          b64v = String(b64v).replace(/^data:video\/\w+;base64,/, "");
          showMediaResult("video", b64v);
          out = out.split(vids[j]).join("\n*(Cosmos video dihasilkan)*\n");
        } else {
          out = out.split(vids[j]).join("\n*(Cosmos: no b64_video)*\n");
        }
      } catch (e) {
        out = out.split(vids[j]).join("\n**Cosmos video error:** " + (e.message || e) + "\n");
      }
    }
    return out;
  }

  function patchAgentTags() {
    if (typeof window.runAgentTags === "function" && !window.runAgentTags.__rdCosmos) {
      var prev = window.runAgentTags;
      window.runAgentTags = async function (content) {
        var mid = await prev(content);
        return await handleCosmosTags(mid);
      };
      window.runAgentTags.__rdCosmos = true;
    }
    if (typeof window.runExtraTags === "function" && !window.runExtraTags.__rdCosmos) {
      var prev2 = window.runExtraTags;
      window.runExtraTags = async function (content) {
        var mid = await prev2(content);
        return await handleCosmosTags(mid);
      };
      window.runExtraTags.__rdCosmos = true;
    }
  }

  function boot() {
    injectIconCSS();
    patchIcons();
    patchCatalog();
    patchFetchRemap();
    patchCallModel();
    fixSelectedModel();
    injectVersion();
    patchAgentTags();
    try {
      if (typeof populateModels === "function") populateModels();
    } catch (e) {}
  }

  setTimeout(boot, 200);
  setTimeout(boot, 800);
  setTimeout(boot, 2000);
  setTimeout(boot, 4000);

  var modal = document.getElementById("settingsModal");
  if (modal && !modal.__rdVer62) {
    modal.__rdVer62 = true;
    new MutationObserver(function () {
      if (modal.classList.contains("open")) injectVersion();
    }).observe(modal, { attributes: true, attributeFilter: ["class"] });
  }
})();
