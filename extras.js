/* RolxDesk extras v5.8 — floating YT mini-player always visible */
(function () {
  if (window.__RD_EXTRAS_V58__) return;
  window.__RD_EXTRAS_V58__ = true;
  window.__RD_EXTRAS_V57__ = true;
  window.__RD_EXTRAS__ = true;

  function $(s, r) {
    return (r || document).querySelector(s);
  }
  function withTimeout(promise, ms, label) {
    return new Promise(function (resolve, reject) {
      var done = false;
      var t = setTimeout(function () {
        if (!done) {
          done = true;
          reject(new Error((label || "op") + " timeout"));
        }
      }, ms || 20000);
      promise.then(
        function (v) {
          if (!done) {
            done = true;
            clearTimeout(t);
            resolve(v);
          }
        },
        function (e) {
          if (!done) {
            done = true;
            clearTimeout(t);
            reject(e);
          }
        }
      );
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
    } catch (e) {}
  }

  var GROK_STYLE =
    "\n\n[GAYA BICARA — GROK]\nBicara seperti Grok (xAI): cerdas, blak-blakan, sedikit sarkas. Langsung ke inti.\n";
  var TOOL_LAW =
    "\n\n[ROLXDESK TOOLS]\n" +
    "VIDEO / YouTube / channel / yt → HANYA [[YOUTUBE: …]] JANGAN [[PLAY]].\n" +
    "Video terbaru channel X → [[YOUTUBE: latest:X]].\n" +
    "LAGU / Spotify / track → [[PLAY: judul]] JANGAN YouTube.\n" +
    "Play SELALU di web embed RolxDesk, JANGAN buka aplikasi eksternal.\n";

  function patchContinuity() {
    try {
      if (typeof CONTINUITY === "string") {
        if (CONTINUITY.indexOf("GAYA BICARA") === -1) CONTINUITY += GROK_STYLE;
        if (CONTINUITY.indexOf("[ROLXDESK TOOLS]") === -1) CONTINUITY += TOOL_LAW;
      }
    } catch (e) {}
    if (typeof window.injectPersona === "function" && !window.injectPersona.__rd58) {
      var orig = window.injectPersona;
      window.injectPersona = function (m) {
        var out = orig(m);
        if (Array.isArray(out) && out[0] && out[0].role === "system") {
          var c = String(out[0].content);
          if (c.indexOf("GAYA BICARA") === -1) c += GROK_STYLE;
          if (c.indexOf("[ROLXDESK TOOLS]") === -1) c += TOOL_LAW;
          out[0] = { role: "system", content: c };
        }
        return out;
      };
      window.injectPersona.__rd58 = true;
    }
  }

  function wantsYoutube(u) {
    return /youtube|youtu\.be|\byt\b|\bvideo\b|tonton|channel|youtuber|livestream|\blive\b|shorts/i.test(u);
  }
  function wantsSpotify(u) {
    return /spotify|\btrack\b|\blagu\b|\bsong\b|\bmusik\b|lirik/i.test(u) && !wantsYoutube(u);
  }

  function extractMediaQuery(u) {
    var t = String(u || "").trim();
    var ch =
      t.match(/(?:video\s+)?terbaru\s+(?:dari|oleh|by|channel)\s+["']?([^"'\n.!?]+)/i) ||
      t.match(/putar\s+video\s+terbaru\s+(?:dari\s+|oleh\s+)?["']?([^"'\n.!?]+)/i) ||
      t.match(/(?:latest|newest)\s+(?:video\s+)?(?:from|by|of)\s+["']?([^"'\n.!?]+)/i);
    if (ch) return { kind: "yt-latest", q: ch[1].trim() };
    if (wantsYoutube(t)) {
      var yq = t
        .replace(/^(?:coba\s+)?(?:play|putar|tonton|cari)\s+/i, "")
        .replace(/\b(?:di\s+)?(?:youtube|yt)\b/gi, "")
        .replace(/\bvideo\b/gi, "")
        .replace(/\s+/g, " ")
        .trim();
      return { kind: "youtube", q: yq || t };
    }
    if (wantsSpotify(t) || /(?:play|putar|mainkan)\s+(?:lagu\s+|song\s+|track\s+)/i.test(t)) {
      var sq =
        (t.match(/(?:play|putar|mainkan)\s+(?:lagu\s+|musik\s+|song\s+|track\s+)?["']?([^"'\n]+)/i) || [])[1] || t;
      return { kind: "spotify", q: String(sq).replace(/[.!?]+$/, "").trim() };
    }
    var g = t.match(/(?:play|putar|mainkan)\s+["']?([^"'\n]+)/i);
    if (g) return { kind: "spotify", q: g[1].replace(/[.!?]+$/, "").trim() };
    return { kind: "unknown", q: t.slice(0, 100) };
  }

  function forceToolsExpanded(userText, assistantText) {
    var out = assistantText || "";
    var u = String(userText || "");
    var already = function (tag) {
      return new RegExp("\\[\\[" + tag, "i").test(out);
    };
    out = out.replace(/\[\[BROWSE:\s*https?:\/\/(?:www\.)?youtube\.com\/results[^\]]*\]\]/gi, "");
    if (wantsYoutube(u) || wantsSpotify(u) || /\b(play|putar|mainkan|tonton)\b/i.test(u)) {
      var med = extractMediaQuery(u);
      if (med.kind === "yt-latest" || med.kind === "youtube" || wantsYoutube(u)) {
        out = out.replace(/\[\[PLAY:\s*[^\]]+\]\]/gi, "");
        if (!already("YOUTUBE")) {
          var yq = med.kind === "yt-latest" ? "latest:" + med.q : med.q;
          out += "\n[[YOUTUBE: " + String(yq).slice(0, 120) + "]]\n";
        }
      } else if (med.kind === "spotify" || wantsSpotify(u)) {
        out = out.replace(/\[\[YOUTUBE:\s*[^\]]+\]\]/gi, "");
        if (!already("PLAY")) out += "\n[[PLAY: " + String(med.q).slice(0, 80) + "]]\n";
      }
    }
    out = out.replace(/Tunggu hasil[^\n]*/gi, "");
    return out;
  }

  function patchForceTools() {
    if (typeof window.forceToolsFromUser === "function" && !window.forceToolsFromUser.__rd58) {
      var prev = window.forceToolsFromUser;
      window.forceToolsFromUser = function (ut, at) {
        return forceToolsExpanded(ut, prev(ut, at));
      };
      window.forceToolsFromUser.__rd58 = true;
    } else if (typeof window.forceToolsFromUser !== "function") {
      window.forceToolsFromUser = forceToolsExpanded;
    }
  }

  function ensureYtPanel() {
    if (!$("#rd-yt-css")) {
      var st = document.createElement("style");
      st.id = "rd-yt-css";
      st.textContent = [
        "#rd-yt{position:fixed!important;z-index:2147483000!important;right:10px!important;bottom:72px!important;",
        "width:min(380px,94vw)!important;background:#0e0e12!important;border:1px solid #3a3a48!important;",
        "border-radius:14px!important;overflow:hidden!important;box-shadow:0 12px 40px rgba(0,0,0,.55)!important;",
        "display:none;}",
        "#rd-yt.rd-yt-show{display:block!important;}",
        "#rd-yt .rd-yt-bar{display:flex;align-items:center;gap:8px;padding:8px 10px;background:#1a1a22;user-select:none;}",
        "#rd-yt .rd-yt-title{flex:1;font:12px/1.3 system-ui;color:#ddd;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}",
        "#rd-yt .rd-yt-btn{background:transparent;border:0;color:#aaa;font-size:16px;cursor:pointer;padding:2px 8px;}",
        "#rd-yt iframe{width:100%!important;aspect-ratio:16/9;height:auto!important;min-height:200px;border:0;display:block;background:#000;}"
      ].join("");
      document.head.appendChild(st);
    }
    var panel = document.getElementById("rd-yt");
    if (!panel) {
      panel = document.createElement("div");
      panel.id = "rd-yt";
      panel.innerHTML =
        '<div class="rd-yt-bar"><span class="rd-yt-title" id="rd-yt-title">YouTube</span>' +
        '<button type="button" class="rd-yt-btn" id="rd-yt-min" title="Minimize">—</button>' +
        '<button type="button" class="rd-yt-btn" id="rd-yt-close" title="Tutup">×</button></div>' +
        '<div id="rd-yt-frame-wrap"><iframe id="rd-yt-frame" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen; web-share" allowfullscreen playsinline referrerpolicy="strict-origin-when-cross-origin"></iframe></div>';
      document.body.appendChild(panel);
      document.getElementById("rd-yt-close").onclick = function (e) {
        e.preventDefault();
        e.stopPropagation();
        panel.classList.remove("rd-yt-show");
        panel.style.display = "none";
        var f = document.getElementById("rd-yt-frame");
        if (f) f.src = "about:blank";
      };
      document.getElementById("rd-yt-min").onclick = function (e) {
        e.preventDefault();
        e.stopPropagation();
        var w = document.getElementById("rd-yt-frame-wrap");
        if (w) w.style.display = w.style.display === "none" ? "block" : "none";
      };
    }
    return {
      panel: panel,
      frame: document.getElementById("rd-yt-frame"),
      title: document.getElementById("rd-yt-title")
    };
  }

  function embedYt(id, title) {
    id = String(id || "").trim();
    if (!/^[A-Za-z0-9_-]{11}$/.test(id)) return "ID YouTube tidak valid: " + id;
    var ui = ensureYtPanel();
    var src =
      "https://www.youtube.com/embed/" +
      encodeURIComponent(id) +
      "?autoplay=1&rel=0&playsinline=1&fs=1&modestbranding=1";
    if (ui.frame) {
      ui.frame.setAttribute("src", src);
      ui.frame.style.display = "block";
    }
    if (ui.title) ui.title.textContent = String(title || id).slice(0, 56);
    ui.panel.classList.add("rd-yt-show");
    ui.panel.style.setProperty("display", "block", "important");
    ui.panel.style.setProperty("visibility", "visible", "important");
    ui.panel.style.setProperty("opacity", "1", "important");
    ui.panel.style.setProperty("z-index", "2147483000", "important");
    try {
      var cp = document.getElementById("ytPanel");
      var cf = document.getElementById("ytFrame");
      var ct = document.getElementById("ytTitle");
      if (cf) cf.src = src;
      if (ct) ct.textContent = String(title || id).slice(0, 48);
      if (cp) {
        cp.classList.add("show");
        cp.style.display = "block";
      }
    } catch (e) {}
    if (typeof showToast === "function") {
      try {
        showToast("YouTube: " + String(title || id).slice(0, 40), "success");
      } catch (e2) {}
    }
    return "▶️ " + (title || id) + "\nhttps://youtu.be/" + id;
  }

  function loadYtubersLocal() {
    try {
      return JSON.parse(localStorage.getItem("rd_youtubers_v1") || "[]");
    } catch (e) {
      return [];
    }
  }
  function matchYtuber(name) {
    var n = String(name || "").toLowerCase().replace(/\s+/g, "");
    var list = loadYtubersLocal();
    for (var i = 0; i < list.length; i++) {
      var cn = String(list[i].name || list[i].query || "").toLowerCase().replace(/\s+/g, "");
      if (cn && (cn.indexOf(n) >= 0 || n.indexOf(cn) >= 0)) return list[i];
    }
    return null;
  }

  async function playYoutubeSmart(q) {
    unlockSend();
    q = String(q || "").trim();
    if (!q) return "Query YouTube kosong";
    var idm =
      q.match(/[?&]v=([A-Za-z0-9_-]{11})/) ||
      q.match(/youtu\.be\/([A-Za-z0-9_-]{11})/) ||
      (/^[A-Za-z0-9_-]{11}$/.test(q) ? [null, q] : null);
    if (idm) return embedYt(idm[1], q);

    var channelName = null;
    var latest = false;
    if (/^latest:/i.test(q)) {
      latest = true;
      channelName = q.replace(/^latest:/i, "").trim();
    } else {
      var cm =
        q.match(/^(?:video\s+)?terbaru\s+(?:dari\s+|oleh\s+)?(.+)$/i) ||
        q.match(/^latest\s+(?:from\s+|by\s+)?(.+)$/i);
      if (cm) {
        latest = true;
        channelName = cm[1].trim();
      }
    }

    try {
      if (channelName) {
        var saved = matchYtuber(channelName);
        if (saved && saved.id) {
          try {
            var cr = await withTimeout(
              fetch("/api/yt-channel", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ channelId: saved.id, q: saved.name, channel: true })
              }),
              15000,
              "yt-ch"
            );
            var cj = await cr.json().catch(function () {
              return {};
            });
            if (cr.ok && cj.latest && cj.latest.id) {
              return embedYt(
                cj.latest.id,
                (cj.latest.title || "") + (cj.channel && cj.channel.name ? " · " + cj.channel.name : "")
              );
            }
          } catch (e0) {}
          if (saved.lastVideoId) return embedYt(saved.lastVideoId, saved.lastTitle || saved.name);
        }
      }

      if (latest && channelName) {
        var r1 = await withTimeout(
          fetch("/api/yt-search", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ q: channelName, channel: true, action: "channel" })
          }),
          18000,
          "yt"
        );
        var j1 = await r1.json().catch(function () {
          return {};
        });
        if (r1.ok && j1.latest && j1.latest.id) {
          return embedYt(
            j1.latest.id,
            (j1.latest.title || "") + (j1.channel && j1.channel.name ? " · " + j1.channel.name : "")
          );
        }
        q = channelName;
      }

      var r = await withTimeout(
        fetch("/api/yt-search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ q: q })
        }),
        18000,
        "yt"
      );
      var j = await r.json().catch(function () {
        return {};
      });
      if (r.ok && j.id && /^[A-Za-z0-9_-]{11}$/.test(j.id)) {
        return embedYt(j.id, (j.title || j.id) + (j.uploader ? " · " + j.uploader : ""));
      }
    } catch (e) {}
    return "Tidak ketemu di YouTube: " + q;
  }

  window.playYoutube = function (input) {
    playYoutubeSmart(input).then(function (msg) {
      if (typeof showToast === "function" && msg) showToast(String(msg).split("\n")[0], "success");
    });
    return true;
  };

  function embedSpotifyIframe(trackId) {
    var iframe = document.getElementById("spotifyEmbed");
    var wrap = document.getElementById("spotifyEmbedWrap");
    var bar = document.getElementById("spotifyBar");
    if (iframe) {
      iframe.src = "https://embed.spotify.com/?uri=spotify:track:" + trackId + "&autoplay=1";
      iframe.style.display = "block";
      iframe.style.width = "100%";
      iframe.style.maxWidth = "420px";
      iframe.style.height = "152px";
    }
    if (wrap) {
      wrap.style.display = "block";
      try {
        wrap.classList.add("show");
      } catch (e) {}
    }
    if (bar) {
      try {
        bar.classList.add("show");
      } catch (e2) {}
    }
  }

  async function playSpotifyReal(query) {
    unlockSend();
    var q = String(query || "").trim();
    if (!q) return "Query Spotify kosong";
    var token =
      (window.state && state.keys && (state.keys.spotify || state.keys.spotifyAccess)) ||
      localStorage.getItem("rd_spotify") ||
      localStorage.getItem("wrapped_spotify") ||
      "";
    token = String(token).replace(/^Bearer\s+/i, "");
    if (token) {
      try {
        var sr = await fetch(
          "https://api.spotify.com/v1/search?type=track&limit=5&q=" + encodeURIComponent(q),
          { headers: { Authorization: "Bearer " + token } }
        );
        var sd = await sr.json().catch(function () {
          return {};
        });
        if (sr.ok && sd.tracks && sd.tracks.items && sd.tracks.items.length) {
          var ql = q.toLowerCase();
          var best = sd.tracks.items[0];
          var bestScore = -1;
          sd.tracks.items.forEach(function (tr) {
            var name = String(tr.name || "").toLowerCase();
            var artists = (tr.artists || []).map(function (a) { return a.name; }).join(" ").toLowerCase();
            var score = 0;
            ql.split(/\s+/).forEach(function (tok) {
              if (tok.length > 1 && name.indexOf(tok) >= 0) score += 3;
              if (tok.length > 1 && artists.indexOf(tok) >= 0) score += 2;
            });
            if (score > bestScore) {
              bestScore = score;
              best = tr;
            }
          });
          embedSpotifyIframe(best.id);
          var label = best.name + " — " + (best.artists || []).map(function (a) { return a.name; }).join(", ");
          if (typeof showToast === "function") showToast("Play: " + label, "success");
          return "🎵 " + label;
        }
      } catch (e1) {}
    }
    try {
      var r = await withTimeout(
        fetch("/api/spotify?action=search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ q: q })
        }),
        12000,
        "sp"
      );
      var j = await r.json().catch(function () {
        return {};
      });
      if (r.ok && j.id) {
        embedSpotifyIframe(j.id);
        return "🎵 " + (j.name || q) + (j.artists ? " — " + j.artists : "");
      }
    } catch (e2) {}
    return "Spotify: isi Access Token di Settings agar play di web embed.";
  }

  window.playSpotify = playSpotifyReal;

  function patchMaybePlay() {
    if (typeof window.maybePlayFromText === "function" && !window.maybePlayFromText.__rd58) {
      var prev = window.maybePlayFromText;
      window.maybePlayFromText = function (text) {
        if (wantsYoutube(String(text || ""))) return false;
        if (/\[\[YOUTUBE:/i.test(String(text || ""))) return false;
        return prev.apply(this, arguments);
      };
      window.maybePlayFromText.__rd58 = true;
    }
  }

  async function handleMediaTags(content) {
    if (!content) return content;
    var out = content;
    var yts = [...out.matchAll(/\[\[YOUTUBE:\s*([^\]]+)\]\]/gi)];
    for (var i = 0; i < yts.length; i++) {
      var msg = await playYoutubeSmart(yts[i][1].trim());
      out = out.replace(yts[i][0], "\n" + msg + "\n");
    }
    var plays = [...out.matchAll(/\[\[PLAY:\s*([^\]]+)\]\]/gi)];
    for (var j = 0; j < plays.length; j++) {
      var res = await playSpotifyReal(plays[j][1].trim());
      out = out.replace(plays[j][0], "\n" + res + "\n");
    }
    return out;
  }

  function patchRunAgentTags() {
    if (typeof window.runAgentTags === "function" && !window.runAgentTags.__rd58) {
      var orig = window.runAgentTags;
      window.runAgentTags = async function (content) {
        unlockSend();
        try {
          var pre = await handleMediaTags(content);
          pre = pre.replace(/\[\[YOUTUBE:\s*[^\]]+\]\]/gi, "").replace(/\[\[PLAY:\s*[^\]]+\]\]/gi, "");
          var mid = await withTimeout(Promise.resolve(orig(pre)), 60000, "agent");
          return mid;
        } catch (e) {
          unlockSend();
          return "Error: " + (e.message || e);
        } finally {
          unlockSend();
        }
      };
      window.runAgentTags.__rd58 = true;
    }
  }

  function patchWindowOpen() {
    if (window.open.__rd58) return;
    var wo = window.open.bind(window);
    window.open = function (url, target, features) {
      var u = String(url || "");
      if (/open\.spotify\.com\/(search|track)/i.test(u)) {
        console.warn("[RD] blocked Spotify app open:", u);
        return null;
      }
      if (/youtube\.com\/watch|youtu\.be\//i.test(u) && /mobile|android|iphone/i.test(navigator.userAgent || "")) {
        console.warn("[RD] YT link open suppressed");
        return null;
      }
      return wo(url, target, features);
    };
    window.open.__rd58 = true;
  }

  function boot() {
    patchContinuity();
    patchForceTools();
    patchRunAgentTags();
    patchMaybePlay();
    patchWindowOpen();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else setTimeout(boot, 50);
  setTimeout(boot, 400);
  setTimeout(boot, 1200);
})();
