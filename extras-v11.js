/* RolxDesk v11 capability layer — honest fallbacks, no fake success */
(function () {
  if (window.__RD_V11__) return;
  window.__RD_V11__ = true;
  function textOf(v) {
    if (v == null) return "";
    if (typeof v === "string") return v;
    if (Array.isArray(v)) return v.map(function (x) { return typeof x === "string" ? x : (x && (x.text || x.content) || ""); }).join("\n");
    if (typeof v === "object") return textOf(v.content || v.text || v.message || v.output || "");
    return String(v);
  }
  window.rdTextOf = textOf;
  function normalizeReply(r) {
    if (typeof r === "string") return r;
    if (!r || typeof r !== "object") return textOf(r);
    var msg = r.message || (r.choices && r.choices[0] && r.choices[0].message) || r;
    var out = textOf(msg.content || msg.text || r.content || r.reply || r.output);
    if (!out.trim()) out = textOf(msg.reasoning || msg.reasoning_content || r.reasoning);
    return out.trim() || "Model tidak mengembalikan teks final. Coba ulang atau pilih RD Free Auto.";
  }
  window.rdNormalizeReply = normalizeReply;

  // Patch global helpers where the browser exposes them. Handles Claude/OpenAI content arrays.
  function patchHelpers() {
    if (typeof window.replyText === "function" && !window.replyText.__rdV11) {
      window.replyText = function (reply) { return normalizeReply(reply); };
      window.replyText.__rdV11 = true;
    }
    if (typeof window.forceToolsFromUser === "function" && !window.forceToolsFromUser.__rdV11) {
      var oldForce = window.forceToolsFromUser;
      window.forceToolsFromUser = function (userText, assistantText) {
        var out = oldForce(userText, assistantText);
        var u = String(userText || "");
        if (/\b(gambar|buatkan gambar|generate image|image of)\b/i.test(u) && !/\[\[IMG:/i.test(out)) {
          var q = u.replace(/^(?:tolong\s*)?(?:buatkan|generate|bikin)\s+(?:gambar|image)?\s*/i, "").trim();
          if (q) out += "\n[[IMG: " + q.slice(0, 180) + "]]";
        }
        return out;
      };
      window.forceToolsFromUser.__rdV11 = true;
    }
  }

  // Free image mode: no secret, direct image URL; clearly labelled as external/open model endpoint.
  async function imageTool(prompt) {
    var q = String(prompt || "").trim();
    if (!q) return "Prompt gambar kosong.";
    var url = "https://image.pollinations.ai/prompt/" + encodeURIComponent(q) + "?width=768&height=768&nologo=true&model=flux";
    var html = '<div class="rd-image-result"><p>Gambar dibuat lewat endpoint gambar publik berbasis model open image (tanpa API key di RD).</p><img src="' + url.replace(/\"/g, "&quot;") + '" alt="' + q.replace(/\"/g, "&quot;") + '" style="max-width:100%;border-radius:12px;display:block"/><a href="' + url.replace(/\"/g, "&quot;") + '" target="_blank" rel="noopener">Buka / simpan gambar</a></div>';
    return html;
  }
  window.rdImageTool = imageTool;
  function patchTags() {
    if (typeof window.runAgentTags !== "function" || window.runAgentTags.__rdV11) return;
    var old = window.runAgentTags;
    window.runAgentTags = async function (content) {
      var out = String(content || "");
      var matches = Array.from(out.matchAll(/\[\[IMG:\s*([^\]]+)\]\]/gi));
      for (var i = 0; i < matches.length; i++) {
        try { out = out.replace(matches[i][0], await imageTool(matches[i][1].trim())); }
        catch (e) { out = out.replace(matches[i][0], "\nGambar gagal dibuat: " + e.message + "\n"); }
      }
      return old(out);
    };
    window.runAgentTags.__rdV11 = true;
  }

  // Fish errors are often quota/permission, not a silent success. Fall back to browser TTS.
  function browserTts(text) {
    return new Promise(function (resolve) {
      if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) return resolve(false);
      try {
        var u = new SpeechSynthesisUtterance(String(text || "").replace(/\*\*/g, "").slice(0, 1400));
        u.lang = /[\u0600-\u06ff]/.test(text) ? "id-ID" : "id-ID";
        u.onend = function () { resolve(true); }; u.onerror = function () { resolve(false); };
        speechSynthesis.cancel(); speechSynthesis.speak(u);
      } catch (_) { resolve(false); }
    });
  }
  window.rdBrowserTts = browserTts;

  function boot() { patchHelpers(); patchTags(); }
  setTimeout(boot, 100); setTimeout(boot, 700); setInterval(boot, 5000);
})();
