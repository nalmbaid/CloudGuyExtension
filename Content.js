/* ---------------------------------------------------
   Detect shopping sites
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
   Cloud images + speech bubbles
--------------------------------------------------- */
const baseImages = [
  "e0.png",  /* ###changed here — added explicit e0 start */
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
  /* ems21 unused */
];

let currentImageIndex = 0;
let activeImage = null;
let activeBubble = null;



/* ---------------------------------------------------
   Weather modes
--------------------------------------------------- */
const weatherMode = {
  0: "blank",
  1: "waterdrop",
  2: "waterdrop",
  3: "waterdrop",
  4: "waterdrop",
  5: "waterdrop",
  6: "blank",
  7: "blank",
  8: "blank",
  9: "lightning",
  10: "lightning",
  11: "lightning",
  12: "lightning",
  13: "lightning",
  14: "lightning",
  15: "lightning",
  16: "lightning",
  17: "lightning",
  18: "lightning",
  19: "lightning",
  20: "lightning"
};



/* ---------------------------------------------------
   Show cloud guy
--------------------------------------------------- */
function showEMS(filename) {
  if (!activeImage) {
    activeImage = document.createElement("img");
    Object.assign(activeImage.style, {
      position: "fixed",
      right: "20px",
      top: "20px",
      width: "100px",
      pointerEvents: "none",
      opacity: "0",
      transition: "opacity .5s",
      zIndex: "9999"
    });
    document.body.appendChild(activeImage);
  }

  activeImage.src = chrome.runtime.getURL(filename);
  requestAnimationFrame(() => activeImage.style.opacity = "1");
}



/* ---------------------------------------------------
   Speech bubbles
--------------------------------------------------- */
function showBubble(index) {

  if (index < 1) return;    

  const file = tbImages[index - 1];
  if (!file) return;

  if (activeBubble) activeBubble.remove();

  const bubble = document.createElement("img");
  bubble.src = chrome.runtime.getURL(file);

  Object.assign(bubble.style, {
    position: "fixed",
    right: "130px",
    top: "60px",
    width: "200px",
    opacity: "0",
    transition: "opacity .4s",
    pointerEvents: "none",
    zIndex: "10000"
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
   Weather containers
--------------------------------------------------- */
let activeWeather = null;



/* ---------------------------------------------------
   Keyframes
--------------------------------------------------- */
const style = document.createElement("style");
style.textContent = `

/* Waterdrop now scrolls downward */
@keyframes rainScroll {
  from { background-position-y: 0; }
  to   { background-position-y: 100%; }
}

/* Lightning flash with randomized intensity ###changed here */
@keyframes lightningFlash {
  0%, 100% { opacity: 0; }
  20% { opacity: var(--flash1, 0.8); }
  40% { opacity: var(--flash2, 0.4); }
  60% { opacity: var(--flash3, 1); }
  80% { opacity: var(--flash4, 0.3); }
}
`;
document.head.appendChild(style);



/* ---------------------------------------------------
   Weather display
--------------------------------------------------- */
function showWeather(mode, clickY = null, clickX = null) {
  if (activeWeather) activeWeather.remove();
  if (mode === "blank") return;

  const div = document.createElement("div");

  Object.assign(div.style, {
    position: "fixed",
    pointerEvents: "none",
    opacity: "0",
    transition: "opacity .4s",
    zIndex: "9998"
  });


  /* ----------------------------------------------
   WATERDROP — centered under cloud guy ###changed here
---------------------------------------------- */

if (mode === "waterdrop") {
  const cloudWidth = activeImage ? activeImage.offsetWidth : 120;

  // Cloud's left edge ###changed here
  const cloudLeft = window.innerWidth - 20 - cloudWidth;

  // Offset downward from cloud top ###changed here
  const verticalOffset = 40;  // adjust this value to change how low it starts

  Object.assign(div.style, {
    top: verticalOffset + "px",  /* starts slightly lower than cloud */
    left: cloudLeft + "px",      /* aligned with cloud’s left edge */
    width: cloudWidth + "px",
    height: "100vh",
    backgroundImage: `url(${chrome.runtime.getURL("waterdrops.png")})`,
    backgroundRepeat: "repeat",
    backgroundSize: cloudWidth + "px auto",
    animation: "rainScroll 5s linear infinite"
  });
}


  /* ----------------------------------------------
     LIGHTNING — randomized flash ###changed here
  ---------------------------------------------- */
  if (mode === "lightning") {
    /* Randomize flash brightness ###changed here */
    div.style.setProperty("--flash1", Math.random());
    div.style.setProperty("--flash2", Math.random());
    div.style.setProperty("--flash3", Math.random());
    div.style.setProperty("--flash4", Math.random());

    Object.assign(div.style, {
      top: clickY + "px",
      left: clickX + "px",
      width: "80px",
      height: "120px",
      backgroundImage: `url(${chrome.runtime.getURL("lightning.png")})`,
      backgroundRepeat: "no-repeat",
      backgroundSize: "contain",
      animation: "lightningFlash 1s ease-in-out infinite"
    });
  }

  document.body.appendChild(div);
  requestAnimationFrame(() => div.style.opacity = "1");

  activeWeather = div;

  setTimeout(() => {
    div.style.opacity = "0";
    setTimeout(() => div.remove(), 400);
  }, 5000);
}



/* ---------------------------------------------------
   Load starting cloud (always e0) ###changed here
--------------------------------------------------- */
if (isShoppingSite()) {
  const saved = Number(localStorage.getItem("currentImageIndex"));

  // if saved not valid, start at 0, else use saved ###changed here
  currentImageIndex = isNaN(saved) ? 0 : saved;

  showEMS(baseImages[currentImageIndex]);
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
  const delWords = ["remove", "minus"];

  const isAdd = addWords.some(w => text.includes(w) || aria.includes(w) || cls.includes(w));
  const isDel = delWords.some(w => text.includes(w) || aria.includes(w) || cls.includes(w));


  /* ADD */
  if (isAdd) {
    currentImageIndex = Math.min(currentImageIndex + 1, baseImages.length - 1);
    showEMS(baseImages[currentImageIndex]);
    showBubble(currentImageIndex);  /* ###changed here: bubble matches Option A */

    const mode = weatherMode[currentImageIndex];

    if (mode === "lightning") {
      showWeather(mode, e.clientY, e.clientX);
    } else {
      showWeather(mode);
    }

    localStorage.setItem("currentImageIndex", currentImageIndex);
  }


  /* REMOVE */
  if (isDel) {
    currentImageIndex = Math.max(currentImageIndex - 1, 0);
    showEMS(baseImages[currentImageIndex]);

    showWeather("blank");
    localStorage.setItem("currentImageIndex", currentImageIndex);
  }
});
