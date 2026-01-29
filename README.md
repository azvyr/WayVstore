# WayVstore

WayVstore is a static marketing site for WayV, highlighting the WaveOS platform and Wavium studio. The pages are built with semantic HTML and Tailwind via CDN, making it easy to view locally without a build step.

## Getting started
- Clone the repository and open any page directly in your browser (for example, `index.html`).
- For a simple local server with automatic MIME types, run `python -m http.server` from the repository root and visit `http://localhost:8000`.
- Assets live under `assets/` and are referenced with relative paths, so the site works from any static host (including GitHub Pages).

## Project structure
- `index.html` – Landing page overview.
- `waveos.html` – WaveOS product details.
- `company.html` – Company mission and values.
- `support.html` – Support and contact information.
- `assets/` – Shared images, CSS, and JavaScript (including the responsive navigation controller).

## Responsive navigation
On screens below the `md` breakpoint, the top bar swaps to a hamburger toggle. The button controls a slide-down menu that includes all primary links and relevant calls-to-action, ensuring the site remains easy to navigate on phones and small tablets.

## Contributing
Open an issue or submit a pull request for improvements. Keep pages lightweight, avoid build-time dependencies when possible, and ensure new sections remain responsive.
