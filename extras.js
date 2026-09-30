/* RolxDesk extras v3 — chips, anti-hallucinate, YT≠Spotify, in-app Spotify, browse URL, titles, no-empty */
(function () {
  if (window.__RD_EXTRAS_V3__) return;
  window.__RD_EXTRAS_V3__ = true;
  window.__RD_EXTRAS_V2__ = true;
  window.__RD_EXTRAS__ = true;

  function $(sel, root) { return (root || document).querySelector(sel); }
  function el(tag, attrs, html) {
    var n = document.createElement(tag);
    if (attrs) Object.entries(attrs).forEach(function (kv) {
      var k = kv[0], v = kv[1];
      if (k === "style" && typeof v === "object") Object.assign(n.style, v);
      else if (k.startsWith("on") && typeof v === "function") n.addEventListener(k.slice(2), v);
      else n.setAttribute(k, v);
    });
    if (html != null) n.innerHTML = html;
    return n;
  }

  function injectMobileCSS() {
    if ($("#rd-extras-css")) return;
    var s = document.createElement("style");
    s.id = "rd-extras-css";
    s.textContent = [
      "@media (max-width: 720px) {",
      "  .multi-mode-bar { max-height: 30vh !important; overflow: hidden !important; padding: 6px 10px 8px !important; gap: 6px !important; }",
      "  .multi-mode-bar #multiModelChecks, #multiModelChecks { max-height: 18vh !important; overflow-y: auto !important; overflow-x: hidden !important; -webkit-overflow-scrolling: touch !important; overscroll-behavior: contain; }",
      "  .multi-chip { font-size: 0.65rem !important; padding: 4px 8px !important; }",
      "  .messages { padding-bottom: 100px !important; min-height: 30vh !important; }",
      "  .chat-container { min-height: 0 !important; }",
      "}",
      ".bubble table, .msg table, .messages table { display: block; max-width: 100%; overflow-x: auto; border-collapse: collapse; font-size: 0.8rem; }",
      ".bubble th, .bubble td, .msg th, .msg td { border: 1px solid #333; padding: 4px 8px; white-space: nowrap; }",
      "#rd-yt { bottom: 72px !important; }",
      "#spotifyEmbedWrap { z-index: 50; }",
      "@media (max-width: 720px) { #rd-yt { width: min(100vw - 16px, 360px) !important; right: 8px !important; } }"
    ].join("\n");
    document.head.appendChild(s);
  }

  function ensurePeek() {
    var box = $("#rd-peek");
    if (box) return box;
    box = el("div", { id: "rd-peek" });
    Object.assign(box.style, {
      position: "fixed", left: "8px", right: "8px", bottom: "8px",
      maxHeight: "32vh", overflow: "auto", zIndex: "9999",
      background: "rgba(12,12,16,.94)", color: "#d8d8e0",
      border: "1px solid #333", borderRadius: "10px",
      font: "12px/1.4 ui-monospace,monospace", padding: "8px 10px",
      display: "none", boxShadow: "0 8px 24px rgba(0,0,0,.45)"
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
    var body = $("#rd-peek-body");
    if (body) body.style.margin = "0";
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
      window.__rdPeekTimer = setTimeout(function () { box.style.display = "none"; }, 14000);
    }
  };
  window.rdStatus = function (msg) {
    if (typeof setLiveStatus === "function") { try { setLiveStatus(msg); } catch (e) {} }
    if (typeof setActivity === "function") { try { setActivity(msg, "busy"); } catch (e) {} }
    rdPeek("Status", msg, true);
  };

  var TOOL_LAW =
    "\n\n[ROLXDESK TOOL LAW]\n"
    + "JANGAN bilang tidak bisa. JANGAN mengarang hasil tool.\n"
    + "JANGAN balas kosong \u2014 minimal 1 kalimat berguna.\n"
    + "URL/domain (vercel.app, .com, dll) \u2192 [[BROWSE: https://...]] bukan [[SEARCH]].\n"
    + "YouTube/video/tonton \u2192 [[YOUTUBE:...]] BUKAN [[PLAY]].\n"
    + "Musik/lagu/Spotify \u2192 [[PLAY: judul]].\n"
    + "Tags: [[SEARCH]] [[BROWSE]] [[DOWNLOAD]] [[YOUTUBE]] [[RUN_PY]] [[RUN_JS]] [[CALC]] [[WEATHER]] [[PLAY]]\n";

  function patchContinuity() {
    try {
      if (typeof CONTINUITY === "string" && CONTINUITY.indexOf("TOOL LAW") === -1) CONTINUITY = CONTINUITY + TOOL_LAW;
    } catch (e) {}
    if (typeof window.injectPersona === "function" && !window.injectPersona.__rd3) {
      var orig = window.injectPersona;
      window.injectPersona = function (messages) {
        var out = orig(messages);
        if (Array.isArray(out) && out[0] && out[0].role === "system" && String(out[0].content).indexOf("TOOL LAW") === -1) {
          out[0] = { role: "system", content: out[0].content + TOOL_LAW };
        }
        return out;
      };
      window.injectPersona.__rd3 = true;
    }
  }

  function stripFakeToolClaims(text, executed) {
    if (!text) return text;
    var s = String(text);
    executed = executed || {};
    if (!executed.download) {
      s = s.replace(/Download\s*\(sistem\)\s*:[\s\S]*?(?=\n\n|$)/gi, "");
      s = s.replace(/Unduhan\s*:\s*[^\n]+/gi, "");
      s = s.replace(/Disimpan sandbox\s*:\s*[^\n]+/gi, "");
    }
    if (!executed.youtube) {
      s = s.replace(/YouTube\s*\(sistem\)\s*:[\s\S]*?(?=\n\n|$)/gi, "");
      s = s.replace(/YouTube diputar di panel[^\n]*/gi, "");
    }
    if (!executed.image) s = s.replace(/Berikut gambar[^\n]*\(dihasilkan secara acak\)\s*:?/gi, "");
    return s.replace(/\n{3,}/g, "\n\n").trim();
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
    return /(youtube|youtu\.be|putar\s*video|play\s*video|tonton|video\s+terbaru|short[s]?\b)/i.test(u);
  }
  function wantsMusic(u) {
    return /(spotify|putar\s*(lagu|musik)|play\s*(song|music|lagu)|lirik)/i.test(u) && !wantsYoutube(u);
  }

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
    if (/(hitung|kalkulator|berapa\s+\d|calc\b)/i.test(u) && !already("CALC")) {
      var cm = u.match(/(\d[\d\s]*[+\-*/x\u00d7:]\s*\d[\d\s+\-*/x\u00d7:]*)/);
      if (cm) out += "\n[[CALC: " + cm[1].replace(/[x\u00d7]/gi, "*").replace(/:/g, "/").replace(/\s+/g, "") + "]]\n";
    }
    if (/(cuaca|weather)/i.test(u) && !already("WEATHER")) {
      var loc = (u.match(/(?:di|ke|at)\s+([A-Za-z\u00c0-\u00ff][A-Za-z\u00c0-\u00ff\s]{1,40}?)(?:\s*$|\?|,)/i) || [])[1];
      out += "\n[[WEATHER: " + (loc || "Jakarta").trim() + "]]\n";
    }
    if (/(research|cari\s+(berita|info|data)|search\b|google\b|berita terbaru)/i.test(u) && !already("SEARCH") && !url && !wantsYoutube(u)) {
      var q = u.replace(/.*(?:research|cari(?:\s+berita|\s+info)?|search|google)\s*/i, "").replace(/\?+$/, "").trim();
      if (q.length < 3) q = u.slice(0, 80);
      out += "\n[[SEARCH: " + q.slice(0, 100) + "]]\n";
    }
    if (/(download|unduh|ambil file)/i.test(u) && !already("DOWNLOAD")) {
      var du = extractUrl(u);
      if (du) out += "\n[[DOWNLOAD: " + du + "]]\n";
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
    if (/(jalankan|eksekusi|run)\s*(kode\s*)?(python|py\b)|python sandbox|\[\[RUN_PY/i.test(u) && !already("RUN_PY")) {
      var code = null;
      var fenced = u.match(/```(?:python|py)?\s*([\s\S]*?)```/i);
      if (fenced) code = fenced[1].trim();
      else if (/print\s*\(/i.test(u)) { var pm = u.match(/(print\s*\([^)]*\))/i); if (pm) code = pm[1]; }
      if (!code && /1\s*\+\s*1/.test(u)) code = "print(1+1)";
      if (!code) code = "print('hello from RolxDesk sandbox')";
      out += "\n[[RUN_PY]]" + code + "[[/RUN_PY]]\n";
    }
    if (/(jalankan|eksekusi|run)\s*(kode\s*)?(js|javascript)|\[\[RUN_JS/i.test(u) && !already("RUN_JS")) {
      var jc = null;
      var jf = u.match(/```(?:js|javascript)?\s*([\s\S]*?)```/i);
      if (jf) jc = jf[1].trim();
      if (!jc) jc = "1+1";
      out += "\n[[RUN_JS]]" + jc + "[[/RUN_JS]]\n";
    }
    return out;
  }

  function patchForceTools() {
    if (typeof window.forceToolsFromUser === "function" && !window.forceToolsFromUser.__rd3) {
      var prev = window.forceToolsFromUser;
      window.forceToolsFromUser = function (userText, assistantText) {
        var base = prev(userText, assistantText);
        if (wantsYoutube(userText)) base = String(base || "").replace(/\[\[PLAY:\s*[^\]]+\]\]/gi, "");
        var expanded = forceToolsExpanded(userText, base);
        if (expanded !== (assistantText || "")) rdPeek("Force tools", expanded.slice(0, 500), true);
        return expanded;
      };
      window.forceToolsFromUser.__rd3 = true;
    } else if (typeof window.forceToolsFromUser !== "function") {
      window.forceToolsFromUser = forceToolsExpanded;
    }
  }

  function patchSpotify() {
    if (typeof window.playSpotify === "function" && !window.playSpotify.__rd3) {
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
          if (typeof showToast === "function") showToast("Spotify: " + (e.message || e) + " \u2014 isi token/refresh di Connector", "error");
          return;
        }
        token = String(token || "").replace(/^Bearer\s+/i, "");
        if (!token) {
          if (typeof showToast === "function") showToast("Isi Spotify Access Token / Refresh Token di Connector", "error");
          rdPeek("Spotify", "Token kosong \u2014 tidak membuka tab baru");
          return;
        }
        try {
          var data;
          if (typeof fetchSpotifyApi === "function") {
            data = await fetchSpotifyApi("v1/search?type=track&limit=1&q=" + encodeURIComponent(q), "GET");
          } else {
            var res = await fetch("https://api.spotify.com/v1/search?type=track&limit=1&q=" + encodeURIComponent(q), { headers: { Authorization: "Bearer " + token } });
            data = await res.json();
            if (!res.ok) throw new Error((data.error && data.error.message) || res.status);
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
          try {
            await fetch("https://api.spotify.com/v1/me/player/play", {
              method: "PUT",
              headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
              body: JSON.stringify({ uris: [track.uri] })
            });
          } catch (_) {}
        } catch (e) {
          rdPeek("Spotify error", String(e.message || e));
          if (typeof showToast === "function") showToast("Spotify: " + (e.message || e), "error");
        }
      };
      window.playSpotify.__rd3 = true;
    }
    if (typeof window.maybePlayFromText === "function" && !window.maybePlayFromText.__rd3) {
      var origMaybe = window.maybePlayFromText;
      window.maybePlayFromText = async function (text) {
        if (wantsYoutube(text) || /\[\[YOUTUBE:/i.test(text || "")) return false;
        return origMaybe(text);
      };
      window.maybePlayFromText.__rd3 = true;
    }
    if (typeof window.extractPlayQuery === "function" && !window.extractPlayQuery.__rd3) {
      var ex = window.extractPlayQuery;
      window.extractPlayQuery = function (text) {
        if (wantsYoutube(text)) return null;
        return ex(text);
      };
      window.extractPlayQuery.__rd3 = true;
    }
  }

  var _executed = { youtube: false, download: false, browse: false };

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
        if (j.text) return "\ud83d\udcc4 **" + (j.filename || "file") + "** (" + j.bytes + " B)\n```\n" + String(j.text).slice(0, 8000) + "\n```";
        if (j.base64) {
          try {
            var bin = atob(j.base64);
            var arr = new Uint8Array(bin.length);
            for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
            var blob = new Blob([arr], { type: j.mime || "application/octet-stream" });
            var a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = j.filename || "download.bin";
            a.click();
            setTimeout(function () { URL.revokeObjectURL(a.href); }, 5000);
          } catch (e) {}
          return "\u2b07\ufe0f Download dimulai: **" + (j.filename || "file") + "** (" + j.bytes + " B)";
        }
        return "Download kosong.";
      }
      _executed.browse = true;
      var title = j.title ? ("**" + j.title + "**\n") : "";
      return title + String(j.text || "").slice(0, 12000);
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
      overflow: "hidden", boxShadow: "0 10px 30px rgba(0,0,0,.5)", display: "none"
    });
    var bar = el("div");
    bar.style.cssText = "display:flex;justify-content:space-between;align-items:center;padding:6px 10px;background:#1a1a1a;font:12px system-ui;color:#ccc";
    bar.appendChild(el("span", { id: "rd-yt-title" }, "YouTube"));
    var x = el("button", { type: "button" }, "\u00d7");
    x.style.cssText = "background:none;border:0;color:#aaa;font-size:16px;cursor:pointer";
    x.onclick = function () { p.style.display = "none"; var f = $("#rd-yt-frame"); if (f) f.src = ""; };
    bar.appendChild(x);
    p.appendChild(bar);
    var frame = el("iframe", { id: "rd-yt-frame", allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen", allowfullscreen: "true" });
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
      if (frame) frame.src = "https://www.youtube.com/embed/" + id + "?autoplay=1";
      panel.style.display = "block";
      rdPeek("YouTube", "Playing https://youtu.be/" + id);
      return "\u25b6\ufe0f Mini player RolxDesk: https://youtu.be/" + id;
    }
    var qq = encodeURIComponent(String(q).slice(0, 80));
    if (title) title.textContent = "YouTube \u00b7 " + String(q).slice(0, 40);
    if (frame) frame.src = "https://www.youtube.com/embed?listType=search&list=" + qq;
    panel.style.display = "block";
    rdPeek("YouTube search", String(q).slice(0, 80));
    return "\u25b6\ufe0f Mini player search: **" + String(q).slice(0, 80) + "**\n(Jika embed diblokir: https://www.youtube.com/results?search_query=" + qq + ")";
  }

  async function runExtraTags(content) {
    if (!content) return content;
    var out = content;
    _executed = { youtube: false, download: false, browse: false };
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
    out = out.replace(/\[\[YOUTUBE:\s*([^\]]+)\]\]/gi, function (_, q) { return "\n" + playYoutube(q.trim()) + "\n"; });
    return stripFakeToolClaims(out, _executed);
  }

  function ensureNonEmpty(content, userHint) {
    var s = String(content || "").trim();
    if (s && s !== "(kosong)" && s.length > 2) return s;
    if (_executed.browse) return s || "(Browse selesai \u2014 lihat hasil di atas.)";
    if (_executed.youtube) return s || "\u25b6\ufe0f Video di mini player RolxDesk.";
    return "Model mengembalikan jawaban kosong. Coba ulangi, ganti model, atau ketik lebih spesifik.\n" + (userHint ? ("Permintaan: " + String(userHint).slice(0, 120)) : "");
  }

  function patchRunAgentTags() {
    if (typeof window.runAgentTags === "function" && !window.runAgentTags.__rd3) {
      var orig = window.runAgentTags;
      window.runAgentTags = async function (content) {
        rdPeek("Agent tags", String(content || "").slice(0, 400), true);
        var mid = await orig(content);
        var final = await runExtraTags(mid);
        final = stripFakeToolClaims(final, _executed);
        return ensureNonEmpty(final, content);
      };
      window.runAgentTags.__rd3 = true;
    }
  }

  function patchTitle() {
    if (typeof window.runDebateMode === "function" && !window.runDebateMode.__rd3) {
      var rd = window.runDebateMode;
      window.runDebateMode = async function (topic) {
        try {
          var session = typeof getActiveSession === "function" ? getActiveSession() : null;
          if (session && typeof maybeUpdateTitle === "function") maybeUpdateTitle(session, topic);
          if (typeof renderSessions === "function") renderSessions();
          if (typeof saveSessions === "function") saveSessions();
        } catch (e) {}
        return rd(topic);
      };
      window.runDebateMode.__rd3 = true;
    }
    if (typeof window.runTeamworkMode === "function" && !window.runTeamworkMode.__rd3) {
      var rt = window.runTeamworkMode;
      window.runTeamworkMode = async function (topic) {
        try {
          var session = typeof getActiveSession === "function" ? getActiveSession() : null;
          if (session && typeof maybeUpdateTitle === "function") maybeUpdateTitle(session, topic);
          if (typeof renderSessions === "function") renderSessions();
          if (typeof saveSessions === "function") saveSessions();
        } catch (e) {}
        return rt(topic);
      };
      window.runTeamworkMode.__rd3 = true;
    }
  }

  function handleSlash(text) {
    var m = String(text || "").trim().match(/^\/(img|image|gambar|song|lagu|music|video|vid)\s+([\s\S]+)/i);
    if (!m) return null;
    var cmd = m[1].toLowerCase(), prompt = m[2].trim();
    if (cmd === "img" || cmd === "image" || cmd === "gambar") return { userText: prompt, inject: "User minta GENERATE GAMBAR: \"" + prompt + "\". JANGAN menolak/kosong. JANGAN klaim file sudah jadi. Beri prompt EN + 2 variasi." };
    if (cmd === "song" || cmd === "lagu" || cmd === "music") return { userText: prompt, inject: "User minta GENERATE LAGU: \"" + prompt + "\". JANGAN menolak/kosong. Wajib: judul, genre, lirik (2 verse+chorus), prompt Suno/Udio." };
    return { userText: prompt, inject: "User minta GENERATE VIDEO: \"" + prompt + "\". JANGAN menolak/kosong. Shot list + prompt Runway/Kling/Luma." };
  }

  function hookComposer() {
    document.querySelectorAll("#userInput, #composer textarea, textarea, [contenteditable='true']").forEach(function (ta) {
      if (!ta || ta.__rdSlash3) return;
      ta.__rdSlash3 = true;
      ta.addEventListener("keydown", function (e) {
        if (e.key === "Enter" && !e.shiftKey) {
          var raw = ta.value != null ? ta.value : ta.innerText;
          var sl = handleSlash(raw);
          if (sl && ta.value != null) { ta.value = sl.userText + "\n\n[" + sl.inject + "]"; rdPeek("Slash", sl.inject.slice(0, 200), true); }
        }
      }, true);
    });
  }

  function wrap(name, label) {
    var orig = window[name];
    if (typeof orig !== "function" || orig.__rd3) return;
    window[name] = async function () {
      var args = Array.from(arguments);
      rdPeek(label, args.map(function (a) { return typeof a === "string" ? a.slice(0, 500) : JSON.stringify(a); }).join("\n"), true);
      try {
        var out = await orig.apply(this, args);
        rdPeek(label + " \u2014 hasil", String(typeof out === "string" ? out : JSON.stringify(out)).slice(0, 2500));
        return out;
      } catch (err) { rdPeek(label + " \u2014 error", String(err)); throw err; }
    };
    window[name].__rd3 = true;
  }

  var _fetch = window.fetch;
  window.fetch = function (url, opt) {
    try {
      var u = typeof url === "string" ? url : (url && url.url) || "";
      if (/\/api\//.test(u) || (/^https?:/.test(u) && !/ui\.p\d|pyodide|cdn\.jsdelivr|spotify\.com\/embed/.test(u))) rdPeek("Fetch", u, true);
    } catch (e) {}
    return _fetch.apply(this, arguments);
  };

  function bumpMaxTokens() {
    try {
      if (window.state && window.state.settings) {
        var cur = parseInt(window.state.settings.maxTokens || 0, 10);
        if (!cur || cur < 4096) { window.state.settings.maxTokens = 8192; var inp = $("#maxTokens"); if (inp) inp.value = 8192; }
      }
    } catch (e) {}
  }

  function boot() {
    injectMobileCSS(); patchContinuity(); patchForceTools(); patchSpotify(); patchRunAgentTags(); patchTitle();
    wrap("runPythonSandbox", "Python"); wrap("runJsSandbox", "JavaScript"); hookComposer(); ensurePeek(); bumpMaxTokens();
    rdPeek("RolxDesk extras v3", "Spotify in-app \u00b7 browse URL \u00b7 no-empty \u00b7 title \u00b7 YT");
  }
  function rebind() {
    injectMobileCSS(); patchContinuity(); patchForceTools(); patchSpotify(); patchRunAgentTags(); patchTitle();
    wrap("runPythonSandbox", "Python"); wrap("runJsSandbox", "JavaScript"); hookComposer(); bumpMaxTokens();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else setTimeout(boot, 200);
  setTimeout(rebind, 800); setTimeout(rebind, 2000); setTimeout(rebind, 5000);
})();
