(function () {
  const HOLD_DURATION = 5000;
  let holdTimer = null;
  let popupElement = null;
  let lastFocusedElement = null;

  const createPopup = () => {
    if (popupElement) return popupElement;

    const overlay = document.createElement('div');
    overlay.id = 'founderPopup';
    overlay.className = 'founder-popup';
    overlay.setAttribute('hidden', '');

    overlay.innerHTML = `
      <div class="founder-popup__backdrop" data-popup-close></div>
      <div class="founder-popup__dialog" role="dialog" aria-modal="true" aria-labelledby="founderPopupTitle">
        <div class="founder-popup__header">
          <p class="founder-popup__eyebrow">A note from the founders</p>
          <h2 id="founderPopupTitle" class="founder-popup__title">Thank you for building with us</h2>
          <button type="button" class="founder-popup__close" aria-label="Close founder message" data-popup-close>×</button>
        </div>
        <div class="founder-popup__content">
          <div class="founder-popup__message">
            <p class="founder-popup__name">Charles-Elliott Roger · Co-Founder of WayV</p>
            <p class="founder-popup__text">I appreciate every person who chooses WayV. Your curiosity keeps us inventing.</p>
          </div>
          <div class="founder-popup__message">
            <p class="founder-popup__name">Eliott Lacroix · Co-Founder of WayV</p>
            <p class="founder-popup__text">Thanks for exploring what we're building. We hope these experiences spark something new for you.</p>
          </div>
        </div>
      </div>
    `;

    overlay.addEventListener('click', (event) => {
      if (event.target.closest('[data-popup-close]')) {
        hidePopup();
      }
    });

    document.body.appendChild(overlay);
    popupElement = overlay;
    return popupElement;
  };

  const showPopup = () => {
    const popup = createPopup();
    if (!popup) return;

    lastFocusedElement = document.activeElement;
    popup.removeAttribute('hidden');
    requestAnimationFrame(() => popup.classList.add('is-visible'));
    const closeButton = popup.querySelector('.founder-popup__close');
    closeButton?.focus({ preventScroll: true });
  };

  const hidePopup = () => {
    if (!popupElement) return;
    popupElement.classList.remove('is-visible');
    const handleTransitionEnd = (event) => {
      if (event.target !== popupElement) return;
      popupElement.setAttribute('hidden', '');
      popupElement.removeEventListener('transitionend', handleTransitionEnd);
    };
    popupElement.addEventListener('transitionend', handleTransitionEnd);

    if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
      lastFocusedElement.focus({ preventScroll: true });
    }
  };

  const startHold = () => {
    clearTimeout(holdTimer);
    holdTimer = window.setTimeout(showPopup, HOLD_DURATION);
  };

  const cancelHold = () => {
    clearTimeout(holdTimer);
    holdTimer = null;
  };

  const bindWayVButton = () => {
    const wayvButton = document.querySelector('[data-wayv-button]');
    if (!wayvButton) return;

    wayvButton.addEventListener('pointerdown', startHold);
    wayvButton.addEventListener('pointerup', cancelHold);
    wayvButton.addEventListener('pointerleave', cancelHold);
    wayvButton.addEventListener('pointercancel', cancelHold);
  };

  const init = () => {
    bindWayVButton();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  document.addEventListener('partials:loaded', bindWayVButton);
})();
