// Smooth-scroll for all anchor links (including dropdown items)
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', e => {
    const target = document.querySelector(link.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

// Close dropdowns when clicking outside
document.addEventListener('click', e => {
  if (!e.target.closest('.group')) {
    document.querySelectorAll('.dropdown').forEach(d => {
      d.style.opacity = '';
      d.style.visibility = '';
    });
  }
});
