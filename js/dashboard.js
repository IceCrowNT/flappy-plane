const sections = [...document.querySelectorAll('main section[id]')];
const navLinks = [...document.querySelectorAll('.nav-link')];
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

document.documentElement.style.scrollBehavior = prefersReducedMotion.matches ? 'auto' : 'smooth';

const setActiveLink = (id) => {
  for (const link of navLinks) {
    const isMatch = link.getAttribute('href') === `#${id}`;
    link.classList.toggle('is-active', isMatch);
    if (isMatch) {
      link.setAttribute('aria-current', 'page');
    } else {
      link.removeAttribute('aria-current');
    }
  }
};

if (sections.length && navLinks.length) {
  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (visible?.target?.id) {
        setActiveLink(visible.target.id);
      }
    },
    {
      rootMargin: '-25% 0px -55% 0px',
      threshold: [0.2, 0.45, 0.7]
    }
  );

  for (const section of sections) {
    observer.observe(section);
  }
}

prefersReducedMotion.addEventListener('change', (event) => {
  document.documentElement.style.scrollBehavior = event.matches ? 'auto' : 'smooth';
});
