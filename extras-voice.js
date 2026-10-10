/* RD voice v19 — exact Fish voices + karaoke subtitles */
(function () {
  if (window.__RD_VOICE_V19__) return;
  window.__RD_VOICE_V19__ = true;

  const REFS = {
    ibuki: "5b6d90ce888747c0a5dfe798181324b9",
    alya: "627dc7e8c315428fa844773296969fb1",
    "koro-sensei": "05a680501c8d42af91610defd80d6865",
    verity: "8d21b053e2804e2a890e1cf62f267b6f",
    "vestia-zeta": "c632b5c8521a4a22b05ff919d8b552b7",
    zeta: "c632b5c8521a4a22b05ff919d8b552b7",
    prabowo: "b8d594e696694b499aa12e32d0c1b61",
    investigator: "c632b5c8521a4a22b05ff919d8b552b7"
  };
  const LABELS = { "vestia-zeta": "Zeta", ibuki: "Ibuki", alya: "Alya", verity: "Verity", "koro-sensei": "Koro Sensei", prabowo: "Prabowo" };

  function addStyle() {
    if (document.getElementById("rd-voice-v19-style")) return;
    const s = document.createElement("style");
    s.id = "rd-voice-v19-style";
    s.textContent = `
      #rd-karaoke{position:fixed;left:50%;bottom:clamp(92px,15vh,150px);transform:translateX(-50%);z-index:2147483001;max-width:min(92vw,760px);padding:10px 16px;border:1px solid rgba(139,124,255,.42);border-radius:14px;background:rgba(9,9,15,.88);box-shadow:0 12px 40px rgba(0,0,0,.45);font:600 clamp(16px,2.5vw,25px)/1.45 system-ui;text-align:center;pointer-events:none;backdrop-filter:blur(12px)}
      #rd-karaoke .rd-k-word{display:inline-block;opacity:0;transform:translateY(5px);margin:0 .16em;color:#a9a5b8;transition:opacity .16s ease,transform .16s ease,color .16s ease,text-shadow .16s ease}
      #rd-karaoke .rd-k-word.active{opacity:1;transform:none;color:#fff;text-shadow:0 0 16px rgba(139,124,255,.9)}
      #rd-karaoke .rd-k-word.done{opacity:.44;transform:none}
      @media(max-width:600px){#rd-karaoke{bottom:118px;padding:8px 10px;font-size:17px;max-width:94vw}}
    `;
    document.head.appendChild(s);
  }

  function addAlya() {
    const bars = [document.getElementById("voiceCharBar"), document.querySelector(".voice-picker")];
    bars.forEach(bar => {
      if (!bar || bar.querySelector('[data-v="alya"]') || bar.querySelector('[data-voice="alya"]')) return;
      const b = document.createElement(bar.id === "voiceCharBar" ? "button" : "div");
      if (bar.id === "voiceCharBar") { b.type = "button"; b.dataset.v = "alya"; b.textContent = "Alya"; }
      else { b.dataset.voice = "alya"; b.dataset.color = "#e879f9"; b.textContent = "Alya"; b.className = "voice-chip"; }
      b.addEventListener("click", () => selectVoice("alya", b));
      bar.appendChild(b);
    });
  }
  function selectVoice(id, el) {
    if (!window.state) return;
    state.selectedVoice = id;
    const ref = REFS[id] || REFS["vestia-zeta"];
    localStorage.setItem("rd_fish_reference", ref);
    localStorage.setItem("rd_voice_character", id);
    document.querySelectorAll("#voiceCharBar [data-v], .voice-picker [data-voice]").forEach(x => x.classList.remove("active"));
    el.classList.add("active");
    const color = id === "alya" ? "#e879f9" : id === "ibuki" ? "#7c3aed" : id === "verity" ? "#2563eb" : "#1a7f64";
    const orb = document.getElementById("voiceOrb");
    if (orb) { orb.style.background = `radial-gradient(circle at 40% 35%, ${color}aa, ${color} 55%, ${color}88)`; orb.style.boxShadow = `0 0 50px ${color}66`; }
  }

  function weightedWords(text) {
    return String(text || "").replace(/\s+/g, " ").trim().split(" ").filter(Boolean).map((word, i, all) => ({ word, weight: Math.max(1, word.replace(/[^\p{L}\p{N}]/gu, "").length) + (/[.!?]$/.test(word) ? 3 : /[,;:]$/.test(word) ? 1.4 : 0) }));
  }
  function showKaraoke(text, audio) {
    addStyle();
    const words = weightedWords(text);
    const old = document.getElementById("rd-karaoke"); old?.remove();
    if (!words.length) return () => {};
    const box = document.createElement("div"); box.id = "rd-karaoke"; box.setAttribute("aria-live", "polite");
    words.forEach(x => { const span = document.createElement("span"); span.className = "rd-k-word"; span.textContent = x.word; box.appendChild(span); });
    document.body.appendChild(box);
    const spans = [...box.children], total = words.reduce((n, x) => n + x.weight, 0);
    const update = () => {
      if (!Number.isFinite(audio.duration) || !audio.duration) return;
      const t = audio.currentTime / audio.duration * total;
      let acc = 0, active = -1;
      words.forEach((x, i) => { if (t >= acc) active = i; acc += x.weight; });
      spans.forEach((x, i) => x.className = "rd-k-word" + (i < active ? " done" : i === active ? " active" : ""));
    };
    audio.addEventListener("timeupdate", update); audio.addEventListener("play", update);
    const clean = () => { audio.removeEventListener("timeupdate", update); audio.removeEventListener("play", update); box.remove(); };
    audio.addEventListener("ended", clean, { once: true }); audio.addEventListener("error", clean, { once: true });
    return clean;
  }

  window.speakFish = async function (text) {
    const key = String((state.keys && state.keys.fish) || "").trim();
    if (!key || !text) return false;
    const id = state.selectedVoice || localStorage.getItem("rd_voice_character") || "vestia-zeta";
    const reference = REFS[id] || REFS["vestia-zeta"];
    localStorage.setItem("rd_fish_reference", reference);
    try {
      if (typeof setActivity === "function") setActivity("Fish TTS…", "busy");
      const res = await fetch("/api/fish-tts", { method: "POST", headers: { Authorization: "Bearer " + key, "Content-Type": "application/json" }, body: JSON.stringify({ text: String(text).replace(/\*\*/g, "").slice(0, 1200), reference_id: reference, model: "s2.1-pro-free" }) });
      if (!res.ok) { console.warn("Fish TTS", res.status, await res.text().catch(() => "")); return false; }
      const audio = new Audio(URL.createObjectURL(await res.blob()));
      const clean = showKaraoke(text, audio);
      await new Promise((resolve, reject) => { audio.onended = () => { clean(); resolve(); }; audio.onerror = () => { clean(); reject(new Error("audio play")); }; audio.play().catch(reject); });
      if (typeof setActivity === "function") setActivity("Siap", "");
      return true;
    } catch (e) { console.warn("speakFish", e); if (typeof setActivity === "function") setActivity("Siap", ""); return false; }
  };

  function init() {
    addStyle(); addAlya();
    document.querySelectorAll("#voiceCharBar [data-v], .voice-picker [data-voice]").forEach(el => {
      const id = el.dataset.v || el.dataset.voice;
      el.addEventListener("click", () => selectVoice(id, el));
    });
    const saved = localStorage.getItem("rd_voice_character");
    if (saved && REFS[saved] && window.state) state.selectedVoice = saved;
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else setTimeout(init, 0);
})();
