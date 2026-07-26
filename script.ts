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

// ─── HERO CLAW: descends toward the bunny as you scroll ───
// --claw-progress goes 0 (resting, matches hero-preview) → 1 (right as
// the hero fully scrolls out of frame — rawProgress is exactly 1 at
// that point, so no speed multiplier here: the claw keeps moving for
// the entire time the hero is on screen instead of finishing early
// and sitting still while the rest of the hero scrolls past it.
// easeInOut gives it a slow-start/slow-finish feel instead of
// tracking the scrollbar linearly.
function easeInOut(p: number): number {
  return 0.5 - 0.5 * Math.cos(Math.PI * p);
}

const heroSection = document.querySelector('.hero-section') as HTMLElement | null;
const heroClaw = document.getElementById('heroClaw') as HTMLElement | null;

if (heroSection && heroClaw) {
  let ticking = false;

  const updateClawProgress = () => {
    const rect = heroSection.getBoundingClientRect();
    const rawProgress = Math.min(1, Math.max(0, -rect.top / rect.height));
    const eased = easeInOut(rawProgress);
    heroClaw.style.setProperty('--claw-progress', eased.toFixed(4));
    ticking = false;
  };

  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(updateClawProgress);
      ticking = true;
    }
  }, { passive: true });

  updateClawProgress();
}

// ─── HERO SPRITES: subtle vertical inertia on scroll ──────
// A light spring: fast scrolling nudges the sprite layer, which then
// eases back to rest instead of snapping — a bit of "lag" rather than
// tracking the scroll position 1:1. Runs only while it has noticeable
// motion left, so it doesn't sit in an idle rAF loop the rest of the time.
const heroSprites = document.getElementById('heroSprites') as HTMLElement | null;
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (heroSprites && !prefersReducedMotion) {
  const KICK = 0.12;       // how much a scroll step feeds into the offset
  const FRICTION = 0.85;   // per-frame decay back toward rest
  const MAX_OFFSET = 10;   // px — kept subtle

  let lastScrollY = window.scrollY;
  let offset = 0;
  let rafId: number | null = null;

  const step = () => {
    const currentScrollY = window.scrollY;
    const delta = currentScrollY - lastScrollY;
    lastScrollY = currentScrollY;

    offset += delta * KICK;
    offset = Math.max(-MAX_OFFSET, Math.min(MAX_OFFSET, offset));
    offset *= FRICTION;

    if (Math.abs(offset) < 0.05 && Math.abs(delta) < 0.5) {
      heroSprites.style.transform = '';
      rafId = null;
      return;
    }

    heroSprites.style.transform = `translateY(${offset.toFixed(2)}px)`;
    rafId = window.requestAnimationFrame(step);
  };

  window.addEventListener('scroll', () => {
    if (rafId === null) {
      rafId = window.requestAnimationFrame(step);
    }
  }, { passive: true });
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
