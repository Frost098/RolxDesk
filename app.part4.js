async function testKey() {
  try {
    setLiveStatus("Test key…");
    const reply = await callModel([{ role: "user", content: "Reply with exactly: OK" }]);
    showToast("Key OK: " + String(reply).slice(0, 80), "success");
    setLiveStatus("");
  } catch (e) {
    showToast(e.message || String(e), "error");
    setLiveStatus("");
  }
}

// NOTE: Full part4 may be larger - this ensures file exists; full content pushed next
console.log("RolxDesk part4 loaded");
