/* RD Install v120 */
(function () {
  if (window.__RD_INSTALL_V120__) return;
  window.__RD_INSTALL_V120__ = true;
  var VERSION = "v6.6.1+120";
  function getPrompt() { return window.__RD_DEFERRED_INSTALL || null; }
  function setPrompt(p) { window.__RD_DEFERRED_INSTALL = p || null; }
  function injectCss() {
    if (document.getElementById("rd-install-css")) return;
    var s = document.createElement("style");
    s.id = "rd-install-css";
    s.textContent = "#rd-install-card{margin:14px 0 18px;padding:14px;border-radius:14px;border:1px solid rgba(124,106,247,.4);background:linear-gradient(145deg,rgba(124,106,247,.12),rgba(26,127,100,.08));}#rd-install-card .rd-inst-row{display:flex;gap:12px;align-items:center;}#rd-install-card .rd-inst-icon{width:48px;height:48px;border-radius:12px;flex-shrink:0;background:#12141a;display:grid;place-items:center;font:800 18px system-ui;color:#f4f4f6;overflow:hidden;}#rd-install-card .rd-inst-icon img{width:100%;height:100%;}#rd-install-card .rd-inst-text{flex:1;min-width:0;}#rd-install-card .rd-inst-text strong{display:block;font:700 14px system-ui;color:#fff;margin-bottom:2px;}#rd-install-card .rd-inst-text span{font:12px system-ui;color:#a8a4b8;line-height:1.35;}#rd-install-card .rd-inst-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px;}#rd-install-card button{border:0;border-radius:11px;padding:10px 14px;font:600 12px system-ui;cursor:pointer;}#rd-install-card .rd-inst-primary{background:#7c6af7;color:#fff;}#rd-install-card .rd-inst-hint{margin-top:10px;font:11px system-ui;color:#8b8b98;line-height:1.4;}#rd-settings-version{margin-top:16px;padding-top:12px;border-top:1px solid var(--border,#2a2a31);font:11px system-ui;color:#8b8b98;text-align:center;}";
    document.head.appendChild(s);
  }
  function isStandalone() {
    return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
  }
  function toast(m, t) {
    if (typeof showToast === "function") showToast(m, t || "success");
  }
  async function doInstall() {
    if (isStandalone()) { toast("Sudah terpasang"); return; }
    var p = getPrompt();
    if (p && typeof p.prompt === "function") {
      try {
        await p.prompt();
        var c = await p.userChoice;
        if (c && c.outcome === "accepted") { toast("RolxDesk terpasang"); setPrompt(null); }
        else toast("Dibatalkan", "error");
        updateCardState();
        return;
      } catch (e) { toast("Gagal: " + (e.message || e), "error"); }
    }
    toast("Chrome blok dialog. Menu ⋮ → Install app / Tambahkan ke layar utama", "error");
  }
  function updateCardState() {
    var btn = document.getElementById("rdInstallBtn");
    var hint = document.querySelector("#rd-install-card .rd-inst-hint");
    if (!btn) return;
    if (isStandalone()) {
      btn.textContent = "Sudah terpasang"; btn.disabled = true;
      if (hint) hint.textContent = "Jalan sebagai app.";
    } else if (getPrompt()) {
      btn.textContent = "Install RolxDesk"; btn.disabled = false;
      if (hint) hint.textContent = "Siap — klik untuk dialog install.";
    } else {
      btn.textContent = "Install RolxDesk"; btn.disabled = false;
      if (hint) hint.textContent = "Kalau tidak muncul dialog: Chrome ⋮ → Install app. Browser tidak izinkan install otomatis.";
    }
  }
  function buildCard() {
    injectCss();
    var body = document.querySelector("#settingsModal .modal-body");
    if (!body) return;
    var old = document.getElementById("rd-install-card");
    if (old && !old.dataset.v120) old.remove();
    if (!document.getElementById("rd-install-card")) {
      var card = document.createElement("div");
      card.id = "rd-install-card";
      card.dataset.v120 = "1";
      card.innerHTML = '<div class="section-title" style="margin:0 0 10px">Download / Install RD</div><div class="rd-inst-row"><div class="rd-inst-icon"><img src="/icons/icon-192.svg" alt="RD" onerror="this.remove()"/></div><div class="rd-inst-text"><strong>RolxDesk App</strong><span>Install PWA ke layar utama (bukan APK).</span></div></div><div class="rd-inst-actions"><button type="button" class="rd-inst-primary" id="rdInstallBtn">Install RolxDesk</button></div><p class="rd-inst-hint">Klik untuk install.</p>';
      body.insertBefore(card, body.firstChild);
    }
    var btn = document.getElementById("rdInstallBtn");
    if (btn && !btn.__rdBound) {
      btn.__rdBound = true;
      btn.addEventListener("click", function (e) { e.preventDefault(); e.stopPropagation(); doInstall(); });
    }
    var ver = document.getElementById("rd-settings-version");
    if (!ver) { ver = document.createElement("div"); ver.id = "rd-settings-version"; body.appendChild(ver); }
    ver.textContent = "RolxDesk " + VERSION;
    updateCardState();
  }
  window.addEventListener("beforeinstallprompt", function (e) { e.preventDefault(); setPrompt(e); updateCardState(); });
  window.addEventListener("appinstalled", function () { setPrompt(null); updateCardState(); toast("RolxDesk terpasang"); });
  document.addEventListener("click", function (e) {
    var t = e.target;
    if (t && (t.id === "settingsBtn" || (t.closest && t.closest("#settingsBtn")))) {
      setTimeout(buildCard, 60); setTimeout(buildCard, 250);
    }
  });
  var tries = 0;
  var iv = setInterval(function () {
    tries++;
    if (document.querySelector("#settingsModal .modal-body")) { buildCard(); clearInterval(iv); }
    if (tries > 50) clearInterval(iv);
  }, 400);
})();
