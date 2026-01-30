// Dynamically loads header and footer into the page
function loadInclude(id, file) {
  fetch(file)
    .then(response => response.text())
    .then(data => {
      document.getElementById(id).innerHTML = data;
      if (window.lucide) lucide.createIcons();
    });
}
document.addEventListener('DOMContentLoaded', function() {
  if (document.getElementById('header-include')) {
    loadInclude('header-include', 'assets/js/header.html');
  }
  if (document.getElementById('footer-include')) {
    loadInclude('footer-include', 'assets/js/footer.html');
  }
});