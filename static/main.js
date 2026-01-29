// JS for navigation and interactivity
// Placeholder for SPA-like navigation and menu toggling

document.getElementById('navbar').innerHTML = `
  <div class="navbar-container">
    <a href="index.html" class="logo"><img src="../assets/images/wayv-logo.svg" alt="WayV Logo" style="height:2rem;vertical-align:middle;"> WayV</a>
    <nav class="nav-links">
      <a href="products.html">Products</a>
      <a href="community.html">Community</a>
      <a href="about.html">About</a>
    </nav>
  </div>
`;

document.getElementById('footer').innerHTML = `
  <div class="footer-container">
    <img src="../assets/images/wayv-logo.svg" alt="WayV Logo" style="height:1.5rem;vertical-align:middle;margin-right:0.5rem;">
    <span>© 2026 WayV Technology Inc. All rights reserved.</span>
  </div>
`;

document.getElementById('main-content').innerHTML = `
  <section id="hero">
    <h1>Build the Future<br><span class="gradient-text">With Open Source</span></h1>
    <p>WayV empowers developers with next-gen tools. From robust operating systems to high-performance game engines.</p>
    <div class="hero-buttons">
      <a href="#products" class="btn-primary">Start Building</a>
      <a href="https://github.com/Sw3bbl3/WayVstore" class="btn-secondary">View on GitHub</a>
    </div>
  </section>
`;
