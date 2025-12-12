(function () {
  const toggleMenu = (header, button, menu) => {
    const setState = (isOpen) => {
      if (!menu) return;
      if (isOpen) {
        menu.removeAttribute('hidden');
      } else {
        menu.setAttribute('hidden', '');
      }
      button.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      button.classList.toggle('is-open', isOpen);
    };

    setState(false);

    button.addEventListener('click', (event) => {
      event.stopPropagation();
      const isOpen = !menu.hasAttribute('hidden');
      setState(!isOpen);
    });

    document.addEventListener('click', (event) => {
      if (!header.contains(event.target)) {
        setState(false);
      }
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth >= 768) {
        setState(false);
      }
    });
  };

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-menu-toggle]').forEach((button) => {
      const header = button.closest('header');
      const menu = header?.querySelector('[data-mobile-menu]');
      if (header && menu) {
        toggleMenu(header, button, menu);
      }
    });
  });
})();
