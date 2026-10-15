/* RD YT mini player UI — drag + minimize (v124) */
(function () {
  if (window.__RD_YT_UI_V124__) return;
  window.__RD_YT_UI_V124__ = true;

  var POS_KEY = "rd_yt_pos_v1";

  function injectCss() {
    var old = document.getElementById("rd-yt-css");
    var css =
      "#rd-yt{position:fixed!important;z-index:2147483000!important;" +
      "left:auto!important;right:auto!important;top:auto!important;bottom:auto!important;" +
      "transform:none!important;width:min(420px,92vw)!important;max-width:96vw!important;" +
      "background:#0a0a0e!important;border:1px solid #444!important;border-radius:14px!important;" +
      "overflow:hidden!important;box-shadow:0 16px 48px rgba(0,0,0,.65)!important;display:none;" +
      "touch-action:none;}" +
      "#rd-yt.rd-yt-show{display:block!important;}" +
      "#rd-yt .rd-yt-bar{display:flex;align-items:center;gap:6px;padding:8px 10px;background:#16161e;" +
      "cursor:grab;user-select:none;-webkit-user-select:none;touch-action:none;}" +
      "#rd-yt .rd-yt-bar:active{cursor:grabbing;}" +
      "#rd-yt .rd-yt-title{flex:1;font:12px/1.3 system-ui;color:#eee;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;pointer-events:none;}" +
      "#rd-yt .rd-yt-btn{background:transparent;border:0;color:#ccc;font-size:15px;cursor:pointer;padding:4px 8px;line-height:1;border-radius:8px;}" +
      "#rd-yt .rd-yt-btn:hover{background:rgba(255,255,255,.08);color:#fff;}" +
      "#rd-yt-thumb{position:relative;width:100%;aspect-ratio:16/9;background:#000;cursor:pointer;}" +
      "#rd-yt-thumb img{width:100%;height:100%;object-fit:cover;display:block;}" +
      "#rd-yt-thumb .rd-yt-play{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.35);font-size:48px;color:#fff;}" +
      "#rd-yt iframe{width:100%!important;aspect-ratio:16/9;min-height:180px;border:0;display:none;background:#000;}" +
      "#rd-yt.rd-yt-playing iframe{display:block!important;}" +
      "#rd-yt.rd-yt-playing #rd-yt-thumb{display:none!important;}" +
      "#rd-yt-actions{display:flex;gap:8px;padding:8px;background:#12121a;}" +
      "#rd-yt-actions a,#rd-yt-actions button{flex:1;text-align:center;font:12px system-ui;padding:8px;border-radius:8px;background:#2a2a36;color:#ddd;border:0;text-decoration:none;cursor:pointer;}" +
      "#rd-yt.rd-yt-min #rd-yt-thumb,#rd-yt.rd-yt-min iframe,#rd-yt.rd-yt-min #rd-yt-actions{display:none!important;}" +
      "#rd-yt.rd-yt-min{width:min(280px,90vw)!important;border-radius:999px!important;}" +
      "#rd-yt.rd-yt-min .rd-yt-bar{border-radius:999px;padding:10px 12px;}" +
      "#rd-yt.rd-yt-dragging{opacity:.92;box-shadow:0 20px 56px rgba(0,0,0,.75)!important;}";

    if (old) {
      old.textContent = css;
    } else {
      var st = document.createElement("style");
      st.id = "rd-yt-css";
      st.textContent = css;
      document.head.appendChild(st);
    }
  }

  function loadPos() {
    try {
      var j = JSON.parse(localStorage.getItem(POS_KEY) || "null");
      if (j && typeof j.left === "number" && typeof j.top === "number") return j;
    } catch (e) {}
    return null;
  }

  function savePos(left, top) {
    try {
      localStorage.setItem(POS_KEY, JSON.stringify({ left: left, top: top }));
    } catch (e) {}
  }

  function clampPanel(panel, left, top) {
    var rect = panel.getBoundingClientRect();
    var w = rect.width || 300;
    var h = rect.height || 48;
    var maxL = Math.max(0, window.innerWidth - w - 4);
    var maxT = Math.max(0, window.innerHeight - h - 4);
    left = Math.min(maxL, Math.max(4, left));
    top = Math.min(maxT, Math.max(4, top));
    return { left: left, top: top };
  }

  function applyPos(panel, left, top) {
    var c = clampPanel(panel, left, top);
    panel.style.setProperty("left", c.left + "px", "important");
    panel.style.setProperty("top", c.top + "px", "important");
    panel.style.setProperty("right", "auto", "important");
    panel.style.setProperty("bottom", "auto", "important");
    panel.style.setProperty("transform", "none", "important");
    savePos(c.left, c.top);
  }

  function defaultPos(panel) {
    var pos = loadPos();
    if (pos) {
      applyPos(panel, pos.left, pos.top);
      return;
    }
    var w = Math.min(420, window.innerWidth * 0.92);
    var left = Math.max(8, (window.innerWidth - w) / 2);
    var top = Math.max(8, window.innerHeight - 320);
    applyPos(panel, left, top);
  }

  function ensureControls(panel) {
    var bar = panel.querySelector(".rd-yt-bar");
    if (!bar) return;

    if (!document.getElementById("rd-yt-min")) {
      var minBtn = document.createElement("button");
      minBtn.type = "button";
      minBtn.className = "rd-yt-btn";
      minBtn.id = "rd-yt-min";
      minBtn.title = "Minimize";
      minBtn.setAttribute("aria-label", "Minimize");
      minBtn.textContent = "—";
      var close = document.getElementById("rd-yt-close");
      if (close && close.parentNode === bar) {
        bar.insertBefore(minBtn, close);
      } else {
        bar.appendChild(minBtn);
      }
      minBtn.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        var on = panel.classList.toggle("rd-yt-min");
        minBtn.textContent = on ? "▢" : "—";
        minBtn.title = on ? "Restore" : "Minimize";
        var r = panel.getBoundingClientRect();
        applyPos(panel, r.left, r.top);
      });
    }

    if (bar.__rdDragBound) return;
    bar.__rdDragBound = true;

    var dragging = false;
    var startX = 0, startY = 0, origL = 0, origT = 0;

    function pointerDown(e) {
      if (e.target && (e.target.id === "rd-yt-close" || e.target.id === "rd-yt-min" || e.target.closest(".rd-yt-btn"))) return;
      dragging = true;
      panel.classList.add("rd-yt-dragging");
      var r = panel.getBoundingClientRect();
      origL = r.left;
      origT = r.top;
      var pt = e.touches ? e.touches[0] : e;
      startX = pt.clientX;
      startY = pt.clientY;
      panel.style.setProperty("transform", "none", "important");
      try { bar.setPointerCapture && e.pointerId != null && bar.setPointerCapture(e.pointerId); } catch (err) {}
      e.preventDefault();
    }

    function pointerMove(e) {
      if (!dragging) return;
      var pt = e.touches ? e.touches[0] : e;
      var dx = pt.clientX - startX;
      var dy = pt.clientY - startY;
      applyPos(panel, origL + dx, origT + dy);
      e.preventDefault();
    }

    function pointerUp() {
      if (!dragging) return;
      dragging = false;
      panel.classList.remove("rd-yt-dragging");
    }

    bar.addEventListener("pointerdown", pointerDown, { passive: false });
    window.addEventListener("pointermove", pointerMove, { passive: false });
    window.addEventListener("pointerup", pointerUp);
    window.addEventListener("pointercancel", pointerUp);
    bar.addEventListener("touchstart", pointerDown, { passive: false });
    window.addEventListener("touchmove", pointerMove, { passive: false });
    window.addEventListener("touchend", pointerUp);
  }

  function enhance() {
    injectCss();
    var panel = document.getElementById("rd-yt");
    if (!panel) return false;
    ensureControls(panel);
    if (panel.classList.contains("rd-yt-show") || panel.style.display === "block") {
      defaultPos(panel);
    }
    if (!panel.__rdPosWatch) {
      panel.__rdPosWatch = true;
      var mo = new MutationObserver(function () {
        if (panel.classList.contains("rd-yt-show")) {
          ensureControls(panel);
          var r = panel.getBoundingClientRect();
          if (!loadPos() || (r.left < 2 && r.width > 0)) defaultPos(panel);
        }
      });
      mo.observe(panel, { attributes: true, attributeFilter: ["class", "style"] });
    }
    return true;
  }

  function patchEmbed() {
    if (typeof window.embedYt === "function" && !window.embedYt.__rdUi) {
      var prev = window.embedYt;
      window.embedYt = function () {
        var out = prev.apply(this, arguments);
        setTimeout(enhance, 30);
        setTimeout(enhance, 200);
        return out;
      };
      window.embedYt.__rdUi = true;
    }
  }

  function boot() {
    injectCss();
    enhance();
    patchEmbed();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
  setTimeout(boot, 400);
  setTimeout(boot, 1200);
  setInterval(function () { enhance(); patchEmbed(); }, 5000);

  window.addEventListener("resize", function () {
    var panel = document.getElementById("rd-yt");
    if (!panel || !panel.classList.contains("rd-yt-show")) return;
    var r = panel.getBoundingClientRect();
    applyPos(panel, r.left, r.top);
  });
})();
