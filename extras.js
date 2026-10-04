/* RolxDesk extras v5.3 — play accuracy + draggable YT player */
(function () {
  if (window.__RD_EXTRAS_V53__) return;
  window.__RD_EXTRAS_V53__ = true;
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
      position: "fixed", left: "10px", right: "10px", bottom: "72px",
      maxHeight: "38vh", overflow: "auto", zIndex: "10001",
      background: "rgba(18,18,22,.97)", color: "#e8e8ee",
      border: "1px solid #3a3a48", borderRadius: "14px",
      font: "13px/1.45 system-ui,sans-serif", padding: "10px 12px",
      display: "none", boxShadow: "0 8px 32px rgba(0,0,0,.45)"
    });
    var head = el("div");
    head.style.cssText = "display:flex;justify-content:space-between;align-items:center;margin-bottom:8px";
    var left = el("div"); left.style.cssText = "display:flex;align-items:center;gap:8px";
    var spin = el("span", { id: "rd-work-spin" }, "\u25cf");
    spin.style.cssText = "color:#7c6af7;animation:rdPulse 1s infinite";
    left.appendChild(spin);
    left.appendChild(el("strong", { id: "rd-work-title" }, "Working"));
    head.appendChild(left);
    var close = el("button", { type: "button" }, "\u00d7");
    close.style.cssText = "background:none;border:0;color:#aaa;font-size:18px;cursor:pointer";
    close.onclick = function () { box.style.display = "none"; };
    head.appendChild(close);
    box.appendChild(head);
    box.appendChild(el("div", { id: "rd-work-steps" }, ""));
    var style = document.createElement("style");
    style.textContent = "@keyframes rdPulse{0%,100%{opacity:1}50%{opacity:.35}}#rd-work-steps .rd-step{padding:4px 0;border-bottom:1px solid #2a2a34;color:#c8c8d0;font-size:12px}#rd-work-steps .rd-step b{color:#a89cff}";
    document.head.appendChild(style);
    document.body.appendChild(box);
    return box;
  }
  function workStart(title) {
    var box = ensureWorkPanel();
    var t = $("#rd-work-title"); if (t) t.textContent = title || "Working";
    var spin = $("#rd-work-spin"); if (spin) spin.style.display = "inline";
    var body = $("#rd-work-steps"); if (body) body.innerHTML = "";
    box.style.display = "block";
  }
  function workStep(label, detail) {
    var body = $("#rd-work-steps"); if (!body) return;
    var row = el("div", { class: "rd-step" });
    row.innerHTML = "<b>" + String(label).replace(/</g, "<") + "</b>" +
      (detail ? (" \u00b7 " + String(detail).replace(/</g, "<").slice(0, 160)) : "");
    body.appendChild(row);
    body.scrollTop = body.scrollHeight;
  }
  function workDone(title) {
    var t = $("#rd-work-title"); if (t) t.textContent = title || "Selesai";
    var spin = $("#rd-work-spin"); if (spin) spin.style.display = "none";
    clearTimeout(window.__rdWorkHide);
    window.__rdWorkHide = setTimeout(function () {
      var box = $("#rd-work"); if (box) box.style.display = "none";
    }, 9000);
  }

  var TOOL_LAW =
    "\n\n[ROLXDESK TOOL LAW]\n" +
    "PRIORITAS: pesan user terakhir.\n" +
    "Lagu/play/putar → [[PLAY: judul artis]]. Video channel terbaru → [[YOUTUBE: nama channel]].\n" +
    "JANGAN [[BROWSE]] youtube/results. JANGAN bilang tunggu search.\n";

  function patchContinuity() {
    try {
      if (typeof CONTINUITY === "string" && CONTINUITY.indexOf("TOOL LAW") === -1) CONTINUITY += TOOL_LAW;
    } catch (e) {}
    if (typeof window.injectPersona === "function" && !window.injectPersona.__rd53) {
      var orig = window.injectPersona;
      window.injectPersona = function (m) {
        var out = orig(m);
        if (Array.isArray(out) && out[0] && out[0].role === "system") {
          var c = String(out[0].content);
          if (c.indexOf("TOOL LAW") === -1) out[0] = { role: "system", content: c + TOOL_LAW };
        }
        return out;
      };
      window.injectPersona.__rd53 = true;
    }
  }

  function wantsYoutube(u) {
    return /(youtube|youtu\.be|putar\s*video|play\s*video|tonton|video\s+terbaru)/i.test(u);
  }
  function wantsMusic(u) {
    return /(?:^|[\s\"'])(?:play|putar|mainkan)\b|\blagu\b|\bsong\b|spotify|lirik/i.test(u);
  }
  function extractSongQuery(u) {
    var t = String(u || "").trim();
    var m = t.match(/(?:play|putar|mainkan)\s+(?:lagu\s+|musik\s+|song\s+|video\s+)?[\"']?([^\"'\n]+?)[\"']?\s*$/i);
    if (m) return m[1].replace(/[.!?]+$/, "").trim();
    m = t.match(/(?:play|putar|mainkan)\s+[\"']([^\"']+)[\"']/i);
    if (m) return m[1].trim();
    m = t.match(/\blagu\s+([^\n.]{3,80})/i);
    if (m) return m[1].trim();
    return t.replace(/^(?:yaudah[^,]*,\s*)?(?:coba\s+)?(?:research|cari|play|putar)\s*/i, "").slice(0, 80).trim() || "lofi";
  }

  function forceToolsExpanded(userText, assistantText) {
    var out = assistantText || "";
    var u = String(userText || "");
    try { window.__rdLastUser = u; } catch (e) {}
    var already = function (tag) { return new RegExp("\\[\\[" + tag, "i").test(out); };

    if (wantsMusic(u) || wantsYoutube(u) || /\b(play|putar|mainkan)\b/i.test(u)) {
      out = out.replace(/\[\[BROWSE:\s*https?:\/\/(?:www\.)?youtube\.com\/[^\]]*\]\]/gi, "");
      out = out.replace(/\[\[SEARCH:\s*[^\]]*\]\]/gi, "");
      var q = extractSongQuery(u);
      if (wantsYoutube(u) && !/\blagu\b|\bsong\b/i.test(u)) {
        if (!already("YOUTUBE")) out += "\n[[YOUTUBE: " + q.slice(0, 120) + "]]\n";
        out = out.replace(/\[\[PLAY:\s*[^\]]+\]\]/gi, "");
      } else if (!already("PLAY") && !already("YOUTUBE")) {
        out += "\n[[PLAY: " + q.slice(0, 80) + "]]\n";
      }
    }
    out = out.replace(/Tunggu hasil[^\n]*/gi, "");
    return out;
  }

  function patchForceTools() {
    if (typeof window.forceToolsFromUser === "function" && !window.forceToolsFromUser.__rd53) {
      var prev = window.forceToolsFromUser;
      window.forceToolsFromUser = function (ut, at) { return forceToolsExpanded(ut, prev(ut, at)); };
      window.forceToolsFromUser.__rd53 = true;
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
      st.textContent = "#rd-yt{position:fixed;z-index:10000;background:#111;border:1px solid #333;border-radius:12px;overflow:hidden;box-shadow:0 8px 28px rgba(0,0,0,.45);touch-action:none}" +
        "#rd-yt .rd-yt-bar{display:flex;align-items:center;gap:6px;padding:6px 8px;background:#1a1a1a;cursor:move;user-select:none}" +
        "#rd-yt .rd-yt-title{flex:1;font:12px system-ui;color:#ccc;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}" +
        "#rd-yt .rd-yt-btn{background:none;border:0;color:#aaa;font-size:14px;cursor:pointer;padding:2px 6px;line-height:1}" +
        "#rd-yt .rd-yt-btn:hover{color:#fff}" +
        "#rd-yt.rd-yt-min #rd-yt-frame-wrap{display:none}" +
        "#rd-yt.rd-yt-min{width:220px!important}";
      document.head.appendChild(st);
    }
    panel = el("div", { id: "rd-yt" });
    panel.style.cssText = "right:12px;bottom:88px;width:min(360px,92vw)";
    var bar = el("div", { class: "rd-yt-bar" });
    bar.appendChild(el("span", { class: "rd-yt-title", id: "rd-yt-title" }, "YouTube"));
    var btnMin = el("button", { type: "button", class: "rd-yt-btn", title: "Kecilkan" }, "\u2014");
    var btnClose = el("button", { type: "button", class: "rd-yt-btn", title: "Tutup" }, "\u00d7");
    btnMin.onclick = function (e) {
      e.stopPropagation();
      panel.classList.toggle("rd-yt-min");
      btnMin.textContent = panel.classList.contains("rd-yt-min") ? "\u25a1" : "\u2014";
    };
    btnClose.onclick = function (e) {
      e.stopPropagation();
      panel.style.display = "none";
      var f = document.getElementById("rd-yt-frame");
      if (f) f.src = "";
      panel.classList.remove("rd-yt-min");
    };
    bar.appendChild(btnMin);
    bar.appendChild(btnClose);
    panel.appendChild(bar);
    var wrap = el("div", { id: "rd-yt-frame-wrap" });
    var frame = el("iframe", { id: "rd-yt-frame", allow: "autoplay; encrypted-media; picture-in-picture; fullscreen" });
    frame.style.cssText = "width:100%;aspect-ratio:16/9;border:0;display:block;background:#000";
    wrap.appendChild(frame);
    panel.appendChild(wrap);
    document.body.appendChild(panel);
    var dragging = false, ox = 0, oy = 0;
    bar.addEventListener("pointerdown", function (e) {
      if (e.target.closest(".rd-yt-btn")) return;
      dragging = true;
      var r = panel.getBoundingClientRect();
      ox = e.clientX - r.left; oy = e.clientY - r.top;
      panel.style.left = r.left + "px"; panel.style.top = r.top + "px";
      panel.style.right = "auto"; panel.style.bottom = "auto";
      try { bar.setPointerCapture(e.pointerId); } catch (err) {}
    });
    bar.addEventListener("pointermove", function (e) {
      if (!dragging) return;
      var nx = Math.max(0, Math.min(window.innerWidth - 80, e.clientX - ox));
      var ny = Math.max(0, Math.min(window.innerHeight - 40, e.clientY - oy));
      panel.style.left = nx + "px"; panel.style.top = ny + "px";
    });
    bar.addEventListener("pointerup", function () { dragging = false; });
    bar.addEventListener("pointercancel", function () { dragging = false; });
    return panel;
  }

  async function playYoutubeSmart(q) {
    unlockSend();
    workStart("Mencari video\u2026");
    var query = String(q || "").trim();
    workStep("query", query);
    try {
      var r = await withTimeout(fetch("/api/yt-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ q: query })
      }), 18000, "yt");
      var j = await r.json().catch(function () { return {}; });
      if (r.ok && j.id && /^[A-Za-z0-9_-]{11}$/.test(j.id)) {
        var panel = ensureYtPanel();
        var f = document.getElementById("rd-yt-frame");
        var t = document.getElementById("rd-yt-title");
        if (t) t.textContent = (j.title || j.id).slice(0, 48);
        if (f) f.src = "https://www.youtube-nocookie.com/embed/" + j.id + "?autoplay=1&rel=0";
        panel.style.display = "block";
        panel.classList.remove("rd-yt-min");
        workStep("match", (j.uploader || "") + " score=" + (j.score != null ? j.score : "?"));
        workDone("Playing");
        return "\u25b6\ufe0f " + (j.title || j.id) + (j.uploader ? " · " + j.uploader : "") + "\nhttps://youtu.be/" + j.id;
      }
      workStep("miss", j.error || "no id");
      if (j.search) { workDone("Miss"); return "Tidak ketemu yang cocok. Coba: " + j.search; }
    } catch (e) { workStep("err", String(e.message || e)); }
    workDone("Miss");
    return "Cari di YouTube: " + query;
  }

  function patchSpotify() {
    window.playSpotify = async function (query) {
      if (!query) return;
      unlockSend();
      var q = String(query).trim();
      var m = q.match(/open\.spotify\.com\/track\/([A-Za-z0-9]+)/i);
      if (m && typeof showSpotifyEmbed === "function") { showSpotifyEmbed(m[1]); return; }
      await playYoutubeSmart(q + " official audio");
    };
    window.playSpotify.__rd53 = true;
  }

  async function runExtraTags(content) {
    if (!content) return content;
    var out = content;
    unlockSend();
    try {
      workStart("Tools");
      var yts = [...out.matchAll(/\[\[YOUTUBE:\s*([^\]]+)\]\]/gi)];
      for (var yi = 0; yi < yts.length; yi++) {
        var ytxt = await playYoutubeSmart(yts[yi][1].trim());
        out = out.replace(yts[yi][0], "\n" + ytxt + "\n");
      }
      out = out.replace(/\[\[PLAY:\s*([^\]]+)\]\]/gi, function (_, q) {
        try { window.playSpotify(q.trim()); } catch (e) {}
        return "\n\ud83c\udfb5 " + q.trim() + "\n";
      });
      out = out.replace(/Tunggu hasil[^\n]*/gi, "");
      workDone("OK");
    } catch (e) { workDone("Error"); }
    unlockSend();
    return out.replace(/\n{3,}/g, "\n\n").trim();
  }

  function patchRunAgentTags() {
    if (typeof window.runAgentTags === "function" && !window.runAgentTags.__rd53) {
      var orig = window.runAgentTags;
      window.runAgentTags = async function (content) {
        unlockSend();
        try {
          var mid = await withTimeout(Promise.resolve(orig(content)), 60000, "agent");
          return await runExtraTags(mid);
        } catch (e) { unlockSend(); return "Error: " + (e.message || e); }
        finally { unlockSend(); }
      };
      window.runAgentTags.__rd53 = true;
    }
  }

  function patchAutoTitle() {
    if (typeof window.maybeUpdateTitle !== "function" || window.maybeUpdateTitle.__rd53) return;
    window.maybeUpdateTitle = function (session, userText) {
      if (!session || !userText) return;
      if (session.titleUpdates == null) session.titleUpdates = 0;
      if (session.titleUpdates >= 3) return;
      var t = String(userText).trim();
      if (t.length < 6) return;
      if (/^(halo|hai|hi|hello|hey|p|test|tes|ok|oke|yaudah)\b/i.test(t) && t.length < 24) return;
      var title = t.replace(/^(yaudah[^,]*,\s*|coba\s+|tolong\s+)/i, "")
        .replace(/^(research|cari|buat|bikin|play|putar)\s+/i, "")
        .replace(/\s+/g, " ").trim().slice(0, 40);
      if (title.length < 3) title = t.slice(0, 36);
      session.title = title.charAt(0).toUpperCase() + title.slice(1);
      session.titleUpdates = (session.titleUpdates || 0) + 1;
      try { if (typeof saveSessions === "function") saveSessions(); if (typeof renderSessions === "function") renderSessions(); } catch (e) {}
    };
    window.maybeUpdateTitle.__rd53 = true;
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
    patchContinuity(); patchForceTools(); patchSpotify(); patchRunAgentTags(); patchAutoTitle(); unlockSend();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else setTimeout(boot, 150);
  setTimeout(boot, 700); setTimeout(boot, 2000); setTimeout(boot, 5000);
})();
