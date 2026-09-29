/* RolxDesk extras — modular overlay.
   Loaded AFTER gzip UI so new features don't require re-uploading 170KB index. */
(function () {
  if (window.__RD_EXTRAS__) return;
  window.__RD_EXTRAS__ = true;
  function $(sel, root) { return (root || document).querySelector(sel); }
  function el(tag, attrs, html) {
    const n = document.createElement(tag);
    if (attrs) Object.entries(attrs).forEach(function (kv) {
      var k = kv[0], v = kv[1];
      if (k === "style" && typeof v === "object") Object.assign(n.style, v);
      else if (k.startsWith("on") && typeof v === "function") n.addEventListener(k.slice(2), v);
      else n.setAttribute(k, v);
    });
    if (html != null) n.innerHTML = html;
    return n;
  }
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
    $("#rd-peek-body") && ($("#rd-peek-body").style.margin = "0");
    document.body.appendChild(box);
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
      window.__rdPeekTimer = setTimeout(function () { box.style.display = "none"; }, 12000);
    }
  };
  window.rdStatus = function (msg) {
    if (typeof setLiveStatus === "function") { try { setLiveStatus(msg); } catch (e) {} }
    rdPeek("Status", msg, true);
  };
  function wrap(name, label) {
    var orig = window[name];
    if (typeof orig !== "function") return;
    window[name] = async function () {
      var args = Array.from(arguments);
      var preview = args.map(function (a) {
        return typeof a === "string" ? a.slice(0, 400) : JSON.stringify(a);
      }).join("\n");
      rdPeek(label, preview, true);
      try {
        var out = await orig.apply(this, args);
        var text = typeof out === "string" ? out : JSON.stringify(out);
        rdPeek(label + " \u2014 hasil", String(text).slice(0, 2500));
        return out;
      } catch (err) {
        rdPeek(label + " \u2014 error", String(err));
        throw err;
      }
    };
  }
  wrap("runPythonSandbox", "Python");
  wrap("runJsSandbox", "JavaScript");
  function handleSlash(text) {
    var m = String(text || "").trim().match(/^\/(img|image|gambar|song|lagu|music|video|vid)\s+([\s\S]+)/i);
    if (!m) return null;
    var cmd = m[1].toLowerCase();
    var prompt = m[2].trim();
    if (cmd === "img" || cmd === "image" || cmd === "gambar") {
      return { userText: prompt, inject: "User minta GENERATE GAMBAR. Pakai Gemini image/vision. Jangan tolak." };
    }
    if (cmd === "song" || cmd === "lagu" || cmd === "music") {
      return { userText: prompt, inject: "User minta GENERATE LAGU. Buat lirik + prompt Suno/Udio siap tempel." };
    }
    return { userText: prompt, inject: "User minta GENERATE VIDEO. Buat shot list + prompt Runway/Kling/Luma." };
  }
  function hookComposer() {
    var ta = document.querySelector("textarea, #input, [contenteditable='true']");
    if (!ta || ta.__rdSlash) return;
    ta.__rdSlash = true;
    ta.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && !e.shiftKey) {
        var sl = handleSlash(ta.value != null ? ta.value : ta.innerText);
        if (sl && ta.value != null) ta.value = sl.userText + "\n\n[" + sl.inject + "]";
      }
    }, true);
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
  function boot() {
    hookComposer();
    ensurePeek();
    rdPeek("RolxDesk extras", "Siap: /img /song /video \u00b7 peek eksekusi \u00b7 status fetch");
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else setTimeout(boot, 400);
  setTimeout(hookComposer, 1500);
  setTimeout(hookComposer, 3500);
})();
