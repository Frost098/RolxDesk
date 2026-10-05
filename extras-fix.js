/* RolxDesk extras-fix v6.1 — Grok free slug + North identity */
(function () {
  if (window.__RD_EXTRAS_FIX61__) return;
  window.__RD_EXTRAS_FIX61__ = true;

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
      if (!MODELS.other.length) {
        MODELS.other = [
          { id: "qwen/qwen3.8-27b:free", name: "Qwen3.8 27B" },
          { id: "google/gemma-4-31b-it:free", name: "Gemma 4 31B" }
        ];
      }
    } catch (e) {}
  }

  function northMsg(messages, model, fam) {
    if (String(fam) === "persona") return messages;
    if (!/north-mini-code/i.test(String(model || ""))) return messages;
    var hint = "Kamu asisten coding North Mini Code (Cohere) di RolxDesk. Bukan Grok, bukan Claude, bukan GPT. Jawab langsung. Kalau ditanya siapa kamu: North Mini Code.";
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

  function patchCall() {
    if (typeof window.callModel !== "function" || window.callModel.__rdFix61) return;
    var prev = window.callModel;
    window.callModel = async function (messages) {
      try {
        var ms = document.getElementById("modelSelect");
        var fam = (document.getElementById("familySelect") || {}).value || "";
        if (ms && ms.value) {
          var fixed = remap(ms.value);
          if (fixed !== ms.value) {
            var opt = document.createElement("option");
            opt.value = fixed;
            opt.textContent = (ms.options[ms.selectedIndex] && ms.options[ms.selectedIndex].text) || fixed;
            opt.selected = true;
            ms.appendChild(opt);
            ms.value = fixed;
            if (window.state) state.selectedModel = fixed;
          }
        }
        messages = northMsg(messages, ms && ms.value, fam);
      } catch (e) {}
      return prev.apply(this, arguments);
    };
    window.callModel.__rdFix61 = true;
  }

  function boot() {
    patchCatalog();
    patchCall();
    try {
      if (typeof populateModels === "function") populateModels();
    } catch (e) {}
  }
  setTimeout(boot, 300);
  setTimeout(boot, 1200);
  setTimeout(boot, 3000);
})();
