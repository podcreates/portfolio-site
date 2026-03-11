/**
 * podcreates - Shared Lightbox & FLIP Engine
 * Iteration 17: Shift-Free Scroll Lock (scrollbar-gutter + padding-sync)
 */

function updateSbw() {
  const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
  document.documentElement.style.setProperty("--sbw", scrollbarWidth + "px");
}
window.addEventListener("resize", updateSbw, { passive: true });
updateSbw(); // initial run

// State exported to window for cross-script access (e.g., gallery persistence)
window.lbBusy = false;
window.lastThumbEl = null;  // button.thumb-card
window.lastThumbImg = null; // img inside thumb
window.lastSrc = null;

const OPEN_MS = 620;
const OPEN_EASE = "cubic-bezier(0.19, 1, 0.22, 1)"; // ✅ Luxury Out-Expo
const CLOSE_MS = 560; // Slightly longer for softer landing
const CLOSE_EASE = "cubic-bezier(0.16, 1, 0.3, 1)"; // Softer landing curve

const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightboxImg");
const lightboxClose = document.getElementById("lightboxClose");
const lightboxFrame = document.getElementById("lightboxFrame");

function getRadiusPx(el) {
  return (
    getComputedStyle(document.documentElement).getPropertyValue(
      "--thumb-radius",
    ) || "24px"
  );
}

function getRadiusNum() {
  return parseInt(getRadiusPx()) || 24;
}

function preload(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = src;
  });
}

function preventScroll(e) {
  e.preventDefault();
}

const scrollKeys = { 32: 1, 33: 1, 34: 1, 35: 1, 36: 1, 37: 1, 38: 1, 39: 1, 40: 1 };

function preventScrollKeys(e) {
  if (scrollKeys[e.keyCode]) {
    e.preventDefault();
  }
}

const wheelOpt = { passive: false };

function lockBodyScroll() {
  window.addEventListener('wheel', preventScroll, wheelOpt);
  window.addEventListener('touchmove', preventScroll, wheelOpt);
  window.addEventListener('keydown', preventScrollKeys, wheelOpt);
}

function unlockBodyScroll() {
  window.removeEventListener('wheel', preventScroll, wheelOpt);
  window.removeEventListener('touchmove', preventScroll, wheelOpt);
  window.removeEventListener('keydown', preventScrollKeys, wheelOpt);
}

async function showLightboxImageInstant(src, callback) {
  if (!lightboxImg) return;
  
  lightboxImg.style.transition = "none";
  lightboxImg.style.opacity = "0";
  lightboxImg.src = src;
  
  try {
    if (lightboxImg.decode) await lightboxImg.decode();
  } catch (e) {
    console.warn("Image decode failed", e);
  }

  lightboxImg.classList.remove("is-loading");
  lightboxImg.getBoundingClientRect();
  
  requestAnimationFrame(() => {
    lightboxImg.style.transition = "opacity 180ms ease-out";
    lightboxImg.style.opacity = "1";
    lightboxImg.style.transform = "translateZ(0)";
    
    setTimeout(() => {
        if (callback) callback();
    }, 190);
  });
}

async function openLightbox(src, fromEl) {
  if (window.lbBusy) return;
  window.lbBusy = true;

  window.lastSrc = src;
  window.lastThumbEl = fromEl || null;
  window.lastThumbImg = fromEl?.querySelector("img") || null;

  fromEl?.classList.add("is-opening");

  if (!lightbox || !lightboxImg) {
    fromEl?.classList.remove("is-opening");
    window.lbBusy = false;
    return;
  }

  lightbox.classList.remove("hidden");
  lightbox.classList.remove("closing");
  lightbox.classList.add("show");
  lockBodyScroll();

  lightboxImg.classList.add("is-loading");
  lightboxImg.src = "";

  if (!window.lastThumbImg || !lightboxFrame) {
    await preload(src);
    showLightboxImageInstant(src);
    fromEl?.classList.remove("is-opening");
    window.lbBusy = false;
    return;
  }

  const preloadPromise = preload(src);
  const start = window.lastThumbEl.getBoundingClientRect();
  const end = lightboxFrame.getBoundingClientRect();

  const clone = document.createElement("div");
  clone.id = "lbClone";
  clone.style.borderRadius = getRadiusPx(window.lastThumbEl);
  clone.style.overflow = "hidden";
  clone.style.background = "rgba(9,9,11,.85)";
  clone.style.border = "1px solid rgba(255,255,255,.10)";
  clone.style.boxSizing = "border-box";
  clone.style.position = "fixed";
  clone.style.zIndex = "10000";
  clone.style.left = end.left + "px";
  clone.style.top = end.top + "px";
  clone.style.width = end.width + "px";
  clone.style.height = end.height + "px";
  clone.style.transformOrigin = "top left";
  clone.style.willChange = "transform, opacity, border-radius";

  const img = document.createElement("img");
  img.src = window.lastThumbImg.currentSrc || window.lastThumbImg.src;
  img.style.width = "100%";
  img.style.height = "100%";
  img.style.objectFit = "contain";
  img.style.background = "#09090b";
  clone.appendChild(img);

  const dx = start.left - end.left;
  const dy = start.top - end.top;
  const sx = start.width / end.width;
  const sy = sx;

  const baseR = getRadiusNum();
  clone.style.transform = `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`;
  clone.style.borderRadius = baseR / sx + "px";
  clone.style.opacity = "1";

  document.body.appendChild(clone);

  clone.getBoundingClientRect();
  requestAnimationFrame(() => {
    clone.style.transition = `transform ${OPEN_MS}ms ${OPEN_EASE}, opacity ${OPEN_MS}ms ease, border-radius ${OPEN_MS}ms ${OPEN_EASE}`;
    clone.style.transform = "translate(0px, 0px) scale(1, 1)";
    clone.style.borderRadius = baseR + "px";
  });

  let done = false;
  const finish = async () => {
    if (done) return;
    done = true;

    await preloadPromise;
    showLightboxImageInstant(src, () => {
        clone.remove();
    });

    window.lbBusy = false;
  };

  clone.addEventListener("transitionend", (e) => {
    if (e.propertyName !== "transform") return;
    finish();
  });

  setTimeout(finish, OPEN_MS + 60);
}

function closeLightbox() {
  if (window.lbBusy || !lightbox.classList.contains("show")) return;
  window.lbBusy = true;

  const start = lightboxFrame.getBoundingClientRect();
  const end = window.lastThumbEl?.getBoundingClientRect();

  if (!end) {
    lightbox.classList.add("hidden");
    lightbox.classList.remove("show");
    unlockBodyScroll();
    window.lbBusy = false;
    return;
  }

  lightbox.classList.add("closing");
  lightbox.classList.remove("show");

  const clone = document.createElement("div");
  clone.id = "lbClone";
  clone.style.borderRadius = getRadiusPx(window.lastThumbEl);
  clone.style.overflow = "hidden";
  clone.style.background = "rgba(9,9,11,.85)";
  clone.style.border = "1px solid rgba(255,255,255,.10)";
  clone.style.boxSizing = "border-box";
  clone.style.position = "fixed";
  clone.style.zIndex = "10000";
  clone.style.left = start.left + "px";
  clone.style.top = start.top + "px";
  clone.style.width = start.width + "px";
  clone.style.height = start.height + "px";
  clone.style.transformOrigin = "top left";
  clone.style.willChange = "transform, opacity, border-radius";
  clone.style.transform = "translate(0px,0px) scale(1,1)";
  clone.style.opacity = "1";

  const img = document.createElement("img");
  img.src =
    lightboxImg.currentSrc || lightboxImg.src || window.lastSrc || window.lastThumbImg?.src;
  img.style.width = "100%";
  img.style.height = "100%";
  img.style.objectFit = "contain";
  img.style.background = "#09090b";
  clone.appendChild(img);

  document.body.appendChild(clone);

  lightboxImg.classList.add("is-loading");

  const dx = end.left - start.left;
  const dy = end.top - start.top;
  const sx = +(end.width / start.width).toFixed(4);
  const sy = sx;

  const baseR = getRadiusNum();

  requestAnimationFrame(() => {
    clone.style.transition = `transform ${CLOSE_MS}ms ${CLOSE_EASE}, opacity ${CLOSE_MS}ms ease, border-radius ${CLOSE_MS}ms ${CLOSE_EASE}`;

    requestAnimationFrame(() => {
      clone.style.transform = `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`;
      clone.style.borderRadius = baseR / sx + "px";
      clone.style.opacity = "1";
    });
  });

  let done = false;
  const finish = () => {
    if (done) return;
    done = true;

    requestAnimationFrame(() => {
      clone.remove();
      if (window.lastThumbEl) {
        window.lastThumbEl.classList.remove("is-opening");
      }
      // ✅ CLEAR STATE: prevent "ghost" hidden thumbnails during next filter/render
      window.lastSrc = null;
      window.lastThumbEl = null;
      window.lastThumbImg = null;
    });

    unlockBodyScroll();
    window.lbBusy = false;
  };

  clone.addEventListener("transitionend", (e) => {
    if (e.propertyName !== "transform") return;
    finish();
  });

  setTimeout(finish, CLOSE_MS + 60);
}

if (lightboxClose) lightboxClose.addEventListener("click", closeLightbox);
if (lightbox) {
  lightbox.addEventListener("click", (e) => {
    const inner = document.getElementById("lightboxInner");
    if (e.target === lightbox || e.target === inner) closeLightbox();
  });
}
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeLightbox();
});
