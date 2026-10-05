/* RolxDesk extras v5.5 — expanded tools */
(function () {
  if (window.__RD_EXTRAS_V55__) return;
  window.__RD_EXTRAS_V55__ = true;
  window.__RD_EXTRAS_V54__ = true;
  window.__RD_EXTRAS__ = true;

  function $(s, r) { return (r || document).querySelector(s); }
  function withTimeout(promise, ms, label) {
    return new Promise(function (resolve, reject) {
      var done = false;
      var t = setTimeout(function () {
        if (!done) { done = true; reject(new Error((label || "op") + " timeout")); }
      }, ms || 20000);
      promise.then(function (v) {
        if (!done) { done = true; clearTimeout(t); resolve(v); }
      }, function (e) {
        if (!done) { done = true; clearTimeout(t); reject(e); }
      });
    });
  }
  function unlockSend() {
    try {
      if (window.state) { window.state.isStreaming = false; window.state._sendLock = false; }
      var btn = document.getElementById("sendBtn");
      if (btn) { btn.disabled = false; btn.removeAttribute("disabled"); }
      if (typeof setActivity === "function") setActivity("Siap", "");
    } catch (e) {}
  }

  var GROK_STYLE = "\n\n[GAYA BICARA — GROK]\nBicara seperti Grok (xAI): cerdas, blak-blakan, sedikit sarkas, humor kering, anti-BS. Langsung ke inti. Bahasa ikut user. Jangan bilang kamu Kiro/Cursor.\n";
  var TOOL_LAW =
    "\n\n[ROLXDESK TOOLS & SKILLS — WAJIB PAKAI]\n" +
    "Sistem mengeksekusi tag. JANGAN bilang tidak punya tools / tidak bisa akses.\n" +
    "Media: [[PLAY: lagu]] [[YOUTUBE: query/channel]] [[IMG: prompt]]\n" +
    "Web: [[BROWSE: url]] [[SEARCH: query]] [[HTTP: GET url]] [[FETCH_JSON: url]]\n" +
    "Code: [[RUN_PY]]code[[/RUN_PY]] [[RUN_JS]]code[[/RUN_JS]] [[CALC: expr]]\n" +
    "Util: [[TIME]] [[UUID]] [[HASH: teks]] [[B64ENC: t]] [[B64DEC: t]]\n" +
    "Extra: [[WEATHER: kota]] [[TRANSLATE: lang|teks]] [[REGEX: pattern|teks]] [[SLUG: teks]]\n" +
    "[[UNIT: 100 km to mi]] [[COLOR: #1a73e8]] [[QR: teks]] [[DIFF: a|||b]]\n" +
    "Play lagu → [[PLAY]]. Video channel → [[YOUTUBE]]. JANGAN browse youtube/results.\n" +
    "Python=Pyodide. Research=SEARCH lalu BROWSE link nyata. Jangan ngarang.\n";

  function patchContinuity() {
    try {
      if (typeof CONTINUITY === "string") {
        if (CONTINUITY.indexOf("GAYA BICARA") === -1) CONTINUITY += GROK_STYLE;
        if (CONTINUITY.indexOf("TOOLS & SKILLS") === -1) CONTINUITY += TOOL_LAW;
      }
    } catch (e) {}
    if (typeof window.injectPersona === "function" && !window.injectPersona.__rd55) {
      var orig = window.injectPersona;
      window.injectPersona = function (m) {
        var out = orig(m);
        if (Array.isArray(out) && out[0] && out[0].role === "system") {
          var c = String(out[0].content);
          if (c.indexOf("GAYA BICARA") === -1) c += GROK_STYLE;
          if (c.indexOf("TOOLS & SKILLS") === -1) c += TOOL_LAW;
          out[0] = { role: "system", content: c };
        }
        return out;
      };
      window.injectPersona.__rd55 = true;
    }
  }

  function wantsYoutube(u) { return /(youtube|youtu\.be|putar\s*video|play\s*video|tonton|video\s+terbaru)/i.test(u); }
  function wantsMusic(u) { return /(?:^|[\s\"'])(?:play|putar|mainkan)\b|\blagu\b|\bsong\b|spotify|lirik/i.test(u); }
  function extractSongQuery(u) {
    var t = String(u || "").trim();
    var m = t.match(/(?:play|putar|mainkan)\s+(?:lagu\s+|musik\s+|song\s+|video\s+)?[\"']?([^\"'\n]+?)[\"']?\s*$/i);
    if (m) return m[1].replace(/[.!?]+$/, "").trim();
    return t.replace(/^(?:coba\s+)?(?:research|cari|play|putar)\s*/i, "").slice(0, 80).trim() || "lofi";
  }

  function forceToolsExpanded(userText, assistantText) {
    var out = assistantText || "";
    var u = String(userText || "");
    var already = function (tag) { return new RegExp("\\[\\[" + tag, "i").test(out); };
    if (wantsMusic(u) || wantsYoutube(u) || /\b(play|putar|mainkan)\b/i.test(u)) {
      out = out.replace(/\[\[BROWSE:\s*https?:\/\/(?:www\.)?youtube\.com\/[^\]]*\]\]/gi, "");
      var q = extractSongQuery(u);
      if (wantsYoutube(u) && !/\blagu\b|\bsong\b/i.test(u)) {
        if (!already("YOUTUBE")) out += "\n[[YOUTUBE: " + q.slice(0, 120) + "]]\n";
      } else if (!already("PLAY") && !already("YOUTUBE")) {
        out += "\n[[PLAY: " + q.slice(0, 80) + "]]\n";
      }
    }
    if (/(jalankan|run).*\b(js|javascript)\b|```(?:js|javascript)/i.test(u) && !/\[\[RUN_JS/i.test(out)) {
      var jm = u.match(/```(?:js|javascript)\s*([\s\S]*?)```/i);
      if (jm) out += "\n[[RUN_JS]]" + jm[1].trim() + "[[/RUN_JS]]\n";
    }
    if ((/\bpython\b|```py|pip install/i.test(u)) && !/\[\[RUN_PY/i.test(out)) {
      var pm = u.match(/```(?:python|py)?\s*([\s\S]*?)```/i);
      var code = pm ? pm[1].trim() : "print(2+2)";
      if (/pip install|apt-get|opencv|pyzbar|libzbar/i.test(u)) {
        out += "\n[Sandbox] Vercel/browser tidak menjalankan apt-get atau native OpenCV. Python=Pyodide.\n";
      }
      out += "\n[[RUN_PY]]" + code + "[[/RUN_PY]]\n";
    }
    out = out.replace(/Tunggu hasil[^\n]*/gi, "");
    return out;
  }

  function patchForceTools() {
    if (typeof window.forceToolsFromUser === "function" && !window.forceToolsFromUser.__rd55) {
      var prev = window.forceToolsFromUser;
      window.forceToolsFromUser = function (ut, at) { return forceToolsExpanded(ut, prev(ut, at)); };
      window.forceToolsFromUser.__rd55 = true;
    } else if (typeof window.forceToolsFromUser !== "function") {
      window.forceToolsFromUser = forceToolsExpanded;
    }
  }

  function ensureYtPanel() {
    var panel = document.getElementById("rd-yt");
    if (panel) return panel;
    if (!$("#rd-yt-css")) {
      var st = document.createElement("style");
      st.id = "rd-yt-css";
      st.textContent = "#rd-yt{position:fixed;z-index:10000;background:#111;border:1px solid #333;border-radius:12px;overflow:hidden;box-shadow:0 8px 28px rgba(0,0,0,.45);touch-action:none}#rd-yt .rd-yt-bar{display:flex;align-items:center;gap:6px;padding:6px 8px;background:#1a1a1a;cursor:move;user-select:none}#rd-yt .rd-yt-title{flex:1;font:12px system-ui;color:#ccc;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}#rd-yt .rd-yt-btn{background:none;border:0;color:#aaa;font-size:14px;cursor:pointer;padding:2px 6px}#rd-yt.rd-yt-min #rd-yt-frame-wrap{display:none}#rd-yt.rd-yt-min{width:220px!important}";
      document.head.appendChild(st);
    }
    panel = document.createElement("div");
    panel.id = "rd-yt";
    panel.style.cssText = "right:12px;bottom:88px;width:min(360px,92vw)";
    panel.innerHTML = '<div class="rd-yt-bar"><span class="rd-yt-title" id="rd-yt-title">YouTube</span><button type="button" class="rd-yt-btn" id="rd-yt-min">\u2014</button><button type="button" class="rd-yt-btn" id="rd-yt-close">\u00d7</button></div><div id="rd-yt-frame-wrap"><iframe id="rd-yt-frame" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" style="width:100%;aspect-ratio:16/9;border:0;display:block;background:#000"></iframe></div>';
    document.body.appendChild(panel);
    document.getElementById("rd-yt-min").onclick = function (e) { e.stopPropagation(); panel.classList.toggle("rd-yt-min"); };
    document.getElementById("rd-yt-close").onclick = function (e) { e.stopPropagation(); panel.style.display = "none"; var f = document.getElementById("rd-yt-frame"); if (f) f.src = ""; };
    return panel;
  }

  async function playYoutubeSmart(q) {
    unlockSend();
    try {
      var r = await withTimeout(fetch("/api/yt-search", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ q: q }) }), 18000, "yt");
      var j = await r.json().catch(function () { return {}; });
      if (r.ok && j.id && /^[A-Za-z0-9_-]{11}$/.test(j.id)) {
        var panel = ensureYtPanel();
        var f = document.getElementById("rd-yt-frame"); var t = document.getElementById("rd-yt-title");
        if (t) t.textContent = (j.title || j.id).slice(0, 48);
        if (f) f.src = "https://www.youtube-nocookie.com/embed/" + j.id + "?autoplay=1&rel=0";
        panel.style.display = "block";
        return "\u25b6\ufe0f " + (j.title || j.id) + (j.uploader ? " \u00b7 " + j.uploader : "") + "\nhttps://youtu.be/" + j.id;
      }
    } catch (e) {}
    return "Cari di YouTube: " + q;
  }

  window.playSpotify = async function (query) {
    if (!query) return; unlockSend();
    var q = String(query).trim();
    await playYoutubeSmart(q + " official audio");
  };

  async function runServerJs(code) {
    try {
      var r = await withTimeout(fetch("/api/run-js", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: code }) }), 12000, "run-js");
      var j = await r.json();
      return (j.output || j.error || "").slice(0, 8000);
    } catch (e) { return "JS error: " + (e.message || e); }
  }

  async function simpleHash(text) {
    try {
      var buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
      return Array.from(new Uint8Array(buf)).map(function (b) { return b.toString(16).padStart(2, "0"); }).join("");
    } catch (e) { return "hash gagal"; }
  }

  async function runExtraTags(content) {
    if (!content) return content;
    var out = content; unlockSend();
    try {
      var yts = [...out.matchAll(/\[\[YOUTUBE:\s*([^\]]+)\]\]/gi)];
      for (var yi = 0; yi < yts.length; yi++) {
        out = out.replace(yts[yi][0], "\n" + (await playYoutubeSmart(yts[yi][1].trim())) + "\n");
      }
      out = out.replace(/\[\[PLAY:\s*([^\]]+)\]\]/gi, function (_, q) {
        try { window.playSpotify(q.trim()); } catch (e) {}
        return "\n\ud83c\udfb5 " + q.trim() + "\n";
      });
      var jsBlocks = [...out.matchAll(/\[\[RUN_JS\]\]([\s\S]*?)\[\[\/RUN_JS\]\]/gi)];
      for (var ji = 0; ji < jsBlocks.length; ji++) {
        out = out.replace(jsBlocks[ji][0], "\n```\n[JS output]\n" + (await runServerJs(jsBlocks[ji][1].trim())) + "\n```\n");
      }
      var hashes = [...out.matchAll(/\[\[HASH:\s*([^\]]+)\]\]/gi)];
      for (var hi = 0; hi < hashes.length; hi++) {
        out = out.replace(hashes[hi][0], "\nSHA-256: `" + (await simpleHash(hashes[hi][1].trim())) + "`\n");
      }
      out = out.replace(/\[\[B64ENC:\s*([^\]]+)\]\]/gi, function (_, t) {
        try { return "\n`" + btoa(unescape(encodeURIComponent(t))) + "`\n"; } catch (e) { return "\nb64enc gagal\n"; }
      });
      out = out.replace(/\[\[B64DEC:\s*([^\]]+)\]\]/gi, function (_, t) {
        try { return "\n" + decodeURIComponent(escape(atob(t.trim()))) + "\n"; } catch (e) { return "\nb64dec gagal\n"; }
      });
      out = out.replace(/\[\[CALC:\s*([^\]]+)\]\]/gi, function (_, expr) {
        try {
          var safe = String(expr).replace(/[^0-9+\-*/().%\s]/g, "");
          return "\n\ud83d\udd22 " + safe + " = **" + Function('"use strict";return (' + safe + ')')() + "**\n";
        } catch (e) { return "\ncalc gagal\n"; }
      });
      out = out.replace(/\[\[TIME\]\]/gi, function () { return "\n\ud83d\udd50 " + new Date().toLocaleString("id-ID") + "\n"; });
      out = out.replace(/\[\[UUID\]\]/gi, function () {
        return "\n`" + "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
          var r = Math.random() * 16 | 0; return (c === "x" ? r : (r & 0x3 | 0x8)).toString(16);
        }) + "`\n";
      });
      out = out.replace(/\[\[REGEX:\s*([^|\]]+)\|([^\]]*)\]\]/gi, function (_, pat, text) {
        try {
          var re = new RegExp(pat.trim(), "g");
          var m = String(text).match(re);
          return "\nRegex `" + pat.trim() + "` → " + (m ? m.map(function (x) { return "`" + x + "`"; }).join(", ") : "(tidak match)") + "\n";
        } catch (e) { return "\nRegex error\n"; }
      });
      out = out.replace(/\[\[SLUG:\s*([^\]]+)\]\]/gi, function (_, s) {
        var slug = String(s).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        return "\nSlug: `" + slug + "`\n";
      });
      out = out.replace(/\[\[UNIT:\s*([^\]]+)\]\]/gi, function (_, expr) {
        try {
          var e = String(expr).toLowerCase().replace(/,/g, ".");
          var m = e.match(/([\d.]+)\s*(km|mi|m|ft|kg|lb|c|f|cm|inch|in)\s*(?:to|in|->)?\s*(km|mi|m|ft|kg|lb|c|f|cm|inch|in)?/);
          if (!m) return "\nUnit: format `100 km to mi`\n";
          var v = parseFloat(m[1]), from = m[2], to = m[3] || (from === "km" ? "mi" : from === "c" ? "f" : from);
          var map = { km: 1000, m: 1, mi: 1609.34, ft: 0.3048, cm: 0.01, inch: 0.0254, in: 0.0254 };
          var outv;
          if ((from === "c" || from === "f") && (to === "c" || to === "f")) outv = from === "c" ? (v * 9/5 + 32) : ((v - 32) * 5/9);
          else if ((from === "kg" || from === "lb") && (to === "kg" || to === "lb")) outv = from === "kg" ? v * 2.20462 : v / 2.20462;
          else if (map[from] && map[to]) outv = v * map[from] / map[to];
          else return "\nUnit tidak didukung\n";
          return "\n\ud83d\udccf " + v + " " + from + " = **" + (Math.round(outv * 1000) / 1000) + " " + to + "**\n";
        } catch (err) { return "\nUnit gagal\n"; }
      });
      out = out.replace(/\[\[COLOR:\s*([^\]]+)\]\]/gi, function (_, c) {
        var hex = String(c).trim();
        if (!/^#?[0-9a-fA-F]{3,8}$/.test(hex)) return "\nColor: pakai #RRGGBB\n";
        if (hex[0] !== "#") hex = "#" + hex;
        var h = hex.replace("#", "");
        if (h.length === 3) h = h.split("").map(function (x) { return x + x; }).join("");
        return "\n\ud83c\udfa8 " + hex + " → rgb(" + parseInt(h.slice(0,2),16) + ", " + parseInt(h.slice(2,4),16) + ", " + parseInt(h.slice(4,6),16) + ")\n";
      });
      out = out.replace(/\[\[QR:\s*([^\]]+)\]\]/gi, function (_, text) {
        return "\n![QR](https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=" + encodeURIComponent(text.trim()) + ")\n";
      });
      out = out.replace(/\[\[DIFF:\s*([\s\S]*?)\|\|\|([\s\S]*?)\]\]/gi, function (_, a, b) {
        var A = String(a).split("\n"), B = String(b).split("\n"), lines = [], n = Math.max(A.length, B.length);
        for (var i = 0; i < n; i++) {
          if (A[i] === B[i]) lines.push("  " + (A[i] || ""));
          else { if (A[i] != null) lines.push("- " + A[i]); if (B[i] != null) lines.push("+ " + B[i]); }
        }
        return "\n```diff\n" + lines.join("\n").slice(0, 2000) + "\n```\n";
      });
      var fetches = [...out.matchAll(/\[\[(?:FETCH_JSON|HTTP):\s*(?:GET\s+)?([^\]]+)\]\]/gi)];
      for (var fi = 0; fi < fetches.length; fi++) {
        try {
          var br = await withTimeout(fetch("/api/browse", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: fetches[fi][1].trim(), mode: "text" }) }), 15000, "fetch");
          var bj = await br.json();
          out = out.replace(fetches[fi][0], "\n```\n" + String(bj.text || bj.title || "").slice(0, 3000) + "\n```\n");
        } catch (e) { out = out.replace(fetches[fi][0], "\nFetch gagal\n"); }
      }
      out = out.replace(/Tunggu hasil[^\n]*/gi, "");
    } catch (e) {}
    unlockSend();
    return out.replace(/\n{3,}/g, "\n\n").trim();
  }

  function patchRunAgentTags() {
    if (typeof window.runAgentTags === "function" && !window.runAgentTags.__rd55) {
      var orig = window.runAgentTags;
      window.runAgentTags = async function (content) {
        unlockSend();
        try {
          var mid = await withTimeout(Promise.resolve(orig(content)), 60000, "agent");
          return await runExtraTags(mid);
        } catch (e) { unlockSend(); return "Error: " + (e.message || e); }
        finally { unlockSend(); }
      };
      window.runAgentTags.__rd55 = true;
    }
  }

  async function injectHostedModels() {
    try {
      var r = await fetch("/api/hosted-models");
      var j = await r.json();
      if (!j.hosted || !Array.isArray(j.models)) return;
      window.__RD_HOSTED__ = j;
      var fam = document.getElementById("familySelect");
      if (fam && !fam.querySelector('option[value="hosted"]')) {
        var opt = document.createElement("option");
        opt.value = "hosted"; opt.textContent = "RD Hosted (gratis)";
        fam.appendChild(opt);
      }
      if (typeof window.callModel === "function" && !window.callModel.__rd55) {
        var prevCall = window.callModel;
        window.callModel = async function (msgs) {
          try {
            var mod = (document.getElementById("modelSelect") || {}).value || "";
            var famV = (document.getElementById("familySelect") || {}).value;
            var keys = (window.state && state.keys) || {};
            var ids = j.models.map(function (m) { return m.id; });
            if (j.hosted && (famV === "hosted" || ids.indexOf(mod) >= 0) && !keys.openrouter) {
              var hr = await fetch("/api/hosted-chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model: mod, messages: msgs }) });
              var hd = await hr.json();
              if (!hr.ok) throw new Error(hd.error || "hosted fail");
              return hd;
            }
          } catch (e) {}
          return prevCall.apply(this, arguments);
        };
        window.callModel.__rd55 = true;
      }
    } catch (e) {}
  }

  function boot() {
    patchContinuity();
    patchForceTools();
    patchRunAgentTags();
    injectHostedModels();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else setTimeout(boot, 100);
  setTimeout(boot, 1000);
})();
