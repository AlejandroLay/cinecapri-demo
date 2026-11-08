/* Cine Capri · dades i utilitats compartides (web i administració).
   Demo: les dades es guarden al navegador (localStorage).
   A la versió definitiva això es substitueix per una base de dades. */
(function () {
  'use strict';

  var KEY = 'cinecapri-demo-v3';

  var SEED = {
    version: 1,
    settings: {
      notice: '',
      address: 'Avinguda Verge de Montserrat, 111',
      city: '08820 El Prat de Llobregat',
      phone: '93 379 59 43',
      boxOffice: 'La taquilla obre mitja hora abans de cada sessió.',
      prices: [
        { label: 'Entrada general', price: '7,00 €' },
        { label: 'Menors de 12 anys', price: '5,50 €' },
        { label: 'Majors de 65 anys', price: '5,50 €' }
      ],
      priceNote: '',
      tmdbKey: '',
      social: {
        facebook: 'https://www.facebook.com/pages/cine-Capri-El-Prat-de-Llobregat/127336097278485',
        instagram: 'https://www.instagram.com/cinecaprielprat/',
        x: 'https://x.com/cinecaprielprat'
      }
    },
    films: [
      {
        id: 'f1', title: 'Ruega por nosotras', kind: 'film', family: false,
        rating: '', runtime: 136, synopsis: 'Madrid, 1974. Un drama de Daniel Monzón ambientat en un reformatori.', poster: 'img/ruega-por-nosotras.jpg', trailer: '', link: '',
        pending: false, color: '#5a3d5c',
        days: [
          { date: '2026-11-07', times: ['17:00', '20:00'] },
          { date: '2026-11-08', times: ['17:00', '20:00'] }
        ]
      },
      {
        id: 'f2', title: 'El gato con sombrero', kind: 'film', family: true,
        rating: 'Tots els públics', runtime: 108,
        synopsis: 'El gat del barret del Dr. Seuss arriba en una nova pel·lícula d\'animació.',
        poster: 'img/el-gato-con-sombrero.jpg', trailer: '', link: '', pending: false, color: '#2f4b6e',
        days: [
          { date: '2026-11-14', times: ['17:00'] },
          { date: '2026-11-15', times: ['17:00'] }
        ]
      },
      {
        id: 'f3', title: 'La bola negra', kind: 'film', family: false,
        rating: '', runtime: 159,
        synopsis: 'A partir de l\'obra inacabada de Federico García Lorca, tres històries en tres èpoques diferents.',
        poster: 'img/la-bola-negra.jpg', trailer: '', link: '', pending: false, color: '#30302e',
        days: [
          { date: '2026-11-14', times: ['20:00'] },
          { date: '2026-11-15', times: ['20:00'] }
        ]
      },
      {
        id: 'f4', title: 'Bird', kind: 'cineclub', family: false,
        rating: '', runtime: 119,
        synopsis: 'Bailey té 12 anys i viu en una casa ocupada. Una pel·lícula d\'Andrea Arnold (Regne Unit, 2024), en versió original. Sessió del Cine Club, dins la programació municipal.',
        poster: 'img/bird.jpg', trailer: '', link: 'https://www.elprat.cat/la-ciutat/guia-agenda/cineclub-bird',
        pending: false, color: '#3d5a3a',
        days: [{ date: '2026-11-18', times: ['19:30'] }]
      },
      {
        id: 'f5', title: 'Los Juegos del Hambre: Amanecer en la cosecha', kind: 'film', family: false,
        rating: '', runtime: 150,
        synopsis: 'Anys abans de Katniss, un jove Haymitch Abernathy lluita per sobreviure als Jocs de la Fam.',
        poster: 'img/juegos-del-hambre.jpg', trailer: '', link: '', pending: false, color: '#7a3b2e',
        days: [
          { date: '2026-11-20', times: ['20:00'] },
          { date: '2026-11-21', times: ['17:00', '20:00'] },
          { date: '2026-11-22', times: ['17:00', '20:00'] }
        ]
      },
      {
        id: 'f6', title: 'Hechizo: Bienvenidos a Hexe', kind: 'film', family: true,
        rating: 'Tots els públics', runtime: 103, synopsis: '', poster: 'img/hechizo.jpg', trailer: '', link: '',
        pending: false, color: '#b3842a',
        days: [
          { date: '2026-11-27', times: ['20:00'] },
          { date: '2026-11-28', times: ['17:00', '20:00'] },
          { date: '2026-11-29', times: ['17:00', '20:00'] }
        ]
      },
      {
        id: 'f7', title: 'Vengadores: Doomsday', kind: 'film', family: false,
        rating: '', runtime: 165, synopsis: 'Els Venjadors s\'enfronten al Doctor Doom.',
        poster: 'img/vengadores-doomsday.jpg', trailer: '', link: '', pending: false, color: '#6b4a2f',
        days: [
          { date: '2026-12-17', times: ['20:00'] },
          { date: '2026-12-18', times: ['20:00'] },
          { date: '2026-12-19', times: ['17:00', '20:00'] },
          { date: '2026-12-20', times: ['17:00', '20:00'] }
        ]
      },
      {
        id: 'f8', title: 'Dune: Parte tres', kind: 'film', family: false,
        rating: '', runtime: 140,
        synopsis: 'Continua la història de Paul Atreides, a partir de la novel·la «El Messies de Dune».',
        poster: 'img/dune-parte-tres.jpg', trailer: '', link: '', pending: false, color: '#8a5a2b',
        days: [
          { date: '2026-12-25', times: ['20:00'] },
          { date: '2026-12-26', times: ['17:00', '20:00'] },
          { date: '2026-12-27', times: ['17:00', '20:00'] }
        ]
      }
    ]
  };

  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  var Store = {
    load: function () {
      try {
        var raw = localStorage.getItem(KEY);
        if (raw) {
          var d = JSON.parse(raw);
          if (d && Array.isArray(d.films) && d.settings) return d;
        }
      } catch (e) { /* sense emmagatzematge: fem servir les dades d'exemple */ }
      return clone(SEED);
    },
    save: function (data) {
      try { localStorage.setItem(KEY, JSON.stringify(data)); return true; }
      catch (e) { return false; }
    },
    reset: function () {
      try { localStorage.removeItem(KEY); } catch (e) { /* res */ }
    },
    seed: function () { return clone(SEED); },
    newId: function () { return 'f' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5); }
  };

  /* ---------- Dates en català ---------- */
  var DAYS = ['diumenge', 'dilluns', 'dimarts', 'dimecres', 'dijous', 'divendres', 'dissabte'];
  var MONTHS = ['gener', 'febrer', 'març', 'abril', 'maig', 'juny', 'juliol', 'agost', 'setembre', 'octubre', 'novembre', 'desembre'];
  var MONTHS_SHORT = ['gen.', 'febr.', 'març', 'abr.', 'maig', 'juny', 'jul.', 'ag.', 'set.', 'oct.', 'nov.', 'des.'];

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function parse(s) { var p = s.split('-').map(Number); return new Date(p[0], p[1] - 1, p[2]); }
  function iso(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }

  function realToday() { return iso(new Date()); }
  // ?avui=2026-11-08 permet provar la web com si fos un altre dia.
  function today() {
    try {
      var p = new URLSearchParams(location.search).get('avui');
      if (p && /^\d{4}-\d{2}-\d{2}$/.test(p)) return p;
    } catch (e) { /* res */ }
    return realToday();
  }
  function addDays(s, n) { var d = parse(s); d.setDate(d.getDate() + n); return iso(d); }
  function deMonth(m) { var n = MONTHS[m]; return (/^[aeiou]/.test(n) ? "d'" : 'de ') + n; }
  function joinCa(arr) {
    if (arr.length <= 1) return arr.join('');
    return arr.slice(0, -1).join(', ') + ' i ' + arr[arr.length - 1];
  }

  var Dates = {
    today: today,
    realToday: realToday,
    addDays: addDays,
    parse: parse,
    monthName: function (s) { return cap(MONTHS[parse(s).getMonth()]); },
    // "Dissabte 14 de novembre"
    long: function (s) { var d = parse(s); return cap(DAYS[d.getDay()]) + ' ' + d.getDate() + ' ' + deMonth(d.getMonth()); },
    // "dissabte 14"
    dayNum: function (s) { var d = parse(s); return DAYS[d.getDay()] + ' ' + d.getDate(); },
    // "Dissabte 14 i diumenge 15 de novembre"
    list: function (dates) {
      var groups = [];
      dates.slice().sort().forEach(function (s) {
        var d = parse(s), key = d.getFullYear() + '-' + d.getMonth();
        var g = groups[groups.length - 1];
        if (!g || g.key !== key) { g = { key: key, m: d.getMonth(), items: [] }; groups.push(g); }
        g.items.push(DAYS[d.getDay()] + ' ' + d.getDate());
      });
      var parts = groups.map(function (g) { return joinCa(g.items) + ' ' + deMonth(g.m); });
      return cap(joinCa(parts));
    },
    // { top: "20–22", bottom: "nov." }
    stub: function (dates) {
      var s = dates.slice().sort(), a = parse(s[0]), b = parse(s[s.length - 1]);
      if (s.length === 1 || s[0] === s[s.length - 1]) return { top: String(a.getDate()), bottom: MONTHS_SHORT[a.getMonth()] };
      if (a.getMonth() === b.getMonth()) return { top: a.getDate() + '–' + b.getDate(), bottom: MONTHS_SHORT[a.getMonth()] };
      return { top: a.getDate() + '–' + b.getDate(), bottom: MONTHS_SHORT[a.getMonth()] + '/' + MONTHS_SHORT[b.getMonth()] };
    }
  };

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function posterHTML(f, cls) {
    cls = cls || '';
    if (f.poster) {
      return '<img class="poster ' + cls + '" src="' + esc(f.poster) + '" alt="Cartell de ' + esc(f.title) + '" loading="lazy">';
    }
    return '<div class="poster ph ' + cls + '" style="--c:' + esc(f.color || '#7f1146') + '" role="img" aria-label="' + esc(f.title) + '">' +
      '<span class="ph-title">' + esc(f.title) + '</span><span class="ph-foot">Cine Capri</span></div>';
  }

  window.Capri = { Store: Store, Dates: Dates, esc: esc, posterHTML: posterHTML };
})();
