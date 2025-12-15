(function () {
  const enablePage = () => {
    document.documentElement.classList.add('page-ready');
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', enablePage);
  } else {
    enablePage();
  }
})();
