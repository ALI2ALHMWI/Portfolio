const supportedLanguages = ["ar", "en"];
const defaultLanguage = "en";

let typingTimeout = null;

function typeText(element, text, speed = 40) {
  return new Promise((resolve) => {
    element.textContent = "";
    let i = 0;
    function type() {
      if (i < text.length) {
        element.textContent += text.charAt(i);
        i++;
        typingTimeout = setTimeout(type, speed);
      } else {
        resolve();
      }
    }
    type();
  });
}

async function loadLanguage(lang) {
  if (!supportedLanguages.includes(lang)) lang = defaultLanguage;

  try {
    const response = await fetch(`locales/${lang}.json`);
    const translations = await response.json();

    document.querySelectorAll("[data-i18n]").forEach((element) => {
      if (element.id === "hero-title") return; // handled separately below

      const key = element.getAttribute("data-i18n");
      const value = getNestedValue(translations, key);
      if (value) element.textContent = value;
    });

    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";

    localStorage.setItem("preferredLanguage", lang);
    updateToggleButton(lang);

    runHeroTyping(translations);
  } catch (error) {
    console.error("Failed to load language file:", error);
  }
}

function runHeroTyping(translations) {
  const heroTitleEl = document.getElementById("hero-title");
  const heroCtaEl = document.getElementById("hero-cta");
  if (!heroTitleEl) return;

  const titleText = getNestedValue(translations, "hero.title");
  if (!titleText) return;

  if (typingTimeout) clearTimeout(typingTimeout);

  if (heroCtaEl) {
    heroCtaEl.classList.remove("animate-fade-in-up");
    heroCtaEl.style.opacity = "0";
  }

  typeText(heroTitleEl, titleText).then(() => {
    if (heroCtaEl) {
      heroCtaEl.style.opacity = "";
      heroCtaEl.classList.add("animate-fade-in-up");
    }
  });
}

function getNestedValue(obj, path) {
  return path.split(".").reduce((acc, part) => acc && acc[part], obj);
}

function updateToggleButton(currentLang) {
  const toggleBtn = document.getElementById("lang-toggle");
  if (toggleBtn) {
    toggleBtn.textContent = currentLang === "ar" ? "EN" : "عربي";
  }
}

function initLanguage() {
  const savedLang =
    localStorage.getItem("preferredLanguage") || defaultLanguage;
  loadLanguage(savedLang);

  const toggleBtn = document.getElementById("lang-toggle");
  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      const currentLang = document.documentElement.lang;
      const newLang = currentLang === "ar" ? "en" : "ar";
      loadLanguage(newLang);
    });
  }
}

document.addEventListener("DOMContentLoaded", initLanguage);
