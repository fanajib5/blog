// Alpine.js components
document.addEventListener("alpine:init", () => {
  // Dark mode store
  Alpine.store("darkMode", {
    on: localStorage.getItem("darkMode") === "true",
    init() {
      this.on = localStorage.getItem("darkMode") === "true";
      document.documentElement.classList.toggle("dark", this.on);
    },
    toggle() {
      this.on = !this.on;
      localStorage.setItem("darkMode", this.on);
      document.documentElement.classList.toggle("dark", this.on);
    }
  });

  // Gallery lightbox component
  Alpine.data("gallery", () => ({
    lightboxOpen: false,
    currentImage: null,
    openLightbox(src) {
      this.currentImage = src;
      this.lightboxOpen = true;
      document.body.style.overflow = "hidden";
    },
    closeLightbox() {
      this.lightboxOpen = false;
      this.currentImage = null;
      document.body.style.overflow = "";
    }
  }));
});

// Initialize dark mode from localStorage
document.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("darkMode") === "true") {
    document.documentElement.classList.add("dark");
  }
});
