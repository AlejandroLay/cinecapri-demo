(function () {
  'use strict';
  var C = window.Capri, D = C.Dates, esc = C.esc;
  var data = C.Store.load();
  var T = D.today();
  var isRealToday = T === D.realToday();
  var nowHM = (function () { var d = new Date(); return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2); })();
  // Hora "ara". Per provar: ?avui=2026-11-14&hora=18:00
  var horaParam = (function () {
    try { var h = new URLSearchParams(location.search).get('hora'); return /^\d{2}:\d{2}$/.test(h || '') ? h : ''; }
    catch (e) { return ''; }
  })();
  var NOW = horaParam || (isRealToday ? nowHM : '00:00');

  // Una sessió ja ha començat si és d'avui i la seva hora ja ha arribat.
  function started(date, time) { return date === T && time <= NOW; }

  function $(id) { return document.getElementById(id); }

  /* ---------- Preparar la cartellera ---------- */
  // De cada pel·lícula ens quedem els dies que encara tenen alguna sessió per començar,
  // i en guardem la propera sessió (dia + hora) per ordenar.
  var films = data.films.map(function (f) {
    var next = (f.days || [])
      .filter(function (d) {
        if (!d.times || !d.times.length || d.date < T) return false;
        return d.times.some(function (t) { return !started(d.date, t); });
      })
      .sort(function (a, b) { return a.date.localeCompare(b.date); });
    var first = null;
    if (next.length) {
      var d0 = next[0];
      var t0 = d0.times.slice().sort().filter(function (t) { return !started(d0.date, t); })[0];
      first = d0.date + ' ' + t0;
    }
    return Object.assign({}, f, { next: next, nextSession: first });
  });

  // Ordre: primer la pel·lícula amb la sessió més propera que encara no ha començat.
  var upcoming = films
    .filter(function (f) { return !f.pending && f.nextSession; })
    .sort(function (a, b) { return a.nextSession.localeCompare(b.nextSession); });
  var pending = films.filter(function (f) { return f.pending; });

  var limit = D.addDays(T, 7);
  var featured = upcoming.filter(function (f) { return f.next[0].date <= limit; });
  if (!featured.length && upcoming.length) {
    featured = [upcoming[0]];
    el('titol-destacat', function (t) { t.textContent = 'La propera pel·lícula'; });
  }
  var rest = upcoming.filter(function (f) { return featured.indexOf(f) === -1; });

  /* ---------- Peces ---------- */
  function tags(f) {
    var t = [];
    if (f.kind === 'cineclub') t.push('<span class="tag tag-club">Cine Club · Programació municipal</span>');
    if (f.family) t.push('<span class="tag tag-family">Per a tota la família</span>');
    if (f.rating && f.rating !== 'Tots els públics') t.push('<span class="tag">' + esc(f.rating) + '</span>');
    return t.length ? '<div class="tags">' + t.join('') + '</div>' : '';
  }

  function meta(f) {
    var m = [];
    if (f.runtime) m.push(f.runtime + ' min');
    if (f.rating === 'Tots els públics') m.push('Tots els públics');
    return m.length ? '<p class="meta">' + esc(m.join(' · ')) + '</p>' : '';
  }

  function dayLabel(date) {
    if (date === T) return '<span class="today">Avui</span> ' + esc(D.dayNum(date));
    if (date === D.addDays(T, 1)) return '<span class="tomorrow">Demà</span> ' + esc(D.dayNum(date));
    return esc(D.long(date));
  }

  function timesHTML(day) {
    return day.times.map(function (t) {
      var past = started(day.date, t);
      return '<span class="time' + (past ? ' past' : '') + '"' + (past ? ' title="Sessió ja començada"' : '') + '>' + esc(t) + '</span>';
    }).join('');
  }

  function sessionsTable(f) {
    return '<table class="sessions"><tbody>' + f.next.map(function (d) {
      return '<tr><th scope="row">' + dayLabel(d.date) + '</th><td><div class="times">' + timesHTML(d) + '</div></td></tr>';
    }).join('') + '</tbody></table>';
  }

  function trailerLink(f) {
    return f.trailer ? '<a class="link" href="' + esc(f.trailer) + '" target="_blank" rel="noopener">Mira el tràiler</a>' : '';
  }

  /* ---------- Aquesta setmana ---------- */
  function renderFeatured() {
    var box = $('destacat');
    if (!featured.length) {
      box.innerHTML = '<p class="empty">Ara mateix no hi ha sessions programades. Aviat hi haurà novetats!</p>';
      return;
    }
    box.innerHTML = featured.map(function (f) {
      return '<article class="feature">' +
        '<button class="poster-btn" data-open="' + esc(f.id) + '" aria-label="Més informació de ' + esc(f.title) + '">' + C.posterHTML(f) + '</button>' +
        '<div class="feature-body">' +
          tags(f) +
          '<h3 class="film-title">' + esc(f.title) + '</h3>' +
          meta(f) +
          sessionsTable(f) +
          '<div class="actions">' +
            '<button class="btn" data-open="' + esc(f.id) + '">Més informació</button>' +
            trailerLink(f) +
          '</div>' +
        '</div>' +
      '</article>';
    }).join('');
  }

  /* ---------- Properament, agrupat per mesos ---------- */
  function renderRest() {
    var box = $('properament');
    if (!rest.length) { $('properament-sec').hidden = true; return; }
    var html = '', month = '';
    rest.forEach(function (f) {
      var m = D.monthName(f.next[0].date);
      if (m !== month) {
        if (month) html += '</ul>';
        html += '<h3 class="month">' + esc(m) + '</h3><ul class="rows">';
        month = m;
      }
      var dates = f.next.map(function (d) { return d.date; });
      var stub = D.stub(dates);
      html += '<li><button class="row" data-open="' + esc(f.id) + '">' +
        '<span class="stub"><span class="stub-top">' + esc(stub.top) + '</span><span class="stub-bottom">' + esc(stub.bottom) + '</span></span>' +
        C.posterHTML(f, 'thumb') +
        '<span class="row-main">' +
          '<span class="row-title">' + esc(f.title) + '</span>' +
          '<span class="row-days">' + esc(D.list(dates)) + '</span>' +
          tags(f) +
        '</span>' +
        '<span class="row-more" aria-hidden="true">Horaris</span>' +
      '</button></li>';
    });
    box.innerHTML = html + '</ul>';
  }

  function renderPending() {
    if (!pending.length) return;
    $('pendents-sec').hidden = false;
    $('pendents').innerHTML = pending.map(function (f) {
      return '<li>' + esc(f.title) + (f.family ? ' <span class="tag tag-family">Per a tota la família</span>' : '') + '</li>';
    }).join('');
  }

  /* ---------- Informació ---------- */
  // Cada peça només es pinta si existeix a la pàgina (portada o història).
  function el(id, fn) { var e = $(id); if (e) fn(e); }

  function renderInfo() {
    var s = data.settings;
    if (s.notice && s.notice.trim()) {
      el('avis', function (n) { n.innerHTML = '<div class="wrap">' + esc(s.notice) + '</div>'; n.hidden = false; });
    }
    el('taula-preus', function (t) {
      t.innerHTML = (s.prices || []).map(function (p) {
        return '<tr><th scope="row">' + esc(p.label) + '</th><td>' + esc(p.price) + '</td></tr>';
      }).join('');
    });
    if (s.priceNote) el('nota-preus', function (n) { n.textContent = s.priceNote; n.hidden = false; });
    el('taquilla', function (t) { t.textContent = s.boxOffice || ''; });
    var tel = (s.phone || '').replace(/\s+/g, '');
    ['tel-link', 'peu-tel'].forEach(function (id) { el(id, function (a) { a.textContent = s.phone; a.href = 'tel:+34' + tel; }); });
    el('adreca', function (e) { e.textContent = s.address; });
    el('ciutat', function (e) { e.textContent = s.city; });
    el('peu-adreca', function (e) { e.textContent = s.address + ' · ' + s.city; });
    var so = s.social || {};
    [['s-ig', so.instagram], ['s-fb', so.facebook], ['s-x', so.x]].forEach(function (p) {
      el(p[0], function (a) { if (p[1]) a.href = p[1]; else a.remove(); });
    });
  }

  /* ---------- Fitxa de la pel·lícula ---------- */
  var dlg = $('fitxa');
  function openFilm(id) {
    var f = films.filter(function (x) { return x.id === id; })[0];
    if (!f) return;
    var extra = f.link ? '<a class="link" href="' + esc(f.link) + '" target="_blank" rel="noopener">Més informació a la web de l\'organitzador</a>' : '';
    $('fitxa-cos').innerHTML =
      '<div class="sheet-head"><button class="close" data-close aria-label="Tanca">Tanca</button></div>' +
      '<div class="sheet-grid">' +
        C.posterHTML(f, 'sheet-poster') +
        '<div>' +
          tags(f) +
          '<h2 class="film-title" id="fitxa-titol">' + esc(f.title) + '</h2>' +
          meta(f) +
          (f.synopsis ? '<p class="synopsis">' + esc(f.synopsis) + '</p>' : '') +
          (f.next.length ? '<h3 class="sheet-sub">Sessions</h3>' + sessionsTable(f) : '<p class="note">Data per confirmar.</p>') +
          '<div class="actions">' + trailerLink(f) + extra + '</div>' +
        '</div>' +
      '</div>';
    if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
  }
  function closeFilm() { if (dlg.open) { if (dlg.close) dlg.close(); else dlg.removeAttribute('open'); } }

  document.addEventListener('click', function (e) {
    var o = e.target.closest('[data-open]');
    if (o) { openFilm(o.getAttribute('data-open')); return; }
    if (e.target.closest('[data-close]') || e.target === dlg) closeFilm();
  });

  renderInfo();
  if ($('destacat')) {
    renderFeatured();
    renderRest();
    renderPending();
  }
})();
