(function () {
  // 1. Toggle Logic
  const toggleMenu = (header, button, menu) => {
    let isOpen = false;

    // Helper: Collapse the menu
    const collapseMenu = () => {
      const closeEnd = (event) => {
        if (event.target !== menu || event.propertyName !== 'max-height') return;
        menu.setAttribute('hidden', '');
        menu.removeEventListener('transitionend', closeEnd);
      };

      menu.setAttribute('aria-hidden', 'true');
      
      // Set height explicitly so transition can work
      const currentHeight = menu.scrollHeight;
      menu.style.maxHeight = `${currentHeight}px`;

      requestAnimationFrame(() => {
        menu.classList.remove('is-active');
        menu.style.maxHeight = '0px';
      });

      menu.addEventListener('transitionend', closeEnd);
    };

    // Helper: Expand the menu
    const expandMenu = () => {
      const openEnd = (event) => {
        if (event.target !== menu || event.propertyName !== 'max-height') return;
        menu.style.maxHeight = 'none'; // Remove limit after animation
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

    // Helper: Set State
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

    // Initial state
    setState(false, { instant: true });

    // Click Listener (Button)
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      setState(!isOpen);
    });

    // Click Listener (Outside)
    document.addEventListener('click', (event) => {
      if (!header.contains(event.target)) {
        setState(false);
      }
    });

    // Resize Listener (Auto-close on Desktop)
    window.addEventListener('resize', () => {
      if (window.innerWidth >= 1024) {
        setState(false, { instant: true });
      }
    });
  };

  // 2. Initialization
  const initNavigation = () => {
    // A. Highlight Active Link
    const normalizePath = (path) => {
      if (!path) return '/';
      return path.replace(/\/$/, '/').replace(/\/index\.html$/, '/');
    };

    const currentPath = normalizePath(window.location.pathname);

    document.querySelectorAll('[data-nav-link]').forEach((link) => {
      const linkPath = normalizePath(new URL(link.getAttribute('href'), window.location.origin).pathname);
      if (linkPath === currentPath) {
        link.classList.add('text-[#0071E3]'); // Active Color
      }
    });

    // B. Bind Menu Toggles
    document.querySelectorAll('[data-menu-toggle]').forEach((button) => {
      const header = button.closest('header');
      const menu = header?.querySelector('[data-mobile-menu]');

      if (!header || !menu || header.dataset.navReady === 'true') return;

      toggleMenu(header, button, menu);
      header.dataset.navReady = 'true';
    });
  };

  // 3. Run
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNavigation);
  } else {
    initNavigation();
  }

  document.addEventListener('partials:loaded', initNavigation);
})();