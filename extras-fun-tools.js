/* RD fun tools v1 */
(function () {
  if (window.__RD_FUN_TOOLS_V1__) return;
  window.__RD_FUN_TOOLS_V1__ = true;
  window.rdToolWiki = async function (query) {
    var q = String(query || "").trim();
    if (!q) return "Query kosong";
    try {
      var url = "https://id.wikipedia.org/api/rest_v1/page/summary/" + encodeURIComponent(q);
      var r = await fetch(url);
      if (!r.ok) r = await fetch("https://en.wikipedia.org/api/rest_v1/page/summary/" + encodeURIComponent(q));
      if (!r.ok) return "Wikipedia: tidak ketemu";
      var j = await r.json();
      return "**" + (j.title || q) + "**\n\n" + (j.extract || "");
    } catch (e) { return "Wikipedia error"; }
  };
  window.rdToolTranslate = async function (text, lang) {
    var t = String(text || "").trim();
    var to = String(lang || "en").trim() || "en";
    var url = "https://api.mymemory.translated.net/get?q=" + encodeURIComponent(t.slice(0, 500)) + "&langpair=autodetect|" + encodeURIComponent(to);
    var r = await fetch(url);
    var j = await r.json();
    return (j && j.responseData && j.responseData.translatedText) || "[translate error]";
  };
  window.rdToolQR = function (text) {
    var t = String(text || "RolxDesk").trim();
    var src = "https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=" + encodeURIComponent(t.slice(0, 800));
    return { markdown: "![QR](" + src + ")", url: src };
  };
  window.rdToolUuid = function () {
    if (crypto && crypto.randomUUID) return crypto.randomUUID();
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0;
      return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
    });
  };
  window.rdToolHash = async function (text) {
    var t = String(text || "");
    if (crypto && crypto.subtle) {
      var buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(t));
      return Array.from(new Uint8Array(buf)).map(function (b) { return b.toString(16).padStart(2, "0"); }).join("");
    }
    var h = 5381;
    for (var i = 0; i < t.length; i++) h = ((h << 5) + h) ^ t.charCodeAt(i);
    return "djb2_" + (h >>> 0).toString(16);
  };
  window.rdToolFx = async function (amount, from, to) {
    var a = Number(amount) || 1;
    var f = String(from || "USD").toUpperCase();
    var t = String(to || "IDR").toUpperCase();
    var r = await fetch("https://api.frankfurter.app/latest?amount=" + a + "&from=" + f + "&to=" + t);
    var j = await r.json();
    var val = j.rates && j.rates[t];
    if (val == null) throw new Error("kurs n/a");
    return { text: a + " " + f + " = " + val + " " + t + " (Frankfurter/ECB)" };
  };
  async function replaceAsync(str, re, fn) {
    var m, parts = [], last = 0;
    re.lastIndex = 0;
    while ((m = re.exec(str))) {
      parts.push(str.slice(last, m.index));
      parts.push(await fn(m));
      last = m.index + m[0].length;
    }
    parts.push(str.slice(last));
    return parts.join("");
  }
  window.rdRunFunTags = async function (text) {
    var out = String(text || "");
    out = await replaceAsync(out, /\[\[WIKI:([^\]]+)\]\]/gi, async function (m) { return "\n\n" + (await window.rdToolWiki(m[1])) + "\n\n"; });
    out = await replaceAsync(out, /\[\[TR:([a-zA-Z\-]+)\|([^\]]+)\]\]/gi, async function (m) { return await window.rdToolTranslate(m[2], m[1]); });
    out = await replaceAsync(out, /\[\[QR:([^\]]+)\]\]/gi, async function (m) { return "\n\n" + window.rdToolQR(m[1]).markdown + "\n\n"; });
    out = out.replace(/\[\[UUID\]\]/gi, function () { return window.rdToolUuid(); });
    out = await replaceAsync(out, /\[\[HASH:([^\]]+)\]\]/gi, async function (m) { return await window.rdToolHash(m[1]); });
    out = await replaceAsync(out, /\[\[FX:([0-9.]+)\|([A-Za-z]{3})\|([A-Za-z]{3})\]\]/gi, async function (m) {
      try { return (await window.rdToolFx(m[1], m[2], m[3])).text; } catch (e) { return "[fx error]"; }
    });
    return { text: out };
  };
  function patchAgent() {
    if (typeof window.runAgentTags === "function" && !window.runAgentTags.__rdFun) {
      var prev = window.runAgentTags;
      window.runAgentTags = async function (text) {
        var r1 = await prev.apply(this, arguments);
        var base = typeof r1 === "string" ? r1 : text;
        try { return (await window.rdRunFunTags(base)).text; } catch (e) { return base; }
      };
      window.runAgentTags.__rdFun = true;
    }
  }
  setInterval(patchAgent, 2000);
  patchAgent();
})();
