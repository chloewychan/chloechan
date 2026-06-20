"use strict";
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
