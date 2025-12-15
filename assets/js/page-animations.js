(function () {
  const enablePage = () => {
    document.documentElement.classList.add('page-ready');
    document.body.classList.add('page-shell');
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', enablePage);
  } else {
    enablePage();
  }
})();
