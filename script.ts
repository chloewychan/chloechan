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
