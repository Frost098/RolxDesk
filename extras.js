/* RolxDesk extras v4.1 — image gen fix, less sticky memory, cleaner errors */
(function () {
  if (window.__RD_EXTRAS_V41__) return;
  window.__RD_EXTRAS_V41__ = true;
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

  function injectMobileCSS() {
    if ($("#rd-extras-css")) return;
    var s = document.createElement("style");
    s.id = "rd-extras-css";
    s.textContent = "@media(max-width:720px){.multi-mode-bar{max-height:30vh!important;overflow:hidden!important}.multi-mode-bar #multiModelChecks,#multiModelChecks{max-height:18vh!important;overflow-y:auto!important;-webkit-overflow-scrolling:touch}.multi-chip{font-size:.65rem!important;padding:4px 8px!important}.messages{padding-bottom:100px!important;min-height:30vh!important}}#rd-yt{bottom:72px!important}";
    document.head.appendChild(s);
  }

  function ensurePeek() {
    var box = $("#rd-peek");
    if (box) return box;
    box = el("div", { id: "rd-peek" });
    Object.assign(box.style, {
      position: "fixed", left: "8px", right: "8px", bottom: "8px", maxHeight: "32vh",
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
      window.__rdPeekTimer = setTimeout(function () { box.style.display = "none"; }, 12000);
    }
  };
  window.rdStatus = function (msg) {
    if (typeof setLiveStatus === "function") try { setLiveStatus(msg); } catch (e) {}
    rdPeek("Status", msg, true);
  };

  var TOOL_LAW =
    "\n\n[ROLXDESK TOOL LAW]\n"
    + "Fokus pada PESAN USER TERAKHIR saja. Jangan mengulang topik lama kecuali user minta.\n"
    + "JANGAN bilang tidak bisa. JANGAN balas kosong. JANGAN meniru teks error sistem sebagai tag.\n"
    + "Tag valid HANYA: [[SEARCH: q]] [[BROWSE: url]] [[DOWNLOAD: url]] [[YOUTUBE: q]] [[IMG: prompt]] [[PLAY: lagu]] [[RUN_PY]] [[RUN_JS]] [[CALC: e]] [[WEATHER: kota]]\n"
    + "URL/domain \u2192 [[BROWSE: https://...]]. Video \u2192 [[YOUTUBE:]]. Lagu \u2192 [[PLAY:]]. Gambar \u2192 [[IMG: English prompt]].\n"
    + "Jangan keluarkan tag palsu atau meniru pesan error.\n";

  function patchContinuity() {
    try {
      if (typeof CONTINUITY === "string" && CONTINUITY.indexOf("TOOL LAW") === -1) CONTINUITY += TOOL_LAW;
      else if (typeof CONTINUITY === "string" && CONTINUITY.indexOf("PESAN USER TERAKHIR") === -1) CONTINUITY += TOOL_LAW;
    } catch (e) {}
    if (typeof window.injectPersona === "function" && !window.injectPersona.__rd41) {
      var orig = window.injectPersona;
      window.injectPersona = function (m) {
        var out = orig(m);
        if (Array.isArray(out) && out[0] && out[0].role === "system") {
          var c = String(out[0].content);
          if (c.indexOf("PESAN USER TERAKHIR") === -1) out[0] = { role: "system", content: c + TOOL_LAW };
        }
        return out;
      };
      window.injectPersona.__rd41 = true;
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
    if (/(research|cari\s+(berita|info|data)|search\b|google\b)/i.test(u) && !already("SEARCH") && !url && !wantsYoutube(u) && !wantsImage(u)) {
      var q = u.replace(/.*(?:research|cari(?:\s+berita|\s+info)?|search|google)\s*/i, "").replace(/\?+$/, "").trim();
      if (q.length < 3) q = u.slice(0, 80);
      out += "\n[[SEARCH: " + q.slice(0, 100) + "]]\n";
    }
    return out;
  }

  function patchForceTools() {
    if (typeof window.forceToolsFromUser === "function" && !window.forceToolsFromUser.__rd41) {
      var prev = window.forceToolsFromUser;
      window.forceToolsFromUser = function (ut, at) {
        var base = prev(ut, at);
        if (wantsYoutube(ut)) base = String(base || "").replace(/\[\[PLAY:\s*[^\]]+\]\]/gi, "");
        return forceToolsExpanded(ut, base);
      };
      window.forceToolsFromUser.__rd41 = true;
    } else if (typeof window.forceToolsFromUser !== "function") {
      window.forceToolsFromUser = forceToolsExpanded;
    }
  }

  function patchSpotify() {
    if (typeof window.playSpotify === "function" && !window.playSpotify.__rd41) {
      window.playSpotify = async function (query) {
        if (!query) return;
        var q = String(query).trim();
        rdStatus("Spotify: " + q);
        var token = "";
        try {
          if (typeof ensureSpotifyToken === "function") token = await ensureSpotifyToken();
          else token = (window.state && window.state.keys && window.state.keys.spotify) || localStorage.getItem("rd_spotify") || "";
        } catch (e) {
          rdPeek("Spotify token", String(e.message || e), true);
          if (typeof showToast === "function") showToast("Spotify token: " + (e.message || e), "error");
          return;
        }
        token = String(token || "").replace(/^Bearer\s+/i, "");
        if (!token) {
          if (typeof showToast === "function") showToast("Isi Spotify Access/Refresh Token di Connector", "error");
          return;
        }
        try {
          var data;
          if (typeof fetchSpotifyApi === "function") data = await fetchSpotifyApi("v1/search?type=track&limit=1&q=" + encodeURIComponent(q), "GET");
          else {
            var res = await fetch("https://api.spotify.com/v1/search?type=track&limit=1&q=" + encodeURIComponent(q), { headers: { Authorization: "Bearer " + token } });
            data = await res.json();
            if (res.status === 403) throw new Error("403 — token kurang scope atau perlu refresh");
            if (!res.ok) throw new Error((data.error && data.error.message) || ("HTTP " + res.status));
          }
          var track = data.tracks && data.tracks.items && data.tracks.items[0];
          if (!track) throw new Error("Track tidak ditemukan: " + q);
          var label = track.name + " \u2014 " + (track.artists || []).map(function (a) { return a.name; }).join(", ");
          if (typeof showSpotifyEmbed === "function") showSpotifyEmbed(track.id);
          else {
            var wrap = document.getElementById("spotifyEmbedWrap");
            var iframe = document.getElementById("spotifyEmbed");
            if (wrap && iframe) {
              iframe.src = "https://open.spotify.com/embed/track/" + track.id + "?utm_source=generator&theme=0&autoplay=1";
              iframe.style.display = "block";
              iframe.style.height = "152px";
              wrap.style.display = "flex";
            }
          }
          rdPeek("Spotify", label);
          if (typeof showToast === "function") showToast("Play: " + label, "success");
        } catch (e) {
          rdPeek("Spotify error", String(e.message || e));
          if (typeof showToast === "function") showToast("Spotify: " + (e.message || e), "error");
        }
      };
      window.playSpotify.__rd41 = true;
    }
    if (typeof window.maybePlayFromText === "function" && !window.maybePlayFromText.__rd41) {
      var om = window.maybePlayFromText;
      window.maybePlayFromText = async function (text) {
        if (wantsYoutube(text) || /\[\[YOUTUBE:/i.test(text || "")) return false;
        return om(text);
      };
      window.maybePlayFromText.__rd41 = true;
    }
    if (typeof window.extractPlayQuery === "function" && !window.extractPlayQuery.__rd41) {
      var ex = window.extractPlayQuery;
      window.extractPlayQuery = function (text) {
        if (wantsYoutube(text)) return null;
        return ex(text);
      };
      window.extractPlayQuery.__rd41 = true;
    }
  }

  var _executed = { youtube: false, download: false, browse: false, image: false };

  async function doBrowse(url, mode) {
    rdStatus((mode === "download" ? "Download " : "Browse ") + url);
    try {
      var r = await fetch("/api/browse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url, mode: mode || "text" })
      });
      var j = await r.json();
      if (!r.ok) return "Error browse: " + (j.error || r.status);
      if (mode === "download") {
        _executed.download = true;
        return "Download: **" + (j.filename || "file") + "** (" + (j.bytes || "?") + " B)";
      }
      _executed.browse = true;
      return (j.title ? ("**" + j.title + "**\n") : "") + String(j.text || "").slice(0, 12000);
    } catch (e) {
      return "Browse gagal: " + (e.message || e);
    }
  }

  function ensureYoutubePanel() {
    var p = $("#rd-yt");
    if (p) return p;
    p = el("div", { id: "rd-yt" });
    Object.assign(p.style, {
      position: "fixed", right: "12px", bottom: "72px", width: "min(360px,92vw)",
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
    _executed.youtube = true;
    if (id) {
      if (title) title.textContent = "YouTube \u00b7 " + id;
      if (frame) frame.src = "https://www.youtube-nocookie.com/embed/" + id + "?autoplay=1&rel=0";
      panel.style.display = "block";
      return "\u25b6\ufe0f Mini player: https://youtu.be/" + id;
    }
    var qq = encodeURIComponent(String(q).slice(0, 80));
    if (title) title.textContent = "YouTube \u00b7 " + String(q).slice(0, 40);
    if (frame) frame.src = "https://www.youtube-nocookie.com/embed?listType=search&list=" + qq;
    panel.style.display = "block";
    return "\u25b6\ufe0f Cari di mini player: **" + String(q).slice(0, 80) + "**\nBuka: https://www.youtube.com/results?search_query=" + qq;
  }

  async function generateImageGemini(prompt) {
    var key = (window.state && window.state.keys && window.state.keys.google) || "";
    if (!key) {
      try { key = (JSON.parse(localStorage.getItem("rd_keys") || "{}")).google || ""; } catch (e) {}
    }
    if (!key) return { error: "Isi Google AI Studio API key di Pengaturan." };
    rdStatus("Generate gambar\u2026");
    var models = [
      "gemini-3.1-flash-image",
      "gemini-2.5-flash-image",
      "gemini-3.1-flash-lite-image",
      "gemini-3-pro-image"
    ];
    var lastErr = "";
    var configs = [
      { responseModalities: ["TEXT", "IMAGE"] },
      { responseModalities: ["IMAGE"] },
      { responseModalities: ["Text", "Image"] }
    ];
    for (var mi = 0; mi < models.length; mi++) {
      var model = models[mi];
      for (var ci = 0; ci < configs.length; ci++) {
        try {
          var url = "https://generativelanguage.googleapis.com/v1beta/models/" + encodeURIComponent(model) + ":generateContent?key=" + encodeURIComponent(key);
          var body = {
            contents: [{ role: "user", parts: [{ text: "Generate a high quality image: " + prompt }] }],
            generationConfig: configs[ci]
          };
          var res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
          });
          var data = await res.json().catch(function () { return {}; });
          if (!res.ok) {
            lastErr = (data.error && data.error.message) || ("HTTP " + res.status);
            if (/not found|not supported/i.test(lastErr)) break;
            continue;
          }
          var parts = (((data.candidates || [])[0] || {}).content || {}).parts || [];
          var texts = [], images = [];
          for (var i = 0; i < parts.length; i++) {
            var p = parts[i];
            if (p.text) texts.push(p.text);
            var idata = p.inlineData || p.inline_data;
            if (idata && idata.data) {
              var mime = idata.mimeType || idata.mime_type || "image/png";
              images.push("data:" + mime + ";base64," + idata.data);
            }
          }
          if (images.length) {
            _executed.image = true;
            return { images: images, text: texts.join("\n").trim(), model: model };
          }
          lastErr = model + " tidak mengembalikan gambar";
        } catch (e) {
          lastErr = String(e.message || e);
        }
      }
    }
    return { error: lastErr || "Gagal generate \u2014 cek Google API key & akses model image di AI Studio" };
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
    try {
      var session = typeof getActiveSession === "function" ? getActiveSession() : null;
      if (session) {
        session.messages.push({
          role: "assistant",
          content: caption || "[Gambar di-generate]",
          images: images.map(function (u) { return { dataUrl: u }; })
        });
        if (typeof saveSessions === "function") saveSessions();
      }
    } catch (e) {}
  }

  async function runExtraTags(content) {
    if (!content) return content;
    var out = content;
    _executed = { youtube: false, download: false, browse: false, image: false };

    var br = [...out.matchAll(/\[\[BROWSE:\s*([^\]]+)\]\]/gi)];
    for (var i = 0; i < br.length; i++) {
      var url = br[i][1].trim();
      if (!/^https?:\/\//i.test(url)) url = "https://" + url;
      var res = await doBrowse(url, "text");
      out = out.replace(br[i][0], "\n**Browse (" + url + "):**\n" + res + "\n");
    }
    var dl = [...out.matchAll(/\[\[DOWNLOAD:\s*([^\]]+)\]\]/gi)];
    for (var j = 0; j < dl.length; j++) {
      var dres = await doBrowse(dl[j][1].trim(), "download");
      out = out.replace(dl[j][0], "\n" + dres + "\n");
    }
    out = out.replace(/\[\[YOUTUBE:\s*([^\]]+)\]\]/gi, function (_, q) {
      return "\n" + playYoutube(q.trim()) + "\n";
    });

    var ims = [...out.matchAll(/\[\[IMG:\s*([^\]]+)\]\]/gi)];
    for (var ii = 0; ii < ims.length; ii++) {
      var iprompt = ims[ii][1].trim();
      if (/not found for API|Generate gambar gagal|ModelService/i.test(iprompt)) {
        out = out.replace(ims[ii][0], "");
        continue;
      }
      var ires = await generateImageGemini(iprompt);
      if (ires.images && ires.images.length) {
        showGeneratedImages(ires.images, ires.text || ("Gambar: " + iprompt.slice(0, 80)));
        out = out.replace(ims[ii][0], "\n\ud83d\uddbc\ufe0f Gambar siap (" + (ires.model || "gemini") + ").\n");
      } else {
        var short = "Generate gambar gagal. Cek Google API key & model image di AI Studio.";
        rdPeek("IMG error", String(ires.error || "").slice(0, 300), true);
        out = out.replace(ims[ii][0], "\n\u26a0\ufe0f " + short + "\n");
      }
    }
    out = out.replace(/models\/gemini-[^\s]+ is not found[^\n]*/gi, "");
    out = out.replace(/Call ModelService\.ListModels[^\n]*/gi, "");
    return out.replace(/\n{3,}/g, "\n\n").trim();
  }

  function ensureNonEmpty(content, userHint) {
    var s = String(content || "").trim();
    if (s && s !== "(kosong)" && s.length > 2) return s;
    if (_executed.image) return "Gambar di-generate.";
    if (_executed.youtube) return "Video di mini player.";
    if (_executed.browse) return "Browse selesai.";
    return "Model mengembalikan jawaban kosong. Coba ulangi atau ganti model.";
  }

  function patchRunAgentTags() {
    if (typeof window.runAgentTags === "function" && !window.runAgentTags.__rd41) {
      var orig = window.runAgentTags;
      window.runAgentTags = async function (content) {
        rdPeek("Agent tags", String(content || "").slice(0, 300), true);
        var mid = await orig(content);
        var final = await runExtraTags(mid);
        return ensureNonEmpty(final, content);
      };
      window.runAgentTags.__rd41 = true;
    }
  }

  function handleSlash(text) {
    var m = String(text || "").trim().match(/^\/(img|image|gambar|song|lagu|music|video|vid)\s+([\s\S]+)/i);
    if (!m) return null;
    var cmd = m[1].toLowerCase(), prompt = m[2].trim();
    if (cmd === "img" || cmd === "image" || cmd === "gambar") {
      return { userText: prompt + "\n\n[[IMG: " + prompt + "]]", inject: "" };
    }
    if (cmd === "song" || cmd === "lagu" || cmd === "music") {
      return { userText: prompt, inject: "Buat lirik lagu. Jangan kosong." };
    }
    return { userText: prompt, inject: "Buat shot list video." };
  }

  function hookComposer() {
    document.querySelectorAll("#userInput, textarea").forEach(function (ta) {
      if (!ta || ta.__rdSlash41) return;
      ta.__rdSlash41 = true;
      ta.addEventListener("keydown", function (e) {
        if (e.key === "Enter" && !e.shiftKey) {
          var raw = ta.value != null ? ta.value : ta.innerText;
          var sl = handleSlash(raw);
          if (sl && ta.value != null) {
            ta.value = sl.userText + (sl.inject ? ("\n\n[" + sl.inject + "]") : "");
          }
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
    ensurePeek();
    rdPeek("RolxDesk extras v4.1", "Image models fixed \u00b7 less sticky memory \u00b7 clean errors");
  }
  function rebind() {
    injectMobileCSS();
    patchContinuity();
    patchForceTools();
    patchSpotify();
    patchRunAgentTags();
    hookComposer();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else setTimeout(boot, 200);
  setTimeout(rebind, 800);
  setTimeout(rebind, 2000);
  setTimeout(rebind, 5000);
})();
