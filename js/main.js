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

  // ===== CAS Schedules: Next Race banner + per-series row highlight =====
  const nextRaceBanner = document.getElementById('next-race-banner');
  if (nextRaceBanner) {
    // Metadata for each series
    const SERIES_META = {
      'sched-wct':  { nameEN: 'CAS GT3 World Championship Tour', nameDE: 'CAS GT3 World Championship Tour', seasonEN: '12th Season', seasonDE: '12. Saison', raceday: 'Tuesday 18:00\u201321:00 CET', racedayDE: 'Dienstag 18:00\u201321:00 CET', icon: '\uD83C\uDFC6' },
      'sched-cc':   { nameEN: 'Combined Cup',                    nameDE: 'Combined Cup',                    seasonEN: '10th Season', seasonDE: '10. Saison', raceday: 'Friday 19:00\u201321:00 CET',   racedayDE: 'Freitag 19:00\u201321:00 CET',   icon: '\uD83C\uDFCE\uFE0F' },
      'sched-sfl':  { nameEN: 'CAS Super Formula Lights Cup',    nameDE: 'CAS Super Formula Lights Cup',    seasonEN: '7th Season',  seasonDE: '7. Saison',  raceday: 'Wednesday 19:00\u201321:00 CET', racedayDE: 'Mittwoch 19:00\u201321:00 CET', icon: '\uD83C\uDFCE\uFE0F' },
      'sched-pccd': { nameEN: 'CAS Porsche Community Cup DE',    nameDE: 'CAS Porsche Community Cup DE',    seasonEN: '4th Season',  seasonDE: '4. Saison',  raceday: 'See CAS calendar',               racedayDE: 'Siehe CAS-Kalender',             icon: '\uD83C\uDFC1' },
      'sched-gt4':  { nameEN: 'TSS GT4 Masters',                 nameDE: 'TSS GT4 Masters',                 seasonEN: '3rd Season',  seasonDE: '3. Saison',  raceday: 'Monday 18:45 CET',               racedayDE: 'Montag 18:45 CET',               icon: '\uD83C\uDFCE\uFE0F' }
    };

    // Collect all races from the DOM
    const rows = document.querySelectorAll('tr[data-date][data-series]');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const races = [];
    rows.forEach(tr => {
      const dateStr = tr.getAttribute('data-date');
      const series  = tr.getAttribute('data-series');
      const tds = tr.querySelectorAll('td');
      const round   = tds[0] ? tds[0].textContent.trim() : '';
      const circuit = tds[tds.length - 1] ? tds[tds.length - 1].textContent.trim() : '';
      const date = new Date(dateStr + 'T00:00:00');
      races.push({ dateStr, date, series, round, circuit, tr });
    });

    // Sort by date ascending
    races.sort((a, b) => a.date - b.date);

    // Per-series: find next upcoming race and highlight its row
    const seenSeries = new Set();
    races.forEach(r => {
      if (r.date >= today && !seenSeries.has(r.series)) {
        seenSeries.add(r.series);
        r.tr.classList.add('next-up');
      }
    });

    // Overall next race (earliest future race across all series)
    const upcoming = races.filter(r => r.date >= today);
    const next = upcoming[0];

    if (next) {
      const meta = SERIES_META[next.series] || {};
      const name   = isDE ? meta.nameDE   : meta.nameEN;
      const season = isDE ? meta.seasonDE : meta.seasonEN;
      const rd     = isDE ? meta.racedayDE : meta.raceday;
      const locale = isDE ? 'de-DE' : 'en-US';
      const dateFmt = next.date.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
      const msPerDay = 24 * 60 * 60 * 1000;
      const daysUntil = Math.round((next.date - today) / msPerDay);
      let countdown;
      if (daysUntil === 0) countdown = isDE ? 'Heute'      : 'Today';
      else if (daysUntil === 1) countdown = isDE ? 'Morgen' : 'Tomorrow';
      else countdown = isDE ? ('In ' + daysUntil + ' Tagen') : ('In ' + daysUntil + ' days');

      const labelNext   = isDE ? 'N\u00C4CHSTES RENNEN'      : 'NEXT RACE';
      const labelRound  = isDE ? 'Runde'                     : 'Round';
      const labelJump   = isDE ? 'Zum Kalender \u2192'       : 'Jump to schedule \u2192';

      nextRaceBanner.innerHTML = ''
        + '<div style="display:flex; flex-wrap:wrap; align-items:center; gap: 1rem 1.5rem; justify-content: space-between;">'
        +   '<div style="flex:1 1 280px; min-width: 260px;">'
        +     '<div style="display:inline-block; font-family: var(--font-heading); font-size: 0.7rem; letter-spacing: 1.5px; font-weight: 700; color: var(--accent-red); padding: 0.2rem 0.55rem; background: rgba(230,57,70,0.18); border-radius: 4px; margin-bottom: 0.55rem;">' + labelNext + ' \u2022 ' + countdown + '</div>'
        +     '<h3 style="font-family: var(--font-heading); font-size: 1.35rem; font-weight: 700; color: #fff; margin: 0 0 0.35rem;">' + (meta.icon ? (meta.icon + ' ') : '') + name + '</h3>'
        +     '<p style="margin: 0; font-size: 0.95rem; color: rgba(255,255,255,0.85);">'
        +       '<strong>' + labelRound + ' ' + next.round + '</strong> \u2014 ' + next.circuit
        +     '</p>'
        +     '<p style="margin: 0.35rem 0 0; font-size: 0.85rem; color: rgba(255,255,255,0.6);">' + dateFmt + ' \u2022 ' + rd + ' \u2022 ' + season + '</p>'
        +   '</div>'
        +   '<a href="#' + next.series + '" style="align-self: center; display: inline-flex; align-items: center; padding: 0.65rem 1.2rem; border-radius: 6px; background: var(--accent-red); color: #fff; text-decoration: none; font-family: var(--font-heading); font-weight: 600; font-size: 0.85rem; letter-spacing: 0.5px;">' + labelJump + '</a>'
        + '</div>';
      nextRaceBanner.style.display = '';
    }
  }
});
