/* RolxDesk extras v5.6 — Spotify vs YouTube fixed + accurate channel search */
(function () {
  if (window.__RD_EXTRAS_V56__) return;
  window.__RD_EXTRAS_V56__ = true;
  window.__RD_EXTRAS_V55__ = true;
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
    "\n\n[GAYA BICARA — GROK]\nBicara seperti Grok (xAI): cerdas, blak-blakan, sedikit sarkas, humor kering, anti-BS. Langsung ke inti. Bahasa ikut user. Jangan bilang kamu Kiro/Cursor.\n";
  var TOOL_LAW =
    "\n\n[ROLXDESK TOOLS & SKILLS — WAJIB PAKAI]\n" +
    "Sistem mengeksekusi tag. JANGAN bilang tidak punya tools / tidak bisa akses.\n" +
    "LAGU/Spotify → [[PLAY: judul lagu tepat]] JANGAN YouTube untuk lagu.\n" +
    "VIDEO/YouTube/channel → [[YOUTUBE: query atau channel]] JANGAN [[PLAY]].\n" +
    "Video terbaru channel X → [[YOUTUBE: latest:X]] (format wajib).\n" +
    "Web: [[BROWSE: url]] [[SEARCH: query]] [[HTTP: GET url]]\n" +
    "Code: [[RUN_PY]]code[[/RUN_PY]] [[RUN_JS]]code[[/RUN_JS]] [[CALC: expr]]\n" +
    "JANGAN browse youtube.com/results. JANGAN ngarang judul/link.\n";

  function patchContinuity() {
    try {
      if (typeof CONTINUITY === "string") {
        if (CONTINUITY.indexOf("GAYA BICARA") === -1) CONTINUITY += GROK_STYLE;
        if (CONTINUITY.indexOf("TOOLS & SKILLS") === -1) CONTINUITY += TOOL_LAW;
      }
    } catch (e) {}
    if (typeof window.injectPersona === "function" && !window.injectPersona.__rd56) {
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
      window.injectPersona.__rd56 = true;
    }
  }

  function wantsYoutube(u) {
    return /youtube|youtu\.be|\bvideo\b|tonton|channel|youtuber|livestream|\blive\b/i.test(u);
  }
  function wantsSpotify(u) {
    return /spotify|\btrack\b|\blagu\b|\bsong\b|\bmusik\b|lirik|montagem/i.test(u);
  }
  function wantsMusicPlay(u) {
    return /(?:^|[\s"'])(?:play|putar|mainkan)\b/i.test(u) && !wantsYoutube(u);
  }

  function extractMediaQuery(u) {
    var t = String(u || "").trim();
    // video terbaru dari/oleh CHANNEL
    var ch =
      t.match(/(?:video\s+)?terbaru\s+(?:dari|oleh|by|channel)\s+["']?([^"'\n]+?)["']?\s*$/i) ||
      t.match(/(?:latest|newest)\s+(?:video\s+)?(?:from|by|of)\s+["']?([^"'\n]+?)["']?\s*$/i) ||
      t.match(/putar\s+video\s+terbaru\s+(?:dari\s+|oleh\s+)?["']?([^"'\n]+?)["']?\s*$/i);
    if (ch) return { kind: "yt-latest", q: ch[1].replace(/[.!?]+$/, "").trim() };

    // explicit spotify
    var sp =
      t.match(/(?:spotify|track|lagu|song)\s+(?:play\s+|putar\s+)?["']?([^"'\n]+?)["']?\s*$/i) ||
      t.match(/(?:play|putar|mainkan)\s+(?:lagu\s+|musik\s+|song\s+|track\s+)?["']?([^"'\n]+?)["']?\s*$/i);
    if (sp && !/video/i.test(t)) return { kind: "spotify", q: sp[1].replace(/[.!?]+$/, "").trim() };

    // youtube / video
    var yt = t.match(/(?:play|putar|tonton)\s+(?:video\s+)?["']?([^"'\n]+?)["']?\s*$/i);
    if (yt && wantsYoutube(t)) return { kind: "youtube", q: yt[1].replace(/[.!?]+$/, "").trim() };

    // generic play
    var g = t.match(/(?:play|putar|mainkan)\s+["']?([^"'\n]+?)["']?\s*$/i);
    if (g) {
      var qq = g[1].replace(/[.!?]+$/, "").trim();
      if (wantsYoutube(t)) return { kind: "youtube", q: qq };
      return { kind: "spotify", q: qq };
    }
    return { kind: "unknown", q: t.slice(0, 100) };
  }

  function forceToolsExpanded(userText, assistantText) {
    var out = assistantText || "";
    var u = String(userText || "");
    var already = function (tag) {
      return new RegExp("\\[\\[" + tag, "i").test(out);
    };
    // strip wrong browse to yt search pages
    out = out.replace(/\[\[BROWSE:\s*https?:\/\/(?:www\.)?youtube\.com\/results[^\]]*\]\]/gi, "");

    if (wantsMusicPlay(u) || wantsYoutube(u) || wantsSpotify(u) || /\b(play|putar|mainkan)\b/i.test(u)) {
      var med = extractMediaQuery(u);
      if (med.kind === "yt-latest" || med.kind === "youtube" || (wantsYoutube(u) && !wantsSpotify(u))) {
        if (!already("YOUTUBE")) {
          var yq = med.kind === "yt-latest" ? "latest:" + med.q : med.q;
          out += "\n[[YOUTUBE: " + yq.slice(0, 120) + "]]\n";
        }
        // hapus PLAY salah
        out = out.replace(/\[\[PLAY:\s*[^\]]+\]\]/gi, "");
      } else if (med.kind === "spotify" || wantsSpotify(u) || wantsMusicPlay(u)) {
        if (!already("PLAY")) out += "\n[[PLAY: " + med.q.slice(0, 80) + "]]\n";
        out = out.replace(/\[\[YOUTUBE:\s*[^\]]+\]\]/gi, "");
      }
    }
    if (/(jalankan|run).*\b(js|javascript)\b|```(?:js|javascript)/i.test(u) && !/\[\[RUN_JS/i.test(out)) {
      var jm = u.match(/```(?:js|javascript)\s*([\s\S]*?)```/i);
      if (jm) out += "\n[[RUN_JS]]" + jm[1].trim() + "[[/RUN_JS]]\n";
    }
    if (/\bpython\b|```py|pip install/i.test(u) && !/\[\[RUN_PY/i.test(out)) {
      var pm = u.match(/```(?:python|py)?\s*([\s\S]*?)```/i);
      var code = pm ? pm[1].trim() : "print(2+2)";
      out += "\n[[RUN_PY]]" + code + "[[/RUN_PY]]\n";
    }
    out = out.replace(/Tunggu hasil[^\n]*/gi, "");
    return out;
  }

  function patchForceTools() {
    if (typeof window.forceToolsFromUser === "function" && !window.forceToolsFromUser.__rd56) {
      var prev = window.forceToolsFromUser;
      window.forceToolsFromUser = function (ut, at) {
        return forceToolsExpanded(ut, prev(ut, at));
      };
      window.forceToolsFromUser.__rd56 = true;
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
      st.textContent =
        "#rd-yt{position:fixed;z-index:10000;background:#111;border:1px solid #333;border-radius:12px;overflow:hidden;box-shadow:0 8px 28px rgba(0,0,0,.45);touch-action:none}#rd-yt .rd-yt-bar{display:flex;align-items:center;gap:6px;padding:6px 8px;background:#1a1a1a;cursor:move;user-select:none}#rd-yt .rd-yt-title{flex:1;font:12px system-ui;color:#ccc;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}#rd-yt .rd-yt-btn{background:none;border:0;color:#aaa;font-size:14px;cursor:pointer;padding:2px 6px}#rd-yt.rd-yt-min #rd-yt-frame-wrap{display:none}#rd-yt.rd-yt-min{width:220px!important}";
      document.head.appendChild(st);
    }
    panel = document.createElement("div");
    panel.id = "rd-yt";
    panel.style.cssText = "right:12px;bottom:88px;width:min(360px,92vw)";
    panel.innerHTML =
      '<div class="rd-yt-bar"><span class="rd-yt-title" id="rd-yt-title">YouTube</span><button type="button" class="rd-yt-btn" id="rd-yt-min">\u2014</button><button type="button" class="rd-yt-btn" id="rd-yt-close">\u00d7</button></div><div id="rd-yt-frame-wrap"><iframe id="rd-yt-frame" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" style="width:100%;aspect-ratio:16/9;border:0;display:block;background:#000"></iframe></div>';
    document.body.appendChild(panel);
    document.getElementById("rd-yt-min").onclick = function (e) {
      e.stopPropagation();
      panel.classList.toggle("rd-yt-min");
    };
    document.getElementById("rd-yt-close").onclick = function (e) {
      e.stopPropagation();
      panel.style.display = "none";
      var f = document.getElementById("rd-yt-frame");
      if (f) f.src = "";
    };
    return panel;
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
      var c = list[i];
      var cn = String(c.name || c.query || "")
        .toLowerCase()
        .replace(/\s+/g, "");
      if (cn && (cn.indexOf(n) >= 0 || n.indexOf(cn) >= 0)) return c;
    }
    return null;
  }

  async function playYoutubeSmart(q) {
    unlockSend();
    q = String(q || "").trim();
    if (!q) return "Query YouTube kosong";

    // Direct URL / id
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
      // 1) Saved YouTuber list
      if (channelName) {
        var saved = matchYtuber(channelName);
        if (saved && saved.lastVideoId && /^[A-Za-z0-9_-]{11}$/.test(saved.lastVideoId)) {
          // refresh latest from API
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
          return embedYt(saved.lastVideoId, saved.lastTitle || saved.name);
        }
      }

      // 2) Channel latest via API
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
            (j1.latest.title || "") +
              (j1.channel && j1.channel.name ? " · " + j1.channel.name : "")
          );
        }
        // fallback search with channel name + sort by score (API already scores)
        q = "video terbaru " + channelName;
      }

      // 3) Normal search
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

  function embedYt(id, title) {
    var panel = ensureYtPanel();
    var f = document.getElementById("rd-yt-frame");
    var t = document.getElementById("rd-yt-title");
    if (t) t.textContent = String(title || id).slice(0, 48);
    if (f) f.src = "https://www.youtube-nocookie.com/embed/" + id + "?autoplay=1&rel=0";
    panel.style.display = "block";
    return "▶️ " + (title || id) + "\nhttps://youtu.be/" + id;
  }

  /** Spotify: pakai core playSpotify / token; JANGAN lempar ke YouTube */
  async function playSpotifyReal(query) {
    unlockSend();
    var q = String(query || "").trim();
    if (!q) return "Query Spotify kosong";

    // Core function (jika belum di-override)
    if (typeof window.__rdCorePlaySpotify === "function") {
      try {
        await window.__rdCorePlaySpotify(q);
        return "🎵 Spotify: " + q;
      } catch (e) {}
    }

    // Token user → Web API search
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
          // Pilih track paling mirip judul
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
            if (name === ql) score += 10;
            if (score > bestScore) {
              bestScore = score;
              best = tr;
            }
          });
          if (typeof showSpotifyEmbed === "function") showSpotifyEmbed(best.id);
          else embedSpotifyIframe(best.id);
          var label =
            best.name +
            " — " +
            (best.artists || [])
              .map(function (a) {
                return a.name;
              })
              .join(", ");
          if (typeof showToast === "function") showToast("Play: " + label, "success");
          return "🎵 " + label + "\nhttps://open.spotify.com/track/" + best.id;
        }
      } catch (e1) {}
    }

    // Server client-credentials search
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
        if (typeof showSpotifyEmbed === "function") showSpotifyEmbed(j.id);
        else embedSpotifyIframe(j.id);
        var lab = (j.name || q) + (j.artists ? " — " + j.artists : "");
        return "🎵 " + lab + "\nhttps://open.spotify.com/track/" + j.id;
      }
    } catch (e2) {}

    return (
      "Spotify: tidak ketemu \"" +
      q +
      "\". Isi Spotify token di Settings, atau coba judul lebih spesifik."
    );
  }

  function embedSpotifyIframe(trackId) {
    var wrap = document.getElementById("spotifyEmbedWrap");
    var iframe = document.getElementById("spotifyEmbed");
    if (iframe) {
      iframe.src = "https://open.spotify.com/embed/track/" + trackId + "?utm_source=generator&autoplay=1";
      iframe.style.display = "block";
      if (wrap) {
        wrap.style.display = "block";
        wrap.classList && wrap.classList.add("show");
      }
      var bar = document.getElementById("spotifyBar");
      if (bar) bar.classList.add("show");
    }
  }

  // Jangan timpa core sebelum disimpan
  if (typeof window.playSpotify === "function" && !window.__rdCorePlaySpotify) {
    window.__rdCorePlaySpotify = window.playSpotify;
  }
  window.playSpotify = playSpotifyReal;

  async function runServerJs(code) {
    try {
      var r = await withTimeout(
        fetch("/api/run-js", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: code })
        }),
        12000,
        "run-js"
      );
      var j = await r.json();
      return (j.output || j.error || "").slice(0, 8000);
    } catch (e) {
      return "JS error: " + (e.message || e);
    }
  }

  async function simpleHash(text) {
    try {
      var buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
      return Array.from(new Uint8Array(buf))
        .map(function (b) {
          return b.toString(16).padStart(2, "0");
        })
        .join("");
    } catch (e) {
      return "hash gagal";
    }
  }

  async function runExtraTags(content) {
    if (!content) return content;
    var out = content;
    unlockSend();
    try {
      var yts = [...out.matchAll(/\[\[YOUTUBE:\s*([^\]]+)\]\]/gi)];
      for (var yi = 0; yi < yts.length; yi++) {
        out = out.replace(yts[yi][0], "\n" + (await playYoutubeSmart(yts[yi][1].trim())) + "\n");
      }
      var plays = [...out.matchAll(/\[\[PLAY:\s*([^\]]+)\]\]/gi)];
      for (var pi = 0; pi < plays.length; pi++) {
        var res = await playSpotifyReal(plays[pi][1].trim());
        out = out.replace(plays[pi][0], "\n" + res + "\n");
      }
      var jsBlocks = [...out.matchAll(/\[\[RUN_JS\]\]([\s\S]*?)\[\[\/RUN_JS\]\]/gi)];
      for (var ji = 0; ji < jsBlocks.length; ji++) {
        out = out.replace(
          jsBlocks[ji][0],
          "\n```\n[JS output]\n" + (await runServerJs(jsBlocks[ji][1].trim())) + "\n```\n"
        );
      }
      var hashes = [...out.matchAll(/\[\[HASH:\s*([^\]]+)\]\]/gi)];
      for (var hi = 0; hi < hashes.length; hi++) {
        out = out.replace(
          hashes[hi][0],
          "\nSHA-256: `" + (await simpleHash(hashes[hi][1].trim())) + "`\n"
        );
      }
      out = out.replace(/\[\[B64ENC:\s*([^\]]+)\]\]/gi, function (_, t) {
        try {
          return "\n`" + btoa(unescape(encodeURIComponent(t))) + "`\n";
        } catch (e) {
          return "\nb64enc gagal\n";
        }
      });
      out = out.replace(/\[\[B64DEC:\s*([^\]]+)\]\]/gi, function (_, t) {
        try {
          return "\n" + decodeURIComponent(escape(atob(t.trim()))) + "\n";
        } catch (e) {
          return "\nb64dec gagal\n";
        }
      });
      out = out.replace(/\[\[CALC:\s*([^\]]+)\]\]/gi, function (_, expr) {
        try {
          var safe = String(expr).replace(/[^0-9+\-*/().%\s]/g, "");
          return (
            "\n🔢 " +
            safe +
            " = **" +
            Function('"use strict";return (' + safe + ")")() +
            "**\n"
          );
        } catch (e) {
          return "\ncalc gagal\n";
        }
      });
      out = out.replace(/\[\[TIME\]\]/gi, function () {
        return "\n🕒 " + new Date().toLocaleString("id-ID") + "\n";
      });
      out = out.replace(/\[\[UUID\]\]/gi, function () {
        return (
          "\n`" +
          "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
            var r = (Math.random() * 16) | 0;
            return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
          }) +
          "`\n"
        );
      });
      out = out.replace(/Tunggu hasil[^\n]*/gi, "");
    } catch (e) {}
    unlockSend();
    return out.replace(/\n{3,}/g, "\n\n").trim();
  }

  function patchRunAgentTags() {
    if (typeof window.runAgentTags === "function" && !window.runAgentTags.__rd56) {
      var orig = window.runAgentTags;
      window.runAgentTags = async function (content) {
        unlockSend();
        try {
          var mid = await withTimeout(Promise.resolve(orig(content)), 60000, "agent");
          return await runExtraTags(mid);
        } catch (e) {
          unlockSend();
          return "Error: " + (e.message || e);
        } finally {
          unlockSend();
        }
      };
      window.runAgentTags.__rd56 = true;
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
        opt.value = "hosted";
        opt.textContent = "RD Hosted (gratis)";
        fam.appendChild(opt);
      }
    } catch (e) {}
  }

  function boot() {
    patchContinuity();
    patchForceTools();
    patchRunAgentTags();
    injectHostedModels();
    // pastikan core playSpotify tersimpan sebelum override
    if (typeof window.playSpotify === "function" && !window.__rdCorePlaySpotify) {
      // already set above if core loaded first
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else setTimeout(boot, 100);
  setTimeout(boot, 1000);
})();
