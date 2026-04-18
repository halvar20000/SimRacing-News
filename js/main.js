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

  // ===== CAS Schedules: Next Race banner + per-series row highlight + .ics export =====
  const nextRaceBanner = document.getElementById('next-race-banner');
  if (nextRaceBanner) {
    // Metadata for each series
    const SERIES_META = {
      'sched-wct':  { nameEN: 'CAS GT3 World Championship Tour', nameDE: 'CAS GT3 World Championship Tour', seasonEN: '12th Season', seasonDE: '12. Saison', raceday: 'Tuesday 18:00\u201321:00 CET', racedayDE: 'Dienstag 18:00\u201321:00 CET', icon: '\uD83C\uDFC6', icsFile: 'cas-wct-2026',           icsShort: 'WCT',     icsStart: '180000', icsEnd: '210000' },
      'sched-cc':   { nameEN: 'Combined Cup',                    nameDE: 'Combined Cup',                    seasonEN: '10th Season', seasonDE: '10. Saison', raceday: 'Friday 19:00\u201321:00 CET',   racedayDE: 'Freitag 19:00\u201321:00 CET',   icon: '\uD83C\uDFCE\uFE0F', icsFile: 'cas-combined-cup-2026', icsShort: 'CC',      icsStart: '190000', icsEnd: '210000' },
      'sched-sfl':  { nameEN: 'CAS Super Formula Lights Cup',    nameDE: 'CAS Super Formula Lights Cup',    seasonEN: '7th Season',  seasonDE: '7. Saison',  raceday: 'Wednesday 19:00\u201321:00 CET', racedayDE: 'Mittwoch 19:00\u201321:00 CET', icon: '\uD83C\uDFCE\uFE0F', icsFile: 'cas-sfl-2026',           icsShort: 'SFL',     icsStart: '190000', icsEnd: '210000' },
      'sched-pccd': { nameEN: 'CAS Porsche Community Cup Deutschland', nameDE: 'CAS Porsche Community Cup Deutschland', seasonEN: '4th Season',  seasonDE: '4. Saison',  raceday: 'See CAS calendar',               racedayDE: 'Siehe CAS-Kalender',             icon: '\uD83C\uDFC1',       icsFile: 'cas-porsche-cup-2026',  icsShort: 'PCCD',    icsStart: '200000', icsEnd: '213000' },
      'sched-gt4':  { nameEN: 'TSS GT4 Masters',                 nameDE: 'TSS GT4 Masters',                 seasonEN: '3rd Season',  seasonDE: '3. Saison',  raceday: 'Monday 18:45 CET',               racedayDE: 'Montag 18:45 CET',               icon: '\uD83C\uDFCE\uFE0F', icsFile: 'tss-gt4-masters-2026',  icsShort: 'GT4',     icsStart: '184500', icsEnd: '204500' }
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

    // ===== .ics calendar export =====
    function icsEscape(s) {
      return String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
    }

    function stripEmoji(s) {
      // Strip leading flag/country emoji pair + any surrounding whitespace
      return s.replace(/^\s*[\uD83C\uDDE6-\uDDFF]{2}\s*/g, '').replace(/^\s*[\u2600-\u27BF\uD83C\uDF00-\uDFFF\uD83D\uDC00-\uDFFF\uD83E\uDD00-\uDFFF]\s*/g, '').trim();
    }

    function nowUTCStamp() {
      const d = new Date();
      const pad = n => String(n).padStart(2, '0');
      return d.getUTCFullYear() + pad(d.getUTCMonth() + 1) + pad(d.getUTCDate())
           + 'T' + pad(d.getUTCHours()) + pad(d.getUTCMinutes()) + pad(d.getUTCSeconds()) + 'Z';
    }

    function buildICS(seriesId) {
      const meta = SERIES_META[seriesId];
      if (!meta) return '';
      const seriesRaces = races.filter(r => r.series === seriesId);
      const stamp = nowUTCStamp();
      const name = isDE ? meta.nameDE : meta.nameEN;
      const season = isDE ? meta.seasonDE : meta.seasonEN;
      const pageUrl = 'https://simracing-hub.com/' + (isDE ? 'de/' : '') + 'cas-community.html#' + seriesId;

      const lines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//SimRacing Hub//CAS Schedules//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'X-WR-CALNAME:' + icsEscape(name + ' 2026'),
        'X-WR-CALDESC:' + icsEscape(name + ' \u2014 ' + season),
        'X-WR-TIMEZONE:Europe/Paris',
        // Minimal Europe/Paris VTIMEZONE (CET/CEST DST rules)
        'BEGIN:VTIMEZONE',
        'TZID:Europe/Paris',
        'BEGIN:STANDARD',
        'DTSTART:19701025T030000',
        'TZOFFSETFROM:+0200',
        'TZOFFSETTO:+0100',
        'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU',
        'TZNAME:CET',
        'END:STANDARD',
        'BEGIN:DAYLIGHT',
        'DTSTART:19700329T020000',
        'TZOFFSETFROM:+0100',
        'TZOFFSETTO:+0200',
        'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU',
        'TZNAME:CEST',
        'END:DAYLIGHT',
        'END:VTIMEZONE'
      ];

      seriesRaces.forEach(r => {
        const dateCompact = r.dateStr.replace(/-/g, '');
        const circuit = stripEmoji(r.circuit);
        const summary = meta.icsShort + ' R' + r.round + ' \u2014 ' + circuit;
        const description = name + ' \u2014 ' + season + '\\nRound ' + r.round + ' \u2014 ' + circuit + '\\n\\n' + pageUrl;
        lines.push(
          'BEGIN:VEVENT',
          'UID:' + seriesId + '-r' + r.round + '-2026@simracing-hub.com',
          'DTSTAMP:' + stamp,
          'DTSTART;TZID=Europe/Paris:' + dateCompact + 'T' + meta.icsStart,
          'DTEND;TZID=Europe/Paris:' + dateCompact + 'T' + meta.icsEnd,
          'SUMMARY:' + icsEscape(summary),
          'LOCATION:' + icsEscape(circuit),
          'DESCRIPTION:' + icsEscape(description).replace(/\\\\n/g, '\\n'),
          'URL:' + pageUrl,
          'END:VEVENT'
        );
      });

      lines.push('END:VCALENDAR');
      return lines.join('\r\n');
    }

    function downloadICS(seriesId) {
      const meta = SERIES_META[seriesId];
      if (!meta) return;
      const ics = buildICS(seriesId);
      const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = meta.icsFile + '.ics';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 500);
    }

    // Inject a download button into each schedule wrapper
    const btnLabel = isDE ? 'Zum Kalender hinzuf\u00FCgen (.ics)' : 'Add to Calendar (.ics)';
    const btnHint  = isDE ? 'F\u00FCr Google / Apple / Outlook \u2014 alle Rennen auf einmal' : 'Google / Apple / Outlook compatible \u2014 all races at once';

    Object.keys(SERIES_META).forEach(seriesId => {
      const wrapper = document.getElementById(seriesId);
      if (!wrapper) return;
      const table = wrapper.querySelector('table');
      if (!table) return;

      const btnWrap = document.createElement('div');
      btnWrap.style.cssText = 'display: flex; flex-wrap: wrap; align-items: center; gap: 0.65rem 1rem; padding: 0 1.5rem 1rem;';
      btnWrap.innerHTML = ''
        + '<button type="button" class="ics-btn" data-series="' + seriesId + '" style="display:inline-flex; align-items:center; gap:0.5rem; padding:0.55rem 1rem; border-radius:6px; background: var(--accent-red); color:#fff; border:none; cursor:pointer; font-family: var(--font-heading); font-weight:600; font-size:0.82rem; letter-spacing:0.3px;">'
        +   '<span aria-hidden="true" style="font-size:1rem;">\uD83D\uDCC5</span> ' + btnLabel
        + '</button>'
        + '<span style="font-size:0.78rem; color: rgba(255,255,255,0.55);">' + btnHint + '</span>';

      // Insert just before the <table>
      wrapper.insertBefore(btnWrap, table);
    });

    // Delegate click handler
    document.querySelectorAll('.ics-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        const sid = btn.getAttribute('data-series');
        if (sid) downloadICS(sid);
      });
    });
  }
});
