const supportedLanguages = ["ar", "en"];
const defaultLanguage = "en";
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const precisePointer = window.matchMedia("(hover: hover) and (pointer: fine) and (min-width: 760px)");

function getNestedValue(obj, path) {
  return path.split(".").reduce((acc, part) => (acc ? acc[part] : undefined), obj);
}

function watchMediaQuery(query, callback) {
  if (typeof query.addEventListener === "function") {
    query.addEventListener("change", callback);
    return;
  }

  query.addListener?.(callback);
}

async function loadLanguage(lang) {
  const language = supportedLanguages.includes(lang) ? lang : defaultLanguage;

  try {
    const response = await fetch(`locales/${language}.json`);
    if (!response.ok) throw new Error(`Language file failed: ${response.status}`);
    const translations = await response.json();

    document.querySelectorAll("[data-i18n]").forEach((element) => {
      const key = element.getAttribute("data-i18n");
      const value = getNestedValue(translations, key);
      if (value) element.textContent = value;
    });

    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    localStorage.setItem("preferredLanguage", language);
    updateToggleButton(language);
  } catch (error) {
    updateToggleButton(document.documentElement.lang || defaultLanguage);
    console.warn("Language switching is unavailable in this context.", error);
  }
}

function updateToggleButton(currentLang) {
  document.querySelectorAll("[data-lang-toggle]").forEach((toggleBtn) => {
    toggleBtn.textContent = currentLang === "ar" ? "EN" : "AR";
    toggleBtn.setAttribute(
      "aria-label",
      currentLang === "ar" ? "Switch language to English" : "Switch language to Arabic",
    );
  });
}

function initLanguage() {
  const savedLang = localStorage.getItem("preferredLanguage") || defaultLanguage;
  loadLanguage(savedLang);

  document.querySelectorAll("[data-lang-toggle]").forEach((toggleBtn) => {
    toggleBtn.addEventListener("click", () => {
      const currentLang = document.documentElement.lang || defaultLanguage;
      loadLanguage(currentLang === "ar" ? "en" : "ar");
    });
  });
}

function initMobileMenu() {
  const menuToggle = document.getElementById("menu-toggle");
  const menu = document.getElementById("primary-menu");
  if (!menuToggle || !menu) return;

  function closeMenu() {
    menu.classList.remove("menu-open");
    menuToggle.classList.remove("menu-open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open navigation menu");
    document.body.classList.remove("menu-open");
  }

  menuToggle.addEventListener("click", () => {
    const isOpen = menu.classList.toggle("menu-open");
    menuToggle.classList.toggle("menu-open", isOpen);
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.setAttribute("aria-label", isOpen ? "Close navigation menu" : "Open navigation menu");
    document.body.classList.toggle("menu-open", isOpen);
  });

  menu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });
}

function initReveal() {
  const staggerGroups = [
    ".project-grid",
    ".stack-grid",
    ".skill-category-grid",
  ];

  staggerGroups.forEach((selector) => {
    document.querySelectorAll(selector).forEach((group) => {
      Array.from(group.children).forEach((element, index) => {
        element.classList.add("reveal", "reveal-stagger");
        element.style.setProperty("--reveal-delay", `${Math.min(index, 4) * 70}ms`);
      });
    });
  });

  const revealElements = document.querySelectorAll(".reveal");
  if (reducedMotion.matches || !("IntersectionObserver" in window)) {
    revealElements.forEach((element) => element.classList.add("reveal-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("reveal-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.14 },
  );

  revealElements.forEach((element) => observer.observe(element));
}

function initActiveNavigation() {
  const links = Array.from(document.querySelectorAll(".nav-link"));
  const linkBySectionId = new Map();
  const sections = [];

  links.forEach((link) => {
    const targetId = link.getAttribute("href")?.slice(1);
    if (!targetId) return;

    const section = document.getElementById(targetId);
    if (!section) return;

    linkBySectionId.set(targetId, link);
    sections.push(section);
  });

  if (!("IntersectionObserver" in window) || sections.length === 0) return;

  let activeLink = links.find((link) => link.classList.contains("active")) || null;

  function setActiveLink(nextLink) {
    if (!nextLink || nextLink === activeLink) return;
    activeLink?.classList.remove("active");
    nextLink.classList.add("active");
    activeLink = nextLink;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        setActiveLink(linkBySectionId.get(entry.target.id));
      });
    },
    {
      rootMargin: "-42% 0px -50% 0px",
      threshold: 0,
    },
  );

  sections.forEach((section) => observer.observe(section));
}

function initProjectCarousels() {
  document.querySelectorAll(".project-carousel").forEach((carousel) => {
    const track = carousel.querySelector(".carousel-track");
    const slides = Array.from(track?.children || []);
    const prevBtn = carousel.querySelector(".carousel-prev");
    const nextBtn = carousel.querySelector(".carousel-next");
    const dotsContainer = carousel.querySelector(".carousel-dots");
    let currentIndex = 0;

    if (!track || slides.length <= 1 || !prevBtn || !nextBtn || !dotsContainer) return;

    slides.forEach((_, index) => {
      const dot = document.createElement("span");
      dot.className = "carousel-dot";
      if (index === 0) dot.classList.add("carousel-dot-active");
      dotsContainer.appendChild(dot);
    });

    const dots = Array.from(dotsContainer.children);

    function update() {
      track.style.transform = `translateX(-${currentIndex * 100}%)`;
      dots.forEach((dot, index) => {
        dot.classList.toggle("carousel-dot-active", index === currentIndex);
      });
    }

    function goTo(index) {
      currentIndex = (index + slides.length) % slides.length;
      update();
    }

    prevBtn.addEventListener("click", () => goTo(currentIndex - 1));
    nextBtn.addEventListener("click", () => goTo(currentIndex + 1));
  });
}

function initHeroParallax() {
  const scene = document.querySelector("[data-depth-scene]");
  if (!scene) return;

  let frameId = 0;
  let bounds = null;
  let pointerX = 0;
  let pointerY = 0;
  let isEnabled = precisePointer.matches && !reducedMotion.matches;

  function clearFrame() {
    if (!frameId) return;
    cancelAnimationFrame(frameId);
    frameId = 0;
  }

  function resetParallax() {
    clearFrame();
    scene.style.transform = "";
    bounds = null;
  }

  function measureScene() {
    bounds = scene.getBoundingClientRect();
  }

  function renderParallax() {
    frameId = 0;
    if (!bounds || !isEnabled) return;

    const x = (pointerX - bounds.left) / bounds.width - 0.5;
    const y = (pointerY - bounds.top) / bounds.height - 0.5;
    scene.style.transform = `rotateX(${(-y * 3).toFixed(2)}deg) rotateY(${(x * 4).toFixed(2)}deg)`;
  }

  function scheduleParallax() {
    if (!frameId) frameId = requestAnimationFrame(renderParallax);
  }

  scene.addEventListener(
    "pointerenter",
    () => {
      if (!isEnabled) return;
      measureScene();
    },
    { passive: true },
  );

  scene.addEventListener(
    "pointermove",
    (event) => {
      if (!isEnabled) return;
      if (!bounds) measureScene();
      pointerX = event.clientX;
      pointerY = event.clientY;
      scheduleParallax();
    },
    { passive: true },
  );

  scene.addEventListener("pointerleave", resetParallax, { passive: true });

  window.addEventListener(
    "resize",
    () => {
      bounds = null;
      if (!precisePointer.matches) resetParallax();
    },
    { passive: true },
  );

  watchMediaQuery(precisePointer, (event) => {
    isEnabled = event.matches && !reducedMotion.matches;
    if (!isEnabled) resetParallax();
  });

  watchMediaQuery(reducedMotion, (event) => {
    isEnabled = precisePointer.matches && !event.matches;
    if (!isEnabled) resetParallax();
  });
}

function initVisibilityPause() {
  document.addEventListener("visibilitychange", () => {
    const isHidden = document.hidden;
    document.documentElement.classList.toggle("animations-paused", isHidden);
    if (isHidden) document.querySelector("[data-depth-scene]")?.style.removeProperty("transform");
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initLanguage();
  initMobileMenu();
  initReveal();
  initActiveNavigation();
  initProjectCarousels();
  initHeroParallax();
  initVisibilityPause();
});
