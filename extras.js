/* RolxDesk extras v4.5 — yt-search by ID + unlock send, no freeze */
(function () {
  if (window.__RD_EXTRAS_V45__) return;
  window.__RD_EXTRAS_V45__ = true;
  window.__RD_EXTRAS_V4__ = true;
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
        reject(new Error((label || "op") + " timeout " + ms + "ms"));
      }, ms || 25000);
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
      if (window.state) { window.state.isStreaming = false; window.state._sendLock = false; }
      var btn = document.getElementById("sendBtn");
      if (btn) btn.disabled = false;
      if (typeof setActivity === "function") setActivity("Siap", "");
      if (typeof clearLiveStatus === "function") clearLiveStatus();
    } catch (e) {}
  }

  function injectMobileCSS() {
    if ($("#rd-extras-css")) return;
    var s = document.createElement("style");
    s.id = "rd-extras-css";
    s.textContent = [
      "html, body { padding-top: env(safe-area-inset-top, 0px); }",
      ".chat-header, .main > header, header.chat-header, .topbar { padding-top: max(8px, env(safe-area-inset-top, 0px)) !important; }",
      "@media (max-width: 720px) {",
      "  .chat-header { padding-top: max(10px, env(safe-area-inset-top, 0px)) !important; min-height: 48px; }",
      "  .multi-mode-bar { max-height: 28vh !important; overflow: hidden !important; }",
      "  .multi-mode-bar #multiModelChecks, #multiModelChecks { max-height: 16vh !important; overflow-y: auto !important; -webkit-overflow-scrolling: touch; }",
      "  .multi-chip { font-size: .65rem !important; padding: 4px 8px !important; }",
      "  .messages { padding-bottom: 110px !important; min-height: 28vh !important; }",
      "  #rd-yt { bottom: 80px !important; width: min(100vw - 16px, 360px) !important; right: 8px !important; }",
      "  #rd-peek { bottom: 70px !important; max-height: 28vh !important; }",
      "}",
      "#sendBtn:disabled { opacity: 0.55; }",
      "#userInput { pointer-events: auto !important; }"
    ].join("\n");
    document.head.appendChild(s);
    var vp = document.querySelector('meta[name="viewport"]');
    if (vp && !/viewport-fit=cover/.test(vp.content || "")) {
      vp.content = (vp.content || "width=device-width, initial-scale=1") + ", viewport-fit=cover";
    }
  }

  function ensurePeek() {
    var box = $("#rd-peek");
    if (box) return box;
    box = el("div", { id: "rd-peek" });
    Object.assign(box.style, {
      position: "fixed", left: "8px", right: "8px", bottom: "8px", maxHeight: "28vh",
      overflow: "auto", zIndex: "9999", background: "rgba(12,12,16,.94)", color: "#d8d8e0",
      border: "1px solid #333", borderRadius: "10px", font: "12px/1.4 ui-monospace,monospace",
      padding: "8px 10px", display: "none"
    });
    var head = el("div");
    head.style.cssText = "display:flex;justify-content:space-between;align-items:center;margin-bottom:6px";
    head.appendChild(el("strong", { id: "rd-peek-title" }, "Aktivitas"));
    var close = el("button", { type: "button" }, "\u00d7");
    close.style.cssText = "background:none;border:0;color:#aaa;font-size:16px;cursor:pointer";
    close.onclick = function () { box.style.display = "none"; };
    head.appendChild(close);
    box.appendChild(head);
    box.appendChild(el("pre", { id: "rd-peek-body" }, ""));
    document.body.appendChild(box);
    return box;
  }
  window.rdPeek = function (title, body, stay) {
    var box = ensurePeek();
    var t = $("#rd-peek-title"), b = $("#rd-peek-body");
    if (t) t.textContent = title || "Aktivitas";
    if (b) b.textContent = body || "";
    box.style.display = "block";
    if (!stay) {
      clearTimeout(window.__rdPeekTimer);
      window.__rdPeekTimer = setTimeout(function () { box.style.display = "none"; }, 10000);
    }
  };
  window.rdStatus = function (msg) {
    if (typeof setLiveStatus === "function") try { setLiveStatus(msg); } catch (e) {}
    rdPeek("Status", msg, true);
  };

  var TOOL_LAW =
    "\n\n[ROLXDESK TOOL LAW]\n"
    + "Fokus PESAN USER TERAKHIR saja. Jangan mengulang topik lama.\n"
    + "JANGAN bilang tidak bisa. JANGAN balas kosong. JANGAN meniru teks error sebagai tag.\n"
    + "Tag: [[SEARCH: q]] [[BROWSE: url]] [[DOWNLOAD: url]] [[YOUTUBE: q]] [[IMG: prompt]] [[PLAY: lagu]] [[RUN_PY]] [[RUN_JS]] [[CALC: e]] [[WEATHER: kota]]\n"
    + "Gambar=[[IMG:]]. Video=[[YOUTUBE:]]. Lagu=[[PLAY:]]. Situs=[[BROWSE:]].\n";

  function patchContinuity() {
    try {
      if (typeof CONTINUITY === "string" && CONTINUITY.indexOf("PESAN USER TERAKHIR") === -1) CONTINUITY += TOOL_LAW;
    } catch (e) {}
    if (typeof window.injectPersona === "function" && !window.injectPersona.__rd45) {
      var orig = window.injectPersona;
      window.injectPersona = function (m) {
        var out = orig(m);
        if (Array.isArray(out) && out[0] && out[0].role === "system") {
          var c = String(out[0].content);
          if (c.indexOf("PESAN USER TERAKHIR") === -1) out[0] = { role: "system", content: c + TOOL_LAW };
        }
        return out;
      };
      window.injectPersona.__rd45 = true;
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
  function wantsYoutube(u) { return /(youtube|youtu\.be|putar\s*video|play\s*video|tonton|video\s+terbaru|short[s]?\b)/i.test(u); }
  function wantsMusic(u) { return /(spotify|putar\s*(lagu|musik)|play\s*(song|music|lagu)|lirik)/i.test(u) && !wantsYoutube(u); }
  function wantsImage(u) { return /(buatkan?|generate|bikin|gambarin|draw|lukis|generate\s+image|make\s+(an?\s+)?image|\/img)\b/i.test(u); }

  function forceToolsExpanded(userText, assistantText) {
    var out = assistantText || "";
    var u = String(userText || "");
    var already = function (tag) { return new RegExp("\\[\\[" + tag, "i").test(out); };
    var url = extractUrl(u);
    var dom = extractDomain(u);
    if (!url && dom) url = "https://" + dom;
    if (url && !/youtube\.com|youtu\.be|spotify\.com/i.test(url)) {
      if (/(research|cari|buka|baca|browse|telusuri|kunjungi|isi|lihat|apa\s+aja|ringkas)/i.test(u) || /^https?:\/\//i.test(u.trim()) || dom) {
        if (!already("BROWSE")) out += "\n[[BROWSE: " + url + "]]\n";
        out = out.replace(/\[\[SEARCH:\s*[^\]]*\]\]/gi, "");
      }
    }
    if (wantsImage(u) && !already("IMG") && !wantsYoutube(u)) {
      var ip = u.replace(/.*(?:buatkan?|generate|bikin|gambarin|draw|lukis|generate\s+image|make\s+(?:an?\s+)?image|\/img)\s*/i, "").trim();
      if (ip.length < 3) ip = u.slice(0, 120);
      out += "\n[[IMG: " + ip.slice(0, 400) + "]]\n";
    }
    if (wantsYoutube(u) && !already("YOUTUBE")) {
      var yu = extractUrl(u) || u.replace(/.*(?:youtube|putar\s*video|play\s*video|tonton|video\s+terbaru(?:\s+dari)?|short[s]?)\s*/i, "").trim();
      yu = yu.replace(/^(video|lagu)\s+/i, "").trim();
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
    if (typeof window.forceToolsFromUser === "function" && !window.forceToolsFromUser.__rd45) {
      var prev = window.forceToolsFromUser;
      window.forceToolsFromUser = function (ut, at) {
        var base = prev(ut, at);
        if (wantsYoutube(ut)) base = String(base || "").replace(/\[\[PLAY:\s*[^\]]+\]\]/gi, "");
        return forceToolsExpanded(ut, base);
      };
      window.forceToolsFromUser.__rd45 = true;
    } else if (typeof window.forceToolsFromUser !== "function") {
      window.forceToolsFromUser = forceToolsExpanded;
    }
  }

  function ensureYoutubePanel() {
    var p = $("#rd-yt");
    if (p) return p;
    p = el("div", { id: "rd-yt" });
    Object.assign(p.style, {
      position: "fixed", right: "12px", bottom: "80px", width: "min(360px,92vw)",
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

  function playYoutube(q) {
    var id = null;
    var m = String(q).match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([A-Za-z0-9_-]{6,})/);
    if (m) id = m[1];
    var panel = ensureYoutubePanel();
    var frame = $("#rd-yt-frame");
    var title = $("#rd-yt-title");
    if (id) {
      if (title) title.textContent = "YouTube \u00b7 " + id;
      if (frame) frame.src = "https://www.youtube-nocookie.com/embed/" + id + "?autoplay=1&rel=0";
      panel.style.display = "block";
      return "\u25b6\ufe0f Mini player: https://youtu.be/" + id;
    }
    // Jangan pakai listType=search (sering Video tidak tersedia)
    var qq = encodeURIComponent(String(q).slice(0, 80));
    if (title) title.textContent = "YouTube \u00b7 " + String(q).slice(0, 40);
    panel.style.display = "none";
    return "\u25b6\ufe0f Cari di YouTube: https://www.youtube.com/results?search_query=" + qq;
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
    rdPeek("Spotify", label);
    if (typeof showToast === "function") showToast("Play: " + label, "success");
  }

  async function playMusicFree(q) {
    var yq = String(q).replace(/^(putar|play)\s+(lagu|musik|song|music)?\s*/i, "").trim() || q;
    unlockSend();
    rdStatus("Cari YouTube: " + yq);
    try {
      var r = await withTimeout(fetch("/api/yt-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ q: yq + " official audio" })
      }), 12000, "yt-search");
      var j = await r.json().catch(function () { return {}; });
      if (r.ok && j.id) {
        var panel = ensureYoutubePanel();
        var frame = $("#rd-yt-frame");
        var title = $("#rd-yt-title");
        if (title) title.textContent = String(j.title || yq).slice(0, 50);
        if (frame) frame.src = "https://www.youtube-nocookie.com/embed/" + j.id + "?autoplay=1&rel=0";
        panel.style.display = "block";
        rdPeek("Musik", (j.title || yq) + "\n" + (j.url || ("https://youtu.be/" + j.id)));
        if (typeof showToast === "function") showToast("Play: " + (j.title || yq), "success");
        return;
      }
      var link = (j && j.search) || ("https://www.youtube.com/results?search_query=" + encodeURIComponent(yq + " official audio"));
      rdPeek("Musik", "Buka:\n" + link);
      if (typeof showToast === "function") showToast("Buka YouTube search", "info");
      try { window.open(link, "_blank"); } catch (e) {}
    } catch (e) {
      rdPeek("Musik", "Gagal: " + (e.message || e));
      unlockSend();
    }
  }

  function patchSpotify() {
    window.playSpotify = async function (query) {
      if (!query) return;
      var q = String(query).trim();
      unlockSend();
      rdStatus("Musik: " + q);
      var mTrack = q.match(/open\.spotify\.com\/track\/([A-Za-z0-9]+)/i) || q.match(/spotify:track:([A-Za-z0-9]+)/i);
      if (mTrack) {
        showSpotifyEmbedId(mTrack[1], "Spotify \u00b7 " + mTrack[1]);
        return;
      }
      await playMusicFree(q);
    };
    window.playSpotify.__rd45 = true;

    if (typeof window.maybePlayFromText === "function" && !window.maybePlayFromText.__rd45) {
      var om = window.maybePlayFromText;
      window.maybePlayFromText = async function (text) {
        if (wantsYoutube(text) || /\[\[YOUTUBE:/i.test(text || "")) return false;
        return om(text);
      };
      window.maybePlayFromText.__rd45 = true;
    }
    if (typeof window.extractPlayQuery === "function" && !window.extractPlayQuery.__rd45) {
      var ex = window.extractPlayQuery;
      window.extractPlayQuery = function (text) {
        if (wantsYoutube(text)) return null;
        return ex(text);
      };
      window.extractPlayQuery.__rd45 = true;
    }
  }

  var _executed = { youtube: false, download: false, browse: false, image: false };

  async function doBrowse(url, mode) {
    rdStatus((mode === "download" ? "Download " : "Browse ") + url);
    try {
      var r = await withTimeout(fetch("/api/browse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url, mode: mode || "text" })
      }), 20000, "browse");
      var j = await r.json();
      if (!r.ok) return "Error browse: " + (j.error || r.status);
      if (mode === "download") { _executed.download = true; return "Download: **" + (j.filename || "file") + "**"; }
      _executed.browse = true;
      return (j.title ? ("**" + j.title + "**\n") : "") + String(j.text || "").slice(0, 12000);
    } catch (e) {
      return "Browse gagal: " + (e.message || e);
    }
  }

  async function generateImageGemini(prompt) {
    var key = (window.state && window.state.keys && window.state.keys.google) || "";
    if (!key) { try { key = (JSON.parse(localStorage.getItem("rd_keys") || "{}")).google || ""; } catch (e) {} }
    if (!key) return { error: "Isi Google API key di Pengaturan." };
    rdStatus("Generate gambar\u2026");
    var models = ["gemini-3.1-flash-image", "gemini-2.5-flash-image", "gemini-3.1-flash-lite-image"];
    var lastErr = "";
    for (var mi = 0; mi < models.length; mi++) {
      var model = models[mi];
      try {
        var url = "https://generativelanguage.googleapis.com/v1beta/models/" + encodeURIComponent(model) + ":generateContent?key=" + encodeURIComponent(key);
        var body = {
          contents: [{ role: "user", parts: [{ text: "Generate a high quality image: " + prompt }] }],
          generationConfig: { responseModalities: ["TEXT", "IMAGE"] }
        };
        var res = await withTimeout(fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body)
        }), 28000, "img-" + model);
        var data = await res.json().catch(function () { return {}; });
        if (!res.ok) {
          lastErr = (data.error && data.error.message) || ("HTTP " + res.status);
          if (/quota|rate.limit|billing/i.test(lastErr)) return { error: "Kuota Gemini habis." };
          continue;
        }
        var parts = (((data.candidates || [])[0] || {}).content || {}).parts || [];
        var texts = [], images = [];
        for (var i = 0; i < parts.length; i++) {
          var p = parts[i];
          if (p.text) texts.push(p.text);
          var idata = p.inlineData || p.inline_data;
          if (idata && idata.data) {
            images.push("data:" + (idata.mimeType || idata.mime_type || "image/png") + ";base64," + idata.data);
          }
        }
        if (images.length) { _executed.image = true; return { images: images, text: texts.join("\n").trim(), model: model }; }
        lastErr = model + " tanpa gambar";
      } catch (e) { lastErr = String(e.message || e); }
    }
    return { error: lastErr || "Gagal generate" };
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
      html += '<img class="msg-thumb" src="' + images[i] + '" alt="generated" style="max-width:min(100%,420px);max-height:360px;border-radius:12px;margin-top:8px;display:block" />';
    }
    bubble.innerHTML = html;
    wrap.appendChild(bubble);
    box.appendChild(wrap);
    box.scrollTop = box.scrollHeight;
  }

  async function runExtraTags(content) {
    if (!content) return content;
    var out = content;
    _executed = { youtube: false, download: false, browse: false, image: false };
    try {
      var br = [...out.matchAll(/\[\[BROWSE:\s*([^\]]+)\]\]/gi)];
      for (var i = 0; i < br.length; i++) {
        var url = br[i][1].trim();
        if (!/^https?:\/\//i.test(url)) url = "https://" + url;
        var res = await doBrowse(url, "text");
        out = out.replace(br[i][0], "\n**Browse (" + url + "):**\n" + res + "\n");
      }
      out = out.replace(/\[\[YOUTUBE:\s*([^\]]+)\]\]/gi, function (_, q) {
        _executed.youtube = true;
        return "\n" + playYoutube(q.trim()) + "\n";
      });
      out = out.replace(/\[\[PLAY:\s*([^\]]+)\]\]/gi, function (_, q) {
        try { window.playSpotify(q.trim()); } catch (e) { playMusicFree(q.trim()); }
        return "\n\ud83c\udfb5 Putar: **" + q.trim() + "**\n";
      });
      var ims = [...out.matchAll(/\[\[IMG:\s*([^\]]+)\]\]/gi)];
      for (var ii = 0; ii < ims.length; ii++) {
        var iprompt = ims[ii][1].trim();
        if (/not found for API|Generate gambar gagal|ModelService|quota/i.test(iprompt)) {
          out = out.replace(ims[ii][0], ""); continue;
        }
        var ires = await generateImageGemini(iprompt);
        if (ires.images && ires.images.length) {
          showGeneratedImages(ires.images, ires.text || ("Gambar: " + iprompt.slice(0, 80)));
          out = out.replace(ims[ii][0], "\n\ud83d\uddbc\ufe0f Gambar siap.\n");
        } else {
          rdPeek("IMG error", String(ires.error || "").slice(0, 280), true);
          out = out.replace(ims[ii][0], "\n\u26a0\ufe0f Generate gambar gagal.\n");
        }
      }
    } catch (e) { rdPeek("runExtraTags error", String(e.message || e), true); }
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
    if (typeof window.runAgentTags === "function" && !window.runAgentTags.__rd45) {
      var orig = window.runAgentTags;
      window.runAgentTags = async function (content) {
        try {
          rdPeek("Agent tags", String(content || "").slice(0, 280), true);
          var mid = await withTimeout(Promise.resolve(orig(content)), 90000, "agent-tags");
          var final = await runExtraTags(mid);
          return ensureNonEmpty(final);
        } catch (e) {
          rdPeek("Agent error", String(e.message || e), true);
          unlockSend();
          return "Error tool: " + (e.message || e);
        } finally { unlockSend(); }
      };
      window.runAgentTags.__rd45 = true;
    }
  }

  setInterval(function () {
    try {
      if (window.state && (window.state.isStreaming || window.state._sendLock)) {
        if (!window.__rdLockSince) window.__rdLockSince = Date.now();
        else if (Date.now() - window.__rdLockSince > 60000) {
          unlockSend(); window.__rdLockSince = 0;
          rdPeek("Watchdog", "Send unlock 60s");
        }
      } else window.__rdLockSince = 0;
    } catch (e) {}
  }, 4000);

  function handleSlash(text) {
    var m = String(text || "").trim().match(/^\/(img|image|gambar|song|lagu|music|video|vid)\s+([\s\S]+)/i);
    if (!m) return null;
    var cmd = m[1].toLowerCase(), prompt = m[2].trim();
    if (cmd === "img" || cmd === "image" || cmd === "gambar") return { userText: prompt + "\n\n[[IMG: " + prompt + "]]", inject: "" };
    if (cmd === "song" || cmd === "lagu" || cmd === "music") return { userText: prompt + "\n\n[[PLAY: " + prompt + "]]", inject: "" };
    return { userText: prompt, inject: "" };
  }

  function hookComposer() {
    document.querySelectorAll("#userInput, textarea").forEach(function (ta) {
      if (!ta || ta.__rdSlash45) return;
      ta.__rdSlash45 = true;
      ta.addEventListener("keydown", function (e) {
        if (e.key === "Enter" && !e.shiftKey) {
          var raw = ta.value != null ? ta.value : ta.innerText;
          var sl = handleSlash(raw);
          if (sl && ta.value != null) ta.value = sl.userText;
        }
      }, true);
    });
  }

  function boot() {
    injectMobileCSS(); patchContinuity(); patchForceTools(); patchSpotify(); patchRunAgentTags();
    hookComposer(); ensurePeek(); unlockSend();
    rdPeek("RolxDesk extras v4.5", "Musik: yt-search ID + no freeze");
  }
  function rebind() {
    injectMobileCSS(); patchContinuity(); patchForceTools(); patchSpotify(); patchRunAgentTags(); hookComposer();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else setTimeout(boot, 200);
  setTimeout(rebind, 800); setTimeout(rebind, 2000); setTimeout(rebind, 5000);
})();
