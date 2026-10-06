/* redirect stub — real UI loaded via extras-ui.js CDN pin */
(function () {
  if (window.__RD_EXTRAS_UI60__) return;
  var s = document.createElement("script");
  s.src = "https://cdn.jsdelivr.net/gh/Frost098/RolxDesk@302a8ff4041cffd489608834b6dd4b8ff2538332/extras-ui.js";
  s.async = false;
  document.head.appendChild(s);
})();
