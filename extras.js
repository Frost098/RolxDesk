/* RolxDesk extras v5.7 — YT > Spotify priority, web embed only, pre-handle tags */
(function () {
  if (window.__RD_EXTRAS_V57__) return;
  window.__RD_EXTRAS_V57__ = true;
  window.__RD_EXTRAS_V56__ = true;
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
    if (typeof window.injectPersona === "function" && !window.injectPersona.__rd57) {
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
      window.injectPersona.__rd57 = true;
    }
  }

  // ---- Intent detection: VIDEO selalu menang atas Spotify ----
  function wantsYoutube(u) {
    return (
      /youtube|youtu\.be|\byt\b|\bvideo\b|tonton|channel|youtuber|livestream|\blive\b|shorts/i.test(
        u
      )
    );
  }
  function wantsSpotify(u) {
    // Hanya eksplisit lagu — JANGAN "montagem" otomatis
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
        (
          t.match(/(?:play|putar|mainkan)\s+(?:lagu\s+|musik\s+|song\s+|track\s+)?["']?([^"'\n]+)/i) ||
          []
        )[1] || t;
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
      // PRIORITAS YOUTUBE
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
    if (typeof window.forceToolsFromUser === "function" && !window.forceToolsFromUser.__rd57) {
      var prev = window.forceToolsFromUser;
      window.forceToolsFromUser = function (ut, at) {
        return forceToolsExpanded(ut, prev(ut, at));
      };
      window.forceToolsFromUser.__rd57 = true;
    } else if (typeof window.forceToolsFromUser !== "function") {
      window.forceToolsFromUser = forceToolsExpanded;
    }
  }

  // ---- YouTube web embed (jangan buka app) ----
  function ensureYtPanel() {
    // Pakai panel core dulu
    var core = document.getElementById("ytPanel");
    if (core) return { panel: core, frame: document.getElementById("ytFrame"), title: document.getElementById("ytTitle"), core: true };

    var panel = document.getElementById("rd-yt");
    if (panel)
      return {
        panel: panel,
        frame: document.getElementById("rd-yt-frame"),
        title: document.getElementById("rd-yt-title"),
        core: false
      };

    if (!$("#rd-yt-css")) {
      var st = document.createElement("style");
      st.id = "rd-yt-css";
      st.textContent =
        "#rd-yt{position:fixed;z-index:10000;right:12px;bottom:88px;width:min(360px,92vw);background:#111;border:1px solid #333;border-radius:12px;overflow:hidden;box-shadow:0 8px 28px rgba(0,0,0,.45)}#rd-yt .rd-yt-bar{display:flex;align-items:center;gap:6px;padding:6px 8px;background:#1a1a1a;cursor:move;user-select:none}#rd-yt .rd-yt-title{flex:1;font:12px system-ui;color:#ccc;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}#rd-yt .rd-yt-btn{background:none;border:0;color:#aaa;font-size:14px;cursor:pointer;padding:2px 6px}";
      document.head.appendChild(st);
    }
    panel = document.createElement("div");
    panel.id = "rd-yt";
    panel.innerHTML =
      '<div class="rd-yt-bar"><span class="rd-yt-title" id="rd-yt-title">YouTube</span><button type="button" class="rd-yt-btn" id="rd-yt-close">×</button></div><div><iframe id="rd-yt-frame" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" referrerpolicy="strict-origin-when-cross-origin" style="width:100%;aspect-ratio:16/9;border:0;display:block;background:#000"></iframe></div>';
    document.body.appendChild(panel);
    document.getElementById("rd-yt-close").onclick = function (e) {
      e.stopPropagation();
      panel.style.display = "none";
      var f = document.getElementById("rd-yt-frame");
      if (f) f.src = "";
    };
    return {
      panel: panel,
      frame: document.getElementById("rd-yt-frame"),
      title: document.getElementById("rd-yt-title"),
      core: false
    };
  }

  function embedYt(id, title) {
    var ui = ensureYtPanel();
    var src =
      "https://www.youtube-nocookie.com/embed/" +
      id +
      "?autoplay=1&rel=0&playsinline=1&fs=1";
    if (ui.frame) ui.frame.src = src;
    if (ui.title) ui.title.textContent = String(title || id).slice(0, 48);
    if (ui.core) {
      ui.panel.classList.add("show");
    } else {
      ui.panel.style.display = "block";
    }
    // Jangan window.open — tetap di web
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

  // Override core playYoutube (sync API) → smart search + web embed
  window.playYoutube = function (input) {
    playYoutubeSmart(input).then(function (msg) {
      if (typeof showToast === "function" && msg) showToast(String(msg).split("\n")[0], "success");
    });
    return true;
  };

  // ---- Spotify: embed web saja, JANGAN window.open app ----
  function embedSpotifyIframe(trackId) {
    var iframe = document.getElementById("spotifyEmbed");
    var wrap = document.getElementById("spotifyEmbedWrap");
    var bar = document.getElementById("spotifyBar");
    if (iframe) {
      // embed.spotify.com = web player, bukan deep link app
      iframe.src =
        "https://embed.spotify.com/?uri=spotify:track:" + trackId + "&autoplay=1";
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
            var artists = (tr.artists || [])
              .map(function (a) {
                return a.name;
              })
              .join(" ")
              .toLowerCase();
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
          var label =
            best.name +
            " — " +
            (best.artists || [])
              .map(function (a) {
                return a.name;
              })
              .join(", ");
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

    // JANGAN window.open ke app — minta token saja
    return "Spotify: isi Access Token di Settings agar play di web embed.";
  }

  window.playSpotify = playSpotifyReal;

  // Blok maybePlayFromText biar tidak nyedot intent YouTube ke Spotify
  function patchMaybePlay() {
    if (typeof window.maybePlayFromText === "function" && !window.maybePlayFromText.__rd57) {
      var prev = window.maybePlayFromText;
      window.maybePlayFromText = function (text) {
        if (wantsYoutube(String(text || ""))) return false;
        if (/\[\[YOUTUBE:/i.test(String(text || ""))) return false;
        return prev.apply(this, arguments);
      };
      window.maybePlayFromText.__rd57 = true;
    }
  }

  async function handleMediaTags(content) {
    if (!content) return content;
    var out = content;
    // YouTube dulu
    var yts = [...out.matchAll(/\[\[YOUTUBE:\s*([^\]]+)\]\]/gi)];
    for (var i = 0; i < yts.length; i++) {
      var msg = await playYoutubeSmart(yts[i][1].trim());
      out = out.replace(yts[i][0], "\n" + msg + "\n");
    }
    // PLAY hanya jika bukan sisa YouTube
    var plays = [...out.matchAll(/\[\[PLAY:\s*([^\]]+)\]\]/gi)];
    for (var j = 0; j < plays.length; j++) {
      var res = await playSpotifyReal(plays[j][1].trim());
      out = out.replace(plays[j][0], "\n" + res + "\n");
    }
    return out;
  }

  function patchRunAgentTags() {
    if (typeof window.runAgentTags === "function" && !window.runAgentTags.__rd57) {
      var orig = window.runAgentTags;
      window.runAgentTags = async function (content) {
        unlockSend();
        try {
          // Pre-handle media SEBELUM core (core playYoutube cuma terima ID)
          var pre = await handleMediaTags(content);
          // Core jangan proses tag media lagi
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
      window.runAgentTags.__rd57 = true;
    }
  }

  // Cegah window.open ke spotify/youtube app dari core
  function patchWindowOpen() {
    if (window.open.__rd57) return;
    var wo = window.open.bind(window);
    window.open = function (url, target, features) {
      var u = String(url || "");
      if (/open\.spotify\.com\/(search|track)/i.test(u)) {
        // jangan buka app — ignore
        console.warn("[RD] blocked Spotify app open:", u);
        return null;
      }
      if (/youtube\.com\/watch|youtu\.be\//i.test(u) && /mobile|android|iphone/i.test(navigator.userAgent || "")) {
        // biarkan, tapi prefer embed sudah jalan
        console.warn("[RD] YT link open suppressed on mobile in favor of embed");
        return null;
      }
      return wo(url, target, features);
    };
    window.open.__rd57 = true;
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
