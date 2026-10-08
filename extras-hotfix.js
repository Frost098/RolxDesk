/* RolxDesk extras-hotfix v1 — Google AI Studio + YT play intent */
(function () {
  if (window.__RD_HOTFIX_V1__) return;
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
    if (vn && wantsYoutube(t)) {
      return { kind: "youtube", q: vn[1].replace(/[.!?]+$/g, "").trim() };
    }

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

  // Override forceToolsFromUser media injection
  function forceYt(userText, assistantText) {
    var out = assistantText || "";
    var u = String(userText || "");
    if (!wantsYoutube(u) && !/\b(play|putar|tonton)\b/i.test(u)) return out;
    var med = extractMediaQuery(u);
    if (med.kind === "yt-latest" || med.kind === "youtube" || wantsYoutube(u)) {
      out = out.replace(/\[\[PLAY:\s*[^\]]+\]\]/gi, "");
      out = out.replace(/<play:\s*[^>]+>/gi, "");
      if (!/\[\[YOUTUBE:/i.test(out)) {
        var yq = med.kind === "yt-latest" ? "latest:" + med.q : med.q;
        out += "\n[[YOUTUBE: " + String(yq).slice(0, 100) + "]]\n";
      }
    }
    return out;
  }

  function patchForce() {
    if (typeof window.forceToolsFromUser === "function") {
      if (window.forceToolsFromUser.__rdHot1) return;
      var prev = window.forceToolsFromUser;
      window.forceToolsFromUser = function (ut, at) {
        return forceYt(ut, prev(ut, at));
      };
      window.forceToolsFromUser.__rdHot1 = true;
    } else {
      window.forceToolsFromUser = forceYt;
    }
  }

  // Normalize <play:...> and prevent Spotify for video queries
  function patchTags() {
    if (typeof window.runAgentTags !== "function" || window.runAgentTags.__rdHot1) return;
    var orig = window.runAgentTags;
    window.runAgentTags = async function (content) {
      var c = String(content || "");
      c = c.replace(/<play:\s*([^>]+)>/gi, function (_, q) {
        return "[[YOUTUBE: " + String(q).trim() + "]]";
      });
      // PLAY → YOUTUBE jika kelihatan video
      c = c.replace(/\[\[PLAY:\s*([^\]]+)\]\]/gi, function (full, q) {
        if (wantsYoutube(q) || /dadylocky|lofi|channel|youtuber|vlog/i.test(q)) {
          return "[[YOUTUBE: " + String(q).trim() + "]]";
        }
        return full;
      });
      return orig(c);
    };
    window.runAgentTags.__rdHot1 = true;
  }

  // Google / Venice / Manus / custom JANGAN lewat hosted
  function patchCallModel() {
    if (typeof window.callModel !== "function" || window.callModel.__rdHot1) return;
    var prev = window.callModel;
    window.callModel = async function (messages) {
      var fam = "";
      try {
        var el = document.getElementById("familySelect");
        fam = el ? String(el.value || "") : "";
      } catch (e) {}
      var direct = { google: 1, venice: 1, manus: 1, custom: 1, "9router": 1, fish: 1 };
      if (direct[fam]) {
        return prev.apply(this, arguments);
      }
      var model = "";
      try {
        model = (window.state && state.selectedModel) || "";
        if (!model) {
          var ms = document.getElementById("modelSelect");
          model = ms ? ms.value : "";
        }
      } catch (e2) {}
      // gemini* dengan key google → core
      if (/^gemini/i.test(model) && fam !== "hosted") {
        return prev.apply(this, arguments);
      }
      return prev.apply(this, arguments);
    };
    window.callModel.__rdHot1 = true;
  }

  // Badge
  function badge() {
    var el = document.getElementById("rd-patch-ver");
    if (el) el.textContent = (el.textContent || "") + " · hotfix1";
  }

  function boot() {
    patchForce();
    patchTags();
    patchCallModel();
    badge();
  }
  setTimeout(boot, 80);
  setTimeout(boot, 500);
  setTimeout(boot, 1500);
})();
