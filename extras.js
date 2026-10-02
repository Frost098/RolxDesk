/* RolxDesk extras v4.8 — brief browse + raw github for RD */
(function () {
  if (window.__RD_EXTRAS_V48__) return;
  window.__RD_EXTRAS_V48__ = true;
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
        if (done) return;
        done = true;
        reject(new Error((label || "op") + " timeout"));
      }, ms || 20000);
      promise.then(function (v) {
        if (done) return;
        done = true;
        clearTimeout(t);
        resolve(v);
      }, function (e) {
        if (done) return;
        done = true;
        clearTimeout(t);
        reject(e);
      });
    });
  }

  function unlockSend() {
    try {
      if (window.state) {
        window.state.isStreaming = false;
        window.state._sendLock = false;
      }
      var btn = document.getElementById("sendBtn");
      if (btn) {
        btn.disabled = false;
        btn.removeAttribute("disabled");
      }
      if (typeof setActivity === "function") setActivity("Siap", "");
      if (typeof clearLiveStatus === "function") clearLiveStatus();
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
    head.style.cssText = "display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;gap:8px";
    var left = el("div");
    left.style.cssText = "display:flex;align-items:center;gap:8px";
    var spin = el("span", { id: "rd-work-spin" }, "\u25cf");
    spin.style.cssText = "color:#7c6af7;animation:rdPulse 1s infinite";
    left.appendChild(spin);
    left.appendChild(el("strong", { id: "rd-work-title" }, "Working"));
    head.appendChild(left);
    var close = el("button", { type: "button" }, "\u00d7");
    close.style.cssText = "background:none;border:0;color:#aaa;font-size:18px;cursor:pointer;line-height:1";
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
    var t = $("#rd-work-title");
    if (t) t.textContent = title || "Working";
    var spin = $("#rd-work-spin");
    if (spin) spin.style.display = "inline";
    var body = $("#rd-work-steps");
    if (body) body.innerHTML = "";
    box.style.display = "block";
  }
  function workStep(label, detail) {
    var body = $("#rd-work-steps");
    if (!body) return;
    var row = el("div", { class: "rd-step" });
    row.innerHTML = "<b>" + String(label).replace(/</g, "<") + "</b>" +
      (detail ? (" \u00b7 " + String(detail).replace(/</g, "<").slice(0, 160)) : "");
    body.appendChild(row);
    body.scrollTop = body.scrollHeight;
    ensureWorkPanel().style.display = "block";
  }
  function workDone(title) {
    var t = $("#rd-work-title");
    if (t) t.textContent = title || "Selesai";
    var spin = $("#rd-work-spin");
    if (spin) spin.style.display = "none";
    clearTimeout(window.__rdWorkHide);
    window.__rdWorkHide = setTimeout(function () {
      var box = $("#rd-work");
      if (box) box.style.display = "none";
    }, 9000);
  }

  window.rdPeek = function (title, body) {
    workStart(title || "Aktivitas");
    String(body || "").split("\n").forEach(function (line) {
      if (line.trim()) workStep(line.trim().slice(0, 48), line.trim().length > 48 ? line.trim().slice(48) : "");
    });
  };
  window.rdStatus = function (msg) {
    if (typeof setLiveStatus === "function") try { setLiveStatus(msg); } catch (e) {}
    workStep("status", msg);
  };

  function injectMobileCSS() {
    if ($("#rd-extras-css")) return;
    var s = document.createElement("style");
    s.id = "rd-extras-css";
    s.textContent = [
      "html, body { padding-top: env(safe-area-inset-top, 0px); }",
      ".chat-header, .main > header { padding-top: max(8px, env(safe-area-inset-top, 0px)) !important; }",
      "@media (max-width: 720px) {",
      "  .multi-mode-bar { max-height: 28vh !important; overflow: hidden !important; }",
      "  .multi-mode-bar #multiModelChecks, #multiModelChecks { max-height: 16vh !important; overflow-y: auto !important; }",
      "  .messages { padding-bottom: 120px !important; }",
      "  #rd-yt { bottom: 88px !important; right: 8px !important; width: min(100vw - 16px, 360px) !important; }",
      "  #rd-work { bottom: 80px !important; max-height: 32vh !important; }",
      "}",
      "#sendBtn:disabled { opacity: 0.55; }",
      "#userInput { pointer-events: auto !important; }"
    ].join("\n");
    document.head.appendChild(s);
  }

  var TOOL_LAW =
    "\n\n[ROLXDESK TOOL LAW]\n"
    + "PRIORITAS MUTLAK: PESAN USER TERAKHIR saja. JANGAN kembali ke topik/link/browse lama kecuali user minta lagi.\n"
    + "JANGAN bilang tidak bisa / tidak punya tools. JANGAN balas kosong.\n"
    + "Setelah tool (browse/search): JELASKAN RINGKAS dulu (3-8 kalimat / bullet). JANGAN hanya menempel seluruh teks mentah.\n"
    + "Tag: [[SEARCH: q]] [[BROWSE: url]] [[YOUTUBE: q]] [[IMG: prompt]] [[PLAY: lagu]] [[RUN_PY]] [[RUN_JS]] [[MCP:service:aksi]]\n"
    + "Video terbaru channel X \u2192 [[YOUTUBE: X]]. Lagu \u2192 [[PLAY: judul]].\n";

  function connectorHint() {
    var lines = [];
    try {
      var k = (window.state && window.state.keys) || {};
      try {
        var ls = JSON.parse(localStorage.getItem("rd_keys") || "{}");
        k = Object.assign({}, ls, k);
      } catch (e2) {}
      if (k.github) lines.push("GitHub: TERHUBUNG");
      if (k.vercel) lines.push("Vercel: TERHUBUNG");
      if (k.wix) lines.push("Wix: TERHUBUNG");
      if (k.openrouter) lines.push("OpenRouter: TERHUBUNG");
      if (k.google) lines.push("Google key: TERHUBUNG ([[IMG:]])");
      if (k.spotify || k.spotifyClientId) lines.push("Spotify kredensial ada");
    } catch (e) {}
    if (!lines.length) return "\n[Konektor] Belum ada token di Pengaturan.\n";
    return "\n[Konektor aktif]\n- " + lines.join("\n- ") + "\n";
  }

  function patchContinuity() {
    try {
      if (typeof CONTINUITY === "string" && CONTINUITY.indexOf("PRIORITAS MUTLAK") === -1) {
        CONTINUITY = String(CONTINUITY).replace(
          /Lanjutkan percakapan yang sudah ada[^.]*\./i,
          "Prioritas PESAN USER TERAKHIR; jangan kembali ke topik lama kecuali diminta."
        );
        CONTINUITY += TOOL_LAW;
      }
    } catch (e) {}
    if (typeof window.injectPersona === "function" && !window.injectPersona.__rd48) {
      var orig = window.injectPersona;
      window.injectPersona = function (m) {
        var out = orig(m);
        if (Array.isArray(out) && out[0] && out[0].role === "system") {
          var c = String(out[0].content);
          if (c.indexOf("PRIORITAS MUTLAK") === -1) c += TOOL_LAW;
          if (c.indexOf("[Konektor") === -1) c += connectorHint();
          out[0] = { role: "system", content: c };
        }
        return out;
      };
      window.injectPersona.__rd48 = true;
    }
  }

  function extractUrl(s) {
    var m = String(s || "").match(/https?:\/\/[^\s\]\)\"\'<>]+/i);
    return m ? m[0].replace(/[.,;]+$/, "") : null;
  }
  function extractDomain(s) {
    var m = String(s || "").match(/\b((?:[a-z0-9-]+\.)+(?:vercel\.app|netlify\.app|github\.io|com|net|org|io|id|co|app|dev|xyz))\b/i);
    return m ? m[1] : null;
  }
  function wantsYoutube(u) {
    return /(youtube|youtu\.be|putar\s*video|play\s*video|tonton|video\s+terbaru|short[s]?\b|terbaru\s+(oleh|dari|by))/i.test(u);
  }
  function wantsMusic(u) {
    return /(spotify|putar\s*(lagu|musik)|play\s*(song|music|lagu)|lirik)/i.test(u) && !wantsYoutube(u);
  }
  function wantsImage(u) {
    return /(buatkan?|generate|bikin|gambarin|draw|lukis|\/img)\b/i.test(u);
  }
  function wantsBrief(u) {
    return /(ringkas|singkat|rangkum|summary|tl;?dr|apa\s+aja|jelaskan\s+singkat|poin\s+utama)/i.test(String(u || ""));
  }

  function forceToolsExpanded(userText, assistantText) {
    var out = assistantText || "";
    var u = String(userText || "");
    try { window.__rdLastUser = u; } catch (e) {}
    var already = function (tag) { return new RegExp("\\[\\[" + tag, "i").test(out); };
    var url = extractUrl(u);
    var dom = extractDomain(u);
    if (!url && dom) url = "https://" + dom;

    if (/frost098\/rolxdesk|github\.com\/frost098\/rolxdesk|repo\s+rd\b|isi\s+repo/i.test(u) && !already("BROWSE")) {
      var target = "https://raw.githubusercontent.com/Frost098/RolxDesk/main/SOURCE.md";
      if (/readme/i.test(u)) target = "https://raw.githubusercontent.com/Frost098/RolxDesk/main/README.md";
      if (/extras/i.test(u)) target = "https://raw.githubusercontent.com/Frost098/RolxDesk/main/extras.js";
      out += "\n[[BROWSE: " + target + "]]\n";
      out = out.replace(/\[\[SEARCH:\s*[^\]]*\]\]/gi, "");
    }
    if (url && !/youtube\.com|youtu\.be|spotify\.com/i.test(url)) {
      if (/(research|cari|buka|baca|browse|telusuri|kunjungi|isi|lihat|apa\s+aja|ringkas)/i.test(u) || /^https?:\/\//i.test(u.trim()) || dom) {
        if (!already("BROWSE")) {
          var g = url.match(/github\.com\/([^\/]+)\/([^\/]+)(?:\/blob\/[^\/]+\/(.+))?/i);
          if (g && !g[3]) url = "https://raw.githubusercontent.com/" + g[1] + "/" + g[2] + "/main/README.md";
          else if (g && g[3]) url = "https://raw.githubusercontent.com/" + g[1] + "/" + g[2] + "/main/" + g[3];
          out += "\n[[BROWSE: " + url + "]]\n";
        }
        out = out.replace(/\[\[SEARCH:\s*[^\]]*\]\]/gi, "");
      }
    }
    if (wantsImage(u) && !already("IMG") && !wantsYoutube(u)) {
      var ip = u.replace(/.*(?:buatkan?|generate|bikin|gambarin|draw|lukis|\/img)\s*/i, "").trim();
      if (ip.length < 3) ip = u.slice(0, 120);
      out += "\n[[IMG: " + ip.slice(0, 400) + "]]\n";
    }
    if (wantsYoutube(u) && !already("YOUTUBE")) {
      var yu = extractUrl(u);
      if (!yu) {
        yu = u
          .replace(/.*(?:youtube|putar\s*video|play\s*video|tonton)\s*/i, "")
          .replace(/\bvideo\s+terbaru\s+(oleh|dari|by)\s+/i, "")
          .replace(/\bterbaru\s+(oleh|dari|by)\s+/i, "")
          .replace(/^(video|oleh|dari|by)\s+/i, "")
          .trim();
      }
      if (yu) out += "\n[[YOUTUBE: " + yu.slice(0, 120) + "]]\n";
      out = out.replace(/\[\[PLAY:\s*[^\]]+\]\]/gi, "");
    } else if (wantsMusic(u) && !already("PLAY")) {
      var song = u.replace(/.*(?:putar|play)\s+(?:lagu|musik|song|music)?\s*/i, "").trim() || "lofi";
      out += "\n[[PLAY: " + song.slice(0, 80) + "]]\n";
    }
    if (/(research|cari\s+(berita|info|data)|search\b|google\b|cara\s+)/i.test(u) && !already("SEARCH") && !url && !wantsYoutube(u) && !wantsImage(u)) {
      var q = u.replace(/.*(?:research|cari(?:\s+berita|\s+info)?|search|google)\s*/i, "").replace(/\?+$/, "").trim();
      if (q.length < 3) q = u.slice(0, 100);
      out += "\n[[SEARCH: " + q.slice(0, 120) + "]]\n";
    }
    return out;
  }

  function patchForceTools() {
    if (typeof window.forceToolsFromUser === "function" && !window.forceToolsFromUser.__rd48) {
      var prev = window.forceToolsFromUser;
      window.forceToolsFromUser = function (ut, at) {
        var base = prev(ut, at);
        if (wantsYoutube(ut)) base = String(base || "").replace(/\[\[PLAY:\s*[^\]]+\]\]/gi, "");
        return forceToolsExpanded(ut, base);
      };
      window.forceToolsFromUser.__rd48 = true;
    } else if (typeof window.forceToolsFromUser !== "function") {
      window.forceToolsFromUser = forceToolsExpanded;
    }
  }

  function ensureYoutubePanel() {
    var p = $("#rd-yt");
    if (p) return p;
    p = el("div", { id: "rd-yt" });
    Object.assign(p.style, {
      position: "fixed", right: "12px", bottom: "88px", width: "min(360px,92vw)",
      zIndex: "10000", background: "#111", border: "1px solid #333", borderRadius: "12px",
      overflow: "hidden", display: "none"
    });
    var bar = el("div");
    bar.style.cssText = "display:flex;justify-content:space-between;padding:6px 10px;background:#1a1a1a;font:12px system-ui;color:#ccc";
    bar.appendChild(el("span", { id: "rd-yt-title" }, "YouTube"));
    var x = el("button", { type: "button" }, "\u00d7");
    x.style.cssText = "background:none;border:0;color:#aaa;font-size:16px;cursor:pointer";
    x.onclick = function () { p.style.display = "none"; var f = $("#rd-yt-frame"); if (f) f.src = ""; };
    bar.appendChild(x);
    p.appendChild(bar);
    var frame = el("iframe", {
      id: "rd-yt-frame",
      allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
    });
    frame.style.cssText = "width:100%;aspect-ratio:16/9;border:0;display:block;background:#000";
    p.appendChild(frame);
    document.body.appendChild(p);
    return p;
  }

  function playYoutubeById(id, title) {
    if (!id || !/^[A-Za-z0-9_-]{11}$/.test(id)) {
      workStep("youtube", "ID invalid: " + id);
      return false;
    }
    var panel = ensureYoutubePanel();
    var frame = $("#rd-yt-frame");
    var t = $("#rd-yt-title");
    if (t) t.textContent = (title || id).slice(0, 48);
    if (frame) frame.src = "https://www.youtube-nocookie.com/embed/" + id + "?autoplay=1&rel=0";
    panel.style.display = "block";
    workStep("play", title || id);
    return true;
  }

  async function resolveYoutube(q) {
    var m = String(q).match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([A-Za-z0-9_-]{11})/);
    if (m) return { id: m[1], title: q };
    workStep("search", q);
    try {
      var r = await withTimeout(fetch("/api/yt-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ q: q })
      }), 16000, "yt-search");
      var j = await r.json().catch(function () { return {}; });
      workStep("source", (j.source || "?") + " q=" + (j.query || q));
      if (r.ok && j.id && /^[A-Za-z0-9_-]{11}$/.test(j.id)) {
        workStep("found", j.title || j.id);
        return { id: j.id, title: j.title || q };
      }
      workStep("miss", j.error || "no valid id");
      return { search: j.search || ("https://www.youtube.com/results?search_query=" + encodeURIComponent(q)) };
    } catch (e) {
      workStep("error", String(e.message || e));
      return { search: "https://www.youtube.com/results?search_query=" + encodeURIComponent(q) };
    }
  }

  async function playYoutubeSmart(q) {
    unlockSend();
    workStart("Mencari video\u2026");
    var res = await resolveYoutube(String(q).trim());
    if (res.id) {
      playYoutubeById(res.id, res.title);
      workDone("Playing");
      return "\u25b6\ufe0f " + (res.title || res.id) + "\nhttps://youtu.be/" + res.id;
    }
    workStep("fallback", "buka search YouTube");
    workDone("Tidak ada embed");
    try { if (res.search) window.open(res.search, "_blank"); } catch (e) {}
    return "Cari di YouTube: " + (res.search || q);
  }

  function showSpotifyEmbedId(id, label) {
    if (typeof showSpotifyEmbed === "function") showSpotifyEmbed(id);
    else {
      var wrap = document.getElementById("spotifyEmbedWrap");
      var iframe = document.getElementById("spotifyEmbed");
      if (wrap && iframe) {
        iframe.src = "https://open.spotify.com/embed/track/" + id + "?utm_source=generator&theme=0&autoplay=1";
        iframe.style.display = "block";
        iframe.style.height = "152px";
        wrap.style.display = "flex";
      }
    }
    workStep("spotify", label);
  }

  function patchSpotify() {
    window.playSpotify = async function (query) {
      if (!query) return;
      unlockSend();
      var q = String(query).trim();
      workStart("Musik\u2026");
      workStep("query", q);
      var mTrack = q.match(/open\.spotify\.com\/track\/([A-Za-z0-9]+)/i) || q.match(/spotify:track:([A-Za-z0-9]+)/i);
      if (mTrack) {
        showSpotifyEmbedId(mTrack[1], "track " + mTrack[1]);
        workDone("Spotify embed");
        return;
      }
      workStep("route", "YouTube audio");
      await playYoutubeSmart(q.replace(/^(putar|play)\s+(lagu|musik|song|music)?\s*/i, "").trim() + " official audio");
      unlockSend();
    };
    window.playSpotify.__rd48 = true;

    if (typeof window.maybePlayFromText === "function" && !window.maybePlayFromText.__rd48) {
      var om = window.maybePlayFromText;
      window.maybePlayFromText = async function (text) {
        if (wantsYoutube(text) || /\[\[YOUTUBE:/i.test(text || "")) return false;
        return om(text);
      };
      window.maybePlayFromText.__rd48 = true;
    }
    if (typeof window.extractPlayQuery === "function" && !window.extractPlayQuery.__rd48) {
      var ex = window.extractPlayQuery;
      window.extractPlayQuery = function (text) {
        if (wantsYoutube(text)) return null;
        return ex(text);
      };
      window.extractPlayQuery.__rd48 = true;
    }
  }

  var _executed = { youtube: false, browse: false, image: false };

  async function doBrowse(url, brief) {
    workStep("browse", url);
    try {
      var r = await withTimeout(fetch("/api/browse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url, mode: "text" })
      }), 20000, "browse");
      var j = await r.json();
      if (!r.ok) {
        workStep("browse fail", j.error || r.status);
        return "Error browse: " + (j.error || r.status);
      }
      _executed.browse = true;
      workStep("browse ok", (j.title || "").slice(0, 60));
      var title = j.title ? String(j.title).trim() : "";
      var text = String(j.text || "").replace(/\s+/g, " ").trim();
      var limit = brief ? 900 : 3500;
      var body = text.slice(0, limit);
      if (text.length > limit) body += "\u2026";
      var out = "";
      if (title) out += "**" + title + "**\n";
      out += "_Sumber: " + url + "_\n\n";
      if (brief) {
        var parts = text.split(/(?<=[.!?])\s+/).filter(function (s) { return s.length > 40; }).slice(0, 6);
        if (parts.length >= 2) {
          out += parts.map(function (s) { return "- " + s.slice(0, 160); }).join("\n");
        } else {
          out += body;
        }
        out += "\n\n_(ringkas otomatis \u2014 minta detail file tertentu jika perlu)_";
      } else {
        out += body;
      }
      return out;
    } catch (e) {
      workStep("browse err", String(e.message || e));
      return "Browse gagal: " + (e.message || e);
    }
  }

  async function generateImageGemini(prompt) {
    var key = (window.state && window.state.keys && window.state.keys.google) || "";
    if (!key) { try { key = (JSON.parse(localStorage.getItem("rd_keys") || "{}")).google || ""; } catch (e) {} }
    if (!key) return { error: "Isi Google API key" };
    workStep("img", prompt.slice(0, 80));
    var models = ["gemini-3.1-flash-image", "gemini-2.5-flash-image", "gemini-3.1-flash-lite-image"];
    var lastErr = "";
    for (var mi = 0; mi < models.length; mi++) {
      var model = models[mi];
      workStep("model", model);
      try {
        var url = "https://generativelanguage.googleapis.com/v1beta/models/" + encodeURIComponent(model) + ":generateContent?key=" + encodeURIComponent(key);
        var res = await withTimeout(fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: "Generate a high quality image: " + prompt }] }],
            generationConfig: { responseModalities: ["TEXT", "IMAGE"] }
          })
        }), 28000, "img");
        var data = await res.json().catch(function () { return {}; });
        if (!res.ok) {
          lastErr = (data.error && data.error.message) || ("HTTP " + res.status);
          if (/quota|billing/i.test(lastErr)) return { error: "Kuota Gemini habis" };
          continue;
        }
        var parts = (((data.candidates || [])[0] || {}).content || {}).parts || [];
        var images = [], texts = [];
        for (var i = 0; i < parts.length; i++) {
          var p = parts[i];
          if (p.text) texts.push(p.text);
          var idata = p.inlineData || p.inline_data;
          if (idata && idata.data) images.push("data:" + (idata.mimeType || "image/png") + ";base64," + idata.data);
        }
        if (images.length) {
          _executed.image = true;
          workStep("img ok", model);
          return { images: images, text: texts.join("\n"), model: model };
        }
        lastErr = model + " no image";
      } catch (e) { lastErr = String(e.message || e); }
    }
    return { error: lastErr || "gagal" };
  }

  function showGeneratedImages(images, caption) {
    var box = document.getElementById("messages");
    if (!box) return;
    var wrap = document.createElement("div");
    wrap.className = "msg assistant";
    var bubble = document.createElement("div");
    bubble.className = "bubble";
    var html = caption ? "<p>" + String(caption).replace(/</g, "<").slice(0, 300) + "</p>" : "";
    for (var i = 0; i < images.length; i++) {
      html += '<img class="msg-thumb" src="' + images[i] + '" style="max-width:min(100%,420px);max-height:360px;border-radius:12px;margin-top:8px;display:block" />';
    }
    bubble.innerHTML = html;
    wrap.appendChild(bubble);
    box.appendChild(wrap);
    box.scrollTop = box.scrollHeight;
  }

  async function runExtraTags(content) {
    if (!content) return content;
    var out = content;
    _executed = { youtube: false, browse: false, image: false };
    unlockSend();
    try {
      workStart("Menjalankan tools\u2026");
      var br = [...out.matchAll(/\[\[BROWSE:\s*([^\]]+)\]\]/gi)];
      for (var i = 0; i < br.length; i++) {
        var url = br[i][1].trim();
        if (!/^https?:\/\//i.test(url)) url = "https://" + url;
        var brief = !!(window.__rdLastUser && wantsBrief(window.__rdLastUser));
        var res = await doBrowse(url, brief);
        out = out.replace(br[i][0], "\n**Browse (" + url + "):**\n" + res + "\n");
      }
      var yts = [...out.matchAll(/\[\[YOUTUBE:\s*([^\]]+)\]\]/gi)];
      for (var yi = 0; yi < yts.length; yi++) {
        var ytxt = await playYoutubeSmart(yts[yi][1].trim());
        _executed.youtube = true;
        out = out.replace(yts[yi][0], "\n" + ytxt + "\n");
      }
      out = out.replace(/\[\[PLAY:\s*([^\]]+)\]\]/gi, function (_, q) {
        try { window.playSpotify(q.trim()); } catch (e) {}
        return "\n\ud83c\udfb5 " + q.trim() + "\n";
      });
      var ims = [...out.matchAll(/\[\[IMG:\s*([^\]]+)\]\]/gi)];
      for (var ii = 0; ii < ims.length; ii++) {
        var ip = ims[ii][1].trim();
        if (/quota|not found|gagal/i.test(ip)) { out = out.replace(ims[ii][0], ""); continue; }
        var ires = await generateImageGemini(ip);
        if (ires.images && ires.images.length) {
          showGeneratedImages(ires.images, ires.text || ip.slice(0, 80));
          out = out.replace(ims[ii][0], "\n\ud83d\uddbc\ufe0f Gambar siap\n");
        } else {
          workStep("img fail", ires.error);
          out = out.replace(ims[ii][0], "\n\u26a0\ufe0f Gambar gagal\n");
        }
      }
      workDone("Tools selesai");
    } catch (e) {
      workStep("error", String(e.message || e));
      workDone("Error");
    }
    unlockSend();
    return out.replace(/\n{3,}/g, "\n\n").trim();
  }

  function ensureNonEmpty(content) {
    var s = String(content || "").trim();
    if (s && s !== "(kosong)" && s.length > 2) return s;
    if (_executed.image) return "Gambar di-generate.";
    if (_executed.youtube) return "Video di mini player.";
    if (_executed.browse) return "Browse selesai.";
    return "Model mengembalikan jawaban kosong.";
  }

  function patchRunAgentTags() {
    if (typeof window.runAgentTags === "function" && !window.runAgentTags.__rd48) {
      var orig = window.runAgentTags;
      window.runAgentTags = async function (content) {
        unlockSend();
        try {
          workStart("Agent tools");
          workStep("tags", String(content || "").slice(0, 120));
          var mid = await withTimeout(Promise.resolve(orig(content)), 60000, "agent");
          var final = await runExtraTags(mid);
          return ensureNonEmpty(final);
        } catch (e) {
          workStep("agent error", String(e.message || e));
          workDone("Error");
          unlockSend();
          return "Error: " + (e.message || e);
        } finally {
          unlockSend();
        }
      };
      window.runAgentTags.__rd48 = true;
    }
  }

  setInterval(function () {
    try {
      var locked = window.state && (window.state.isStreaming || window.state._sendLock);
      var btn = document.getElementById("sendBtn");
      if (btn && btn.disabled && !locked) btn.disabled = false;
      if (locked) {
        if (!window.__rdLockSince) window.__rdLockSince = Date.now();
        else if (Date.now() - window.__rdLockSince > 25000) {
          unlockSend();
          window.__rdLockSince = 0;
          workStep("watchdog", "unlock 25s");
        }
      } else window.__rdLockSince = 0;
    } catch (e) {}
  }, 3000);

  function handleSlash(text) {
    var m = String(text || "").trim().match(/^\/(img|image|gambar|song|lagu|music|video|vid)\s+([\s\S]+)/i);
    if (!m) return null;
    var cmd = m[1].toLowerCase(), prompt = m[2].trim();
    if (cmd === "img" || cmd === "image" || cmd === "gambar") return prompt + "\n\n[[IMG: " + prompt + "]]";
    if (cmd === "song" || cmd === "lagu" || cmd === "music") return prompt + "\n\n[[PLAY: " + prompt + "]]";
    return prompt + "\n\n[[YOUTUBE: " + prompt + "]]";
  }

  function hookComposer() {
    document.querySelectorAll("#userInput, textarea").forEach(function (ta) {
      if (!ta || ta.__rd48) return;
      ta.__rd48 = true;
      ta.addEventListener("keydown", function (e) {
        if (e.key === "Enter" && !e.shiftKey) {
          var raw = ta.value != null ? ta.value : ta.innerText;
          var sl = handleSlash(raw);
          if (sl && ta.value != null) ta.value = sl;
        }
      }, true);
    });
  }

  function boot() {
    injectMobileCSS();
    patchContinuity();
    patchForceTools();
    patchSpotify();
    patchRunAgentTags();
    hookComposer();
    unlockSend();
    workStart("RolxDesk v4.8");
    workStep("ready", "browse ringkas \u00b7 raw github");
    workDone("Siap");
  }
  function rebind() {
    injectMobileCSS();
    patchContinuity();
    patchForceTools();
    patchSpotify();
    patchRunAgentTags();
    hookComposer();
    unlockSend();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else setTimeout(boot, 150);
  setTimeout(rebind, 700);
  setTimeout(rebind, 2000);
  setTimeout(rebind, 5000);
})();
