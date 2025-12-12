const nav = document.getElementById('nav');
const productCards = document.querySelectorAll('[data-animate="card"]');
const themeToggle = document.getElementById('themeToggle');
const mobileButton = document.getElementById('mobileMenuButton');
const mobileDrawer = document.getElementById('mobileDrawer');

function handleNav() {
  if (window.scrollY > 12) {
    nav?.classList.add('nav-blur');
  } else {
    nav?.classList.remove('nav-blur');
  }
}

function animateIntro() {
  if (typeof gsap === 'undefined') return;
  gsap.from('.hero-text', { opacity: 0, y: 25, duration: 1, ease: 'power3.out', stagger: 0.12 });
  gsap.from('.hero-button', { opacity: 0, y: 30, duration: 0.9, delay: 0.2, ease: 'power3.out', stagger: 0.08 });
  gsap.from('[data-animate="showcase-title"]', { opacity: 0, y: 20, duration: 0.8, delay: 0.4 });
  productCards.forEach((card, index) => {
    gsap.from(card, {
      opacity: 0,
      y: 40,
      duration: 1,
      ease: 'power3.out',
      delay: 0.4 + index * 0.12,
    });
  });
}

function initSmoothLinks() {
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (event) => {
      const targetId = link.getAttribute('href');
      if (!targetId || targetId === '#') return;
      const el = document.querySelector(targetId);
      if (el) {
        event.preventDefault();
        const offsetTop = el.getBoundingClientRect().top + window.scrollY - 60;
        window.scrollTo({ top: offsetTop, behavior: 'smooth' });
        mobileDrawer?.classList.remove('open');
      }
    });
  });
}

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('wayv-theme', theme);
  if (themeToggle) {
    themeToggle.innerHTML = theme === 'light' ? '☀️ Light' : '🌙 Dark';
  }
}

function initTheme() {
  const stored = localStorage.getItem('wayv-theme');
  const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
  const initial = stored || (prefersLight ? 'light' : 'dark');
  setTheme(initial);
  themeToggle?.addEventListener('click', () => {
    const next = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    setTheme(next);
  });
}

function initMobileMenu() {
  mobileButton?.addEventListener('click', () => {
    mobileDrawer?.classList.toggle('open');
  });
  document.addEventListener('click', (event) => {
    if (!mobileDrawer || !mobileButton) return;
    if (!mobileDrawer.contains(event.target) && !mobileButton.contains(event.target)) {
      mobileDrawer.classList.remove('open');
    }
  });
}

window.addEventListener('scroll', handleNav);
window.addEventListener('load', () => {
  handleNav();
  initSmoothLinks();
  initTheme();
  initMobileMenu();
  animateIntro();
});
