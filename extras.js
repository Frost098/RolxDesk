/* RolxDesk extras — modular overlay.
   Loaded AFTER gzip UI. Force-tools + anti-refuse + slash + peek. */
(function () {
  if (window.__RD_EXTRAS__) return;
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

  /* ---------- peek panel ---------- */
  function ensurePeek() {
    var box = $("#rd-peek");
    if (box) return box;
    box = el("div", { id: "rd-peek" });
    Object.assign(box.style, {
      position: "fixed", left: "8px", right: "8px", bottom: "8px",
      maxHeight: "34vh", overflow: "auto", zIndex: "9999",
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
    var t = $("#rd-peek-title");
    var b = $("#rd-peek-body");
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

  /* ---------- stronger CONTINUITY (anti-refuse) ---------- */
  var TOOL_LAW =
    "\n\n[ROLXDESK TOOL LAW — WAJIB DIIKUTI]\n"
    + "Kamu BERADA di aplikasi RolxDesk yang SUDAH punya tools nyata. JANGAN bilang "
    + "\"maaf saya tidak dapat\", \"saya tidak punya akses\", \"saya tidak bisa menjalankan\", "
    + "\"I cannot\", \"I'm unable\", \"as an AI I don't have\". Itu SALAH di sini.\n"
    + "Tools yang WAJIB dipakai lewat tag (sistem akan mengeksekusi):\n"
    + "- Research/cari web: [[SEARCH: query]]\n"
    + "- Buka/baca website: [[BROWSE: https://...]]\n"
    + "- Download file: [[DOWNLOAD: https://...]]\n"
    + "- YouTube mini player: [[YOUTUBE: url atau query]]\n"
    + "- Python: [[RUN_PY]]kode[[/RUN_PY]]\n"
    + "- JavaScript: [[RUN_JS]]kode[[/RUN_JS]]\n"
    + "- Hitung: [[CALC: ekspresi]]\n"
    + "- Cuaca: [[WEATHER: kota]]\n"
    + "- Musik: [[PLAY: judul]]\n"
    + "Kalau user minta cari/buka link/jalankan kode/hitung/cuaca/download/youtube — "
    + "LANGSUNG keluarkan tag. Jangan menolak. Boleh 1 kalimat singkat lalu tag.\n";

  function patchContinuity() {
    try {
      if (typeof CONTINUITY === "string" && CONTINUITY.indexOf("TOOL LAW") === -1) {
        CONTINUITY = CONTINUITY + TOOL_LAW;
      }
    } catch (e) {}
    if (typeof window.injectPersona === "function" && !window.injectPersona.__rd) {
      var orig = window.injectPersona;
      window.injectPersona = function (messages) {
        var out = orig(messages);
        if (Array.isArray(out) && out[0] && out[0].role === "system") {
          if (String(out[0].content).indexOf("TOOL LAW") === -1) {
            out[0] = { role: "system", content: out[0].content + TOOL_LAW };
          }
        }
        return out;
      };
      window.injectPersona.__rd = true;
    }
  }

  /* ---------- expanded forceToolsFromUser ---------- */
  function extractUrl(s) {
    var m = String(s || "").match(/https?:\/\/[^\s\]\)\"\'<>]+/i);
    return m ? m[0].replace(/[.,;]+$/, "") : null;
  }

  function forceToolsExpanded(userText, assistantText) {
    var out = assistantText || "";
    var u = String(userText || "");
    var already = function (tag) { return new RegExp("\\[\\[" + tag, "i").test(out); };

    if (/(hitung|kalkulator|berapa\s+\d|calc\b)/i.test(u) && !already("CALC")) {
      var cm = u.match(/(\d[\d\s]*[+\-*/x×:]\s*\d[\d\s+\-*/x×:]*)/);
      if (cm) out += "\n[[CALC: " + cm[1].replace(/[x×]/gi, "*").replace(/:/g, "/").replace(/\s+/g, "") + "]]\n";
    }
    if (/(cuaca|weather)/i.test(u) && !already("WEATHER")) {
      var loc = (u.match(/(?:di|ke|at)\s+([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\s]{1,40}?)(?:\s*$|\?|,)/i) || [])[1];
      out += "\n[[WEATHER: " + (loc || "Jakarta").trim() + "]]\n";
    }
    if (/(research|cari\s+(berita|info|data)|search\b|google\b|apa kabar tentang|berita terbaru)/i.test(u) && !already("SEARCH")) {
      var q = u.replace(/.*(?:research|cari(?:\s+berita|\s+info)?|search|google)\s*/i, "")
               .replace(/\?+$/, "").trim();
      if (q.length < 3) q = u.slice(0, 80);
      out += "\n[[SEARCH: " + q.slice(0, 100) + "]]\n";
    }
    if (/(buka|baca|browse|kunjungi|scrape|isi (web|situs|website)|lihat (web|situs|halaman))/i.test(u) || extractUrl(u)) {
      if (!already("BROWSE")) {
        var bu = extractUrl(u);
        if (bu && !/youtube\.com|youtu\.be/i.test(bu)) {
          out += "\n[[BROWSE: " + bu + "]]\n";
        }
      }
    }
    if (/(download|unduh|ambil file)/i.test(u) && !already("DOWNLOAD")) {
      var du = extractUrl(u);
      if (du) out += "\n[[DOWNLOAD: " + du + "]]\n";
    }
    if (/(youtube|putar video|play video|tonton)/i.test(u) || /youtu\.?be/i.test(u)) {
      if (!already("YOUTUBE")) {
        var yu = extractUrl(u) || u.replace(/.*(?:youtube|putar video|play video|tonton)\s*/i, "").trim();
        if (yu) out += "\n[[YOUTUBE: " + yu.slice(0, 120) + "]]\n";
      }
    }
    if (/(jalankan|eksekusi|run)\s*(kode\s*)?(python|py\b)|python sandbox|\[\[RUN_PY/i.test(u) && !already("RUN_PY")) {
      var code = null;
      var fenced = u.match(/```(?:python|py)?\s*([\s\S]*?)```/i);
      if (fenced) code = fenced[1].trim();
      else if (/print\s*\(/i.test(u)) {
        var pm = u.match(/(print\s*\([^)]*\))/i);
        if (pm) code = pm[1];
      }
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
    if (/(putar|play)\s+(lagu|musik|song)|spotify/i.test(u) && !already("PLAY")) {
      var song = u.replace(/.*(?:putar|play)\s+(?:lagu|musik|song)?\s*/i, "").trim() || "lofi";
      out += "\n[[PLAY: " + song.slice(0, 80) + "]]\n";
    }
    return out;
  }

  function patchForceTools() {
    if (typeof window.forceToolsFromUser === "function" && !window.forceToolsFromUser.__rd) {
      var prev = window.forceToolsFromUser;
      window.forceToolsFromUser = function (userText, assistantText) {
        var base = prev(userText, assistantText);
        var expanded = forceToolsExpanded(userText, base);
        if (expanded !== (assistantText || "")) {
          rdPeek("Force tools", expanded.slice(0, 600), true);
        }
        return expanded;
      };
      window.forceToolsFromUser.__rd = true;
    } else if (typeof window.forceToolsFromUser !== "function") {
      window.forceToolsFromUser = forceToolsExpanded;
    }
  }

  /* ---------- BROWSE / DOWNLOAD / YOUTUBE handlers ---------- */
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
        if (j.text) return "📄 **" + (j.filename || "file") + "** (" + j.bytes + " B)\n```\n" + String(j.text).slice(0, 8000) + "\n```";
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
          return "⬇️ Download dimulai: **" + (j.filename || "file") + "** (" + j.bytes + " B)";
        }
        return "Download kosong.";
      }
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
      position: "fixed", right: "12px", bottom: "12px", width: "min(360px,92vw)",
      zIndex: "10000", background: "#111", border: "1px solid #333", borderRadius: "12px",
      overflow: "hidden", boxShadow: "0 10px 30px rgba(0,0,0,.5)", display: "none"
    });
    var bar = el("div");
    bar.style.cssText = "display:flex;justify-content:space-between;align-items:center;padding:6px 10px;background:#1a1a1a;font:12px system-ui;color:#ccc";
    bar.appendChild(el("span", { id: "rd-yt-title" }, "YouTube"));
    var x = el("button", { type: "button" }, "\u00d7");
    x.style.cssText = "background:none;border:0;color:#aaa;font-size:16px;cursor:pointer";
    x.onclick = function () {
      p.style.display = "none";
      var f = $("#rd-yt-frame");
      if (f) f.src = "";
    };
    bar.appendChild(x);
    p.appendChild(bar);
    var frame = el("iframe", {
      id: "rd-yt-frame",
      allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture",
      allowfullscreen: "true"
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
      if (frame) frame.src = "https://www.youtube.com/embed/" + id + "?autoplay=1";
      panel.style.display = "block";
      rdPeek("YouTube", "Playing " + id);
      return "▶️ Mini player: https://youtu.be/" + id;
    }
    var qq = encodeURIComponent(String(q).slice(0, 80));
    if (title) title.textContent = "YouTube \u00b7 search";
    if (frame) frame.src = "https://www.youtube.com/embed?listType=search&list=" + qq;
    panel.style.display = "block";
    return "▶️ Mini player search: " + q;
  }

  async function runExtraTags(content) {
    if (!content) return content;
    var out = content;
    var br = [...out.matchAll(/\[\[BROWSE:\s*([^\]]+)\]\]/gi)];
    for (var i = 0; i < br.length; i++) {
      var url = br[i][1].trim();
      var res = await doBrowse(url, "text");
      out = out.replace(br[i][0], "\n**Browse (" + url + "):**\n" + res + "\n");
    }
    var dl = [...out.matchAll(/\[\[DOWNLOAD:\s*([^\]]+)\]\]/gi)];
    for (var j = 0; j < dl.length; j++) {
      var durl = dl[j][1].trim();
      var dres = await doBrowse(durl, "download");
      out = out.replace(dl[j][0], "\n" + dres + "\n");
    }
    out = out.replace(/\[\[YOUTUBE:\s*([^\]]+)\]\]/gi, function (_, q) {
      return "\n" + playYoutube(q.trim()) + "\n";
    });
    return out;
  }

  function patchRunAgentTags() {
    if (typeof window.runAgentTags === "function" && !window.runAgentTags.__rd) {
      var orig = window.runAgentTags;
      window.runAgentTags = async function (content) {
        var mid = await orig(content);
        return await runExtraTags(mid);
      };
      window.runAgentTags.__rd = true;
    }
  }

  /* ---------- slash commands ---------- */
  function handleSlash(text) {
    var m = String(text || "").trim().match(/^\/(img|image|gambar|song|lagu|music|video|vid)\s+([\s\S]+)/i);
    if (!m) return null;
    var cmd = m[1].toLowerCase();
    var prompt = m[2].trim();
    if (cmd === "img" || cmd === "image" || cmd === "gambar") {
      return {
        userText: prompt,
        inject: "User minta GENERATE GAMBAR: \"" + prompt + "\". "
          + "JANGAN menolak. Deskripsikan prompt detail siap pakai untuk model gambar (Gemini/Imagen/Flux). "
          + "Kalau ada vision/image tool, pakai. Format: 1) prompt EN siap tempel 2) variasi singkat."
      };
    }
    if (cmd === "song" || cmd === "lagu" || cmd === "music") {
      return {
        userText: prompt,
        inject: "User minta GENERATE LAGU: \"" + prompt + "\". "
          + "JANGAN menolak. Buat: judul, genre, lirik penuh, dan prompt Suno/Udio siap tempel. "
          + "Opsional [[PLAY: judul]] kalau cocok di Spotify."
      };
    }
    return {
      userText: prompt,
      inject: "User minta GENERATE VIDEO: \"" + prompt + "\". "
        + "JANGAN menolak. Buat shot list + prompt Runway/Kling/Luma siap tempel."
    };
  }

  function hookComposer() {
    var ta = document.querySelector("#composer textarea, textarea#input, textarea, [contenteditable='true']");
    if (!ta || ta.__rdSlash) return;
    ta.__rdSlash = true;
    ta.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && !e.shiftKey) {
        var raw = ta.value != null ? ta.value : ta.innerText;
        var sl = handleSlash(raw);
        if (sl && ta.value != null) {
          ta.value = sl.userText + "\n\n[" + sl.inject + "]";
        }
      }
    }, true);
  }

  function wrap(name, label) {
    var orig = window[name];
    if (typeof orig !== "function" || orig.__rd) return;
    window[name] = async function () {
      var args = Array.from(arguments);
      var preview = args.map(function (a) {
        return typeof a === "string" ? a.slice(0, 500) : JSON.stringify(a);
      }).join("\n");
      rdPeek(label, preview, true);
      try {
        var out = await orig.apply(this, args);
        var text = typeof out === "string" ? out : JSON.stringify(out);
        rdPeek(label + " — hasil", String(text).slice(0, 2500));
        return out;
      } catch (err) {
        rdPeek(label + " — error", String(err));
        throw err;
      }
    };
    window[name].__rd = true;
  }

  var _fetch = window.fetch;
  window.fetch = function (url, opt) {
    try {
      var u = typeof url === "string" ? url : (url && url.url) || "";
      if (/\/api\//.test(u) || (/^https?:/.test(u) && !/ui\.p\d/.test(u))) {
        rdPeek("Fetch", u, true);
      }
    } catch (e) {}
    return _fetch.apply(this, arguments);
  };

  function bumpMaxTokens() {
    try {
      if (window.state && window.state.settings) {
        var cur = parseInt(window.state.settings.maxTokens || 0, 10);
        if (!cur || cur < 4096) {
          window.state.settings.maxTokens = 8192;
          var inp = $("#maxTokens");
          if (inp) inp.value = 8192;
        }
      }
    } catch (e) {}
  }

  function boot() {
    patchContinuity();
    patchForceTools();
    patchRunAgentTags();
    wrap("runPythonSandbox", "Python");
    wrap("runJsSandbox", "JavaScript");
    hookComposer();
    ensurePeek();
    bumpMaxTokens();
    rdPeek("RolxDesk extras", "Anti-refuse aktif \u00b7 /img /song /video \u00b7 browse/download/yt \u00b7 peek");
  }

  function rebind() {
    patchContinuity();
    patchForceTools();
    patchRunAgentTags();
    wrap("runPythonSandbox", "Python");
    wrap("runJsSandbox", "JavaScript");
    hookComposer();
    bumpMaxTokens();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else setTimeout(boot, 200);
  setTimeout(rebind, 800);
  setTimeout(rebind, 2000);
  setTimeout(rebind, 5000);
})();
