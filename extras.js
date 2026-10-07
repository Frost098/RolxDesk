/* RolxDesk extras v5.9 — YT thumbnail player + media tags force */
(function () {
  if (window.__RD_EXTRAS_V59__) return;
  window.__RD_EXTRAS_V59__ = true;
  window.__RD_EXTRAS_V58__ = true;
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

  var TOOL_LAW =
    "\n\n[ROLXDESK TOOLS]\n" +
    "VIDEO/YouTube/channel/yt → [[YOUTUBE: query]] JANGAN [[PLAY]].\n" +
    "Video terbaru channel X → [[YOUTUBE: latest:X]].\n" +
    "LAGU/Spotify → [[PLAY: judul]].\n" +
    "Play di web embed RolxDesk saja.\n";

  function patchContinuity() {
    try {
      if (typeof CONTINUITY === "string" && CONTINUITY.indexOf("[ROLXDESK TOOLS]") === -1) {
        CONTINUITY += TOOL_LAW;
      }
    } catch (e) {}
  }

  function wantsYoutube(u) {
    return /youtube|youtu\.be|\byt\b|\bvideo\b|tonton|channel|youtuber|livestream|\blive\b|shorts/i.test(
      u
    );
  }
  function wantsSpotify(u) {
    return /spotify|\btrack\b|\blagu\b|\bsong\b|\bmusik\b|lirik/i.test(u) && !wantsYoutube(u);
  }

  function extractMediaQuery(u) {
    var t = String(u || "").trim();
    var ch =
      t.match(/(?:video\s+)?terbaru\s+(?:dari|oleh|by|channel)\s+["']?([^"'\n.!?]+)/i) ||
      t.match(/putar\s+video\s+terbaru\s+(?:dari\s+|oleh\s+)?["']?([^"'\n.!?]+)/i);
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
    if (wantsSpotify(t)) {
      var sq =
        (t.match(/(?:play|putar|mainkan)\s+(?:lagu\s+|musik\s+|song\s+|track\s+)?["']?([^"'\n]+)/i) ||
          [])[1] || t;
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
    return out;
  }

  function patchForceTools() {
    if (typeof window.forceToolsFromUser === "function" && !window.forceToolsFromUser.__rd59) {
      var prev = window.forceToolsFromUser;
      window.forceToolsFromUser = function (ut, at) {
        return forceToolsExpanded(ut, prev(ut, at));
      };
      window.forceToolsFromUser.__rd59 = true;
    } else if (typeof window.forceToolsFromUser !== "function") {
      window.forceToolsFromUser = forceToolsExpanded;
    }
  }

  function ensureYtPanel() {
    if (!$("#rd-yt-css")) {
      var st = document.createElement("style");
      st.id = "rd-yt-css";
      st.textContent = [
        "#rd-yt{position:fixed!important;z-index:2147483000!important;left:50%!important;transform:translateX(-50%)!important;",
        "bottom:90px!important;width:min(420px,96vw)!important;background:#0a0a0e!important;",
        "border:1px solid #444!important;border-radius:14px!important;overflow:hidden!important;",
        "box-shadow:0 16px 48px rgba(0,0,0,.65)!important;display:none;}",
        "#rd-yt.rd-yt-show{display:block!important;}",
        "#rd-yt .rd-yt-bar{display:flex;align-items:center;gap:8px;padding:8px 10px;background:#16161e;}",
        "#rd-yt .rd-yt-title{flex:1;font:12px/1.3 system-ui;color:#eee;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}",
        "#rd-yt .rd-yt-btn{background:transparent;border:0;color:#ccc;font-size:16px;cursor:pointer;padding:2px 8px;}",
        "#rd-yt-thumb{position:relative;width:100%;aspect-ratio:16/9;background:#000;cursor:pointer;}",
        "#rd-yt-thumb img{width:100%;height:100%;object-fit:cover;display:block;}",
        "#rd-yt-thumb .rd-yt-play{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;",
        "background:rgba(0,0,0,.35);font-size:48px;color:#fff;text-shadow:0 2px 8px #000;}",
        "#rd-yt iframe{width:100%!important;aspect-ratio:16/9;height:auto!important;min-height:200px;border:0;display:none;background:#000;}",
        "#rd-yt.rd-yt-playing iframe{display:block!important;}",
        "#rd-yt.rd-yt-playing #rd-yt-thumb{display:none!important;}",
        "#rd-yt-actions{display:flex;gap:8px;padding:8px;background:#12121a;}",
        "#rd-yt-actions a,#rd-yt-actions button{flex:1;text-align:center;font:12px system-ui;padding:8px;border-radius:8px;",
        "background:#2a2a36;color:#ddd;border:0;text-decoration:none;cursor:pointer;}"
      ].join("");
      document.head.appendChild(st);
    }
    var panel = document.getElementById("rd-yt");
    if (!panel) {
      panel = document.createElement("div");
      panel.id = "rd-yt";
      panel.innerHTML =
        '<div class="rd-yt-bar"><span class="rd-yt-title" id="rd-yt-title">YouTube</span>' +
        '<button type="button" class="rd-yt-btn" id="rd-yt-close">×</button></div>' +
        '<div id="rd-yt-thumb"><img id="rd-yt-thumb-img" alt=""/><div class="rd-yt-play">▶</div></div>' +
        '<iframe id="rd-yt-frame" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowfullscreen playsinline referrerpolicy="origin"></iframe>' +
        '<div id="rd-yt-actions">' +
        '<button type="button" id="rd-yt-start">Putar di sini</button>' +
        '<a id="rd-yt-open" href="#" target="_blank" rel="noopener">Tab baru</a>' +
        "</div>";
      document.body.appendChild(panel);
      document.getElementById("rd-yt-close").onclick = function (e) {
        e.preventDefault();
        panel.classList.remove("rd-yt-show", "rd-yt-playing");
        panel.style.display = "none";
        var f = document.getElementById("rd-yt-frame");
        if (f) f.src = "about:blank";
      };
      function startPlay() {
        var f = document.getElementById("rd-yt-frame");
        var id = panel.getAttribute("data-vid");
        if (!f || !id) return;
        f.src =
          "https://www.youtube.com/embed/" +
          id +
          "?autoplay=1&rel=0&playsinline=1&fs=1&modestbranding=1";
        panel.classList.add("rd-yt-playing");
      }
      document.getElementById("rd-yt-thumb").onclick = startPlay;
      document.getElementById("rd-yt-start").onclick = startPlay;
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
    ui.panel.setAttribute("data-vid", id);
    if (ui.title) ui.title.textContent = String(title || id).slice(0, 56);
    var img = document.getElementById("rd-yt-thumb-img");
    if (img) {
      img.src = "https://i.ytimg.com/vi/" + id + "/hqdefault.jpg";
      img.alt = String(title || id);
    }
    var open = document.getElementById("rd-yt-open");
    if (open) open.href = "https://www.youtube.com/embed/" + id + "?autoplay=1";
    // reset playing state → show thumbnail first (user tap = play, lolos autoplay policy)
    ui.panel.classList.remove("rd-yt-playing");
    if (ui.frame) ui.frame.src = "about:blank";
    ui.panel.classList.add("rd-yt-show");
    ui.panel.style.setProperty("display", "block", "important");
    ui.panel.style.setProperty("visibility", "visible", "important");
    ui.panel.style.setProperty("opacity", "1", "important");
    ui.panel.style.setProperty("z-index", "2147483000", "important");
    // auto-try play after short delay (desktop); mobile butuh tap
    setTimeout(function () {
      try {
        if (!/mobile|android|iphone/i.test(navigator.userAgent || "")) {
          document.getElementById("rd-yt-start").click();
        }
      } catch (e) {}
    }, 300);
    if (typeof showToast === "function") {
      try {
        showToast("YouTube siap — ketuk Putar", "success");
      } catch (e2) {}
    }
    return "▶️ " + (title || id) + "\nhttps://youtu.be/" + id + "\n(Ketuk ▶ Putar di sini)";
  }

  function loadYtubersLocal() {
    try {
      return JSON.parse(localStorage.getItem("rd_youtubers_v1") || "[]");
    } catch (e) {
      return [];
    }
  }
  function matchYtuber(name) {
    var n = String(name || "")
      .toLowerCase()
      .replace(/\s+/g, "");
    var list = loadYtubersLocal();
    for (var i = 0; i < list.length; i++) {
      var cn = String(list[i].name || list[i].query || "")
        .toLowerCase()
        .replace(/\s+/g, "");
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
        if (r1.ok && j1.videos && j1.videos[0] && j1.videos[0].id) {
          return embedYt(j1.videos[0].id, j1.videos[0].title || channelName);
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
          var best = sd.tracks.items[0];
          embedSpotifyIframe(best.id);
          var label =
            best.name +
            " — " +
            (best.artists || [])
              .map(function (a) {
                return a.name;
              })
              .join(", ");
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
        return "🎵 " + (j.name || q);
      }
    } catch (e2) {}
    return "Spotify: isi Access Token di Settings agar play di web embed.";
  }
  window.playSpotify = playSpotifyReal;

  function patchMaybePlay() {
    if (typeof window.maybePlayFromText === "function" && !window.maybePlayFromText.__rd59) {
      var prev = window.maybePlayFromText;
      window.maybePlayFromText = function (text) {
        if (wantsYoutube(String(text || ""))) return false;
        if (/\[\[YOUTUBE:/i.test(String(text || ""))) return false;
        return prev.apply(this, arguments);
      };
      window.maybePlayFromText.__rd59 = true;
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
    if (typeof window.runAgentTags === "function" && !window.runAgentTags.__rd59) {
      var orig = window.runAgentTags;
      window.runAgentTags = async function (content) {
        unlockSend();
        try {
          var pre = await handleMediaTags(content);
          pre = pre.replace(/\[\[YOUTUBE:\s*[^\]]+\]\]/gi, "").replace(/\[\[PLAY:\s*[^\]]+\]\]/gi, "");
          return await withTimeout(Promise.resolve(orig(pre)), 60000, "agent");
        } catch (e) {
          unlockSend();
          return "Error: " + (e.message || e);
        } finally {
          unlockSend();
        }
      };
      window.runAgentTags.__rd59 = true;
    }
  }

  function patchWindowOpen() {
    if (window.open.__rd59) return;
    var wo = window.open.bind(window);
    window.open = function (url, target, features) {
      var u = String(url || "");
      if (/open\.spotify\.com\/(search|track)/i.test(u)) return null;
      return wo(url, target, features);
    };
    window.open.__rd59 = true;
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
