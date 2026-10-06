/* RolxDesk extras-ui v6.5 bootstrap — load full bundle from same origin (no stale CDN pin) */
(function () {
  if (window.__RD_EXTRAS_UI65__ || window.__RD_EXTRAS_UI_BOOT__) return;
  window.__RD_EXTRAS_UI_BOOT__ = true;
  var s = document.createElement("script");
  s.src = "./extras-ui.bundle.js?v=66";
  s.async = false;
  document.head.appendChild(s);
})();
