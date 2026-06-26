// ===== SIMRACING HUB - Main JavaScript =====

// Mobile menu toggle
document.addEventListener('DOMContentLoaded', () => {
  const menuToggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('nav');

  if (menuToggle && nav) {
    menuToggle.addEventListener('click', () => {
      nav.classList.toggle('open');
      menuToggle.textContent = nav.classList.contains('open') ? '\u2715' : '\u2630';
    });

    // Close menu on link click (mobile)
    nav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        nav.classList.remove('open');
        menuToggle.textContent = '\u2630';
      });
    });
  }

  // Set active nav link based on current page
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('nav a').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });

  // Detect language from <html lang="...">
  const lang = document.documentElement.lang || 'en';
  const isDE = lang === 'de';

  // Update hero date dynamically (homepage only)
  const heroDate = document.querySelector('.hero-date');
  if (heroDate) {
    const now = new Date();
    const locale = isDE ? 'de-DE' : 'en-US';
    const dateStr = now.toLocaleDateString(locale, {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    const timeStr = now.toLocaleTimeString(locale, {
      hour: '2-digit', minute: '2-digit', timeZoneName: 'short'
    });
    const prefix = isDE ? 'Aktualisiert' : 'Updated';
    heroDate.textContent = prefix + ' ' + dateStr + ' \u2022 ' + timeStr;
  }

  // Update last-updated timestamp in footer
  const lastUpdated = document.querySelector('.last-updated');
  if (lastUpdated) {
    const now = new Date();
    const locale = isDE ? 'de-DE' : 'en-US';
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    const prefix = isDE ? 'Zuletzt aktualisiert: ' : 'Last updated: ';
    lastUpdated.textContent = prefix + now.toLocaleDateString(locale, options);
  }

  // ===== Image lightbox (click to enlarge) =====
  // Activates only for images carrying the .zoomable class, so it is a
  // no-op on pages that don't use it.
  const zoomables = document.querySelectorAll('img.zoomable');
  if (zoomables.length) {
    // Inject styles once
    const css = document.createElement('style');
    css.textContent =
      'img.zoomable{cursor:zoom-in;}' +
      '#lb-overlay{position:fixed;inset:0;background:rgba(5,5,9,0.92);display:flex;align-items:center;justify-content:center;z-index:9999;padding:2rem;cursor:zoom-out;opacity:0;visibility:hidden;transition:opacity .18s ease;}' +
      '#lb-overlay.open{opacity:1;visibility:visible;}' +
      '#lb-overlay img{max-width:95vw;max-height:90vh;width:auto;height:auto;border-radius:8px;box-shadow:0 12px 48px rgba(0,0,0,.7);border:1px solid rgba(255,255,255,0.1);}' +
      '#lb-overlay .lb-close{position:fixed;top:0.75rem;right:1.25rem;color:#fff;font-size:2.4rem;line-height:1;cursor:pointer;font-family:Arial,sans-serif;opacity:0.85;}' +
      '#lb-overlay .lb-close:hover{opacity:1;}' +
      '#lb-overlay .lb-cap{position:fixed;bottom:1rem;left:0;right:0;text-align:center;color:rgba(255,255,255,0.75);font-family:var(--font-heading,sans-serif);font-size:0.85rem;padding:0 1rem;}';
    document.head.appendChild(css);

    let ov = null;
    const buildOverlay = () => {
      ov = document.createElement('div');
      ov.id = 'lb-overlay';
      ov.setAttribute('role', 'dialog');
      ov.setAttribute('aria-modal', 'true');
      ov.innerHTML = '<span class="lb-close" aria-label="Close">&times;</span><img alt=""><div class="lb-cap"></div>';
      document.body.appendChild(ov);
      ov.addEventListener('click', closeLb);
    };
    const openLb = (src, alt) => {
      if (!ov) buildOverlay();
      ov.querySelector('img').src = src;
      ov.querySelector('img').alt = alt || '';
      ov.querySelector('.lb-cap').textContent = alt || '';
      ov.classList.add('open');
      document.body.style.overflow = 'hidden';
    };
    const closeLb = () => {
      if (ov) { ov.classList.remove('open'); document.body.style.overflow = ''; }
    };
    zoomables.forEach(im => {
      im.addEventListener('click', () => openLb(im.getAttribute('src'), im.alt));
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLb(); });
  }
});
