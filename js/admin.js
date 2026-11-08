(function () {
  'use strict';
  var C = window.Capri, D = C.Dates, esc = C.esc;
  var data = C.Store.load();
  var T = D.today();
  var view = $('view');
  var showPast = false;
  var draft = null;          // pel·lícula que s'està editant
  var tab = 'films';

  var COLORS = ['#7a3b2e', '#2f4b6e', '#3d5a3a', '#b3842a', '#5a3d5c', '#6b4a2f', '#30302e', '#8a5a2b'];
  var RATINGS = ['', 'Tots els públics', '+7', '+12', '+16', '+18'];

  function $(id) { return document.getElementById(id); }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  function persist(msg) {
    if (!C.Store.save(data)) {
      alert('No s\'ha pogut desar. Potser les imatges són massa grans per a la demo.');
      return false;
    }
    toast(msg || 'Desat');
    return true;
  }

  var toastTimer;
  function toast(msg) {
    var t = $('toast');
    t.textContent = msg; t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.hidden = true; }, 2200);
  }

  /* ---------- Accés (només demo; a la versió real hi haurà usuaris de veritat) ---------- */
  function loggedIn() { try { return sessionStorage.getItem('capri-admin') === '1'; } catch (e) { return false; } }
  function showApp() { $('login').hidden = true; $('app').hidden = false; go(tab); }
  $('login-form').addEventListener('submit', function (e) {
    e.preventDefault();
    if ($('pass').value.trim().toLowerCase() === 'capri') {
      try { sessionStorage.setItem('capri-admin', '1'); } catch (err) { /* res */ }
      showApp();
    } else {
      $('login-error').hidden = false;
    }
  });
  $('logout').addEventListener('click', function () {
    try { sessionStorage.removeItem('capri-admin'); } catch (e) { /* res */ }
    location.reload();
  });

  document.querySelectorAll('[data-tab]').forEach(function (b) {
    b.addEventListener('click', function () { go(b.getAttribute('data-tab')); });
  });

  function go(t) {
    tab = t; draft = null;
    document.querySelectorAll('[data-tab]').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-tab') === t);
    });
    if (t === 'settings') renderSettings(); else renderList();
    window.scrollTo(0, 0);
  }

  /* ---------- Llista de pel·lícules ---------- */
  function status(f) {
    var days = (f.days || []).map(function (d) { return d.date; }).sort();
    if (f.pending) return 'pending';
    if (!days.length) return 'empty';
    if (days[days.length - 1] < T) return 'past';
    return 'upcoming';
  }
  function firstDate(f) { var d = (f.days || []).map(function (x) { return x.date; }).sort(); return d[0] || '9999'; }
  function upcomingDates(f) { return (f.days || []).map(function (d) { return d.date; }).filter(function (d) { return d >= T; }).sort(); }

  function renderList() {
    var order = { upcoming: 0, empty: 1, pending: 2, past: 3 };
    var list = data.films.slice().sort(function (a, b) {
      return order[status(a)] - order[status(b)] || firstDate(a).localeCompare(firstDate(b));
    });
    var pastCount = list.filter(function (f) { return status(f) === 'past'; }).length;
    if (!showPast) list = list.filter(function (f) { return status(f) !== 'past'; });

    view.innerHTML =
      '<div class="list-head">' +
        '<h1>Cartellera</h1>' +
        '<button class="btn" id="add">+ Afegeix una pel·lícula</button>' +
      '</div>' +
      (list.length ? '<ul class="admin-list">' + list.map(function (f) {
        var st = status(f), up = upcomingDates(f);
        var when = st === 'pending' ? 'Data per confirmar'
          : st === 'empty' ? 'Sense sessions'
          : st === 'past' ? 'Ja s\'ha projectat'
          : D.list(up);
        var badge = st === 'pending' ? '<span class="badge">Pendent</span>'
          : st === 'past' ? '<span class="badge muted">Passada</span>'
          : st === 'empty' ? '<span class="badge warn">Sense sessions</span>' : '';
        if (f.kind === 'cineclub') badge += '<span class="badge club">Cine Club</span>';
        return '<li class="admin-item ' + st + '">' +
          C.posterHTML(f, 'thumb') +
          '<div class="admin-item-main"><strong>' + esc(f.title) + '</strong><span>' + esc(when) + '</span><div>' + badge + '</div></div>' +
          '<div class="admin-item-actions">' +
            '<button class="btn small" data-edit="' + esc(f.id) + '">Edita</button>' +
            '<button class="btn small ghost" data-del="' + esc(f.id) + '">Esborra</button>' +
          '</div>' +
        '</li>';
      }).join('') + '</ul>' : '<p class="empty">Encara no hi ha cap pel·lícula. Afegeix-ne una.</p>') +
      (pastCount ? '<p><button class="linklike" id="toggle-past">' + (showPast ? 'Amaga les passades' : 'Mostra les passades (' + pastCount + ')') + '</button></p>' : '') +
      '<p class="hint">Les sessions que ja han passat desapareixen soles de la web. No cal esborrar-les.</p>';

    $('add').addEventListener('click', function () { openEditor(null); });
    var tp = $('toggle-past');
    if (tp) tp.addEventListener('click', function () { showPast = !showPast; renderList(); });
    view.querySelectorAll('[data-edit]').forEach(function (b) {
      b.addEventListener('click', function () { openEditor(b.getAttribute('data-edit')); });
    });
    view.querySelectorAll('[data-del]').forEach(function (b) {
      b.addEventListener('click', function () {
        var id = b.getAttribute('data-del');
        var f = data.films.filter(function (x) { return x.id === id; })[0];
        if (f && confirm('Segur que vols esborrar «' + f.title + '»?')) {
          data.films = data.films.filter(function (x) { return x.id !== id; });
          persist('Esborrada');
          renderList();
        }
      });
    });
  }

  /* ---------- Editor ---------- */
  function newFilm() {
    return {
      id: C.Store.newId(), title: '', kind: 'film', family: false, rating: '', runtime: null,
      synopsis: '', poster: '', trailer: '', link: '', pending: false,
      color: COLORS[data.films.length % COLORS.length],
      days: [{ date: nextWeekend(), times: [] }]
    };
  }
  function nextWeekend() {
    // proper dissabte
    var d = D.parse(T), add = (6 - d.getDay() + 7) % 7 || 7;
    return D.addDays(T, add);
  }

  function openEditor(id) {
    var f = id ? data.films.filter(function (x) { return x.id === id; })[0] : null;
    draft = f ? clone(f) : newFilm();
    draft._isNew = !f;
    renderEditor();
    window.scrollTo(0, 0);
  }

  function field(name) { return view.querySelector('[name="' + name + '"]'); }

  function syncForm() {
    if (!draft) return;
    draft.title = field('title').value.trim();
    draft.kind = field('kind').value;
    draft.family = field('family').checked;
    draft.rating = field('rating').value;
    draft.runtime = parseInt(field('runtime').value, 10) || null;
    draft.synopsis = field('synopsis').value.trim();
    draft.trailer = field('trailer').value.trim();
    draft.link = field('link').value.trim();
    draft.pending = field('pending').checked;
    draft.days = Array.prototype.map.call(view.querySelectorAll('.day-row'), function (row) {
      return { date: row.querySelector('[data-date]').value, timesRaw: row.querySelector('[data-times]').value };
    });
  }

  function timesText(day) {
    if (day.timesRaw != null) return day.timesRaw;
    return (day.times || []).join(', ');
  }

  function dayRowsHTML() {
    if (!draft.days.length) return '<p class="hint">Cap dia afegit.</p>';
    return draft.days.map(function (d, i) {
      var label = d.date ? D.long(d.date) : '';
      return '<div class="day-row">' +
        '<label><span>Dia</span><input type="date" data-date value="' + esc(d.date) + '" required></label>' +
        '<label class="grow"><span>Hores</span><input type="text" data-times inputmode="numeric" placeholder="17:00, 19:30" value="' + esc(timesText(d)) + '"></label>' +
        '<button type="button" class="btn small ghost" data-remove-day="' + i + '" aria-label="Treu aquest dia">Treu</button>' +
        (label ? '<span class="day-label">' + esc(label) + '</span>' : '') +
      '</div>';
    }).join('');
  }

  function renderEditor() {
    var f = draft, hasKey = !!(data.settings.tmdbKey || '').trim();
    view.innerHTML =
      '<p><button class="linklike" id="back">‹ Torna a la llista</button></p>' +
      '<h1>' + (f._isNew ? 'Nova pel·lícula' : 'Edita la pel·lícula') + '</h1>' +

      '<section class="panel">' +
        '<h2>Omple les dades automàticament</h2>' +
        (hasKey
          ? '<div class="search-row"><input type="search" id="tmdb-q" placeholder="Escriu el títol, per exemple: Dune" value="' + esc(f.title) + '"><button type="button" class="btn" id="tmdb-go">Cerca</button></div>' +
            '<div id="tmdb-results" class="tmdb-results"></div>'
          : '<p class="hint">Si poses una clau gratuïta de TMDB a <em>Informació i preus</em>, només caldrà escriure el títol: el cartell, la sinopsi, la durada i el tràiler s\'omplen sols.</p>') +
      '</section>' +

      '<form id="film-form" class="panel form" novalidate>' +
        '<div class="form-grid">' +
          '<div class="poster-col">' +
            C.posterHTML(f) +
            '<label class="btn small ghost file-btn">Puja un cartell<input type="file" id="poster-file" accept="image/*" hidden></label>' +
            (f.poster ? '<button type="button" class="linklike" id="poster-clear">Treu el cartell</button>' : '') +
          '</div>' +
          '<div class="fields">' +
            '<label><span>Títol</span><input name="title" required value="' + esc(f.title) + '"></label>' +
            '<div class="inline">' +
              '<label><span>Tipus</span><select name="kind">' +
                '<option value="film"' + (f.kind === 'film' ? ' selected' : '') + '>Pel·lícula</option>' +
                '<option value="cineclub"' + (f.kind === 'cineclub' ? ' selected' : '') + '>Cine Club / programació municipal</option>' +
              '</select></label>' +
              '<label><span>Edat</span><select name="rating">' + RATINGS.map(function (r) {
                return '<option value="' + esc(r) + '"' + (f.rating === r ? ' selected' : '') + '>' + (r || '—') + '</option>';
              }).join('') + '</select></label>' +
              '<label><span>Durada (min)</span><input name="runtime" type="number" min="1" max="400" value="' + esc(f.runtime || '') + '"></label>' +
            '</div>' +
            '<label class="check"><input type="checkbox" name="family"' + (f.family ? ' checked' : '') + '> Per a tota la família</label>' +
            '<label><span>Sinopsi <em>(opcional)</em></span><textarea name="synopsis" rows="4">' + esc(f.synopsis) + '</textarea></label>' +
            '<label><span>Enllaç del tràiler <em>(YouTube, opcional)</em></span><input name="trailer" type="url" value="' + esc(f.trailer) + '"></label>' +
            '<label><span>Altre enllaç <em>(opcional, per exemple la web de l\'Ajuntament)</em></span><input name="link" type="url" value="' + esc(f.link) + '"></label>' +
          '</div>' +
        '</div>' +

        '<h2>Dies i hores</h2>' +
        '<label class="check"><input type="checkbox" name="pending"' + (f.pending ? ' checked' : '') + '> Encara no tenim data (sortirà a «Pendents de confirmar»)</label>' +
        '<div id="days">' + dayRowsHTML() + '</div>' +
        '<div class="day-tools">' +
          '<button type="button" class="btn small ghost" id="add-day">+ Afegeix un dia</button>' +
          '<button type="button" class="btn small ghost" id="copy-day">Repeteix l\'últim dia l\'endemà</button>' +
        '</div>' +
        '<p class="hint">Escriu les hores separades per comes. Serveix «17:00», «17.00» o «17h».</p>' +

        '<p id="form-error" class="error" hidden></p>' +
        '<div class="form-actions">' +
          '<button type="submit" class="btn">Desa i publica</button>' +
          '<button type="button" class="btn ghost" id="cancel">Cancel·la</button>' +
        '</div>' +
      '</form>';

    $('back').addEventListener('click', function () { go('films'); });
    $('cancel').addEventListener('click', function () { go('films'); });
    $('film-form').addEventListener('submit', function (e) { e.preventDefault(); saveDraft(); });
    $('add-day').addEventListener('click', function () {
      syncForm();
      draft.days.push({ date: '', times: [] });
      renderEditor();
    });
    $('copy-day').addEventListener('click', function () {
      syncForm();
      var last = draft.days[draft.days.length - 1];
      if (!last || !last.date) { draft.days.push({ date: nextWeekend(), times: [] }); }
      else draft.days.push({ date: D.addDays(last.date, 1), timesRaw: last.timesRaw });
      renderEditor();
    });
    view.querySelectorAll('[data-remove-day]').forEach(function (b) {
      b.addEventListener('click', function () {
        syncForm();
        draft.days.splice(parseInt(b.getAttribute('data-remove-day'), 10), 1);
        renderEditor();
      });
    });
    view.querySelectorAll('[data-date]').forEach(function (inp) {
      inp.addEventListener('change', function () {
        var lbl = inp.closest('.day-row').querySelector('.day-label');
        var text = inp.value ? D.long(inp.value) : '';
        if (lbl) lbl.textContent = text;
        else if (text) inp.closest('.day-row').insertAdjacentHTML('beforeend', '<span class="day-label">' + esc(text) + '</span>');
      });
    });
    $('poster-file').addEventListener('change', function (e) {
      var file = e.target.files && e.target.files[0];
      if (!file) return;
      syncForm();
      resizeImage(file, 500).then(function (url) { draft.poster = url; renderEditor(); })
        .catch(function () { alert('No s\'ha pogut llegir la imatge.'); });
    });
    var pc = $('poster-clear');
    if (pc) pc.addEventListener('click', function () { syncForm(); draft.poster = ''; renderEditor(); });

    var go_ = $('tmdb-go');
    if (go_) {
      go_.addEventListener('click', searchTmdb);
      $('tmdb-q').addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); searchTmdb(); } });
    }
  }

  function parseTimes(raw) {
    var out = [], bad = [];
    String(raw || '').split(/[,;\s]+/).filter(Boolean).forEach(function (t) {
      var m = t.match(/^(\d{1,2})(?:[:.h](\d{2}))?h?$/i);
      if (m && +m[1] < 24 && (!m[2] || +m[2] < 60)) out.push(('0' + m[1]).slice(-2) + ':' + (m[2] || '00'));
      else bad.push(t);
    });
    out = out.filter(function (t, i) { return out.indexOf(t) === i; }).sort();
    return { times: out, bad: bad };
  }

  function saveDraft() {
    syncForm();
    var err = [];
    if (!draft.title) err.push('Falta el títol.');
    var days = [];
    draft.days.forEach(function (d) {
      if (!d.date && !String(d.timesRaw || '').trim()) return;
      if (!d.date) { err.push('Hi ha un dia sense data.'); return; }
      var p = parseTimes(d.timesRaw);
      if (p.bad.length) err.push('No entenc aquestes hores: ' + p.bad.join(', ') + '.');
      if (!p.times.length) err.push('El ' + D.long(d.date).toLowerCase() + ' no té cap hora.');
      days.push({ date: d.date, times: p.times });
    });
    if (!draft.pending && !days.length) err.push('Afegeix almenys un dia, o marca «Encara no tenim data».');

    // Ajuntem dies repetits
    var merged = {};
    days.forEach(function (d) { merged[d.date] = (merged[d.date] || []).concat(d.times); });
    days = Object.keys(merged).sort().map(function (k) {
      var ts = merged[k].filter(function (t, i, a) { return a.indexOf(t) === i; }).sort();
      return { date: k, times: ts };
    });

    var box = $('form-error');
    if (err.length) {
      box.innerHTML = err.map(esc).join('<br>');
      box.hidden = false;
      box.scrollIntoView({ block: 'center', behavior: 'smooth' });
      return;
    }
    var f = clone(draft);
    delete f._isNew;
    f.days = days;
    var i = data.films.findIndex(function (x) { return x.id === f.id; });
    if (i === -1) data.films.push(f); else data.films[i] = f;
    if (persist('Desat. Ja surt a la web.')) go('films');
  }

  function resizeImage(file, maxW) {
    return new Promise(function (resolve, reject) {
      var img = new Image(), url = URL.createObjectURL(file);
      img.onload = function () {
        var s = Math.min(1, maxW / img.width), c = document.createElement('canvas');
        c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        resolve(c.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(); };
      img.src = url;
    });
  }

  /* ---------- TMDB (opcional) ---------- */
  function tmdb(path, params) {
    var key = (data.settings.tmdbKey || '').trim();
    var url = new URL('https://api.themoviedb.org/3' + path);
    Object.keys(params || {}).forEach(function (k) { url.searchParams.set(k, params[k]); });
    var headers = { accept: 'application/json' };
    if (key.length > 40) headers.Authorization = 'Bearer ' + key; else url.searchParams.set('api_key', key);
    return fetch(url.toString(), { headers: headers }).then(function (r) {
      if (!r.ok) throw new Error(r.status);
      return r.json();
    });
  }

  function searchTmdb() {
    var q = $('tmdb-q').value.trim(), box = $('tmdb-results');
    if (!q) return;
    box.innerHTML = '<p class="hint">Cercant…</p>';
    tmdb('/search/movie', { query: q, language: 'es-ES', region: 'ES', include_adult: 'false' }).then(function (r) {
      var res = (r.results || []).slice(0, 8);
      if (!res.length) { box.innerHTML = '<p class="hint">No hem trobat res. Prova amb un altre títol o omple-ho a mà.</p>'; return; }
      box.innerHTML = res.map(function (m) {
        var img = m.poster_path ? '<img src="https://image.tmdb.org/t/p/w92' + esc(m.poster_path) + '" alt="">' : '<span class="noimg"></span>';
        return '<button type="button" class="tmdb-item" data-tmdb="' + m.id + '">' + img +
          '<span><strong>' + esc(m.title) + '</strong><small>' + esc((m.release_date || '').slice(0, 4)) + '</small></span></button>';
      }).join('');
      box.querySelectorAll('[data-tmdb]').forEach(function (b) {
        b.addEventListener('click', function () { pickTmdb(b.getAttribute('data-tmdb')); });
      });
    }).catch(function (e) {
      box.innerHTML = '<p class="error">No s\'ha pogut connectar amb TMDB (' + esc(e.message) + '). Revisa la clau.</p>';
    });
  }

  var CERT = { 'A': 'Tots els públics', 'APTA': 'Tots els públics', 'TP': 'Tots els públics', '7': '+7', '12': '+12', '16': '+16', '18': '+18' };

  function pickTmdb(id) {
    syncForm();
    $('tmdb-results').innerHTML = '<p class="hint">Carregant…</p>';
    Promise.all([
      tmdb('/movie/' + id, { language: 'es-ES', append_to_response: 'videos,release_dates' }),
      tmdb('/movie/' + id, { language: 'ca-ES' }).catch(function () { return {}; })
    ]).then(function (r) {
      var es = r[0], ca = r[1];
      draft.title = es.title || draft.title;
      draft.synopsis = ca.overview || es.overview || draft.synopsis;
      draft.runtime = es.runtime || draft.runtime;
      if (es.poster_path) draft.poster = 'https://image.tmdb.org/t/p/w500' + es.poster_path;
      var vids = (es.videos && es.videos.results) || [];
      var tr = vids.filter(function (v) { return v.site === 'YouTube' && v.type === 'Trailer'; })[0] || vids.filter(function (v) { return v.site === 'YouTube'; })[0];
      var trailerP = tr ? Promise.resolve(tr) : tmdb('/movie/' + id + '/videos', { language: 'en-US' }).then(function (v) {
        return (v.results || []).filter(function (x) { return x.site === 'YouTube' && x.type === 'Trailer'; })[0];
      }).catch(function () { return null; });
      var spain = ((es.release_dates && es.release_dates.results) || []).filter(function (x) { return x.iso_3166_1 === 'ES'; })[0];
      if (spain) {
        var c = (spain.release_dates || []).map(function (x) { return (x.certification || '').toUpperCase(); }).filter(Boolean)[0];
        if (c && CERT[c]) draft.rating = CERT[c];
      }
      return trailerP.then(function (t) {
        if (t) draft.trailer = 'https://www.youtube.com/watch?v=' + t.key;
        renderEditor();
        toast('Dades omplertes. Ara posa els dies i les hores.');
      });
    }).catch(function (e) {
      $('tmdb-results').innerHTML = '<p class="error">Error en carregar la pel·lícula (' + esc(e.message) + ').</p>';
    });
  }

  /* ---------- Informació i preus ---------- */
  function renderSettings() {
    var s = data.settings;
    view.innerHTML =
      '<h1>Informació i preus</h1>' +
      '<form id="set-form" class="panel form">' +
        '<h2>Avís a la part de dalt de la web</h2>' +
        '<label><span>Deixa-ho en blanc si no cal cap avís</span><textarea name="notice" rows="2" placeholder="Per exemple: Tancat per vacances del 3 al 20 d\'agost.">' + esc(s.notice) + '</textarea></label>' +

        '<h2>Preus</h2>' +
        '<div id="prices">' + (s.prices || []).map(priceRow).join('') + '</div>' +
        '<button type="button" class="btn small ghost" id="add-price">+ Afegeix un preu</button>' +
        '<label><span>Nota sota els preus <em>(opcional)</em></span><input name="priceNote" value="' + esc(s.priceNote) + '" placeholder="Per exemple: Dimecres, dia de l\'espectador"></label>' +

        '<h2>Taquilla i contacte</h2>' +
        '<label><span>Text sobre les entrades</span><textarea name="boxOffice" rows="2">' + esc(s.boxOffice) + '</textarea></label>' +
        '<div class="inline">' +
          '<label class="grow"><span>Adreça</span><input name="address" value="' + esc(s.address) + '"></label>' +
          '<label class="grow"><span>Codi postal i població</span><input name="city" value="' + esc(s.city) + '"></label>' +
          '<label><span>Telèfon</span><input name="phone" value="' + esc(s.phone) + '"></label>' +
        '</div>' +

        '<h2>Xarxes socials</h2>' +
        '<label><span>Instagram</span><input name="instagram" type="url" value="' + esc(s.social.instagram) + '"></label>' +
        '<label><span>Facebook</span><input name="facebook" type="url" value="' + esc(s.social.facebook) + '"></label>' +
        '<label><span>X (Twitter)</span><input name="x" type="url" value="' + esc(s.social.x) + '"></label>' +

        '<h2>Omplir pel·lícules automàticament</h2>' +
        '<label><span>Clau de TMDB <em>(gratuïta, a themoviedb.org)</em></span><input name="tmdbKey" autocomplete="off" value="' + esc(s.tmdbKey) + '"></label>' +

        '<div class="form-actions"><button class="btn" type="submit">Desa</button></div>' +
      '</form>' +

      '<section class="panel">' +
        '<h2>Còpia de seguretat (demo)</h2>' +
        '<div class="day-tools">' +
          '<button class="btn small ghost" id="export">Descarrega una còpia</button>' +
          '<label class="btn small ghost file-btn">Recupera una còpia<input type="file" id="import" accept="application/json" hidden></label>' +
          '<button class="btn small ghost danger" id="reset">Torna a les dades d\'exemple</button>' +
        '</div>' +
      '</section>';

    $('add-price').addEventListener('click', function () {
      $('prices').insertAdjacentHTML('beforeend', priceRow({ label: '', price: '' }));
    });
    $('prices').addEventListener('click', function (e) {
      var b = e.target.closest('[data-remove-price]');
      if (b) b.closest('.price-row').remove();
    });
    $('set-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var g = function (n) { return view.querySelector('[name="' + n + '"]').value.trim(); };
      s.notice = g('notice'); s.priceNote = g('priceNote'); s.boxOffice = g('boxOffice');
      s.address = g('address'); s.city = g('city'); s.phone = g('phone'); s.tmdbKey = g('tmdbKey');
      s.social = { instagram: g('instagram'), facebook: g('facebook'), x: g('x') };
      s.prices = Array.prototype.map.call(view.querySelectorAll('.price-row'), function (r) {
        return { label: r.querySelector('[data-pl]').value.trim(), price: r.querySelector('[data-pp]').value.trim() };
      }).filter(function (p) { return p.label || p.price; });
      persist('Desat. Ja surt a la web.');
    });
    $('export').addEventListener('click', function () {
      var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'cinecapri-' + D.realToday() + '.json';
      a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
    });
    $('import').addEventListener('change', function (e) {
      var file = e.target.files && e.target.files[0];
      if (!file) return;
      file.text().then(function (txt) {
        var d = JSON.parse(txt);
        if (!d || !Array.isArray(d.films) || !d.settings) throw new Error();
        data = d;
        persist('Còpia recuperada');
        go('films');
      }).catch(function () { alert('Aquest fitxer no és una còpia vàlida.'); });
    });
    $('reset').addEventListener('click', function () {
      if (confirm('Es perdran tots els canvis i tornaran les dades d\'exemple. Continuar?')) {
        C.Store.reset();
        data = C.Store.load();
        toast('Dades d\'exemple restaurades');
        go('films');
      }
    });
  }

  function priceRow(p) {
    return '<div class="price-row inline">' +
      '<label class="grow"><span>Concepte</span><input data-pl value="' + esc(p.label) + '" placeholder="Entrada general"></label>' +
      '<label><span>Preu</span><input data-pp value="' + esc(p.price) + '" placeholder="7,00 €"></label>' +
      '<button type="button" class="btn small ghost" data-remove-price aria-label="Treu aquest preu">Treu</button>' +
    '</div>';
  }

  /* ---------- Inici ---------- */
  if (loggedIn()) showApp(); else { $('login').hidden = false; $('pass').focus(); }
})();
