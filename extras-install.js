/* RD Install v121 — CisyPi-style banner + real file download + native prompt */
(function () {
  if (window.__RD_INSTALL_V121__) return;
  window.__RD_INSTALL_V121__ = true;
  var VERSION = "v6.6.1+121";

  function getPrompt() { return window.__RD_DEFERRED_INSTALL || null; }
  function setPrompt(p) { window.__RD_DEFERRED_INSTALL = p || null; }

  function toast(m, t) {
    if (typeof showToast === "function") showToast(m, t || "success");
  }
  function isStandalone() {
    return window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;
  }

  function injectCss() {
    if (document.getElementById("rd-install-css")) return;
    var s = document.createElement("style");
    s.id = "rd-install-css";
    s.textContent =
      "#rd-install-banner{position:fixed;left:10px;right:10px;bottom:calc(72px + env(safe-area-inset-bottom,0px));" +
      "z-index:60;display:none;padding:12px 14px;border-radius:14px;border:1px solid rgba(220,38,38,.35);" +
      "background:rgba(40,10,14,.94);backdrop-filter:blur(10px);box-shadow:0 12px 40px rgba(0,0,0,.45);}" +
      "#rd-install-banner.show{display:block;}" +
      "#rd-install-banner .row{display:flex;gap:10px;align-items:flex-start;}" +
      "#rd-install-banner .ico{width:36px;height:36px;border-radius:10px;background:#12141a;display:grid;place-items:center;" +
      "font:800 12px system-ui;color:#f4f4f6;flex-shrink:0;overflow:hidden;}" +
      "#rd-install-banner .ico img{width:100%;height:100%;}" +
      "#rd-install-banner .txt{flex:1;min-width:0;}" +
      "#rd-install-banner .txt strong{display:block;font:700 13px system-ui;color:#fff;margin-bottom:2px;}" +
      "#rd-install-banner .txt span{font:11px system-ui;color:#c4b5b8;line-height:1.35;}" +
      "#rd-install-banner .acts{display:flex;gap:8px;margin-top:10px;flex-wrap:wrap;}" +
      "#rd-install-banner button,#rd-install-card button{border:0;border-radius:10px;padding:9px 14px;font:600 12px system-ui;cursor:pointer;}" +
      "#rd-install-banner .go,#rd-install-card .rd-inst-primary{background:#7c6af7;color:#fff;}" +
      "#rd-install-banner .sec,#rd-install-card .rd-inst-secondary{background:rgba(255,255,255,.08);color:#eee;border:1px solid rgba(255,255,255,.12);}" +
      "#rd-install-banner .x{background:transparent;color:#aaa;padding:4px 8px;margin-left:auto;}" +
      "#rd-install-card{margin:14px 0 18px;padding:14px;border-radius:14px;border:1px solid rgba(124,106,247,.4);" +
      "background:linear-gradient(145deg,rgba(124,106,247,.12),rgba(26,127,100,.08));}" +
      "#rd-install-card .rd-inst-row{display:flex;gap:12px;align-items:center;}" +
      "#rd-install-card .rd-inst-icon{width:48px;height:48px;border-radius:12px;background:#12141a;display:grid;place-items:center;" +
      "font:800 18px system-ui;color:#f4f4f6;overflow:hidden;flex-shrink:0;}" +
      "#rd-install-card .rd-inst-icon img{width:100%;height:100%;}" +
      "#rd-install-card .rd-inst-text{flex:1;min-width:0;}" +
      "#rd-install-card .rd-inst-text strong{display:block;font:700 14px system-ui;color:#fff;}" +
      "#rd-install-card .rd-inst-text span{font:12px system-ui;color:#a8a4b8;}" +
      "#rd-install-card .rd-inst-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px;}" +
      "#rd-install-card .rd-inst-hint{margin-top:10px;font:11px system-ui;color:#8b8b98;line-height:1.4;}" +
      "#rd-install-guide{position:fixed;inset:0;z-index:2147483001;background:rgba(0,0,0,.72);display:none;" +
      "align-items:flex-end;justify-content:center;padding:16px;}" +
      "#rd-install-guide.open{display:flex;}" +
      "#rd-install-guide .box{width:min(100%,420px);background:#121218;border:1px solid #333;border-radius:16px;padding:16px;}" +
      "#rd-install-guide h3{margin:0 0 8px;font:700 16px system-ui;color:#fff;}" +
      "#rd-install-guide ol{margin:0 0 12px 18px;padding:0;color:#ccc;font:13px/1.5 system-ui;}" +
      "#rd-install-guide .row{display:flex;gap:8px;flex-wrap:wrap;}" +
      "#rd-settings-version{margin-top:16px;padding-top:12px;border-top:1px solid var(--border,#2a2a31);" +
      "font:11px system-ui;color:#8b8b98;text-align:center;}";
    document.head.appendChild(s);
  }

  function downloadLauncher() {
    var html =
      "<!DOCTYPE html><html><head><meta charset=utf-8>" +
      "<meta name=viewport content=\"width=device-width,initial-scale=1\">" +
      "<meta http-equiv=refresh content=\"0;url=https://rolxdesk.vercel.app/\">" +
      "<title>RolxDesk</title>" +
      "<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#070708;color:#eee;" +
      "font-family:system-ui,sans-serif}a{color:#a78bfa}</style></head><body>" +
      "<p>Membuka <strong>RolxDesk</strong>…<br><a href=\"https://rolxdesk.vercel.app/\">Klik di sini jika tidak otomatis</a></p>" +
      "<script>location.replace(\"https://rolxdesk.vercel.app/\");<\/script></body></html>";
    var blob = new Blob([html], { type: "text/html;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "RolxDesk.html";
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
    toast("File RolxDesk.html diunduh");
  }

  async function nativeInstall() {
    var p = getPrompt();
    if (p && typeof p.prompt === "function") {
      try {
        await p.prompt();
        var c = await p.userChoice;
        if (c && c.outcome === "accepted") {
          toast("RolxDesk terpasang");
          setPrompt(null);
          hideBanner();
          return true;
        }
        toast("Install dibatalkan", "error");
        return false;
      } catch (e) {
        toast("Install gagal: " + (e.message || e), "error");
        return false;
      }
    }
    return false;
  }

  function showGuide() {
    injectCss();
    var g = document.getElementById("rd-install-guide");
    if (!g) {
      g = document.createElement("div");
      g.id = "rd-install-guide";
      g.innerHTML =
        "<div class=\"box\">" +
        "<h3>Pasang RolxDesk ke HP</h3>" +
        "<ol>" +
        "<li>Chrome → menu <strong>⋮</strong> (kanan atas)</li>" +
        "<li>Pilih <strong>Install app</strong> atau <strong>Tambahkan ke layar utama</strong></li>" +
        "<li>Konfirmasi — ikon <strong>RD</strong> muncul di home screen</li>" +
        "</ol>" +
        "<p style=\"font:12px system-ui;color:#9a9aab;margin:0 0 12px\">Atau unduh file pintasan HTML (langsung ke folder Download).</p>" +
        "<div class=\"row\">" +
        "<button type=\"button\" class=\"go\" id=\"rdGuideInstall\">Coba Install</button>" +
        "<button type=\"button\" class=\"sec\" id=\"rdGuideDl\">Unduh RolxDesk.html</button>" +
        "<button type=\"button\" class=\"sec\" id=\"rdGuideClose\">Tutup</button>" +
        "</div></div>";
      document.body.appendChild(g);
      g.addEventListener("click", function (e) { if (e.target === g) g.classList.remove("open"); });
      document.getElementById("rdGuideClose").onclick = function () { g.classList.remove("open"); };
      document.getElementById("rdGuideDl").onclick = function () { downloadLauncher(); };
      document.getElementById("rdGuideInstall").onclick = async function () {
        var ok = await nativeInstall();
        if (!ok) toast("Pakai langkah menu Chrome di atas", "error");
      };
    }
    g.querySelectorAll("button.go").forEach(function (b) {
      b.style.cssText = "border:0;border-radius:10px;padding:9px 14px;font:600 12px system-ui;cursor:pointer;background:#7c6af7;color:#fff";
    });
    g.querySelectorAll("button.sec").forEach(function (b) {
      b.style.cssText = "border:1px solid rgba(255,255,255,.12);border-radius:10px;padding:9px 14px;font:600 12px system-ui;cursor:pointer;background:rgba(255,255,255,.08);color:#eee";
    });
    g.classList.add("open");
  }

  async function doInstallPrimary() {
    if (isStandalone()) {
      toast("Sudah terpasang sebagai app");
      return;
    }
    var ok = await nativeInstall();
    if (ok) return;
    downloadLauncher();
    showGuide();
  }

  function hideBanner() {
    var b = document.getElementById("rd-install-banner");
    if (b) b.classList.remove("show");
    try { localStorage.setItem("rd_install_banner_dismissed", "1"); } catch (e) {}
  }

  function ensureBanner() {
    injectCss();
    if (isStandalone()) return;
    try { if (localStorage.getItem("rd_install_banner_dismissed") === "1") return; } catch (e) {}
    if (document.getElementById("rd-install-banner")) {
      document.getElementById("rd-install-banner").classList.add("show");
      return;
    }
    var b = document.createElement("div");
    b.id = "rd-install-banner";
    b.innerHTML =
      "<div class=\"row\">" +
      "<div class=\"ico\"><img src=\"/icons/icon-192.svg\" alt=\"\" onerror=\"this.parentNode.textContent='RD'\"/></div>" +
      "<div class=\"txt\"><strong>Pakai RolxDesk lebih nyaman di HP</strong>" +
      "<span>Install ke home screen seperti aplikasi. Atau unduh file pintasan.</span></div>" +
      "<button type=\"button\" class=\"x\" id=\"rdBannerX\" aria-label=\"Tutup\">×</button></div>" +
      "<div class=\"acts\">" +
      "<button type=\"button\" class=\"go\" id=\"rdBannerInstall\">Install</button>" +
      "<button type=\"button\" class=\"sec\" id=\"rdBannerDl\">Unduh</button>" +
      "</div>";
    document.body.appendChild(b);
    b.classList.add("show");
    document.getElementById("rdBannerX").onclick = hideBanner;
    document.getElementById("rdBannerInstall").onclick = function () { doInstallPrimary(); };
    document.getElementById("rdBannerDl").onclick = function () { downloadLauncher(); };
  }

  function buildSettingsCard() {
    injectCss();
    var body = document.querySelector("#settingsModal .modal-body");
    if (!body) return;
    var old = document.getElementById("rd-install-card");
    if (old && !old.dataset.v121) old.remove();
    if (!document.getElementById("rd-install-card")) {
      var card = document.createElement("div");
      card.id = "rd-install-card";
      card.dataset.v121 = "1";
      card.innerHTML =
        '<div class="section-title" style="margin:0 0 10px">Download / Install RD</div>' +
        '<div class="rd-inst-row">' +
        '<div class="rd-inst-icon"><img src="/icons/icon-192.svg" alt="RD" onerror="this.remove()"/></div>' +
        '<div class="rd-inst-text"><strong>RolxDesk App</strong>' +
        "<span>Install ke home screen, atau unduh file HTML pintasan ke folder Download.</span></div></div>" +
        '<div class="rd-inst-actions">' +
        '<button type="button" class="rd-inst-primary" id="rdInstallBtn">Install</button>' +
        '<button type="button" class="rd-inst-secondary" id="rdDownloadBtn">Unduh file</button>' +
        "</div>" +
        '<p class="rd-inst-hint">Unduh = file RolxDesk.html ke Download. Install = dialog Chrome / petunjuk home screen.</p>';
      body.insertBefore(card, body.firstChild);
    }
    var btn = document.getElementById("rdInstallBtn");
    if (btn && !btn.__rdBound) {
      btn.__rdBound = true;
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        doInstallPrimary();
      });
    }
    var dl = document.getElementById("rdDownloadBtn");
    if (dl && !dl.__rdBound) {
      dl.__rdBound = true;
      dl.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        downloadLauncher();
      });
    }
    var ver = document.getElementById("rd-settings-version");
    if (!ver) {
      ver = document.createElement("div");
      ver.id = "rd-settings-version";
      body.appendChild(ver);
    }
    ver.textContent = "RolxDesk " + VERSION;
  }

  window.addEventListener("beforeinstallprompt", function (e) {
    e.preventDefault();
    setPrompt(e);
    ensureBanner();
  });
  window.addEventListener("appinstalled", function () {
    setPrompt(null);
    hideBanner();
    toast("RolxDesk terpasang");
  });

  document.addEventListener("click", function (e) {
    var t = e.target;
    if (t && (t.id === "settingsBtn" || (t.closest && t.closest("#settingsBtn")))) {
      setTimeout(buildSettingsCard, 60);
      setTimeout(buildSettingsCard, 250);
    }
  });

  var tries = 0;
  var iv = setInterval(function () {
    tries++;
    if (document.querySelector("#settingsModal .modal-body")) {
      buildSettingsCard();
      clearInterval(iv);
    }
    if (tries > 40) clearInterval(iv);
  }, 400);

  setTimeout(ensureBanner, 1800);
})();
