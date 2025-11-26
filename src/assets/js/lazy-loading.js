// Lazy Loading for Images
document.addEventListener('DOMContentLoaded', function() {
  // Intersection Observer for lazy loading
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          const src = img.dataset.src;
          const srcset = img.dataset.srcset;

          if (src) {
            img.src = src;
            img.removeAttribute('data-src');
          }

          if (srcset) {
            img.srcset = srcset;
            img.removeAttribute('data-srcset');
          }

          img.classList.remove('lazy');
          img.classList.add('loaded');
          observer.unobserve(img);
        }
      });
    }, {
      rootMargin: '50px 0px',
      threshold: 0.01
    });

    // Observe all images with data-src attribute
    const lazyImages = document.querySelectorAll('img[data-src]');
    lazyImages.forEach(img => {
      imageObserver.observe(img);
    });
  } else {
    // Fallback for browsers that don't support IntersectionObserver
    const lazyImages = document.querySelectorAll('img[data-src]');
    lazyImages.forEach(img => {
      const src = img.dataset.src;
      const srcset = img.dataset.srcset;

      if (src) {
        img.src = src;
      }

      if (srcset) {
        img.srcset = srcset;
      }

      img.classList.remove('lazy');
      img.classList.add('loaded');
    });
  }
});

// Add lazy loading CSS
const style = document.createElement('style');
style.textContent = `
  img.lazy {
    opacity: 0;
    transition: opacity 0.3s ease-in-out;
  }

  img.loaded {
    opacity: 1;
  }
`;
document.head.appendChild(style);