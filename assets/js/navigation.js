(function () {
  const toggleMenu = (header, button, menu) => {
    let isOpen = false;

    const collapseMenu = () => {
      const closeEnd = (event) => {
        if (event.target !== menu || event.propertyName !== 'max-height') return;
        menu.setAttribute('hidden', '');
        menu.removeEventListener('transitionend', closeEnd);
      };

      menu.setAttribute('aria-hidden', 'true');

      const currentHeight = menu.scrollHeight;
      menu.style.maxHeight = `${currentHeight}px`;

      requestAnimationFrame(() => {
        menu.classList.remove('is-active');
        menu.style.maxHeight = '0px';
      });

      menu.addEventListener('transitionend', closeEnd);
    };

    const expandMenu = () => {
      const openEnd = (event) => {
        if (event.target !== menu || event.propertyName !== 'max-height') return;
        menu.style.maxHeight = 'none';
        menu.removeEventListener('transitionend', openEnd);
      };

      menu.removeAttribute('hidden');
      menu.setAttribute('aria-hidden', 'false');
      menu.style.maxHeight = `${menu.scrollHeight}px`;

      requestAnimationFrame(() => {
        menu.classList.add('is-active');
      });

      menu.addEventListener('transitionend', openEnd);
    };

    const setState = (nextIsOpen, options = { instant: false }) => {
      if (!menu || (nextIsOpen === isOpen && !options.instant)) return;

      button.setAttribute('aria-expanded', nextIsOpen ? 'true' : 'false');
      button.classList.toggle('is-open', nextIsOpen);

      if (options.instant) {
        if (nextIsOpen) {
          menu.removeAttribute('hidden');
          menu.setAttribute('aria-hidden', 'false');
          menu.classList.add('is-active');
          menu.style.maxHeight = 'none';
        } else {
          menu.classList.remove('is-active');
          menu.style.maxHeight = '0px';
          menu.setAttribute('hidden', '');
          menu.setAttribute('aria-hidden', 'true');
        }
        isOpen = nextIsOpen;
        return;
      }

      if (nextIsOpen) {
        expandMenu();
      } else {
        collapseMenu();
      }

      isOpen = nextIsOpen;
    };

    setState(false, { instant: true });

    button.addEventListener('click', (event) => {
      event.stopPropagation();
      setState(!isOpen);
    });

    document.addEventListener('click', (event) => {
      if (!header.contains(event.target)) {
        setState(false);
      }
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth >= 768) {
        setState(false, { instant: true });
      }
    });
  };

  const initNavigation = () => {
    const normalizePath = (path) => {
      if (!path) return '/';
      return path.replace(/\/$/, '/').replace(/\/index\.html$/, '/');
    };

    const currentPath = normalizePath(window.location.pathname);

    document.querySelectorAll('[data-nav-link]').forEach((link) => {
      const baseColor = link.dataset.baseColor;
      const linkPath = normalizePath(new URL(link.getAttribute('href'), window.location.origin).pathname);

      if (linkPath === currentPath) {
        if (baseColor) {
          link.classList.remove(baseColor);
        }
        link.classList.add('text-slate-900');
      }
    });

    document.querySelectorAll('[data-menu-toggle]').forEach((button) => {
      const header = button.closest('header');
      const menu = header?.querySelector('[data-mobile-menu]');
      if (header && menu) {
        toggleMenu(header, button, menu);
      }
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNavigation);
  } else {
    initNavigation();
  }
})();
