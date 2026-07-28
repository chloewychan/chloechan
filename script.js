"use strict";
// ─── SMOOTH SCROLL & DROPDOWNS ────────────────────────────
// Smooth-scroll for all anchor links (including dropdown items)
document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        if (!href)
            return;
        const target = document.querySelector(href);
        if (!target)
            return;
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
});
// Close dropdowns when clicking outside
document.addEventListener('click', (e) => {
    const target = e.target;
    if (!target.closest('.group')) {
        document.querySelectorAll('.dropdown').forEach((d) => {
            d.style.opacity = '';
            d.style.visibility = '';
        });
    }
});
// ─── MOBILE NAV MENU ───────────────────────────────────────
// The desktop nav's dropdowns are hover-driven, which doesn't work on
// touch — below the sm breakpoint it's replaced by a hamburger button
// that toggles a flat link list instead.
const mobileMenuToggle = document.getElementById('mobileMenuToggle');
const mobileMenu = document.getElementById('mobileMenu');
const mobileMenuIconOpen = document.getElementById('mobileMenuIconOpen');
const mobileMenuIconClose = document.getElementById('mobileMenuIconClose');
if (mobileMenuToggle && mobileMenu && mobileMenuIconOpen && mobileMenuIconClose) {
    const setOpen = (open) => {
        mobileMenu.classList.toggle('hidden', !open);
        mobileMenuIconOpen.classList.toggle('hidden', open);
        mobileMenuIconClose.classList.toggle('hidden', !open);
        mobileMenuToggle.setAttribute('aria-expanded', String(open));
        mobileMenuToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    };
    mobileMenuToggle.addEventListener('click', () => {
        setOpen(mobileMenu.classList.contains('hidden'));
    });
    mobileMenu.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', () => setOpen(false));
    });
    document.addEventListener('click', (e) => {
        const target = e.target;
        if (!target.closest('#mobileMenuToggle') && !target.closest('#mobileMenu')) {
            setOpen(false);
        }
    });
}
// ─── HERO CLAW: descends toward the bunny as you scroll ───
// --claw-progress goes 0 (resting, matches hero-preview) → 1 (right as
// the hero fully scrolls out of frame — rawProgress is exactly 1 at
// that point, so no speed multiplier here: the claw keeps moving for
// the entire time the hero is on screen instead of finishing early
// and sitting still while the rest of the hero scrolls past it.
// easeInOut gives it a slow-start/slow-finish feel instead of
// tracking the scrollbar linearly.
function easeInOut(p) {
    return 0.5 - 0.5 * Math.cos(Math.PI * p);
}
const heroSection = document.querySelector('.hero-section');
const heroClaw = document.getElementById('heroClaw');
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
// ─── HERO SPRITES: per-sprite scroll inertia + cursor magnet ──
// Each sprite (and icon) runs its own light spring simulation on
// scroll: fast scrolling nudges it, then it eases back to rest instead
// of snapping — "lag" rather than tracking scroll position 1:1.
// Kick/friction/max vary per element (via --inertia-kick/
// --inertia-friction/--inertia-max custom properties, icons falling
// back to a gentle default) so the scene reads as independent
// characters instead of one flat block moving together.
//
// Decorative sprites (not the claw or the headline text) also get
// pulled toward the mouse when it's nearby — a soft "magnet" — which
// eases back to 0 as the cursor moves away. The social icons get the
// same pull, just much weaker, so they read as reactive without
// wandering far from their click targets. Both effects are combined
// into one offset per frame and applied through the standalone
// `translate` CSS property rather than
// `transform`, since `transform` is already driven by each element's
// `bob-*` keyframe animation — `translate` composites with it instead
// of fighting over the same property.
//
// Runs only while something still has noticeable motion left, so it
// doesn't sit in an idle rAF loop the rest of the time.
const heroSprites = document.getElementById('heroSprites');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (heroSprites && !prefersReducedMotion) {
    const MAGNET_RADIUS = 220; // px — cursor distance at which pull starts
    const MAGNET_STRENGTH_SPRITE = 18; // px — max pull for sprites, right under the cursor
    const MAGNET_STRENGTH_ICON = 6; // px — icons get a much subtler version of the same pull
    const MAGNET_EASE = 0.15; // per-frame chase toward the target pull
    const readVar = (el, name, fallback) => {
        const value = parseFloat(getComputedStyle(el).getPropertyValue(name));
        return Number.isFinite(value) ? value : fallback;
    };
    const targets = Array.from(heroSprites.querySelectorAll('.sprite, .hero-icon'));
    const sprites = targets.map((el) => ({
        el,
        magnetStrength: el.classList.contains('sprite') ? MAGNET_STRENGTH_SPRITE : MAGNET_STRENGTH_ICON,
        kick: readVar(el, '--inertia-kick', 0.12),
        friction: readVar(el, '--inertia-friction', 0.85),
        maxOffset: readVar(el, '--inertia-max', 10),
        scrollOffset: 0,
        magnetX: 0,
        magnetY: 0,
        targetMagnetX: 0,
        targetMagnetY: 0,
    }));
    let lastScrollY = window.scrollY;
    let mouseX = 0;
    let mouseY = 0;
    let hasMouse = false;
    let rafId = null;
    const scheduleStep = () => {
        if (rafId === null) {
            rafId = window.requestAnimationFrame(step);
        }
    };
    const step = () => {
        const currentScrollY = window.scrollY;
        const scrollDelta = currentScrollY - lastScrollY;
        lastScrollY = currentScrollY;
        let stillActive = false;
        sprites.forEach((s) => {
            s.scrollOffset += scrollDelta * s.kick;
            s.scrollOffset = Math.max(-s.maxOffset, Math.min(s.maxOffset, s.scrollOffset));
            s.scrollOffset *= s.friction;
            if (s.magnetStrength > 0) {
                if (hasMouse) {
                    const rect = s.el.getBoundingClientRect();
                    const dx = mouseX - (rect.left + rect.width / 2);
                    const dy = mouseY - (rect.top + rect.height / 2);
                    const dist = Math.hypot(dx, dy);
                    if (dist > 0.01 && dist < MAGNET_RADIUS) {
                        const pull = (1 - dist / MAGNET_RADIUS) * s.magnetStrength;
                        s.targetMagnetX = (dx / dist) * pull;
                        s.targetMagnetY = (dy / dist) * pull;
                    }
                    else {
                        s.targetMagnetX = 0;
                        s.targetMagnetY = 0;
                    }
                }
                else {
                    s.targetMagnetX = 0;
                    s.targetMagnetY = 0;
                }
                s.magnetX += (s.targetMagnetX - s.magnetX) * MAGNET_EASE;
                s.magnetY += (s.targetMagnetY - s.magnetY) * MAGNET_EASE;
            }
            const totalX = s.magnetX;
            const totalY = s.scrollOffset + s.magnetY;
            const settled = Math.abs(s.scrollOffset) < 0.05 &&
                Math.abs(scrollDelta) < 0.5 &&
                Math.abs(s.magnetX) < 0.05 &&
                Math.abs(s.magnetY) < 0.05 &&
                Math.abs(s.targetMagnetX) < 0.05 &&
                Math.abs(s.targetMagnetY) < 0.05;
            if (settled) {
                s.el.style.removeProperty('translate');
            }
            else {
                s.el.style.setProperty('translate', `${totalX.toFixed(2)}px ${totalY.toFixed(2)}px`);
                stillActive = true;
            }
        });
        rafId = stillActive ? window.requestAnimationFrame(step) : null;
    };
    window.addEventListener('scroll', scheduleStep, { passive: true });
    heroSection?.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        hasMouse = true;
        scheduleStep();
    }, { passive: true });
    heroSection?.addEventListener('mouseleave', () => {
        hasMouse = false;
        scheduleStep();
    }, { passive: true });
}
// ─── REVEAL BOXES ─────────────────────────────────────────
document.querySelectorAll('.reveal-box').forEach((box) => {
    box.addEventListener('click', () => {
        const content = box.querySelector('.reveal-content');
        if (content) {
            content.classList.toggle('hidden');
        }
    });
});
// ─── CAROUSEL NAVIGATION ──────────────────────────────────
document.querySelectorAll('.carousel').forEach((carousel) => {
    const prevBtn = carousel.querySelector('.carousel-prev');
    const nextBtn = carousel.querySelector('.carousel-next');
    const indicator = carousel.querySelector('.carousel-indicator');
    if (prevBtn && nextBtn && indicator) {
        let currentSlide = 1;
        const totalSlides = parseInt(indicator.textContent?.split(' / ')[1] || '3');
        const updateIndicator = () => {
            if (indicator) {
                indicator.textContent = `${currentSlide} / ${totalSlides}`;
            }
        };
        prevBtn.addEventListener('click', (e) => {
            e.preventDefault();
            currentSlide = currentSlide > 1 ? currentSlide - 1 : totalSlides;
            updateIndicator();
        });
        nextBtn.addEventListener('click', (e) => {
            e.preventDefault();
            currentSlide = currentSlide < totalSlides ? currentSlide + 1 : 1;
            updateIndicator();
        });
    }
});
