/* RolxDesk extras-hotfix v2 — Google AI Studio + YT play */
(function () {
  if (window.__RD_HOTFIX_V2__) return;
  window.__RD_HOTFIX_V2__ = true;
  window.__RD_HOTFIX_V1__ = true;

  function wantsYoutube(u) {
    return /youtube|youtu\.be|\byt\b|\bvideo\b|tonton|channel|youtuber|livestream|\blive\b|shorts/i.test(
      String(u || "")
    );
  }

  function extractMediaQuery(u) {
    var t = String(u || "").trim();
    var lastPutar = null;
    var rePutar = /(?:tolong\s+)?(?:play|putar|tonton|mainkan)\s+([^\n]+)/gi;
    var mm;
    while ((mm = rePutar.exec(t))) lastPutar = mm[1].trim();
    var focus = lastPutar || t;

    var ch =
      focus.match(/(?:video\s+)?terbaru\s+(?:dari|oleh|by|channel)\s+["']?([^"'\n.!?]+)/i) ||
      t.match(/(?:video\s+)?terbaru\s+(?:dari|oleh|by|channel)\s+["']?([^"'\n.!?]+)/i);
    if (ch) return { kind: "yt-latest", q: ch[1].replace(/[.!?]+$/g, "").trim() };

    var vn = focus.match(/(?:video(?:\s*nya)?|channel|youtuber)\s+["']?([^"'\n.!?]+)/i);
    if (vn && wantsYoutube(t))
      return { kind: "youtube", q: vn[1].replace(/[.!?]+$/g, "").trim() };

    if (wantsYoutube(t)) {
      var yq = focus
        .replace(/^(?:coba\s+)?(?:play|putar|tonton|cari|tolong)\s+/i, "")
        .replace(/\b(?:di\s+)?(?:youtube|yt)\b/gi, " ")
        .replace(/\b(?:video(?:\s*nya)?|nya)\b/gi, " ")
        .replace(/\b(bukan|lofi|coding|sinetron|protes|minta)\b/gi, " ")
        .replace(/\s+/g, " ")
        .trim();
      return { kind: "youtube", q: yq || focus.slice(0, 80) };
    }
    return { kind: "unknown", q: focus.slice(0, 100) };
  }

  function forceYt(userText, assistantText) {
    var out = assistantText || "";
    var u = String(userText || "");
    if (!wantsYoutube(u) && !/\b(play|putar|tonton)\b/i.test(u)) return out;
    var med = extractMediaQuery(u);
    if (med.kind === "yt-latest" || med.kind === "youtube" || wantsYoutube(u)) {
      out = out.replace(/\[\[PLAY:\s*[^\]]+\]\]/gi, "");
      out = out.replace(/<play:\s*[^>]+>/gi, "");
      // ganti YOUTUBE query lama yang sampah
      out = out.replace(/\[\[YOUTUBE:\s*[^\]]+\]\]/gi, "");
      var yq = med.kind === "yt-latest" ? "latest:" + med.q : med.q;
      out += "\n[[YOUTUBE: " + String(yq).slice(0, 100) + "]]\n";
    }
    return out;
  }

  function patchForce() {
    if (typeof window.forceToolsFromUser === "function") {
      if (window.forceToolsFromUser.__rdHot2) return;
      var prev = window.forceToolsFromUser;
      window.forceToolsFromUser = function (ut, at) {
        return forceYt(ut, prev(ut, at));
      };
      window.forceToolsFromUser.__rdHot2 = true;
    } else {
      window.forceToolsFromUser = forceYt;
    }
  }

  function patchTags() {
    if (typeof window.runAgentTags !== "function" || window.runAgentTags.__rdHot2) return;
    var orig = window.runAgentTags;
    window.runAgentTags = async function (content) {
      var c = String(content || "");
      c = c.replace(/<play:\s*([^>]+)>/gi, function (_, q) {
        return "[[YOUTUBE: " + String(q).trim() + "]]";
      });
      c = c.replace(/\[\[PLAY:\s*([^\]]+)\]\]/gi, function (full, q) {
        if (wantsYoutube(q) || /dadylocky|lofi|channel|youtuber|vlog/i.test(q)) {
          return "[[YOUTUBE: " + String(q).trim() + "]]";
        }
        return full;
      });
      return orig(c);
    };
    window.runAgentTags.__rdHot2 = true;
  }

  function getKey(name) {
    try {
      if (window.state && state.keys && state.keys[name]) return String(state.keys[name]).trim();
    } catch (e) {}
    try {
      var map = { google: "keyGoogle", venice: "keyVenice", manus: "keyManus" };
      var el = document.getElementById(map[name] || "");
      if (el && el.value) return String(el.value).trim();
    } catch (e2) {}
    return "";
  }

  function currentModel() {
    try {
      if (window.state && state.selectedModel) return String(state.selectedModel);
      var ms = document.getElementById("modelSelect");
      return ms ? String(ms.value || "") : "";
    } catch (e) {
      return "";
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

  function patchCallModel() {
    if (typeof window.callModel !== "function" || window.callModel.__rdHot2) return;
    var prev = window.callModel;
    window.callModel = async function (messages) {
      var fam = currentFamily();
      var model = currentModel();
      var temp = 0.7;
      var maxTok = 2048;
      try {
        if (window.state && state.settings) {
          temp = parseFloat(state.settings.temperature ?? 0.7);
          maxTok = parseInt(state.settings.maxTokens ?? 2048, 10);
        }
      } catch (e0) {}

      // Google AI Studio — panggil core callGoogle, JANGAN hosted
      if (fam === "google" || /^gemini/i.test(model)) {
        var gkey = getKey("google");
        if (!gkey) throw new Error("Google AI Studio API Key belum diisi di Settings.");
        if (typeof callGoogle === "function") {
          return await callGoogle(messages, model, gkey, temp, maxTok);
        }
        // fallback fetch langsung ke Gemini API
        var mid = model || "gemini-2.0-flash";
        // map id palsu → yang valid
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
          contents.push({
            role: m.role === "assistant" ? "model" : "user",
            parts: [{ text: String(m.content || "") }]
          });
        }
        var url =
          "https://generativelanguage.googleapis.com/v1beta/models/" +
          encodeURIComponent(mid) +
          ":generateContent?key=" +
          encodeURIComponent(gkey);
        var gr = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: contents,
            generationConfig: { temperature: temp, maxOutputTokens: maxTok }
          })
        });
        var gj = await gr.json().catch(function () {
          return {};
        });
        if (!gr.ok) {
          var em =
            (gj.error && gj.error.message) ||
            gj.message ||
            "Google HTTP " + gr.status;
          throw new Error(String(em));
        }
        var text = "";
        try {
          text = gj.candidates[0].content.parts.map(function (p) {
            return p.text || "";
          }).join("");
        } catch (e1) {}
        return {
          choices: [{ message: { role: "assistant", content: text || "(kosong)" } }]
        };
      }

      if (fam === "venice" || fam === "manus" || fam === "custom" || fam === "9router") {
        return prev.apply(this, arguments);
      }

      return prev.apply(this, arguments);
    };
    window.callModel.__rdHot2 = true;
  }

  function badge() {
    var el = document.getElementById("rd-patch-ver");
    if (el && el.textContent.indexOf("hotfix2") === -1) {
      el.textContent = (el.textContent || "RD") + " · hotfix2";
    }
  }

  function boot() {
    patchForce();
    patchTags();
    patchCallModel();
    badge();
  }
  setTimeout(boot, 100);
  setTimeout(boot, 600);
  setTimeout(boot, 2000);
  setInterval(function () {
    patchForce();
    patchTags();
    patchCallModel();
  }, 5000);
})();
