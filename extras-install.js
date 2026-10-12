/* RD Install / Download PWA — card di dalam Settings */
(function () {
  if (window.__RD_INSTALL_V1__) return;
  window.__RD_INSTALL_V1__ = true;

  var deferredPrompt = null;
  var VERSION = "v6.6.1+117";

  function injectCss() {
    if (document.getElementById("rd-install-css")) return;
    var s = document.createElement("style");
    s.id = "rd-install-css";
    s.textContent =
      "#rd-install-card{margin:14px 0 18px;padding:14px;border-radius:14px;" +
      "border:1px solid rgba(124,106,247,.4);background:linear-gradient(145deg,rgba(124,106,247,.12),rgba(26,127,100,.08));}" +
      "#rd-install-card .rd-inst-row{display:flex;gap:12px;align-items:center;}" +
      "#rd-install-card .rd-inst-icon{width:48px;height:48px;border-radius:12px;flex-shrink:0;" +
      "background:#12141a;display:grid;place-items:center;font:800 18px system-ui;color:#f4f4f6;" +
      "box-shadow:0 4px 14px rgba(0,0,0,.35);}" +
      "#rd-install-card .rd-inst-text{flex:1;min-width:0;}" +
      "#rd-install-card .rd-inst-text strong{display:block;font:700 14px system-ui;color:#fff;margin-bottom:2px;}" +
      "#rd-install-card .rd-inst-text span{font:12px system-ui;color:#a8a4b8;line-height:1.35;}" +
      "#rd-install-card .rd-inst-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px;}" +
      "#rd-install-card button,#rd-install-card a.rd-inst-btn{" +
      "border:0;border-radius:11px;padding:10px 14px;font:600 12px system-ui;cursor:pointer;" +
      "text-decoration:none;display:inline-flex;align-items:center;gap:6px;}" +
      "#rd-install-card .rd-inst-primary{background:#7c6af7;color:#fff;}" +
      "#rd-install-card .rd-inst-secondary{background:rgba(255,255,255,.08);color:#ddd;border:1px solid rgba(255,255,255,.12);}" +
      "#rd-install-card .rd-inst-hint{margin-top:10px;font:11px system-ui;color:#8b8b98;line-height:1.4;}" +
      "#rd-install-card.installed .rd-inst-primary{opacity:.55;pointer-events:none;}" +
      "#rd-settings-version{margin-top:16px;padding-top:12px;border-top:1px solid var(--border,#2a2a31);" +
      "font:11px system-ui;color:#8b8b98;text-align:center;}";
    document.head.appendChild(s);
  }

  function isStandalone() {
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true ||
      document.referrer.indexOf("android-app://") === 0
    );
  }

  function isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  }

  function isAndroid() {
    return /Android/i.test(navigator.userAgent);
  }

  function toast(m, t) {
    if (typeof showToast === "function") showToast(m, t || "success");
  }

  async function doInstall() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      var choice = await deferredPrompt.userChoice;
      if (choice && choice.outcome === "accepted") {
        toast("RolxDesk dipasang");
        deferredPrompt = null;
        updateCardState();
      }
      return;
    }
    if (isIOS()) toast("iOS: Share → Add to Home Screen", "success");
    else if (isAndroid()) toast("Chrome: menu ⋮ → Install app / Add to Home screen", "success");
    else toast("Browser: ikon install di address bar, atau menu → Install RolxDesk", "success");
  }

  function updateCardState() {
    var card = document.getElementById("rd-install-card");
    if (!card) return;
    var btn = card.querySelector(".rd-inst-primary");
    var hint = card.querySelector(".rd-inst-hint");
    if (isStandalone()) {
      card.classList.add("installed");
      if (btn) btn.textContent = "Sudah terpasang";
      if (hint) hint.textContent = "Kamu sedang memakai RD sebagai app.";
    } else if (deferredPrompt) {
      card.classList.remove("installed");
      if (btn) btn.textContent = "Install RolxDesk";
      if (hint) hint.textContent = "Satu ketuk — pasang seperti aplikasi biasa.";
    } else {
      card.classList.remove("installed");
      if (btn) btn.textContent = "Cara install";
      if (isIOS() && hint) hint.textContent = "iPhone/iPad: tombol Share → Add to Home Screen / Tambah ke Layar Utama.";
      else if (isAndroid() && hint) hint.textContent = "Android Chrome: menu ⋮ → Install app atau Tambahkan ke layar utama.";
      else if (hint) hint.textContent = "Desktop: ikon install di address bar, atau menu browser → Install RolxDesk.";
    }
  }

  function buildCard() {
    injectCss();
    if (document.getElementById("rd-install-card")) {
      updateCardState();
      return;
    }
    var body = document.querySelector("#settingsModal .modal-body");
    if (!body) return;

    var card = document.createElement("div");
    card.id = "rd-install-card";
    card.innerHTML =
      '<div class="section-title" style="margin:0 0 10px">Download / Install RD</div>' +
      '<div class="rd-inst-row">' +
      '  <div class="rd-inst-icon" aria-hidden="true">RD</div>' +
      '  <div class="rd-inst-text">' +
      "    <strong>RolxDesk App</strong>" +
      "    <span>Pasang ke HP / PC biar kebuka kayak aplikasi — tanpa Play Store.</span>" +
      "  </div>" +
      "</div>" +
      '<div class="rd-inst-actions">' +
      '  <button type="button" class="rd-inst-primary" id="rdInstallBtn">Install RolxDesk</button>' +
      '  <a class="rd-inst-btn rd-inst-secondary" id="rdInstallHome" href="/">Buka di tab ini</a>' +
      "</div>" +
      '<p class="rd-inst-hint">Memakai ikon RD dari manifest PWA.</p>';

    if (body.firstChild) body.insertBefore(card, body.firstChild);
    else body.appendChild(card);

    document.getElementById("rdInstallBtn").onclick = function (e) {
      e.preventDefault();
      doInstall();
    };

    if (!document.getElementById("rd-settings-version")) {
      var ver = document.createElement("div");
      ver.id = "rd-settings-version";
      ver.textContent = "RolxDesk " + VERSION;
      body.appendChild(ver);
    }

    updateCardState();
  }

  window.addEventListener("beforeinstallprompt", function (e) {
    e.preventDefault();
    deferredPrompt = e;
    updateCardState();
  });
  window.addEventListener("appinstalled", function () {
    deferredPrompt = null;
    updateCardState();
    toast("RolxDesk terpasang");
  });

  function boot() { buildCard(); }

  document.addEventListener("click", function (e) {
    var t = e.target;
    if (!t) return;
    if (t.id === "settingsBtn" || (t.closest && t.closest("#settingsBtn"))) {
      setTimeout(buildCard, 80);
      setTimeout(buildCard, 300);
    }
  });

  var tries = 0;
  var iv = setInterval(function () {
    tries++;
    if (document.getElementById("settingsModal")) {
      buildCard();
      var modal = document.getElementById("settingsModal");
      if (modal && !modal.__rdInstObs) {
        modal.__rdInstObs = true;
        var obs = new MutationObserver(function () {
          if (modal.classList.contains("open") || getComputedStyle(modal).display !== "none") buildCard();
        });
        obs.observe(modal, { attributes: true, attributeFilter: ["class", "style"] });
      }
    }
    if (tries > 40) clearInterval(iv);
  }, 500);

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else setTimeout(boot, 0);
})();
