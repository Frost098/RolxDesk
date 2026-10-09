/* RolxDesk CisyPi bridge v1 — search metadata, play official source embed */
(function () {
  if (window.__RD_CISYPI_BRIDGE_V1__) return;
  window.__RD_CISYPI_BRIDGE_V1__ = true;

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>\"']/g, function (c) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c];
    });
  }
  function ensureUi() {
    if (!document.getElementById("rd-cp-css")) {
      var style = document.createElement("style");
      style.id = "rd-cp-css";
      style.textContent = "#rd-cp{position:fixed;z-index:2147482998;right:14px;bottom:88px;width:min(430px,94vw);background:#0c0d12;border:1px solid #3d4160;border-radius:16px;box-shadow:0 18px 60px #000b;overflow:hidden;display:none;color:#eee}#rd-cp.show{display:block}#rd-cp-head{display:flex;gap:8px;align-items:center;padding:10px 12px;background:linear-gradient(120deg,#141526,#101a25)}#rd-cp-title{flex:1;font-weight:700;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}#rd-cp-close{background:transparent;color:#bbb;border:0;font-size:20px;cursor:pointer}#rd-cp-list{max-height:270px;overflow:auto;padding:8px}#rd-cp-list article{display:grid;grid-template-columns:92px 1fr;gap:9px;padding:8px;border:1px solid #292c40;border-radius:10px;margin-bottom:7px;background:#11131b}#rd-cp-list img{width:92px;height:58px;object-fit:cover;border-radius:7px;background:#20222c}#rd-cp-list h4{font-size:12px;margin:0 0 3px}#rd-cp-list p{font-size:10px;color:#aeb2c0;margin:0 0 5px;line-height:1.3}#rd-cp-list button,#rd-cp-list a{font-size:10px;border:1px solid #555b87;background:#202542;color:#fff;border-radius:6px;padding:4px 7px;text-decoration:none;cursor:pointer;margin-right:4px}#rd-cp-frame{width:100%;height:250px;border:0;background:#000;display:none}#rd-cp-note{font-size:10px;color:#9ea5b7;padding:8px 10px;line-height:1.35}";
      document.head.appendChild(style);
    }
    var panel = document.getElementById("rd-cp");
    if (!panel) {
      panel = document.createElement("section");
      panel.id = "rd-cp";
      panel.innerHTML = '<div id="rd-cp-head"><span id="rd-cp-title">CisyPi Media</span><button id="rd-cp-close" type="button">×</button></div><div id="rd-cp-list"></div><iframe id="rd-cp-frame" allow="autoplay; fullscreen" allowfullscreen></iframe><div id="rd-cp-note">Metadata dari katalog publik CisyPi. Playback memakai official source embed; RD tidak mengunduh atau menyalin video.</div>';
      document.body.appendChild(panel);
      document.getElementById("rd-cp-close").onclick = function () { panel.classList.remove("show"); document.getElementById("rd-cp-frame").src = "about:blank"; };
    }
    return panel;
  }
  function openItem(item) {
    var panel = ensureUi(), frame = document.getElementById("rd-cp-frame"), list = document.getElementById("rd-cp-list");
    var url = item.embedUrl || item.sourceUrl;
    if (!url) { if (typeof showToast === "function") showToast("Video CisyPi belum punya source aktif", "error"); return false; }
    frame.src = url;
    frame.style.display = "block";
    list.style.display = "none";
    document.getElementById("rd-cp-title").textContent = item.title || "CisyPi video";
    panel.classList.add("show");
    if (typeof showToast === "function") showToast("CisyPi: " + String(item.title || "video").slice(0, 42), "success");
    return true;
  }
  async function search(query, autoplay) {
    query = String(query || "").trim();
    if (!query) return "Query CisyPi kosong.";
    var r = await fetch("/api/cisypi-catalog?q=" + encodeURIComponent(query) + "&limit=8", { signal: AbortSignal.timeout(20000) });
    var data = await r.json().catch(function () { return {}; });
    if (!r.ok) throw new Error(data.error || "CisyPi catalog HTTP " + r.status);
    var items = Array.isArray(data.items) ? data.items : [];
    var panel = ensureUi(), list = document.getElementById("rd-cp-list"), frame = document.getElementById("rd-cp-frame");
    frame.style.display = "none"; frame.src = "about:blank"; list.style.display = "block";
    document.getElementById("rd-cp-title").textContent = "CisyPi · " + query;
    if (!items.length) { list.innerHTML = '<p style="padding:12px;color:#aaa">Tidak ada video CisyPi yang cocok.</p>'; panel.classList.add("show"); return "Tidak ada video CisyPi untuk: " + query; }
    list.innerHTML = items.map(function (item, i) {
      return '<article><img src="' + esc(item.thumbnailUrl || "") + '" alt=""><div><h4>' + esc(item.title) + '</h4><p>' + esc((item.creator && item.creator.name || "CisyPi") + " · " + (item.category || "video")) + '</p><button type="button" data-i="' + i + '">Putar di CisyPi</button>' + (item.sourceUrl ? '<a href="' + esc(item.sourceUrl) + '" target="_blank" rel="noopener">Sumber</a>' : "") + '</div></article>';
    }).join("");
    list.querySelectorAll("button[data-i]").forEach(function (btn) { btn.onclick = function () { openItem(items[Number(btn.dataset.i)]); }; });
    panel.classList.add("show");
    if (autoplay && items.length === 1) openItem(items[0]);
    return "CisyPi menemukan " + items.length + " kandidat. Pilih video di panel.";
  }
  window.playCisyPi = function (query) { return search(query, true).catch(function (e) { if (typeof showToast === "function") showToast(e.message, "error"); return "CisyPi gagal: " + e.message; }); };
  window.searchCisyPi = function (query) { return search(query, false); };

  function wants(text) { return /cisy\s*pi|cisypi|terdaftar di cisy|video cisy/i.test(String(text || "")); }
  function getQuery(text) {
    var s = String(text || "").replace(/.*?(?:cisy\s*pi|cisypi)/i, "").replace(/^(?:nya|di|yang|video)\s*/i, "").trim();
    s = s.replace(/^(?:tolong\s+)?(?:putar|play|tonton|mainkan|cari|search)\s+/i, "").trim();
    return s || "";
  }
  window.rdCisyPiTool = function (userText, assistantText) {
    if (!wants(userText)) return assistantText;
    var q = getQuery(userText);
    if (!q) return assistantText + "\nPakai nama/judulnya, misalnya: `putar video Hu Tao yang ada di CisyPi`.";
    var out = String(assistantText || "").replace(/\[\[CISYPI:[^\]]+\]\]/gi, "");
    return out + "\n[[CISYPI: " + q.slice(0, 100) + "]]";
  };
  function patchTags() {
    if (typeof window.runAgentTags !== "function" || window.runAgentTags.__rdCisyPi) return;
    var old = window.runAgentTags;
    window.runAgentTags = async function (content) {
      var out = String(content || ""), ms = Array.from(out.matchAll(/\[\[CISYPI:\s*([^\]]+)\]\]/gi));
      for (var i = 0; i < ms.length; i++) { var result = await search(ms[i][1].trim(), true); out = out.replace(ms[i][0], "\n🎬 " + result + "\n"); }
      return old(out);
    };
    window.runAgentTags.__rdCisyPi = true;
  }
  function boot() {
    patchTags();
    if (typeof window.forceToolsFromUser === "function" && !window.forceToolsFromUser.__rdCisyPi) {
      var old = window.forceToolsFromUser;
      window.forceToolsFromUser = function (u, a) { return old(u, window.rdCisyPiTool(u, a)); };
      window.forceToolsFromUser.__rdCisyPi = true;
    }
  }
  setTimeout(boot, 100); setTimeout(boot, 900); setInterval(boot, 5000);
})();
