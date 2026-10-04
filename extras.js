/* RolxDesk extras v4.9 — tools expand + RUN_PY fix + identity */
(function () {
  if (window.__RD_EXTRAS_V49__) return;
  window.__RD_EXTRAS_V49__ = true;
  window.__RD_EXTRAS__ = true;
  console.log('[RD] extras v4.9 loaded — UI polish in extras-ui.js');
  function $(s, r) { return (r || document).querySelector(s); }
  function el(t, a, h) {
    var n = document.createElement(t);
    if (a) Object.entries(a).forEach(function (kv) {
      var k = kv[0], v = kv[1];
      if (k === 'style' && typeof v === 'object') Object.assign(n.style, v);
      else if (k.startsWith('on') && typeof v === 'function') n.addEventListener(k.slice(2), v);
      else n.setAttribute(k, v);
    });
    if (h != null) n.innerHTML = h;
    return n;
  }
  function withTimeout(promise, ms, label) {
    return new Promise(function (resolve, reject) {
      var done = false;
      var t = setTimeout(function () { if (!done) { done = true; reject(new Error((label || 'op') + ' timeout')); } }, ms || 20000);
      promise.then(function (v) { if (!done) { done = true; clearTimeout(t); resolve(v); } }, function (e) { if (!done) { done = true; clearTimeout(t); reject(e); } });
    });
  }
  function unlockSend() {
    try {
      if (window.state) { window.state.isStreaming = false; window.state._sendLock = false; }
      var btn = document.getElementById('sendBtn');
      if (btn) { btn.disabled = false; btn.removeAttribute('disabled'); }
      if (typeof setActivity === 'function') setActivity('Siap', '');
    } catch (e) {}
  }
  function ensureWorkPanel() {
    var box = $('#rd-work');
    if (box) return box;
    box = el('div', { id: 'rd-work' });
    Object.assign(box.style, { position: 'fixed', left: '10px', right: '10px', bottom: '72px', maxHeight: '38vh', overflow: 'auto', zIndex: '10001', background: 'rgba(18,18,22,.97)', color: '#e8e8ee', border: '1px solid #3a3a48', borderRadius: '14px', font: '13px/1.45 system-ui,sans-serif', padding: '10px 12px', display: 'none', boxShadow: '0 8px 32px rgba(0,0,0,.45)' });
    var head = el('div'); head.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:8px';
    var left = el('div'); left.style.cssText = 'display:flex;align-items:center;gap:8px';
    var spin = el('span', { id: 'rd-work-spin' }, '\u25cf'); spin.style.cssText = 'color:#7c6af7;animation:rdPulse 1s infinite';
    left.appendChild(spin); left.appendChild(el('strong', { id: 'rd-work-title' }, 'Working')); head.appendChild(left);
    var close = el('button', { type: 'button' }, '\u00d7'); close.style.cssText = 'background:none;border:0;color:#aaa;font-size:18px;cursor:pointer';
    close.onclick = function () { box.style.display = 'none'; }; head.appendChild(close); box.appendChild(head);
    box.appendChild(el('div', { id: 'rd-work-steps' }, ''));
    var style = document.createElement('style'); style.textContent = '@keyframes rdPulse{0%,100%{opacity:1}50%{opacity:.35}}#rd-work-steps .rd-step{padding:4px 0;border-bottom:1px solid #2a2a34;color:#c8c8d0;font-size:12px}#rd-work-steps .rd-step b{color:#a89cff}';
    document.head.appendChild(style); document.body.appendChild(box); return box;
  }
  function workStart(title) { var box = ensureWorkPanel(); var t = $('#rd-work-title'); if (t) t.textContent = title || 'Working'; var spin = $('#rd-work-spin'); if (spin) spin.style.display = 'inline'; var body = $('#rd-work-steps'); if (body) body.innerHTML = ''; box.style.display = 'block'; }
  function workStep(label, detail) { var body = $('#rd-work-steps'); if (!body) return; var row = el('div', { class: 'rd-step' }); row.innerHTML = '<b>' + String(label).replace(/</g, '<') + '</b>' + (detail ? (' \u00b7 ' + String(detail).replace(/</g, '<').slice(0, 160)) : ''); body.appendChild(row); body.scrollTop = body.scrollHeight; ensureWorkPanel().style.display = 'block'; }
  function workDone(title) { var t = $('#rd-work-title'); if (t) t.textContent = title || 'Selesai'; var spin = $('#rd-work-spin'); if (spin) spin.style.display = 'none'; clearTimeout(window.__rdWorkHide); window.__rdWorkHide = setTimeout(function () { var box = $('#rd-work'); if (box) box.style.display = 'none'; }, 9000); }
  window.rdPeek = function (title, body) { workStart(title || 'Aktivitas'); String(body || '').split('\n').forEach(function (line) { if (line.trim()) workStep(line.trim().slice(0, 48), line.trim().length > 48 ? line.trim().slice(48) : ''); }); };
  window.rdStatus = function (msg) { if (typeof setLiveStatus === 'function') try { setLiveStatus(msg); } catch (e) {} workStep('status', msg); };
  function injectMobileCSS() {
    if ($('#rd-extras-css')) return;
    var s = document.createElement('style'); s.id = 'rd-extras-css';
    s.textContent = 'html,body{padding-top:env(safe-area-inset-top,0)}@media(max-width:720px){.messages{padding-bottom:120px!important}#rd-yt{bottom:88px!important;right:8px!important}#rd-work{bottom:80px!important;max-height:32vh!important}}#sendBtn:disabled{opacity:.55}#userInput{pointer-events:auto!important}';
    document.head.appendChild(s);
  }
  var TOOL_LAW = '\n\n[ROLXDESK TOOL LAW]\nPRIORITAS MUTLAK: PESAN USER TERAKHIR.\nJANGAN bilang tidak bisa. JANGAN bilang kamu Kiro/Cursor/IDE.\nJujur soal model: sebutkan family + model ID di chip.\nPython: [[RUN_PY]]kode_lengkap[[/RUN_PY]].\nTag: [[SEARCH]] [[BROWSE]] [[YOUTUBE]] [[IMG]] [[PLAY]] [[RUN_PY]] [[CALC]] [[TIME]] [[UUID]]\n';
  function patchContinuity() {
    try { if (typeof CONTINUITY === 'string' && CONTINUITY.indexOf('TOOL LAW') === -1) CONTINUITY += TOOL_LAW; } catch (e) {}
    if (typeof window.injectPersona === 'function' && !window.injectPersona.__rd49) {
      var orig = window.injectPersona;
      window.injectPersona = function (m) {
        var out = orig(m);
        if (Array.isArray(out) && out[0] && out[0].role === 'system') {
          var c = String(out[0].content);
          if (c.indexOf('TOOL LAW') === -1) out[0] = { role: 'system', content: c + TOOL_LAW };
        }
        return out;
      };
      window.injectPersona.__rd49 = true;
    }
  }
  function extractUrl(s) { var m = String(s || '').match(/https?:\/\/[^\s\]\)\"\'<>]+/i); return m ? m[0].replace(/[.,;]+$/, '') : null; }
  function wantsYoutube(u) { return /(youtube|youtu\.be|putar\s*video|play\s*video|tonton|video\s+terbaru)/i.test(u); }
  function wantsMusic(u) { return /(spotify|putar\s*(lagu|musik)|play\s*(song|music|lagu))/i.test(u) && !wantsYoutube(u); }
  function wantsImage(u) { return /(buatkan?|generate|bikin|gambarin|draw|\/img)\b/i.test(u); }
  function forceToolsExpanded(userText, assistantText) {
    var out = assistantText || '';
    var u = String(userText || '');
    try { window.__rdLastUser = u; } catch (e) {}
    var already = function (tag) { return new RegExp('\\[\\[' + tag, 'i').test(out); };
    var url = extractUrl(u);
    if (url && !/youtube|youtu\.be|spotify/i.test(url) && /(research|cari|buka|browse|ringkas|https?:)/i.test(u)) {
      if (!already('BROWSE')) out += '\n[[BROWSE: ' + url + ']]\n';
    }
    if (wantsImage(u) && !already('IMG') && !wantsYoutube(u)) {
      var ip = u.replace(/.*(?:buatkan?|generate|bikin|gambarin|draw|\/img)\s*/i, '').trim() || u.slice(0, 120);
      out += '\n[[IMG: ' + ip.slice(0, 400) + ']]\n';
    }
    if (wantsYoutube(u) && !already('YOUTUBE')) {
      var yu = extractUrl(u) || u.replace(/.*(?:youtube|putar\s*video|play\s*video|tonton|video\s+terbaru(?:\s+(?:oleh|dari|by))?)\s*/i, '').trim();
      if (yu) out += '\n[[YOUTUBE: ' + yu.slice(0, 120) + ']]\n';
    } else if (wantsMusic(u) && !already('PLAY')) {
      var song = u.replace(/.*(?:putar|play)\s+(?:lagu|musik|song|music)?\s*/i, '').trim() || 'lofi';
      out += '\n[[PLAY: ' + song.slice(0, 80) + ']]\n';
    }
    if (/(jalankan|eksekusi|run)\s*(python|kode|code)?|\bpython\b|```py/i.test(u) && !/\[\[RUN_PY/i.test(out)) {
      var code = null;
      var fm = u.match(/```(?:python|py)?\s*([\s\S]*?)```/i);
      if (fm && fm[1].trim()) code = fm[1].trim();
      if (!code) {
        var lines = u.split('\n').filter(function (ln) { return /^\s*(import |from |def |print\(|for |while |if |#)/.test(ln); });
        if (lines.length) code = lines.join('\n');
      }
      if (!code || /^kode$/i.test(code.trim())) code = "print('RolxDesk Python OK')\nprint(2+2)";
      out += '\n[[RUN_PY]]' + code + '[[/RUN_PY]]\n';
    }
    return out;
  }
  function patchForceTools() {
    if (typeof window.forceToolsFromUser === 'function' && !window.forceToolsFromUser.__rd49) {
      var prev = window.forceToolsFromUser;
      window.forceToolsFromUser = function (ut, at) { return forceToolsExpanded(ut, prev(ut, at)); };
      window.forceToolsFromUser.__rd49 = true;
    } else if (typeof window.forceToolsFromUser !== 'function') {
      window.forceToolsFromUser = forceToolsExpanded;
    }
  }
  async function playYoutubeSmart(q) {
    unlockSend(); workStart('Mencari video\u2026');
    try {
      var r = await withTimeout(fetch('/api/yt-search', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ q: q }) }), 16000, 'yt');
      var j = await r.json().catch(function () { return {}; });
      if (r.ok && j.id && /^[A-Za-z0-9_-]{11}$/.test(j.id)) {
        var panel = document.getElementById('rd-yt');
        if (!panel) {
          panel = el('div', { id: 'rd-yt' });
          Object.assign(panel.style, { position: 'fixed', right: '12px', bottom: '88px', width: 'min(360px,92vw)', zIndex: '10000', background: '#111', border: '1px solid #333', borderRadius: '12px', overflow: 'hidden' });
          var frame = el('iframe', { id: 'rd-yt-frame', allow: 'autoplay; encrypted-media; picture-in-picture; fullscreen' });
          frame.style.cssText = 'width:100%;aspect-ratio:16/9;border:0;display:block;background:#000';
          panel.appendChild(frame); document.body.appendChild(panel);
        }
        var f = document.getElementById('rd-yt-frame');
        if (f) f.src = 'https://www.youtube-nocookie.com/embed/' + j.id + '?autoplay=1&rel=0';
        panel.style.display = 'block';
        workDone('Playing');
        return '\u25b6\ufe0f ' + (j.title || j.id) + '\nhttps://youtu.be/' + j.id;
      }
    } catch (e) {}
    workDone('Miss');
    return 'Cari di YouTube: ' + q;
  }
  function patchSpotify() {
    window.playSpotify = async function (query) {
      if (!query) return; unlockSend();
      var q = String(query).trim();
      var m = q.match(/open\.spotify\.com\/track\/([A-Za-z0-9]+)/i);
      if (m && typeof showSpotifyEmbed === 'function') { showSpotifyEmbed(m[1]); return; }
      await playYoutubeSmart(q.replace(/^(putar|play)\s+(lagu|musik|song|music)?\s*/i, '').trim() + ' official audio');
    };
    window.playSpotify.__rd49 = true;
  }
  async function runExtraTags(content) {
    if (!content) return content;
    var out = content; unlockSend();
    try {
      workStart('Tools');
      var yts = [...out.matchAll(/\[\[YOUTUBE:\s*([^\]]+)\]\]/gi)];
      for (var yi = 0; yi < yts.length; yi++) {
        var ytxt = await playYoutubeSmart(yts[yi][1].trim());
        out = out.replace(yts[yi][0], '\n' + ytxt + '\n');
      }
      out = out.replace(/\[\[PLAY:\s*([^\]]+)\]\]/gi, function (_, q) { try { window.playSpotify(q.trim()); } catch (e) {} return '\n\ud83c\udfb5 ' + q.trim() + '\n'; });
      out = out.replace(/\[\[CALC:\s*([^\]]+)\]\]/gi, function (_, expr) {
        try { var safe = String(expr).replace(/[^0-9+\-*/().%\s]/g, ''); return '\n\ud83d\udd22 ' + safe + ' = **' + Function('"use strict";return (' + safe + ')')() + '**\n'; }
        catch (e) { return '\n\ud83d\udd22 gagal\n'; }
      });
      out = out.replace(/\[\[TIME\]\]/gi, function () { return '\n\ud83d\udd50 ' + new Date().toLocaleString('id-ID') + '\n'; });
      out = out.replace(/\[\[UUID\]\]/gi, function () {
        return '\n\ud83c\udd94 `' + 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) { var r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16); }) + '`\n';
      });
      workDone('OK');
    } catch (e) { workDone('Error'); }
    unlockSend();
    return out.replace(/\n{3,}/g, '\n\n').trim();
  }
  function patchRunAgentTags() {
    if (typeof window.runAgentTags === 'function' && !window.runAgentTags.__rd49) {
      var orig = window.runAgentTags;
      window.runAgentTags = async function (content) {
        unlockSend();
        try {
          var mid = await withTimeout(Promise.resolve(orig(content)), 60000, 'agent');
          return await runExtraTags(mid);
        } catch (e) { unlockSend(); return 'Error: ' + (e.message || e); }
        finally { unlockSend(); }
      };
      window.runAgentTags.__rd49 = true;
    }
  }
  setInterval(function () {
    try {
      var locked = window.state && (window.state.isStreaming || window.state._sendLock);
      var btn = document.getElementById('sendBtn');
      if (btn && btn.disabled && !locked) btn.disabled = false;
      if (locked) {
        if (!window.__rdLockSince) window.__rdLockSince = Date.now();
        else if (Date.now() - window.__rdLockSince > 25000) { unlockSend(); window.__rdLockSince = 0; }
      } else window.__rdLockSince = 0;
    } catch (e) {}
  }, 3000);
  function boot() { injectMobileCSS(); patchContinuity(); patchForceTools(); patchSpotify(); patchRunAgentTags(); unlockSend(); }
  function rebind() { boot(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else setTimeout(boot, 150);
  setTimeout(rebind, 700); setTimeout(rebind, 2000); setTimeout(rebind, 5000);
})();
