(() => {
  "use strict";
  const scriptUrl = document.currentScript && document.currentScript.src;
  if (!scriptUrl) return;
  const baseConfigUrl = new URL("prank-settings.json", scriptUrl);
  const allowedModes = new Set(["off", "banner", "confetti", "surprise", "secret-code"]);
  const allowedTargets = new Set(["both", "spanish", "french"]);
  let lastSettingKey = null;
  let currentBanner = null;
  let currentGate = null;
  const activePieces = new Set();

  const addStyles = () => {
    if (document.getElementById("site-prank-styles")) return;
    const style = document.createElement("style");
    style.id = "site-prank-styles";
    style.textContent = [
      ".site-prank-banner { display:flex; align-items:center; justify-content:center; gap:12px; position:relative; z-index:10000; padding:12px 48px 12px 16px; background:#fff1c8; color:#34250a; border-bottom:2px solid #e3a62f; font:700 15px/1.4 system-ui,sans-serif; text-align:center; }",
      ".site-prank-close { position:absolute; right:12px; top:50%; transform:translateY(-50%); border:0; border-radius:8px; padding:5px 9px; background:#f0d88f; color:#34250a; font:700 18px/1 system-ui,sans-serif; cursor:pointer; }",
      ".site-prank-piece { position:fixed; top:-30px; z-index:10001; pointer-events:none; font-size:clamp(18px,3vw,30px); animation:site-prank-fall 2.8s ease-in forwards; }",
      "@keyframes site-prank-fall { to { transform:translate3d(var(--drift),110vh,0) rotate(620deg); opacity:.15; } }",
      ".site-prank-gate { position:relative; z-index:10002; display:flex; flex-wrap:wrap; align-items:center; justify-content:center; gap:10px; padding:14px 48px 14px 14px; background:#eef2ff; color:#172033; border-bottom:1px solid #c7d2fe; font:600 14px/1.4 system-ui,sans-serif; }",
      ".site-prank-gate label { display:flex; flex-wrap:wrap; align-items:center; gap:8px; }",
      ".site-prank-gate input { width:min(220px,55vw); box-sizing:border-box; padding:9px 10px; border:1px solid #9ca3af; border-radius:8px; background:white; color:#111827; font:500 14px system-ui,sans-serif; }",
      ".site-prank-gate button { border:0; border-radius:8px; padding:9px 13px; background:#3730a3; color:white; font:700 14px system-ui,sans-serif; cursor:pointer; }",
      ".site-prank-gate .site-prank-error { flex-basis:100%; text-align:center; color:#b91c1c; font-weight:600; }",
      "@media (prefers-reduced-motion: reduce) { .site-prank-piece { display:none !important; animation:none !important; } }"
    ].join("\n");
    document.head.appendChild(style);
  };

  const removeEffects = () => {
    if (currentBanner) currentBanner.remove();
    currentBanner = null;
    if (currentGate) currentGate.remove();
    currentGate = null;
    for (const piece of activePieces) piece.remove();
    activePieces.clear();
  };

  const addBanner = message => {
    const banner = document.createElement("aside");
    banner.className = "site-prank-banner";
    banner.setAttribute("role", "status");
    const text = document.createElement("span");
    text.textContent = message || "👀 Verrassing! De taalgeest wenst je veel succes.";
    const close = document.createElement("button");
    close.className = "site-prank-close";
    close.type = "button";
    close.setAttribute("aria-label", "Melding sluiten");
    close.textContent = "×";
    close.addEventListener("click", () => {
      banner.remove();
      if (currentBanner === banner) currentBanner = null;
    });
    banner.append(text, close);
    document.body.prepend(banner);
    currentBanner = banner;
  };

  const addConfetti = () => {
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const pieces = ["🎉", "✨", "🎊", "📚", "⭐", "🦜"];
    for (let i = 0; i < 28; i++) {
      const piece = document.createElement("span");
      piece.className = "site-prank-piece";
      piece.setAttribute("aria-hidden", "true");
      piece.textContent = pieces[Math.floor(Math.random() * pieces.length)];
      piece.style.left = (Math.random() * 100) + "vw";
      piece.style.setProperty("--drift", (Math.random() * 160 - 80) + "px");
      piece.style.animationDelay = (Math.random() * 700) + "ms";
      document.body.appendChild(piece);
      activePieces.add(piece);
      window.setTimeout(() => {
        piece.remove();
        activePieces.delete(piece);
      }, 4000);
    }
  };

  const hashCode = async value => {
    if (!window.crypto || !window.crypto.subtle || !window.TextEncoder) {
      throw new Error("Deze browser ondersteunt geen veilige codecontrole.");
    }
    const bytes = new TextEncoder().encode(value.normalize("NFKC").trim().toLowerCase());
    const digest = await window.crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest)).map(byte => byte.toString(16).padStart(2, "0")).join("");
  };

  const addCodeGate = (expectedHash, message) => {
    const gate = document.createElement("aside");
    gate.className = "site-prank-gate";
    gate.setAttribute("aria-label", "Geheime verrassing");
    const label = document.createElement("label");
    const labelText = document.createElement("span");
    labelText.textContent = "🔐 Voer je geheime code in voor een verrassing:";
    const input = document.createElement("input");
    input.type = "password";
    input.autocomplete = "off";
    input.autocapitalize = "off";
    input.spellcheck = false;
    input.placeholder = "Geheime code";
    input.setAttribute("aria-label", "Geheime code");
    const submit = document.createElement("button");
    submit.type = "submit";
    submit.textContent = "Proberen";
    label.append(labelText, input);
    const form = document.createElement("form");
    form.style.display = "flex";
    form.style.flexWrap = "wrap";
    form.style.justifyContent = "center";
    form.style.gap = "8px";
    form.append(label, submit);
    const error = document.createElement("span");
    error.className = "site-prank-error";
    error.setAttribute("role", "status");
    form.addEventListener("submit", async event => {
      event.preventDefault();
      submit.disabled = true;
      error.textContent = "";
      try {
        const submittedHash = await hashCode(input.value);
        if (expectedHash && submittedHash === expectedHash) {
          gate.remove();
          if (currentGate === gate) currentGate = null;
          addStyles();
          addBanner(message || "🎉 Code goed! Je hebt de geheime verrassing gevonden 😎");
          addConfetti();
        } else {
          error.textContent = "Niet helemaal 😈 Probeer nog eens.";
          input.select();
        }
      } catch (_) {
        error.textContent = "Codecontrole wordt niet ondersteund in deze browser.";
      } finally {
        submit.disabled = false;
      }
    });
    const close = document.createElement("button");
    close.className = "site-prank-close";
    close.type = "button";
    close.setAttribute("aria-label", "Codevenster sluiten");
    close.textContent = "×";
    close.addEventListener("click", () => {
      gate.remove();
      if (currentGate === gate) currentGate = null;
    });
    gate.append(form, error, close);
    document.body.prepend(gate);
    currentGate = gate;
  };

  const applySetting = config => {
    const page = location.pathname.includes("/frans-oefenen/") ? "french" : "spanish";
    let mode = config.mode;
    let target = config.target;
    if (!allowedModes.has(mode)) mode = "off";
    if (!allowedTargets.has(target)) target = "both";
    if (target !== "both" && target !== page) mode = "off";
    const message = typeof config.message === "string" ? config.message.slice(0, 180) : "";
    const codeHash = typeof config.codeHash === "string" ? config.codeHash : "";
    const key = JSON.stringify({ mode, target, message, codeHash });
    if (key === lastSettingKey) return;
    lastSettingKey = key;
    removeEffects();
    if (mode === "off") return;
    if (mode === "secret-code") {
      if (new URLSearchParams(location.search).get("prank") === "code") {
        addStyles();
        addCodeGate(codeHash, message);
      }
      return;
    }
    addStyles();
    if (mode === "banner" || mode === "surprise") addBanner(message);
    if (mode === "confetti" || mode === "surprise") addConfetti();
  };

  const refreshSetting = async () => {
    try {
      const url = new URL(baseConfigUrl.href);
      url.searchParams.set("t", String(Date.now()));
      const response = await fetch(url.href, {
        cache: "no-store",
        credentials: "same-origin"
      });
      if (!response.ok) return;
      const config = await response.json();
      if (config && typeof config === "object") applySetting(config);
    } catch (_) {
      // Failed settings requests must never prevent the language exercises from working.
    }
  };

  // Check every 20 seconds so the owner can change pranks while learners are already practising.
  refreshSetting();
  window.setInterval(refreshSetting, 20000);
})();
