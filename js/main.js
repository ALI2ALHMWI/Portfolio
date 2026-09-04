const supportedLanguages = ["ar", "en"];
const defaultLanguage = "en";

async function loadLanguage(lang) {
  if (!supportedLanguages.includes(lang)) lang = defaultLanguage;

  try {
    const response = await fetch(`locales/${lang}.json`);
    const translations = await response.json();

    document.querySelectorAll("[data-i18n]").forEach((element) => {
      const key = element.getAttribute("data-i18n");
      const value = getNestedValue(translations, key);
      if (value) element.textContent = value;
    });

    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";

    localStorage.setItem("preferredLanguage", lang);
    updateToggleButton(lang);
  } catch (error) {
    console.error("Failed to load language file:", error);
  }
}

function getNestedValue(obj, path) {
  return path.split(".").reduce((acc, part) => acc && acc[part], obj);
}

function updateToggleButton(currentLang) {
  const toggleBtn = document.getElementById("lang-toggle");
  if (toggleBtn) {
    toggleBtn.textContent = currentLang === "ar" ? "EN" : "AR";
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
