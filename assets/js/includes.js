(function () {
  const executeScripts = (scripts) => {
    scripts.forEach((original) => {
      const script = document.createElement('script');
      if (original.src) {
        script.src = original.src;
      } else {
        script.textContent = original.textContent;
      }
      script.async = false;
      document.body.appendChild(script);
    });
  };

  const loadPartial = async (placeholder) => {
    const url = placeholder.dataset.include;
    if (!url) return;

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const template = document.createElement('template');
      template.innerHTML = (await response.text()).trim();

      const fragment = template.content;
      const scripts = [...fragment.querySelectorAll('script')];
      scripts.forEach((script) => script.remove());

      placeholder.replaceWith(fragment);
      if (scripts.length) {
        executeScripts(scripts);
      }
    } catch (error) {
      console.error(`Failed to load partial: ${url}`, error);
    }
  };

  document.addEventListener('DOMContentLoaded', () => {
    const placeholders = [...document.querySelectorAll('[data-include]')];

    Promise.all(placeholders.map((placeholder) => loadPartial(placeholder)))
      .catch((error) => console.error('Failed to load one or more partials', error))
      .finally(() => {
        document.dispatchEvent(new Event('partials:loaded'));
      });
  });
})();
