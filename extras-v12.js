/* RD v12 — CisyPi priority routing, local/open image mode, phone browser actions */
(function () {
  if (window.__RD_V12__) return;
  window.__RD_V12__ = true;
  function isCisy(text) { return /cisy\s*pi|cisypi|terdaftar di cisy/i.test(String(text || "")); }
  function queryOf(text) {
    return String(text || "").replace(/.*?(?:cisy\s*pi|cisypi)/i, "").replace(/^(?:yang|di|video|nya)\s*/i, "").replace(/^(?:tolong\s*)?(?:putar|play|tonton|cari|search)\s+/i, "").trim() || "";
  }
  function installForceGuard() {
    if (typeof window.forceToolsFromUser !== "function" || window.forceToolsFromUser.__rdV12) return;
    var prev = window.forceToolsFromUser;
    window.forceToolsFromUser = function (userText, assistantText) {
      var u = String(userText || ""), out = String(assistantText || "");
      if (isCisy(u)) {
        var q = queryOf(u);
        out = out.replace(/\[\[(?:PLAY|YOUTUBE|SEARCH):[^\]]+\]\]/gi, "");
        out = out.replace(/https?:\/\/(?:www\.)?(?:youtube\.com|youtu\.be)\/[^\s)]+/gi, "");
        return out + "\n[[CISYPI: " + (q || "video") .slice(0, 120) + "]]\n";
      }
      return prev(u, out);
    };
    window.forceToolsFromUser.__rdV12 = true;
  }
  async function handleCisyTags(content) {
    var out = String(content || "");
    var ms = Array.from(out.matchAll(/\[\[CISYPI:\s*([^\]]+)\]\]/gi));
    for (var i = 0; i < ms.length; i++) {
      var q = ms[i][1].trim();
      try {
        var result = await window.playCisyPi(q);
        out = out.replace(ms[i][0], "\n🎬 **CisyPi:** " + String(result || "Picker dibuka") + "\n");
      } catch (e) { out = out.replace(ms[i][0], "\nCisyPi gagal: " + e.message + "\n"); }
    }
    // A CisyPi action must never leave a YouTube action behind in the same answer.
    if (ms.length) out = out.replace(/\[\[(?:YOUTUBE|PLAY):[^\]]+\]\]/gi, "");
    return out;
  }
  function installTagGuard() {
    if (typeof window.runAgentTags !== "function" || window.runAgentTags.__rdV12) return;
    var prev = window.runAgentTags;
    window.runAgentTags = async function (content) {
      var out = await handleCisyTags(content);
      return prev(out);
    };
    window.runAgentTags.__rdV12 = true;
  }
  function localImageCard(prompt) {
    var q = String(prompt || "").trim();
    var remote = "https://image.pollinations.ai/prompt/" + encodeURIComponent(q) + "?width=768&height=768&nologo=true&model=flux";
    var local = "https://websd.mlc.ai/";
    var safe = q.replace(/[&<>\"']/g, function (c) { return ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]; });
    return '<div class="rd-image-card"><b>Open image mode</b><p>' + safe + '</p><img src="' + remote + '" alt="' + safe + '" style="max-width:100%;border-radius:12px"><div><a href="' + remote + '" target="_blank" rel="noopener">Buka / simpan hasil</a> · <a href="' + local + '" target="_blank" rel="noopener">Coba local WebGPU tanpa API key</a></div><small>Endpoint pertama memakai model open-weight melalui layanan publik tanpa key. WebSD menjalankan Stable Diffusion langsung di browser/WebGPU jika perangkat mendukung.</small></div>';
  }
  async function handleImageTags(content) {
    var out = String(content || "");
    var ms = Array.from(out.matchAll(/\[\[(?:IMG|LOCAL_IMAGE):\s*([^\]]+)\]\]/gi));
    for (var i = 0; i < ms.length; i++) out = out.replace(ms[i][0], localImageCard(ms[i][1]));
    return out;
  }
  function browserAction(action) {
    var s = String(action || "").trim(), m = s.match(/https?:\/\/[^\s]+/i);
    if (!m) return "Browser Control: URL https:// wajib disertakan.";
    var url = m[0].replace(/[),.;]+$/, "");
    var win = window.open(url, "_blank", "noopener,noreferrer");
    return win ? "Browser Control membuka tab baru: " + url : "Browser memblokir popup. Tekan link ini: " + url;
  }
  window.rdBrowserControl = browserAction;
  async function handleBrowserTags(content) {
    var out = String(content || "");
    var ms = Array.from(out.matchAll(/\[\[(?:BROWSER|OPEN_BROWSER):\s*([^\]]+)\]\]/gi));
    for (var i = 0; i < ms.length; i++) out = out.replace(ms[i][0], "\n🌐 " + browserAction(ms[i][1]) + "\n");
    return out;
  }
  function installAllTagGuard() {
    if (typeof window.runAgentTags !== "function" || window.runAgentTags.__rdV12all) return;
    var prev = window.runAgentTags;
    window.runAgentTags = async function (content) {
      var out = await handleCisyTags(content);
      out = await handleImageTags(out);
      out = await handleBrowserTags(out);
      return prev(out);
    };
    window.runAgentTags.__rdV12all = true;
  }
  function boot() { installForceGuard(); installAllTagGuard(); }
  setTimeout(boot, 100); setTimeout(boot, 800); setInterval(boot, 5000);
})();
