// ─── SMOOTH SCROLL & DROPDOWNS ────────────────────────────
// Smooth-scroll for all anchor links (including dropdown items)
document.querySelectorAll('a[href^="#"]').forEach((link: Element) => {
  link.addEventListener('click', (e: Event) => {
    const href = (link as HTMLAnchorElement).getAttribute('href');
    if (!href) return;
    
    const target = document.querySelector(href);
    if (!target) return;
    
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

// Close dropdowns when clicking outside
document.addEventListener('click', (e: Event) => {
  const target = e.target as HTMLElement;
  if (!target.closest('.group')) {
    document.querySelectorAll('.dropdown').forEach((d: Element) => {
      (d as HTMLElement).style.opacity = '';
      (d as HTMLElement).style.visibility = '';
    });
  }
});

// ─── PARALLAX SCROLLING ───────────────────────────────────
const parallaxBg = document.querySelector('.parallax-bg') as HTMLElement | null;
if (parallaxBg) {
  window.addEventListener('scroll', () => {
    const scrollPosition = window.scrollY;
    // Parallax effect: moves slower than scroll
    const offset = scrollPosition * 0.5;
    parallaxBg.style.transform = `translateY(${offset}px)`;
  });
}

// ─── REVEAL BOXES ─────────────────────────────────────────
document.querySelectorAll('.reveal-box').forEach((box: Element) => {
  box.addEventListener('click', () => {
    const content = box.querySelector('.reveal-content') as HTMLElement | null;
    if (content) {
      content.classList.toggle('hidden');
    }
  });
});

// ─── CAROUSEL NAVIGATION ──────────────────────────────────
document.querySelectorAll('.carousel').forEach((carousel: Element) => {
  const prevBtn = carousel.querySelector('.carousel-prev') as HTMLButtonElement | null;
  const nextBtn = carousel.querySelector('.carousel-next') as HTMLButtonElement | null;
  const indicator = carousel.querySelector('.carousel-indicator') as HTMLElement | null;
  
  if (prevBtn && nextBtn && indicator) {
    let currentSlide = 1;
    const totalSlides = parseInt(indicator.textContent?.split(' / ')[1] || '3');
    
    const updateIndicator = () => {
      if (indicator) {
        indicator.textContent = `${currentSlide} / ${totalSlides}`;
      }
    };
    
    prevBtn.addEventListener('click', (e: Event) => {
      e.preventDefault();
      currentSlide = currentSlide > 1 ? currentSlide - 1 : totalSlides;
      updateIndicator();
    });
    
    nextBtn.addEventListener('click', (e: Event) => {
      e.preventDefault();
      currentSlide = currentSlide < totalSlides ? currentSlide + 1 : 1;
      updateIndicator();
    });
  }
});
