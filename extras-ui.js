/* RolxDesk extras-ui bootstrap — pinned working build + extras-fix v6.5 handles dual-key cleanup */
(function () {
  if (window.__RD_EXTRAS_UI60__ || window.__RD_EXTRAS_UI_BOOT__) return;
  window.__RD_EXTRAS_UI_BOOT__ = true;
  var s = document.createElement("script");
  s.src = "https://cdn.jsdelivr.net/gh/Frost098/RolxDesk@302a8ff4041cffd489608834b6dd4b8ff2538332/extras-ui.js";
  s.async = false;
  document.head.appendChild(s);
})();
