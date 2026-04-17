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
});
