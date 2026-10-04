/* RolxDesk extras v5.4 — tools pack, hosted models, Grok voice, sandbox */
(function () {
  if (window.__RD_EXTRAS_V54__) return;
  window.__RD_EXTRAS_V54__ = true;
  window.__RD_EXTRAS__ = true;

  function $(s, r) { return (r || document).querySelector(s); }
  function el(t, a, h) {
    var n = document.createElement(t);
    if (a) Object.entries(a).forEach(function (kv) {
      var k = kv[0], v = kv[1];
      if (k === "style" && typeof v === "object") Object.assign(n.style, v);
      else if (k.startsWith("on") && typeof v === "function") n.addEventListener(k.slice(2), v);
      else n.setAttribute(k, v);
    });
    if (h != null) n.innerHTML = h;
    return n;
  }
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
  function ensureWorkPanel() {
    var box = $("#rd-work");
    if (box) return box;
    box = el("div", { id: "rd-work" });
    Object.assign(box.style, {
      position: "fixed", left: "10px", right: "10px", bottom: "72px", maxHeight: "38vh", overflow: "auto", zIndex: "10001",
      background: "rgba(18,18,22,.97)", color: "#e8e8ee", border: "1px solid #3a3a48", borderRadius: "14px",
      font: "13px/1.45 system-ui,sans-serif", padding: "10px 12px", display: "none", boxShadow: "0 8px 32px rgba(0,0,0,.45)"
    });
    var head = el("div"); head.style.cssText = "display:flex;justify-content:space-between;align-items:center;margin-bottom:8px";
    var left = el("div"); left.style.cssText = "display:flex;align-items:center;gap:8px";
    var spin = el("span", { id: "rd-work-spin" }, "\u25cf"); spin.style.cssText = "color:#7c6af7;animation:rdPulse 1s infinite";
    left.appendChild(spin); left.appendChild(el("strong", { id: "rd-work-title" }, "Working")); head.appendChild(left);
    var close = el("button", { type: "button" }, "\u00d7"); close.style.cssText = "background:none;border:0;color:#aaa;font-size:18px;cursor:pointer";
    close.onclick = function () { box.style.display = "none"; }; head.appendChild(close); box.appendChild(head);
    box.appendChild(el("div", { id: "rd-work-steps" }, ""));
    var style = document.createElement("style");
    style.textContent = "@keyframes rdPulse{0%,100%{opacity:1}50%{opacity:.35}}#rd-work-steps .rd-step{padding:4px 0;border-bottom:1px solid #2a2a34;color:#c8c8d0;font-size:12px}#rd-work-steps .rd-step b{color:#a89cff}";
    document.head.appendChild(style); document.body.appendChild(box); return box;
  }
  function workStart(title) {
    var box = ensureWorkPanel();
    var t = $("#rd-work-title"); if (t) t.textContent = title || "Working";
    var spin = $("#rd-work-spin"); if (spin) spin.style.display = "inline";
    var body = $("#rd-work-steps"); if (body) body.innerHTML = ""; box.style.display = "block";
  }
  function workStep(label, detail) {
    var body = $("#rd-work-steps"); if (!body) return;
    var row = el("div", { class: "rd-step" });
    row.innerHTML = "<b>" + String(label).replace(/</g, "<") + "</b>" + (detail ? (" \u00b7 " + String(detail).replace(/</g, "<").slice(0, 160)) : "");
    body.appendChild(row); body.scrollTop = body.scrollHeight;
  }
  function workDone(title) {
    var t = $("#rd-work-title"); if (t) t.textContent = title || "Selesai";
    var spin = $("#rd-work-spin"); if (spin) spin.style.display = "none";
    clearTimeout(window.__rdWorkHide);
    window.__rdWorkHide = setTimeout(function () { var box = $("#rd-work"); if (box) box.style.display = "none"; }, 9000);
  }

  var GROK_STYLE = "\n\n[GAYA BICARA — GROK]\nBicara seperti Grok (xAI): cerdas, blak-blakan, sedikit sarkas, humor kering, anti-BS. Langsung ke inti. Boleh blunt. Jangan corporate-robot. Bahasa ikut user. Jangan bilang kamu Kiro/Cursor.\n";
  var TOOL_LAW = "\n\n[ROLXDESK TOOLS & SKILLS]\nPakai tag — sistem eksekusi. JANGAN bilang tidak punya tools.\n[[PLAY: lagu]] [[YOUTUBE: q]] [[BROWSE: url]] [[SEARCH: q]] [[IMG: p]]\n[[RUN_PY]]code[[/RUN_PY]] [[RUN_JS]]code[[/RUN_JS]] [[CALC: 1+1]] [[TIME]] [[UUID]]\n[[HASH: t]] [[B64ENC: t]] [[B64DEC: t]] [[FETCH_JSON: url]] [[HTTP: GET url]]\nPlay lagu → [[PLAY]]. Video channel → [[YOUTUBE]]. JANGAN browse youtube/results.\nPython=Pyodide (bukan apt/opencv native). JS server=/api/run-js (no require/fs).\n";

  function patchContinuity() {
    try {
      if (typeof CONTINUITY === "string") {
        if (CONTINUITY.indexOf("GAYA BICARA") === -1) CONTINUITY += GROK_STYLE;
        if (CONTINUITY.indexOf("TOOLS & SKILLS") === -1) CONTINUITY += TOOL_LAW;
      }
    } catch (e) {}
    if (typeof window.injectPersona === "function" && !window.injectPersona.__rd54) {
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
      window.injectPersona.__rd54 = true;
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
      out = out.replace(/\[\[SEARCH:\s*[^\]]*\]\]/gi, "");
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
        out += "\n[Sandbox] Vercel/browser tidak menjalankan apt-get atau native OpenCV/zbar. Python=Pyodide (stdlib + micropip pure).\n";
      }
      out += "\n[[RUN_PY]]" + code + "[[/RUN_PY]]\n";
    }
    out = out.replace(/Tunggu hasil[^\n]*/gi, "");
    return out;
  }

  function patchForceTools() {
    if (typeof window.forceToolsFromUser === "function" && !window.forceToolsFromUser.__rd54) {
      var prev = window.forceToolsFromUser;
      window.forceToolsFromUser = function (ut, at) { return forceToolsExpanded(ut, prev(ut, at)); };
      window.forceToolsFromUser.__rd54 = true;
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
    panel = el("div", { id: "rd-yt" });
    panel.style.cssText = "right:12px;bottom:88px;width:min(360px,92vw)";
    var bar = el("div", { class: "rd-yt-bar" });
    bar.appendChild(el("span", { class: "rd-yt-title", id: "rd-yt-title" }, "YouTube"));
    var btnMin = el("button", { type: "button", class: "rd-yt-btn", title: "Kecilkan" }, "\u2014");
    var btnClose = el("button", { type: "button", class: "rd-yt-btn", title: "Tutup" }, "\u00d7");
    btnMin.onclick = function (e) { e.stopPropagation(); panel.classList.toggle("rd-yt-min"); btnMin.textContent = panel.classList.contains("rd-yt-min") ? "\u25a1" : "\u2014"; };
    btnClose.onclick = function (e) { e.stopPropagation(); panel.style.display = "none"; var f = document.getElementById("rd-yt-frame"); if (f) f.src = ""; };
    bar.appendChild(btnMin); bar.appendChild(btnClose); panel.appendChild(bar);
    var wrap = el("div", { id: "rd-yt-frame-wrap" });
    var frame = el("iframe", { id: "rd-yt-frame", allow: "autoplay; encrypted-media; picture-in-picture; fullscreen" });
    frame.style.cssText = "width:100%;aspect-ratio:16/9;border:0;display:block;background:#000";
    wrap.appendChild(frame); panel.appendChild(wrap); document.body.appendChild(panel);
    var dragging = false, ox = 0, oy = 0;
    bar.addEventListener("pointerdown", function (e) {
      if (e.target.closest(".rd-yt-btn")) return;
      dragging = true; var r = panel.getBoundingClientRect();
      ox = e.clientX - r.left; oy = e.clientY - r.top;
      panel.style.left = r.left + "px"; panel.style.top = r.top + "px"; panel.style.right = "auto"; panel.style.bottom = "auto";
      try { bar.setPointerCapture(e.pointerId); } catch (err) {}
    });
    bar.addEventListener("pointermove", function (e) {
      if (!dragging) return;
      panel.style.left = Math.max(0, Math.min(window.innerWidth - 80, e.clientX - ox)) + "px";
      panel.style.top = Math.max(0, Math.min(window.innerHeight - 40, e.clientY - oy)) + "px";
    });
    bar.addEventListener("pointerup", function () { dragging = false; });
    return panel;
  }

  async function playYoutubeSmart(q) {
    unlockSend(); workStart("Mencari video\u2026"); workStep("query", q);
    try {
      var r = await withTimeout(fetch("/api/yt-search", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ q: q }) }), 18000, "yt");
      var j = await r.json().catch(function () { return {}; });
      if (r.ok && j.id && /^[A-Za-z0-9_-]{11}$/.test(j.id)) {
        var panel = ensureYtPanel();
        var f = document.getElementById("rd-yt-frame"); var t = document.getElementById("rd-yt-title");
        if (t) t.textContent = (j.title || j.id).slice(0, 48);
        if (f) f.src = "https://www.youtube-nocookie.com/embed/" + j.id + "?autoplay=1&rel=0";
        panel.style.display = "block"; workDone("Playing");
        return "\u25b6\ufe0f " + (j.title || j.id) + (j.uploader ? " \u00b7 " + j.uploader : "") + "\nhttps://youtu.be/" + j.id;
      }
    } catch (e) { workStep("err", String(e.message || e)); }
    workDone("Miss"); return "Cari di YouTube: " + q;
  }

  function patchSpotify() {
    window.playSpotify = async function (query) {
      if (!query) return; unlockSend();
      var q = String(query).trim();
      var m = q.match(/open\.spotify\.com\/track\/([A-Za-z0-9]+)/i);
      if (m && typeof showSpotifyEmbed === "function") { showSpotifyEmbed(m[1]); return; }
      await playYoutubeSmart(q + " official audio");
    };
  }

  async function runServerJs(code) {
    workStep("run-js", "server");
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
      workStart("Tools");
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
      var fetches = [...out.matchAll(/\[\[(?:FETCH_JSON|HTTP):\s*(?:GET\s+)?([^\]]+)\]\]/gi)];
      for (var fi = 0; fi < fetches.length; fi++) {
        try {
          var br = await withTimeout(fetch("/api/browse", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: fetches[fi][1].trim(), mode: "text" }) }), 15000, "fetch");
          var bj = await br.json();
          out = out.replace(fetches[fi][0], "\n```\n" + String(bj.text || bj.title || "").slice(0, 3000) + "\n```\n");
        } catch (e) { out = out.replace(fetches[fi][0], "\nFetch gagal\n"); }
      }
      out = out.replace(/Tunggu hasil[^\n]*/gi, "");
      workDone("OK");
    } catch (e) { workDone("Error"); }
    unlockSend();
    return out.replace(/\n{3,}/g, "\n\n").trim();
  }

  function patchRunAgentTags() {
    if (typeof window.runAgentTags === "function" && !window.runAgentTags.__rd54) {
      var orig = window.runAgentTags;
      window.runAgentTags = async function (content) {
        unlockSend();
        try {
          var mid = await withTimeout(Promise.resolve(orig(content)), 60000, "agent");
          return await runExtraTags(mid);
        } catch (e) { unlockSend(); return "Error: " + (e.message || e); }
        finally { unlockSend(); }
      };
      window.runAgentTags.__rd54 = true;
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
        fam.addEventListener("change", function () {
          if (fam.value === "hosted") {
            var ms = document.getElementById("modelSelect");
            if (ms) ms.innerHTML = j.models.map(function (m) { return '<option value="' + m.id + '">' + m.name + "</option>"; }).join("");
          }
        });
      }
      if (typeof window.callModel === "function" && !window.callModel.__rd54) {
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
        window.callModel.__rd54 = true;
      }
    } catch (e) {}
  }

  function patchAutoTitle() {
    if (typeof window.maybeUpdateTitle !== "function" || window.maybeUpdateTitle.__rd54) return;
    window.maybeUpdateTitle = function (session, userText) {
      if (!session || !userText) return;
      if ((session.titleUpdates || 0) >= 3) return;
      var t = String(userText).trim();
      if (t.length < 6) return;
      if (/^(halo|hai|hi|hello|hey|p|test|ok|oke|yaudah)\b/i.test(t) && t.length < 24) return;
      var title = t.replace(/^(yaudah[^,]*,\s*|coba\s+)/i, "").replace(/^(research|cari|play|putar)\s+/i, "").replace(/\s+/g, " ").trim().slice(0, 40);
      if (title.length < 3) title = t.slice(0, 36);
      session.title = title.charAt(0).toUpperCase() + title.slice(1);
      session.titleUpdates = (session.titleUpdates || 0) + 1;
      try { if (typeof saveSessions === "function") saveSessions(); if (typeof renderSessions === "function") renderSessions(); } catch (e) {}
    };
    window.maybeUpdateTitle.__rd54 = true;
  }

  setInterval(function () {
    try {
      var locked = window.state && (window.state.isStreaming || window.state._sendLock);
      var btn = document.getElementById("sendBtn");
      if (btn && btn.disabled && !locked) btn.disabled = false;
      if (locked) {
        if (!window.__rdLockSince) window.__rdLockSince = Date.now();
        else if (Date.now() - window.__rdLockSince > 25000) { unlockSend(); window.__rdLockSince = 0; }
      } else window.__rdLockSince = 0;
    } catch (e) {}
  }, 3000);

  function boot() {
    patchContinuity(); patchForceTools(); patchSpotify(); patchRunAgentTags(); patchAutoTitle(); injectHostedModels(); unlockSend();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else setTimeout(boot, 150);
  setTimeout(boot, 800); setTimeout(boot, 2500);
})();
