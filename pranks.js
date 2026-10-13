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
  const BONUS_KEY = "letsgetspanish_bonus_unlocked_v1";

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
      ".site-prank-reward { position:relative; z-index:10002; margin:14px auto; padding:22px; width:min(680px,calc(100% - 36px)); box-sizing:border-box; border:2px solid #65a30d; border-radius:18px; background:linear-gradient(135deg,#f0fdf4,#ecfeff); color:#16321d; box-shadow:0 16px 40px rgba(20,83,45,.18); font:500 15px/1.5 system-ui,sans-serif; text-align:center; }",
      ".site-prank-reward h2 { margin:0 0 8px; color:#166534; font-size:clamp(22px,4vw,30px); }",
      ".site-prank-reward p { margin:8px 0 14px; }",
      ".site-prank-reward-links { display:flex; flex-wrap:wrap; justify-content:center; gap:10px; margin-top:14px; }",
      ".site-prank-reward-link { display:inline-flex; align-items:center; justify-content:center; gap:8px; padding:11px 16px; border-radius:10px; background:#166534; color:white !important; text-decoration:none !important; font-weight:800; }",
      ".site-prank-reward-link.secondary { background:#3730a3; }",
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

  const addReward = message => {
    const reward = document.createElement("section");
    reward.className = "site-prank-reward";
    reward.setAttribute("role", "status");
    const title = document.createElement("h2");
    title.textContent = "🎉 Bonus vrijgespeeld!";
    const description = document.createElement("p");
    description.textContent = message || "Je hebt de bonus gevonden! Je kunt de Spaanse en Franse oefenspellen zo vaak gebruiken als je wilt.";
    const details = document.createElement("p");
    details.textContent = "Kies een taal en begin meteen met oefenen.";
    const links = document.createElement("div");
    links.className = "site-prank-reward-links";
    const spanish = document.createElement("a");
    spanish.className = "site-prank-reward-link";
    spanish.href = "https://simonbosboom-nl.github.io/letsgetspanish/";
    spanish.textContent = "🇪🇸 Start Spaans";
    const french = document.createElement("a");
    french.className = "site-prank-reward-link secondary";
    french.href = "https://simonbosboom-nl.github.io/letsgetspanish/frans-oefenen/";
    french.textContent = "🇫🇷 Start Frans";
    links.append(spanish, french);
    const foot = document.createElement("p");
    foot.style.fontSize = "12px";
    foot.style.opacity = ".8";
    foot.textContent = "De bonus blijft op deze browser onthouden. De oefenwebsites zijn openbaar; de code is een leuke verrassing, geen echte toegangsbeveiliging.";
    const close = document.createElement("button");
    close.className = "site-prank-close";
    close.type = "button";
    close.setAttribute("aria-label", "Bonus sluiten");
    close.textContent = "×";
    close.addEventListener("click", () => {
      reward.remove();
      if (currentBanner === reward) currentBanner = null;
    });
    reward.append(title, description, details, links, foot, close);
    document.body.prepend(reward);
    currentBanner = reward;
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
          try { localStorage.setItem(BONUS_KEY, "yes"); } catch (_) {}
          addStyles();
          addReward(message);
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
    const hasPrankLink = new URLSearchParams(location.search).get("prank") === "code";
    let bonusUnlocked = false;
    try { bonusUnlocked = localStorage.getItem(BONUS_KEY) === "yes"; } catch (_) {}
    const key = JSON.stringify({ mode, target, message, codeHash, hasPrankLink, bonusUnlocked });
    if (key === lastSettingKey) return;
    lastSettingKey = key;
    removeEffects();
    if (hasPrankLink && bonusUnlocked) {
      addStyles();
      addReward(message);
      return;
    }
    if (mode === "off") return;
    if (mode === "secret-code") {
      if (hasPrankLink) {
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
