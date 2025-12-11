/* ---------------------------------------------------
      This function determines if the website you are on is a shopping website or has the potential to be.
   It looks  for kep shopping terms on the website you are on and its aria labels.
--------------------------------------------------- */
function isShoppingSite() {
  const bodyText = document.body.innerText.toLowerCase();

  const shoppingKeywords = [
    "add to cart", "add to bag", "add to basket",
    "buy now", "checkout", "free shipping", "in stock"
  ];
  const keywordHit = shoppingKeywords.some(k => bodyText.includes(k));

  const buttons = [...document.querySelectorAll("button, a, input")];
  const classHit = buttons.some(b => /(add|cart|bag|basket|buy|checkout)/i.test(b.className));

  const urlHit = /(product|item|cart|checkout|shop)/.test(location.pathname.toLowerCase());

/*  This part of the function was obtained with help of AI, it detects if JSON-LD represents a Product, essentually checks if the page has a product to sell */
  const hasProductSchema = [...document.querySelectorAll('script[type="application/ld+json"]')]
    .some(tag => {
      try {
        const data = JSON.parse(tag.textContent);
        return data["@type"] === "Product" ||
               (Array.isArray(data) && data.some(d => d["@type"] === "Product"));
      } catch { return false; }
    });

  return keywordHit || classHit || urlHit || hasProductSchema;
}



/* ---------------------------------------------------
    Load in the phases of Cloud Guy and the speech bubbles
--------------------------------------------------- */
const baseImages = [
  "e0.png",
  "e1.png", "e2.png", "e3.png", "e4.png", "e5.png",
  "e6.png", "e7.png", "e8.png", "e9.png", "e10.png",
  "e11.png", "e12.png", "e13.png", "e14.png", "e15.png",
  "e16.png", "e17.png", "e18.png", "e19.png", "e20.png"
];

const tbImages = [
  "ems1_b.png", "ems2_b.png", "ems3_b.png", "ems4_b.png",
  "ems5_b.png", "ems6_b.png", "ems7_b.png", "ems8_b.png",
  "ems9_b.png", "ems10_b.png", "ems11_b.png", "ems12_b.png",
  "ems13_b.png", "ems14_b.png", "ems15_b.png", "ems16_b.png",
  "ems17_b.png", "ems18_b.png", "ems19_b.png", "ems20_b.png"
];

let currentImageIndex = 0;
let activeImage = null;
let activeBubble = null;


/* ---------------------------------------------------
   Weather & Image Setup
--------------------------------------------------- */
const weatherMode = Array(21).fill("blank"); // default to blank
for (let i = 1; i <= 6; i++) weatherMode[i] = "waterdrop"; // waterdrop 1-6
for (let i = 9; i <= 20; i++) weatherMode[i] = "lightning"; // lightning 9-20

const weatherImages = {
  waterdrop: [
    { start: 1, end: 3, file: "waterdrops.png" },
    { start: 4, end: 6, file: "waterdrops2.png" },
    { start: 7, end: 7, file: "waterdrops3.png" }
  ],
  lightning: [
    { start: 10, end: 15, file: "lightning_banner.png" },
    { start: 16, end: 20, file: "lightning_banner_2.png" }
  ]
};



function getWeatherImage(index, type) {
  const entry = weatherImages[type]?.find(e => index >= e.start && index <= e.end);
  return entry ? entry.file : type === "waterdrop" ? "waterdrops.png" : "lightning_banner.png";
}

/* ---------------------------------------------------
   Cloud Guy (EMS) & Bubble
--------------------------------------------------- */
function showEMS(filename) {
  if (!activeImage) {
    activeImage = document.createElement("img");
    Object.assign(activeImage.style, {
      position: "fixed", right: "20px", top: "20px",
      width: "100px", pointerEvents: "none",
      opacity: "0", transition: "opacity .5s",
      zIndex: "9999"
    });
    document.body.appendChild(activeImage);
  }
  activeImage.src = chrome.runtime.getURL(filename);
  requestAnimationFrame(() => activeImage.style.opacity = "1");
}

function showBubble(index) {
  if (index < 1) return;
  const file = tbImages[index - 1];
  if (!file) return;

  activeBubble?.remove();

  const bubble = document.createElement("img");
  bubble.src = chrome.runtime.getURL(file);
  Object.assign(bubble.style, {
    position: "fixed", right: "130px", top: "60px",
    width: "200px", opacity: "0", transition: "opacity .4s",
    pointerEvents: "none", zIndex: "10000"
  });

  document.body.appendChild(bubble);
  requestAnimationFrame(() => bubble.style.opacity = "1");
  activeBubble = bubble;

  setTimeout(() => { 
    bubble.style.opacity = "0"; 
    setTimeout(() => bubble.remove(), 500); 
  }, 4000);
}



/* ---------------------------------------------------
   Weather display
--------------------------------------------------- */
let activeWeather = null;

function createWeatherDiv(backgroundFile, width, top, left, animation) {
  const div = document.createElement("div");
  Object.assign(div.style, {
    position: "fixed",
    top: top + "px",
    left: left + "px",
    width: width + "px",
    height: "100vh",
    backgroundImage: `url(${chrome.runtime.getURL(backgroundFile)})`,
    backgroundRepeat: "repeat",
    backgroundSize: width + "px auto",
    animation: animation,
    pointerEvents: "none",
    opacity: "0",
    transition: "opacity .4s",
    zIndex: "9998"
  });
  return div;
}

function createLightningFlash(clickX, clickY) {
  const flash = document.createElement("div");

  ["--flash1","--flash2","--flash3","--flash4"].forEach(f => 
    flash.style.setProperty(f, Math.random())
  );

  Object.assign(flash.style, {
    position: "fixed",
    top: clickY + "px",
    left: clickX + "px",
    width: "80px",
    height: "120px",
    backgroundImage: `url(${chrome.runtime.getURL("lightning.png")})`,
    backgroundRepeat: "no-repeat",
    backgroundSize: "contain",
    animation: "lightningFlash 1s ease-in-out infinite",
    pointerEvents: "none",
    opacity: "0",
    transition: "opacity .2s",
    zIndex: "10001"
  });

  document.body.appendChild(flash);
  requestAnimationFrame(() => flash.style.opacity = "1");

  setTimeout(() => {
    flash.style.opacity = "0";
    setTimeout(() => flash.remove(), 400);
  }, 1200);
}

function showWeather(mode, clickY = null, clickX = null) {
  // Remove old weather
  if (activeWeather) activeWeather.remove();
  if (mode === "blank") return;

  const cloudWidth = activeImage?.offsetWidth || 120;
  const cloudLeft = window.innerWidth - 20 - cloudWidth;
  const verticalOffset = 80;

  // Lightning flash effect
  if (mode === "lightning" && clickX !== null && clickY !== null) {
    createLightningFlash(clickX, clickY);
  }

  // Cloud overlay for both waterdrop and lightning
  const weatherFile = getWeatherImage(currentImageIndex, mode);
  const div = createWeatherDiv(weatherFile, cloudWidth, verticalOffset, cloudLeft, "rainScroll 5s linear infinite");

  document.body.appendChild(div);
  requestAnimationFrame(() => div.style.opacity = "1");

  activeWeather = div;

  setTimeout(() => {
    div.style.opacity = "0";
    setTimeout(() => div.remove(), 400);
  }, 5000);
}


/* ---------------------------------------------------
   Load starting cloud (always e0) -- this waits for the page to run fully or tries again
--------------------------------------------------- */
function initCloud() {
  if (!isShoppingSite()) return;

  const saved = Number(localStorage.getItem("currentImageIndex"));
  currentImageIndex = isNaN(saved) ? 0 : saved;

  // Retry insertion to handle SPAs / delayed DOM
  const tryShow = () => {
    if (!document.body) {
      setTimeout(tryShow, 200); // try again shortly
      return;
    }
    showEMS(baseImages[currentImageIndex]);
  };

  tryShow();
}

// Run once DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initCloud);
} else {
  initCloud();
}




/* ---------------------------------------------------
   Click listener
--------------------------------------------------- */
document.addEventListener("click", (e) => {
  if (!isShoppingSite()) return;

  const button = e.target.closest("button, a");
  if (!button) return;

  const text = (button.textContent || "").toLowerCase();
  const aria = (button.getAttribute("aria-label") || "").toLowerCase();
  const cls  = (button.className || "").toLowerCase();

  const addWords = ["add to cart", "add to bag", "buy now", "purchase", "shop now", "order now", "add", "+"];
  const delWords = ["remove", "minus","decrease","less","delete"];

  const isAdd = addWords.some(w => text.includes(w) || aria.includes(w) || cls.includes(w));
  const isDel = delWords.some(w => text.includes(w) || aria.includes(w) || cls.includes(w));

  if (isAdd) {
    currentImageIndex = Math.min(currentImageIndex + 1, baseImages.length - 1);
    showEMS(baseImages[currentImageIndex]);
    showBubble(currentImageIndex);

    const mode = weatherMode[currentImageIndex];

    if (mode === "lightning") {
      showWeather(mode, e.clientY, e.clientX);
    } else {
      showWeather(mode);
    }

    localStorage.setItem("currentImageIndex", currentImageIndex);
  }

  if (isDel) {
    currentImageIndex = Math.max(currentImageIndex - 1, 0);
    showEMS(baseImages[currentImageIndex]);
    showWeather("blank");
    localStorage.setItem("currentImageIndex", currentImageIndex);
  }
});
