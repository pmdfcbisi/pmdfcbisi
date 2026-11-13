/* PMD FC Portal: konfigurasi
   API_URL = URL web app Apps Script (…/exec) yang mengembalikan {news, events, apps} */
const API_URL = 'https://script.google.com/macros/s/AKfycbzIUafUutpMpP0qJEW5vNwK0TDC32A1agAAMTRJgPq0PBm5DOkwR01jAHyg5PD_t7Rz/exec';

/* ====== App HUB: daftar kartu dari API (tab "apps"), cadangan content/apps.json ====== */
(function () {
  var lsGet = function (k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } };
  var lsSet = function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  var APPS_KEY = 'pmd_apps';
const GROUPS = [
    { k: 'plan',    t: 'Perencanaan & Input Data' },
    { k: 'trial',   t: 'Trial & Uji Multi Lokasi' },
    { k: 'demplot', t: 'Demplot' },
    { k: 'report',  t: 'Monitoring & Report' },
    { k: 'lain',    t: 'Lainnya' }
  ];
  const ICONS = {
    trial:   '<path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>',
    demplot: '<path d="M12 21v-9"/><path d="M12 12c0-4 2.5-6.5 7-6.5 0 4-2.5 6.5-7 6.5z"/><path d="M12 15c0-3-2-5-6-5 0 3 2 5 6 5z"/>',
    report:  '<path d="M4 4v16h16"/><rect x="7.5" y="12" width="3" height="5" rx=".6"/><rect x="12.5" y="8" width="3" height="9" rx=".6"/><rect x="17.5" y="10.5" width="2.5" height="6.5" rx=".6"/>',
    plan:    '<rect x="6" y="4.5" width="12" height="16.5" rx="2"/><path d="M9 4.5h6V7H9z"/><path d="M9 13.5l2 2 4-4"/>',
    lain:    '<circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/>'
  };
  const SVG = function (k, cls) {
    return '<svg class="' + cls + '" viewBox="0 0 24 24" aria-hidden="true">' + ICONS[k] + '</svg>';
  };
  const kindOf = function (u) {
    if (/docs\.google\.com\/spreadsheets/.test(u)) return 'Spreadsheet';
    if (/script\.google\.com/.test(u)) return 'Web App';
    return 'Tautan';
  };

  
  const list = document.getElementById('list');
  function render(apps) {
    apps = apps.filter(function (a) { return a && a.nama && /^https?:\/\//i.test(a.url || ''); });
    if (!apps.length) return false;
    list.textContent = '';
    let n = 0;
GROUPS.forEach(function (g) {
    const items = apps.filter(function (a) {
      const key = GROUPS.some(function (x) { return x.k === a.grup; }) ? a.grup : 'lain';
      return key === g.k;
    });
    if (!items.length) return;

    const wrap = document.createElement('div');
    wrap.className = 'grp g-' + g.k;
    const hd = document.createElement('div');
    hd.className = 'grp-h';
    hd.textContent = g.t + ' ';
    const cnt = document.createElement('em'); cnt.textContent = items.length;
    hd.appendChild(cnt);
    const grid = document.createElement('div');
    grid.className = 'grp-grid';

    items.forEach(function (a) {
      const el = document.createElement('a');
      el.className = 'card';
      el.href = a.url;
      el.target = '_blank';
      el.rel = 'noopener noreferrer';
      el.style.setProperty('--i', n++);

      el.insertAdjacentHTML('beforeend', SVG(g.k, 'wm'));

      const head = document.createElement('div'); head.className = 'c-head';
      const ico = document.createElement('span'); ico.className = 'ico';
      ico.innerHTML = SVG(g.k, '');
      const tag = document.createElement('span');
      tag.className = 'tag'; tag.textContent = a.tag;
      head.append(ico, tag);
      if (a.badge) { const bd = document.createElement('span'); bd.className = 'badge'; bd.textContent = a.badge; head.appendChild(bd); }

      const nm = document.createElement('b'); nm.textContent = a.nama;
      const d = document.createElement('span');
      d.className = 'd'; d.textContent = a.ket;

      const foot = document.createElement('div'); foot.className = 'c-foot';
      const go = document.createElement('span'); go.className = 'go';
      go.append('Buka ');
      const ar = document.createElement('i'); ar.textContent = '→'; go.appendChild(ar);
      const kd = document.createElement('span'); kd.className = 'kind'; kd.textContent = kindOf(a.url);
      foot.append(go, kd);

      el.append(head, nm, d, foot);
      grid.appendChild(el);
    });

    wrap.append(hd, grid);
    list.appendChild(wrap);
  });
    return true;
  }
  var live = false, shown = false;
  var cached = lsGet(APPS_KEY);
  if (Array.isArray(cached)) shown = render(cached);
  fetch('content/apps.json').then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (a) { if (!live && !shown) shown = render(a); })
    .catch(function () { if (!shown) { list.textContent = ''; var p = document.createElement('p'); p.className = 'msg'; p.textContent = 'Daftar aplikasi belum dapat dimuat. Muat ulang halaman.'; list.appendChild(p); } });
  window.PMD = {
    setApps: function (a) {
      if (!Array.isArray(a) || !render(a)) return;
      live = true; shown = true; lsSet(APPS_KEY, a);
    }
  };
})();

/* ====== News & Kalender (API Apps Script) ====== */
(function () {


  const $ = function (id) { return document.getElementById(id); };
  const fmtDate = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  const fmtMonth = new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' });
  const fmtMon = new Intl.DateTimeFormat('id-ID', { month: 'short' });

  function parseD(s) {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s || '');
    return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null;
  }
  function safeUrl(u) { return /^https?:\/\//i.test(u || '') ? u : ''; }
  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function linkEl(url, label) {
    const a = el('a', 'more', label);
    a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer';
    return a;
  }
  function setMsg(text) {
    ['news-list', 'event-list'].forEach(function (id) {
      $(id).textContent = '';
      $(id).appendChild(el('p', 'msg', text));
    });
  }

  /* ---------- News ---------- */
  function renderNews(items) {
    const box = $('news-list');
    box.textContent = '';
    if (!items.length) { box.appendChild(el('p', 'empty', 'Belum ada berita.')); return; }
    const now = new Date();
    items.map(function (n) { return Object.assign({ d: parseD(n.tgl) }, n); })
      .sort(function (a, b) { return (b.pin ? 1 : 0) - (a.pin ? 1 : 0) || (b.d || 0) - (a.d || 0); })
      .forEach(function (n) {
        const it = el('article', 'news');
        const meta = el('div', 'meta');
        if (n.pin) meta.appendChild(el('span', 'pill pin', 'Disematkan'));
        if (n.kategori) meta.appendChild(el('span', 'tag', n.kategori));
        if (n.d && (now - n.d) / 864e5 <= 7) meta.appendChild(el('span', 'pill new', 'Baru'));
        if (n.d) meta.appendChild(el('span', null, fmtDate.format(n.d)));
        it.append(meta, el('h3', null, n.judul));
        if (n.isi) it.appendChild(el('p', null, n.isi));
        const u = safeUrl(n.link);
        if (u) it.appendChild(linkEl(u, 'Baca selengkapnya \u2192'));
        box.appendChild(it);
      });
  }

  /* ---------- Kalender ---------- */
  let EVENTS = [];
  let showPast = false;

  function renderEvents() {
    const box = $('event-list');
    box.textContent = '';
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const all = EVENTS.map(function (e) {
      const s = parseD(e.mulai);
      return s ? Object.assign({}, e, { s: s, f: parseD(e.selesai) || s }) : null;
    }).filter(Boolean);
    const upcoming = all.filter(function (e) { return e.f >= today; }).sort(function (a, b) { return a.s - b.s; });
    const past = all.filter(function (e) { return e.f < today; }).sort(function (a, b) { return b.s - a.s; });

    if (!upcoming.length) box.appendChild(el('p', 'empty', 'Belum ada event mendatang.'));

    function draw(list, isPast) {
      let key = '';
      list.forEach(function (e) {
        const k = e.s.getFullYear() + '-' + e.s.getMonth();
        if (k !== key) { key = k; box.appendChild(el('h3', 'month', fmtMonth.format(e.s))); }
        const card = el('article', 'ev' + (isPast ? ' past' : ''));
        const dt = el('div', 'dt');
        dt.append(el('b', null, String(e.s.getDate())), el('span', null, fmtMon.format(e.s)));
        const body = el('div');
        const meta = el('div', 'meta');
        if (e.f > e.s) meta.appendChild(el('span', null, fmtDate.format(e.s) + ' – ' + fmtDate.format(e.f)));
        if (!isPast && e.s <= today && e.f >= today) meta.appendChild(el('span', 'pill new', 'Sedang berlangsung'));
        if (e.lokasi) meta.appendChild(el('span', null, e.lokasi));
        body.append(el('h3', null, e.judul), meta);
        if (e.ket) body.appendChild(el('p', null, e.ket));
        const u = safeUrl(e.link);
        if (u) body.appendChild(linkEl(u, 'Detail \u2192'));
        card.append(dt, body);
        box.appendChild(card);
      });
    }
    draw(upcoming, false);

    if (past.length) {
      const btn = el('button', 'btn', showPast ? 'Sembunyikan event yang sudah lewat' : 'Tampilkan event yang sudah lewat (' + past.length + ')');
      btn.type = 'button';
      btn.addEventListener('click', function () { showPast = !showPast; renderEvents(); });
      box.appendChild(btn);
      if (showPast) draw(past, true);
    }
  }

  /* ---------- Ambil data ---------- */
  function load() {
    if (!/^https:\/\/script\.google\.com\//.test(API_URL)) {
      setMsg('Backend belum dihubungkan. Isi API_URL di assets/app.js dengan URL web app (…/exec).');
      return;
    }
    fetch(API_URL)
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (d) {
        renderNews(d.news || []);
        if (window.PMD && Array.isArray(d.apps) && d.apps.length) window.PMD.setApps(d.apps);
        EVENTS = d.events || [];
        renderEvents();
      })
      .catch(function () { setMsg('Data belum dapat dimuat. Muat ulang halaman, atau hubungi admin.'); });
  }

  document.getElementById('reload').addEventListener('click', function () { setMsg('Memuat…'); load(); });
  load();
  
})();

/* ====== Fakta bergilir ====== */
  (function () {
    var facts = [
      'MON89034 dan MIR162 sama-sama menyasar ulat grayak (FAW), tetapi proteinnya berbeda: Cry1A.105 + Cry2Ab2 pada MON89034, Vip3Aa20 pada MIR162.',
      'Toleran glyphosate dan toleran glufosinate adalah dua hal berbeda: yang satu melindungi enzim EPSPS, yang lain menetralkan glufosinate lewat PAT/BAR.',
      'Event bukan nama varietas atau merek benih. Beberapa event bisa digabung dalam satu varietas, yang disebut stacked events.'
    ];
    var p = document.getElementById('lt-fact-text'), dots = document.querySelectorAll('#lt-dots i'), i = 0;
    if (!p) return;
    function show(n) {
      p.textContent = facts[n];
      for (var k = 0; k < dots.length; k++) dots[k].className = k === n ? 'on' : '';
    }
    show(0);
    if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    setInterval(function () {
      p.classList.add('fade');
      setTimeout(function () { i = (i + 1) % facts.length; show(i); p.classList.remove('fade'); }, 250);
    }, 7000);
  })();
  

  /* ====== Jam & kartu cuaca (GPS, cadangan IP) — data cuaca: Open-Meteo ====== */
  (function () {
    var $ = function (id) { return document.getElementById(id); };

    /* Jam */
    var dFmt = new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });
    var tFmt = new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZoneName: 'short' });
    function tick() {
      var n = new Date();
      $('ck-date').textContent = dFmt.format(n);
      $('ck-time').textContent = tFmt.format(n);
    }
    tick();
    setInterval(tick, 1000);

    /* Ikon garis (SVG statis) */
    var ICONS = {
      sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
      moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>',
      partly: '<circle cx="8" cy="8" r="2.8"/><path d="M8 2v1.2M2 8h1.2M3.8 3.8l.9.9M12.2 3.8l-.9.9"/><path d="M9 20h8a3.5 3.5 0 0 0 .5-6.96A4.8 4.8 0 0 0 8.7 12.6 3.7 3.7 0 0 0 9 20z"/>',
      cloud: '<path d="M7 18h10a4 4 0 0 0 .6-7.96A5.5 5.5 0 0 0 7.1 8.9 4.6 4.6 0 0 0 7 18z"/>',
      rain: '<path d="M7 15h10a4 4 0 0 0 .6-7.96A5.5 5.5 0 0 0 7.1 5.9 4.6 4.6 0 0 0 7 15z"/><path d="M8 18l-1 2M12 18l-1 2M16 18l-1 2"/>',
      storm: '<path d="M7 15h10a4 4 0 0 0 .6-7.96A5.5 5.5 0 0 0 7.1 5.9 4.6 4.6 0 0 0 7 15z"/><path d="M12 15l-2 4h3l-1.5 3"/>',
      fog: '<path d="M4 8h16M3 12h18M5 16h14"/>',
      snow: '<path d="M12 3v18M4.2 7.5l15.6 9M19.8 7.5l-15.6 9"/>',
      drop: '<path d="M12 3s6 6.2 6 10.5a6 6 0 0 1-12 0C6 9.2 12 3 12 3z"/>',
      wind: '<path d="M3 8h10a3 3 0 1 0-3-3M3 12h15a3 3 0 1 1-3 3M3 16h7"/>',
      pin: '<path d="M12 21s7-6.2 7-11.2A7 7 0 0 0 5 9.8C5 14.8 12 21 12 21z"/><circle cx="12" cy="10" r="2.5"/>'
    };
    function icon(key, cls) {
      var s = document.createElement('span');
      if (cls) s.className = cls;
      s.setAttribute('aria-hidden', 'true');
      s.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' + (ICONS[key] || ICONS.cloud) + '</svg>';
      return s;
    }
    function wmo(c, day) {
      if (c === 0) return { t: 'Cerah', k: day ? 'sun' : 'moon' };
      if (c === 1) return { t: 'Cerah berawan', k: day ? 'partly' : 'moon' };
      if (c === 2) return { t: 'Berawan sebagian', k: 'partly' };
      if (c === 3) return { t: 'Berawan', k: 'cloud' };
      if (c === 45 || c === 48) return { t: 'Berkabut', k: 'fog' };
      if (c >= 51 && c <= 57) return { t: 'Gerimis', k: 'rain' };
      if (c >= 61 && c <= 65) return { t: c === 61 ? 'Hujan ringan' : c === 63 ? 'Hujan sedang' : 'Hujan lebat', k: 'rain' };
      if (c === 66 || c === 67) return { t: 'Hujan es', k: 'rain' };
      if ((c >= 71 && c <= 77) || c === 85 || c === 86) return { t: 'Salju', k: 'snow' };
      if (c >= 80 && c <= 82) return { t: c === 80 ? 'Hujan lokal ringan' : c === 81 ? 'Hujan lokal' : 'Hujan lokal lebat', k: 'rain' };
      if (c >= 95) return { t: 'Badai petir', k: 'storm' };
      return { t: 'Tidak diketahui', k: 'cloud' };
    }

    function el(tag, cls, text) {
      var e = document.createElement(tag);
      if (cls) e.className = cls;
      if (text != null) e.textContent = text;
      return e;
    }
    function getJSON(url) {
      return fetch(url).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); });
    }

    /* Lokasi bawaan (dipakai sampai pengguna menekan tombol "Lokasi saya") */
    var DEFAULT_LOC = { lat: -7.2575, lon: 112.7521, name: 'Surabaya, Jawa Timur', src: 'Default' };
    var LOC_KEY = 'pmd_wx_loc', WX_KEY = 'pmd_wx_data';
    var LOC_TTL = 24 * 3600 * 1000, WX_TTL = 15 * 60 * 1000;

    function lsGet(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }
    function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

    /* Lokasi: GPS (hanya setelah tombol ditekan) */
    function gpsLocate() {
      return new Promise(function (res, rej) {
        if (!navigator.geolocation) return rej(new Error('nogeo'));
        navigator.geolocation.getCurrentPosition(
          function (p) { res({ lat: p.coords.latitude, lon: p.coords.longitude }); },
          rej,
          { enableHighAccuracy: false, timeout: 15000, maximumAge: 600000 }
        );
      }).then(function (c) {
        var u = 'https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=' + c.lat + '&longitude=' + c.lon + '&localityLanguage=id';
        return getJSON(u).then(function (g) {
          var n = [g.locality || g.city, g.principalSubdivision].filter(Boolean).join(', ');
          return { lat: c.lat, lon: c.lon, name: n || 'Lokasi Anda', src: 'GPS' };
        }).catch(function () {
          return { lat: c.lat, lon: c.lon, name: 'Lokasi Anda', src: 'GPS' };
        });
      });
    }

    var current = null, cache = null, note = '';

    function setStatus(msg) {
      var box = $('wx-body');
      box.textContent = '';
      box.appendChild(el('p', 'wxc-s', msg));
    }

    function paint() {
      if (!cache) { if (note) setStatus(note); return; }
      var loc = current || cache.loc, c = cache.w.current, d = cache.w.daily;
      var info = wmo(c.weather_code, c.is_day === 1);
      var box = $('wx-body');
      box.textContent = '';

      box.appendChild(icon(info.k, 'wxc-wm'));

      var top = el('div', 'wxc-top');
      var txt = el('div');
      txt.append(el('div', 'wxc-c', info.t),
        el('div', 'wxc-s', 'Terasa ' + Math.round(c.apparent_temperature) + '° · ' + Math.round(d.temperature_2m_min[0]) +
          '°–' + Math.round(d.temperature_2m_max[0]) + '°'));
      top.append(icon(info.k, 'wxc-ic k-' + info.k), el('div', 'wxc-t', Math.round(c.temperature_2m) + '°'), txt);
      box.appendChild(top);

      var chips = el('div', 'wxc-chips');
      function chip(key, val, label) {
        var s = el('div', 'wxc-chip'), t = el('div');
        t.append(el('b', null, val), el('small', null, label));
        s.append(icon(key, 'ci'), t);
        chips.appendChild(s);
      }
      chip('drop', Math.round(c.relative_humidity_2m) + '%', 'Lembap');
      if (d.precipitation_probability_max && d.precipitation_probability_max[0] != null) {
        chip('rain', Math.round(d.precipitation_probability_max[0]) + '%', 'Hujan');
      }
      chip('wind', Math.round(c.wind_speed_10m) + ' km/j', 'Angin');
      box.appendChild(chips);

      var row = el('div', 'wxc-loc');
      var btn = el('button', 'btn', loc.src === 'GPS' ? 'Perbarui' : 'Lokasi saya');
      btn.type = 'button';
      btn.title = 'Gunakan lokasi saya (GPS perangkat)';
      btn.setAttribute('aria-label', 'Gunakan lokasi saya');
      btn.addEventListener('click', askGps);
      row.append(icon('pin', 'wxc-pin'), el('span', null, loc.name), el('span', 'pill2', loc.src), btn);
      box.appendChild(row);

      if (note) box.appendChild(el('p', 'wxc-note', note));
    }

    function sameLoc(a, b) { return a && b && Math.abs(a.lat - b.lat) < 0.01 && Math.abs(a.lon - b.lon) < 0.01; }

    function loadWeather(loc, force) {
      var saved = lsGet(WX_KEY);
      if (saved && sameLoc(saved.loc, loc) && saved.w) {
        cache = { loc: loc, w: saved.w };
        paint();
        if (!force && Date.now() - saved.t < WX_TTL) return Promise.resolve();
      }
      var u = 'https://api.open-meteo.com/v1/forecast?latitude=' + loc.lat.toFixed(3) + '&longitude=' + loc.lon.toFixed(3) +
        '&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,is_day' +
        '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max' +
        '&timezone=auto&forecast_days=1';
      return getJSON(u).then(function (w) {
        cache = { loc: loc, w: w };
        lsSet(WX_KEY, { t: Date.now(), loc: { lat: loc.lat, lon: loc.lon }, w: w });
        paint();
      });
    }
    function show(loc, force) {
      current = loc;
      loadWeather(loc, force).catch(function () {
        if (!cache) setStatus('Data cuaca belum dapat dimuat. Muat ulang halaman nanti.');
      });
    }

    function askGps() {
      note = 'Meminta lokasi…';
      paint();
      gpsLocate().then(function (l) {
        note = '';
        lsSet(LOC_KEY, { t: Date.now(), loc: l });
        show(l, true);
      }).catch(function () {
        note = 'Lokasi tidak dapat dibaca. Periksa izin lokasi pada browser.';
        paint();
      });
    }

    /* Awal: lokasi tersimpan (24 jam) atau lokasi bawaan. Tanpa permintaan izin otomatis. */
    (function init() {
      var s = lsGet(LOC_KEY);
      var loc = (s && s.loc && Date.now() - s.t < LOC_TTL) ? s.loc : DEFAULT_LOC;
      setStatus('Memuat cuaca…');
      show(loc);
    })();

    setInterval(function () { if (current) loadWeather(current, true).catch(function () {}); }, 15 * 60 * 1000);
  })();

/* ====== Pembaca materi (modal): isi dimuat dari content/*.html saat pertama dibuka ====== */
(function () {
  function initReader(root, withFilter) {
    var btns = root.querySelectorAll('.lit-nav button');
    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        var t = root.querySelector('#' + b.dataset.t);
        if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
    if (btns.length && 'IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (e.isIntersecting) btns.forEach(function (b) { b.classList.toggle('on', b.dataset.t === e.target.id); });
        });
      }, { rootMargin: '-20% 0px -70% 0px' });
      root.querySelectorAll('section').forEach(function (s) { io.observe(s); });
    }
    if (!withFilter) return;
    var rows = [].slice.call(root.querySelectorAll('#lit-tbl tbody tr'));
    var q = root.querySelector('#lit-q'), none = root.querySelector('#lit-none');
    var chips = root.querySelectorAll('#lit-f button'), cur = 'all';
    if (!q || !none) return;
    function apply() {
      var t = q.value.trim().toLowerCase(), n = 0;
      rows.forEach(function (r) {
        var ok = (cur === 'all' || r.dataset.tag.split(' ').indexOf(cur) > -1) && (!t || r.textContent.toLowerCase().indexOf(t) > -1);
        r.style.display = ok ? '' : 'none'; if (ok) n++;
      });
      none.style.display = n ? 'none' : 'block';
    }
    chips.forEach(function (c) {
      c.addEventListener('click', function () {
        cur = c.dataset.f; chips.forEach(function (x) { x.classList.toggle('on', x === c); }); apply();
      });
    });
    q.addEventListener('input', apply);
  }

  var cfg = [
    { hash: 'literasi', open: 'lt-open',     modal: 'lit-modal',    close: 'lit-close',    sheet: 'lit-sheet',    body: 'lit-gmo',    src: 'content/literasi-gmo.html' },
    { hash: 'insight',  open: 'ins-open',    modal: 'ins-modal',    close: 'ins-close',    sheet: 'ins-sheet',    body: 'ins-gmo',    src: 'content/insight.html' },
    { hash: 'income',   open: 'income-open', modal: 'income-modal', close: 'income-close', sheet: 'income-sheet', body: 'income-gmo', src: 'content/income.html' },
    { hash: 'tkw',      open: 'tkw-open',    modal: 'tkw-modal',    close: 'tkw-close',    sheet: 'tkw-sheet',    body: 'tkw-gmo',    src: 'content/tkw.html' }
  ];
  var $ = function (id) { return document.getElementById(id); };
  var items = cfg.map(function (c) {
    return { c: c, modal: $(c.modal), sheet: $(c.sheet), body: $(c.body), openBtn: $(c.open), closeBtn: $(c.close), on: false, state: '' };
  });
  var viaClick = false;

  function loadContent(it) {
    if (it.state === 'ok' || it.state === 'loading') return;
    it.state = 'loading';
    fetch(it.c.src).then(function (r) { if (!r.ok) throw new Error(r.status); return r.text(); })
      .then(function (html) {
        it.body.innerHTML = html;
        it.state = 'ok';
        initReader(it.body, it.c.hash === 'literasi');
      })
      .catch(function () {
        it.state = '';
        it.body.textContent = '';
        var box = document.createElement('div'); box.className = 'lit-err'; box.setAttribute('role', 'alert');
        box.appendChild(document.createTextNode('Materi belum dapat dimuat. Periksa koneksi, lalu coba lagi.'));
        box.appendChild(document.createElement('br'));
        var b = document.createElement('button'); b.type = 'button'; b.className = 'btn'; b.textContent = 'Coba lagi';
        b.addEventListener('click', function () { it.body.textContent = ''; loadContent(it); });
        box.appendChild(b);
        it.body.appendChild(box);
      });
  }

  function setOpen(it, on) {
    if (it.on === on) return;
    it.on = on;
    it.modal.classList.toggle('open', on);
    it.modal.setAttribute('aria-hidden', on ? 'false' : 'true');
    document.body.classList.toggle('lit-lock', items.some(function (x) { return x.on; }));
    if (on) { loadContent(it); it.sheet.scrollTop = 0; it.closeBtn.focus(); } else { it.openBtn.focus(); }
  }
  function open(it) { viaClick = true; if (location.hash !== '#' + it.c.hash) location.hash = it.c.hash; setOpen(it, true); }
  function close(it) {
    if (viaClick && location.hash === '#' + it.c.hash) { history.back(); }
    else { history.replaceState(null, '', location.pathname + location.search); setOpen(it, false); }
    viaClick = false;
  }
  function sync() {
    var h = location.hash.replace('#', '');
    items.forEach(function (it) { setOpen(it, it.c.hash === h); });
  }
  items.forEach(function (it) {
    ['mouseenter', 'focus', 'touchstart'].forEach(function (ev) {
      it.openBtn.addEventListener(ev, function () { loadContent(it); }, { passive: true, once: true });
    });
    it.openBtn.addEventListener('click', function () { open(it); });
    it.openBtn.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(it); } });
    it.closeBtn.addEventListener('click', function () { close(it); });
    it.modal.addEventListener('click', function (e) { if (e.target === it.modal) close(it); });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    items.forEach(function (it) { if (it.on) close(it); });
  });
  window.addEventListener('hashchange', sync);
  sync();   // tautan langsung: index.html#literasi, #insight, #tkw, #income
})();
