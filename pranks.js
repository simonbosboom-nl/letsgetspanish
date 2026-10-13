(() => {
  "use strict";
  const scriptUrl = document.currentScript && document.currentScript.src;
  if (!scriptUrl) return;
  const baseConfigUrl = new URL("prank-settings.json", scriptUrl);
  const allowedModes = new Set(["off", "banner", "confetti", "surprise"]);
  const allowedTargets = new Set(["both", "spanish", "french"]);
  let lastSettingKey = null;
  let currentBanner = null;
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
      "@media (prefers-reduced-motion: reduce) { .site-prank-piece { display:none !important; animation:none !important; } }"
    ].join("\n");
    document.head.appendChild(style);
  };

  const removeEffects = () => {
    if (currentBanner) currentBanner.remove();
    currentBanner = null;
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

  const applySetting = config => {
    const page = location.pathname.includes("/frans-oefenen/") ? "french" : "spanish";
    let mode = config.mode;
    let target = config.target;
    if (!allowedModes.has(mode)) mode = "off";
    if (!allowedTargets.has(target)) target = "both";
    if (target !== "both" && target !== page) mode = "off";
    const message = typeof config.message === "string" ? config.message.slice(0, 180) : "";
    const key = JSON.stringify({ mode, target, message });
    if (key === lastSettingKey) return;
    lastSettingKey = key;
    removeEffects();
    if (mode === "off") return;
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

  // Refresh active sessions too, so a change by the owner reaches learners already practising.
  refreshSetting();
  window.setInterval(refreshSetting, 20000);
})();
