/* =====================================================================
   MedTech Simulator – Anwendungskern
   Router · Krankenhausplan · Raumansicht · Geräteinformation ·
   Geräteverbund · Lernszenarien · Herausforderungen · Fortschritt
   ===================================================================== */
(function () {
  'use strict';
  const MTS = (window.MTS = window.MTS || {});
  const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  /* =================================================================
     Registries
     ================================================================= */
  const areas = new Map();
  const sims = new Map();
  MTS.areas = areas;
  MTS.sims = sims;
  MTS.registerArea = function (def) {
    if (!def || !def.id) throw new Error('Bereich ohne id');
    def.devices = def.devices || [];
    def.scenarios = def.scenarios || [];
    def.challenges = def.challenges || [];
    areas.set(def.id, def);
  };
  MTS.registerSim = function (def) {
    if (!def || !def.id) throw new Error('Simulation ohne id');
    sims.set(def.id, def);
  };

  /* Lageplan des virtuellen Krankenhauses (Reihenfolge = Rundgang) */
  const LAYOUT = [
    { id: 'icu', name: 'Intensivstation', floor: '2. OG', x: 40, y: 40, w: 300, h: 190, icon: '🫁', color: '#0f7ea3' },
    { id: 'or', name: 'Operationssaal', floor: '2. OG', x: 360, y: 40, w: 300, h: 190, icon: '🔬', color: '#2e8b6f' },
    { id: 'pacu', name: 'Aufwachraum', floor: '2. OG', x: 680, y: 40, w: 220, h: 190, icon: '🛏️', color: '#6b7fd7' },
    { id: 'cathlab', name: 'Herzkatheterlabor', floor: '2. OG', x: 920, y: 40, w: 240, h: 190, icon: '❤️', color: '#c0392b' },
    { id: 'er', name: 'Notaufnahme', floor: 'EG', x: 40, y: 290, w: 300, h: 190, icon: '🚑', color: '#d35400' },
    { id: 'radiology', name: 'Radiologie', floor: 'EG', x: 360, y: 290, w: 300, h: 190, icon: '🩻', color: '#7d5fb2' },
    { id: 'lab', name: 'Labor', floor: 'EG', x: 680, y: 290, w: 220, h: 190, icon: '🧪', color: '#b8860b' },
    { id: 'dialysis', name: 'Dialyse', floor: '1. OG', x: 920, y: 290, w: 240, h: 190, icon: '🩸', color: '#a83279' },
    { id: 'ward', name: 'Normalstation', floor: '1. OG', x: 40, y: 540, w: 460, h: 150, icon: '🏥', color: '#3c8d40' },
    { id: 'neo', name: 'Neonatologie', floor: '1. OG', x: 520, y: 540, w: 640, h: 150, icon: '👶', color: '#e08a9b' },
  ];
  MTS.LAYOUT = LAYOUT;

  /* =================================================================
     Fortschritt (localStorage)
     ================================================================= */
  const STORE_KEY = 'mts-progress-v1';
  const progress = {
    data: { devices: {}, scenarios: {}, challenges: {} },
    load() {
      try { this.data = Object.assign(this.data, JSON.parse(localStorage.getItem(STORE_KEY) || '{}')); } catch (e) { /* ignore */ }
    },
    save() { try { localStorage.setItem(STORE_KEY, JSON.stringify(this.data)); } catch (e) { /* ignore */ } },
    seeDevice(areaId, devId) { this.data.devices[areaId + '/' + devId] = 1; this.save(); },
    scenario(areaId, scId, score, max) {
      const k = areaId + '/' + scId;
      const prev = this.data.scenarios[k];
      if (!prev || score >= prev.score) this.data.scenarios[k] = { score, max };
      this.save();
    },
    challenge(areaId, idx, ok) {
      const k = areaId + '/' + idx;
      this.data.challenges[k] = ok || this.data.challenges[k] === true ? true : false;
      this.save();
    },
    areaStats(area) {
      const dev = area.devices.filter((d) => this.data.devices[area.id + '/' + d.id]).length;
      const sc = area.scenarios.filter((s) => this.data.scenarios[area.id + '/' + s.id]).length;
      const ch = area.challenges.filter((c, i) => this.data.challenges[area.id + '/' + i] === true).length;
      const total = area.devices.length + area.scenarios.length + area.challenges.length;
      return { dev, sc, ch, pct: total ? Math.round(((dev + sc + ch) / total) * 100) : 0 };
    },
    reset() { this.data = { devices: {}, scenarios: {}, challenges: {} }; this.save(); },
  };
  MTS.progress = progress;

  /* =================================================================
     UI-Hilfen
     ================================================================= */
  function toast(msg, kind) {
    const t = document.createElement('div');
    t.className = 'toast ' + (kind || '');
    t.innerHTML = msg;
    $('#toasts').appendChild(t);
    setTimeout(() => t.classList.add('show'), 10);
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 400); }, 3200);
  }
  MTS.toast = toast;

  const PRIO = { high: 'Hoch', medium: 'Mittel', low: 'Niedrig' };
  const CONN_TYPES = {
    daten: { label: 'Daten/Signal', color: '#2b7bb9', dash: '6 4' },
    gas: { label: 'Gas', color: '#1aa179', dash: '' },
    fluid: { label: 'Flüssigkeit/Blut', color: '#d1495b', dash: '' },
    strom: { label: 'Energie/Strom', color: '#e09f3e', dash: '2 4' },
    patient: { label: 'Patientenanschluss', color: '#7b5ea7', dash: '' },
    mechanisch: { label: 'Mechanisch', color: '#6c757d', dash: '10 4' },
  };
  MTS.CONN_TYPES = CONN_TYPES;

  /* Kleiner Ereignis-Mechanismus für Simulationen/Bereiche */
  let cleanup = [];
  function addCleanup(fn) { cleanup.push(fn); }
  function runCleanup() { cleanup.forEach((f) => { try { f(); } catch (e) { console.error(e); } }); cleanup = []; }

  /* =================================================================
     Router
     ================================================================= */
  function parseHash() {
    const h = (location.hash || '#/').replace(/^#\/?/, '');
    return h.split('/').filter(Boolean).map(decodeURIComponent);
  }
  function go(path) { location.hash = '#/' + path; }
  MTS.go = go;

  function route() {
    runCleanup();
    const parts = parseHash();
    const main = $('#main');
    main.scrollTop = 0;
    window.scrollTo(0, 0);
    $$('.nav a').forEach((a) => a.classList.toggle('active', (a.getAttribute('href') || '').replace('#/', '').split('/')[0] === (parts[0] || '')));
    try {
      if (!parts.length) renderHome(main);
      else if (parts[0] === 'area' && parts[1]) renderArea(main, parts[1], parts.slice(2));
      else if (parts[0] === 'lab') renderLab(main, parts[1]);
      else if (parts[0] === 'challenges') renderChallengeHub(main);
      else if (parts[0] === 'progress') renderProgress(main);
      else if (parts[0] === 'about') renderAbout(main);
      else renderHome(main);
    } catch (e) {
      console.error(e);
      main.innerHTML = `<div class="page"><div class="card error"><h2>Fehler beim Laden</h2><pre>${esc(e.stack || e)}</pre></div></div>`;
    }
  }

  /* =================================================================
     Startseite: Lageplan
     ================================================================= */
  function renderHome(main) {
    const tiles = LAYOUT.map((L) => {
      const a = areas.get(L.id);
      const ready = !!a;
      const st = ready ? progress.areaStats(a) : { pct: 0 };
      return `<g class="map-room ${ready ? '' : 'locked'}" data-area="${L.id}" tabindex="0" role="link" aria-label="${esc(L.name)}">
        <rect x="${L.x}" y="${L.y}" width="${L.w}" height="${L.h}" rx="14" fill="${L.color}" fill-opacity="0.10" stroke="${L.color}" stroke-width="2.5"/>
        <rect class="map-room-hover" x="${L.x}" y="${L.y}" width="${L.w}" height="${L.h}" rx="14" fill="${L.color}" fill-opacity="0"/>
        <text x="${L.x + 18}" y="${L.y + 42}" font-size="30">${L.icon}</text>
        <text x="${L.x + 18}" y="${L.y + 80}" font-size="19" font-weight="700" fill="#16323f">${esc(L.name)}</text>
        <text x="${L.x + 18}" y="${L.y + 102}" font-size="13" fill="#4a6370">${esc(L.floor)} · ${ready ? a.devices.length + ' Geräte' : 'in Vorbereitung'}</text>
        ${ready ? `<rect x="${L.x + 18}" y="${L.y + L.h - 34}" width="${L.w - 36}" height="8" rx="4" fill="#dbe5ea"/>
        <rect x="${L.x + 18}" y="${L.y + L.h - 34}" width="${Math.max(0.01, (L.w - 36) * st.pct / 100)}" height="8" rx="4" fill="${L.color}"/>
        <text x="${L.x + L.w - 18}" y="${L.y + L.h - 42}" font-size="12" text-anchor="end" fill="#4a6370">${st.pct} %</text>` : ''}
        ${ready && a.status === 'full' ? `<text x="${L.x + L.w - 18}" y="${L.y + 34}" font-size="11" text-anchor="end" fill="${L.color}" font-weight="700">★ VOLLSTÄNDIG</text>` : ''}
      </g>`;
    }).join('');
    const corridors = `
      <rect x="20" y="250" width="1160" height="22" rx="6" fill="#e3eaee"/>
      <rect x="20" y="500" width="1160" height="22" rx="6" fill="#e3eaee"/>
      <text x="600" y="265" font-size="11" text-anchor="middle" fill="#7a8f99" letter-spacing="4">FLUR · AUFZUG · TREPPENHAUS</text>
      <text x="600" y="515" font-size="11" text-anchor="middle" fill="#7a8f99" letter-spacing="4">FLUR · VERBINDUNGSGANG</text>`;
    const totalDev = Array.from(areas.values()).reduce((s, a) => s + a.devices.length, 0);
    main.innerHTML = `
      <div class="page home">
        <section class="hero">
          <div class="hero-text">
            <span class="badge">Lernumgebung · fiktive Daten</span>
            <h1>Medizintechnik im klinischen Einsatz erleben</h1>
            <p>Gehen Sie durch ein virtuelles Krankenhaus, untersuchen Sie Medizingeräte direkt am (fiktiven) Patientenbett,
               verstehen Sie Messprinzipien in interaktiven Simulationen und testen Sie Ihr Wissen in klinischen Lernszenarien.</p>
            <div class="hero-actions">
              <a class="btn primary" href="#/area/icu">Rundgang starten: Intensivstation →</a>
              <a class="btn" href="#/lab">Simulationslabor</a>
            </div>
            <div class="stats">
              <div><b>${areas.size}</b><span>Bereiche</span></div>
              <div><b>${totalDev}</b><span>Geräte</span></div>
              <div><b>${sims.size}</b><span>Simulationen</span></div>
              <div><b>${Array.from(areas.values()).reduce((s, a) => s + a.scenarios.length, 0)}</b><span>Szenarien</span></div>
            </div>
          </div>
        </section>
        <section class="card map-card">
          <div class="card-head"><h2>Lageplan</h2><span class="muted">Bereich anklicken, um ihn zu betreten</span></div>
          <svg class="hospital-map" viewBox="0 0 1200 720" role="img" aria-label="Lageplan des virtuellen Krankenhauses">
            <rect x="0" y="0" width="1200" height="720" rx="18" fill="#f6f9fa"/>
            ${corridors}${tiles}
          </svg>
        </section>
        <section class="grid3">
          <div class="card"><h3>🔍 Geräte erkunden</h3><p>Klicken Sie in einer Raumansicht auf ein Gerät: Zweck, Funktionsprinzip, Komponenten, Messwerte, Alarme, Verbindungen und Sicherheitsaspekte.</p></div>
          <div class="card"><h3>🩺 Lernszenarien</h3><p>Erleben Sie simulierte Alltagssituationen mit fiktiven Patienten: Werte ändern sich live, Alarme ertönen, Sie entscheiden.</p></div>
          <div class="card"><h3>🎯 Herausforderungen</h3><p>Geräte finden, Aufgaben zuordnen, Komponenten identifizieren, Alarme erkennen und Geräteverbünde erklären.</p></div>
        </section>
      </div>`;
    $$('.map-room').forEach((g) => {
      const id = g.getAttribute('data-area');
      const open = () => (areas.has(id) ? go('area/' + id) : toast('Dieser Bereich ist noch in Vorbereitung.'));
      g.addEventListener('click', open);
      g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
    });
  }

  /* =================================================================
     Bereichsansicht
     ================================================================= */
  let ctx = null; // aktueller Bereichskontext

  function renderArea(main, areaId, sub) {
    const area = areas.get(areaId);
    if (!area) { main.innerHTML = `<div class="page"><div class="card"><h2>Bereich nicht gefunden</h2><a href="#/">Zurück zum Lageplan</a></div></div>`; return; }
    const L = LAYOUT.find((l) => l.id === areaId) || {};
    const idx = LAYOUT.findIndex((l) => l.id === areaId);
    const nextArea = LAYOUT.slice(idx + 1).concat(LAYOUT.slice(0, idx)).find((l) => areas.has(l.id));
    main.innerHTML = `
      <div class="area" style="--accent:${area.color || L.color || '#0f7ea3'}">
        <div class="area-head">
          <div>
            <div class="crumbs"><a href="#/">Lageplan</a> › <span>${esc(area.name)}</span></div>
            <h1>${esc(L.icon || area.icon || '')} ${esc(area.name)}</h1>
            <p class="muted">${esc(area.description || '')}</p>
          </div>
          <div class="area-head-actions">
            ${nextArea && nextArea.id !== areaId ? `<a class="btn small" href="#/area/${nextArea.id}">Weiter: ${esc(nextArea.name)} →</a>` : ''}
          </div>
        </div>
        <div class="area-body">
          <div class="scene-col">
            <div class="scene-toolbar">
              <button class="tbtn" data-act="labels" aria-pressed="true">🏷️ Beschriftungen</button>
              <button class="tbtn" data-act="network" aria-pressed="false">🔗 Geräteverbund</button>
              <button class="tbtn" data-act="sound" aria-pressed="${MTS.Live.audio.enabled}">🔈 Alarmtöne</button>
              <span class="scene-hint">Gerät anklicken für Details</span>
            </div>
            <div class="scene-wrap">
              <svg class="scene" viewBox="${area.scene && area.scene.viewBox ? area.scene.viewBox : '0 0 1600 900'}" preserveAspectRatio="xMidYMid meet"></svg>
              <div class="alarm-bar" hidden></div>
              <div class="learning-flag">LERNSZENARIO · FIKTIVE DATEN</div>
              <div class="scene-overlay" hidden></div>
            </div>
            <div class="legend" hidden></div>
          </div>
          <aside class="side">
            <div class="tabs" role="tablist">
              <button role="tab" data-tab="devices" class="active">Geräte</button>
              <button role="tab" data-tab="scenarios">Szenarien</button>
              <button role="tab" data-tab="challenges">Aufgaben</button>
              <button role="tab" data-tab="info">Lernziele</button>
            </div>
            <div class="side-body"></div>
          </aside>
        </div>
      </div>
      <div class="drawer" hidden><div class="drawer-inner"></div></div>`;

    const svg = $('.scene', main);
    const D = MTS.draw;
    svg.innerHTML = D.defs() + (area.scene && area.scene.render ? area.scene.render(D) : D.room({}));
    svg.insertAdjacentHTML('beforeend', '<g class="net-layer"></g><g class="label-layer"></g><g class="hl-layer"></g>');

    const model = new MTS.PatientModel(area.patient || {});
    ctx = { area, svg, main, model, labels: true, network: false, mode: null, baseline: JSON.parse(JSON.stringify(model.state)), limits: Object.assign({}, MTS.DEFAULT_LIMITS, area.limits || {}) };
    MTS.ctx = ctx;
    addCleanup(MTS.Live.bindSvg(svg, model));
    if (area.scene && area.scene.onMount) {
      const c = area.scene.onMount({ svg, model, area, ctx });
      if (typeof c === 'function') addCleanup(c);
    }

    // Geräte interaktiv machen
    const devById = new Map(area.devices.map((d) => [d.id, d]));
    $$('[data-device]', svg).forEach((g) => {
      const id = g.getAttribute('data-device');
      if (!devById.has(id)) { console.warn('Gerät ohne Datensatz:', id); return; }
      g.classList.add('dev');
      g.setAttribute('tabindex', '0');
      g.setAttribute('role', 'button');
      g.setAttribute('aria-label', devById.get(id).name);
      g.addEventListener('click', (e) => { e.stopPropagation(); onDeviceClick(id); });
      g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onDeviceClick(id); } });
      g.addEventListener('mouseenter', () => hover(id, true));
      g.addEventListener('mouseleave', () => hover(id, false));
      g.addEventListener('focus', () => hover(id, true));
      g.addEventListener('blur', () => hover(id, false));
    });
    // Labels nach Layout zeichnen
    requestAnimationFrame(() => { drawLabels(); });

    // Toolbar
    $$('.scene-toolbar .tbtn', main).forEach((b) => b.addEventListener('click', () => {
      const act = b.getAttribute('data-act');
      if (act === 'labels') { ctx.labels = !ctx.labels; b.setAttribute('aria-pressed', ctx.labels); drawLabels(); }
      if (act === 'network') { ctx.network = !ctx.network; b.setAttribute('aria-pressed', ctx.network); drawNetwork(); }
      if (act === 'sound') {
        MTS.Live.audio.enabled = !MTS.Live.audio.enabled;
        b.setAttribute('aria-pressed', MTS.Live.audio.enabled);
        if (MTS.Live.audio.enabled) { MTS.Live.audio.ensure(); MTS.Live.audio.play('low'); }
      }
    }));

    // Seitenleiste
    $$('.tabs button', main).forEach((b) => b.addEventListener('click', () => showTab(b.getAttribute('data-tab'))));
    showTab('devices');

    // Alarmüberwachung
    startAlarmWatch();

    // Unterrouten: device/<id>, scenario/<id>
    if (sub[0] === 'device' && sub[1] && devById.has(sub[1])) setTimeout(() => openDevice(sub[1]), 50);
    if (sub[0] === 'scenario' && sub[1]) { showTab('scenarios'); setTimeout(() => startScenario(sub[1]), 50); }
    if (sub[0] === 'challenge' && sub[1] != null) { showTab('challenges'); setTimeout(() => startChallenge(Number(sub[1])), 50); }

    const onKey = (e) => { if (e.key === 'Escape') closeDrawer(); };
    document.addEventListener('keydown', onKey);
    addCleanup(() => document.removeEventListener('keydown', onKey));
    const onResize = () => { drawLabels(); if (ctx && ctx.network) drawNetwork(); };
    window.addEventListener('resize', onResize);
    addCleanup(() => window.removeEventListener('resize', onResize));
    addCleanup(() => { ctx = null; MTS.ctx = null; });
  }

  function bboxOf(id) {
    const g = ctx && ctx.svg.querySelector(`[data-device="${id}"]`);
    if (!g) return null;
    try { return g.getBBox(); } catch (e) { return null; }
  }

  function hover(id, on) {
    const layer = ctx && $('.hl-layer', ctx.svg);
    if (!layer) return;
    $$('.hover-ring', layer).forEach((n) => n.remove());
    if (!on || (ctx.mode && ctx.mode.type === 'find')) return;
    const b = bboxOf(id);
    if (!b) return;
    layer.insertAdjacentHTML('beforeend', `<rect class="hover-ring" x="${b.x - 8}" y="${b.y - 8}" width="${b.width + 16}" height="${b.height + 16}" rx="12"/>`);
  }

  function drawLabels() {
    if (!ctx) return;
    const layer = $('.label-layer', ctx.svg);
    layer.innerHTML = '';
    if (!ctx.labels || (ctx.mode && ctx.mode.type === 'find')) return;
    const placed = [];
    ctx.area.devices.forEach((d) => {
      const b = bboxOf(d.id);
      if (!b) return;
      const text = d.short || d.name;
      const w = text.length * 8.6 + 22;
      let x = b.x + b.width / 2 - w / 2;
      let y = d.labelPos === 'bottom' ? b.y + b.height + 8 : b.y - 34;
      if (d.labelOffset) { x += d.labelOffset[0]; y += d.labelOffset[1]; }
      y = Math.max(40, Math.min(860, y));
      x = Math.max(6, Math.min(1594 - w, x));
      // Kollisionen vermeiden
      let guard = 0;
      while (placed.some((p) => Math.abs(p.y - y) < 28 && x < p.x + p.w && x + w > p.x) && guard++ < 10) y += 30;
      placed.push({ x, y, w });
      const seen = progress.data.devices[ctx.area.id + '/' + d.id];
      layer.insertAdjacentHTML('beforeend', `<g class="tag ${seen ? 'seen' : ''}" data-for="${d.id}">
        <rect x="${x}" y="${y}" width="${w}" height="26" rx="13"/>
        <circle cx="${x + 13}" cy="${y + 13}" r="4.5" class="tag-dot"/>
        <text x="${x + 23}" y="${y + 17.5}">${esc(text)}</text></g>`);
    });
    $$('.tag', layer).forEach((t) => t.addEventListener('click', () => onDeviceClick(t.getAttribute('data-for'))));
  }

  function centerOf(id) {
    const b = bboxOf(id);
    if (!b) return null;
    const d = ctx.area.devices.find((x) => x.id === id);
    if (d && d.anchor) return { x: d.anchor[0], y: d.anchor[1] };
    return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
  }

  function drawNetwork(focusId) {
    if (!ctx) return;
    const layer = $('.net-layer', ctx.svg);
    const legend = $('.legend', ctx.main);
    layer.innerHTML = '';
    if (!ctx.network && !focusId) { legend.hidden = true; return; }
    const seen = new Set();
    const used = new Set();
    ctx.area.devices.forEach((d) => {
      (d.connections || []).forEach((c) => {
        if (!c.to || !ctx.area.devices.some((x) => x.id === c.to)) return;
        if (focusId && d.id !== focusId && c.to !== focusId) return;
        const key = [d.id, c.to].sort().join('|') + (c.type || '');
        if (seen.has(key)) return;
        seen.add(key);
        const a = centerOf(d.id), b = centerOf(c.to);
        if (!a || !b) return;
        const T = CONN_TYPES[c.type] || CONN_TYPES.daten;
        used.add(c.type || 'daten');
        const mx = (a.x + b.x) / 2, my = Math.min(a.y, b.y) - 60 - Math.abs(a.x - b.x) * 0.08;
        layer.insertAdjacentHTML('beforeend', `<path class="net-line" d="M${a.x} ${a.y} Q ${mx} ${my} ${b.x} ${b.y}" stroke="${T.color}" ${T.dash ? `stroke-dasharray="${T.dash}"` : ''}/>
          <circle cx="${a.x}" cy="${a.y}" r="7" fill="${T.color}" class="net-node"/><circle cx="${b.x}" cy="${b.y}" r="7" fill="${T.color}" class="net-node"/>`);
      });
    });
    legend.hidden = used.size === 0;
    legend.innerHTML = Array.from(used).map((t) => `<span><i style="background:${CONN_TYPES[t].color}"></i>${CONN_TYPES[t].label}</span>`).join('');
  }

  /* ---------- Alarmüberwachung ---------- */
  function startAlarmWatch() {
    let lastHigh = '';
    let lastSound = 0;
    const tick = () => {
      if (!ctx) return;
      const alarms = ctx.area.patient ? ctx.model.checkAlarms(ctx.limits) : [];
      const extra = ctx.extraAlarms || [];
      const all = extra.concat(alarms);
      const bar = $('.alarm-bar', ctx.main);
      if (all.length) {
        bar.hidden = false;
        bar.innerHTML = all.slice(0, 4).map((a) => `<span class="al al-${a.prio}">${a.prio === 'high' ? '!!!' : a.prio === 'medium' ? '!!' : '!'} ${esc(a.text)}</span>`).join('');
      } else bar.hidden = true;
      // Monitor-Texte
      $$('[data-alarmtext]', ctx.svg).forEach((t) => (t.textContent = alarms[0] ? alarms[0].text : ''));
      $$('[data-ventalarm]', ctx.svg).forEach((t) => {
        const va = all.find((a) => a.id === 'paw' || a.source === 'vent');
        t.textContent = va ? va.text : '';
      });
      const top = all[0];
      $$('.alarm-lamp', ctx.svg).forEach((l) => {
        l.classList.remove('lamp-high', 'lamp-medium', 'lamp-low');
        if (top) l.classList.add('lamp-' + top.prio);
      });
      // Gerätebezogene Alarme markieren
      $$('[data-device]', ctx.svg).forEach((g) => g.classList.toggle('dev-alarm', extra.some((a) => a.device === g.getAttribute('data-device'))));
      const sig = all.map((a) => a.id).join(',');
      const now = performance.now();
      if (top && (sig !== lastHigh || now - lastSound > (top.prio === 'high' ? 6000 : 15000))) {
        MTS.Live.audio.play(top.prio);
        lastSound = now;
      }
      lastHigh = sig;
    };
    const iv = setInterval(tick, 1000);
    setTimeout(tick, 300);
    addCleanup(() => clearInterval(iv));
  }

  /* ---------- Seitenleiste ---------- */
  function showTab(tab) {
    if (!ctx) return;
    $$('.tabs button', ctx.main).forEach((b) => b.classList.toggle('active', b.getAttribute('data-tab') === tab));
    const body = $('.side-body', ctx.main);
    const area = ctx.area;
    if (tab === 'devices') {
      body.innerHTML = `<p class="muted small">${area.devices.length} Geräte in diesem Raum. Klicken Sie ein Gerät in der Szene oder in der Liste an.</p>
        <ul class="dev-list">${area.devices.map((d) => {
          const seen = progress.data.devices[area.id + '/' + d.id];
          return `<li><button data-dev="${d.id}" class="${seen ? 'seen' : ''}"><span class="dev-ico">${esc(d.icon || '⚙️')}</span>
            <span><b>${esc(d.name)}</b><small>${esc(d.category || '')}</small></span><span class="check">${seen ? '✓' : ''}</span></button></li>`;
        }).join('')}</ul>`;
      $$('[data-dev]', body).forEach((b) => {
        b.addEventListener('click', () => onDeviceClick(b.getAttribute('data-dev')));
        b.addEventListener('mouseenter', () => hover(b.getAttribute('data-dev'), true));
        b.addEventListener('mouseleave', () => hover(b.getAttribute('data-dev'), false));
      });
    } else if (tab === 'scenarios') {
      body.innerHTML = area.scenarios.length ? `<p class="muted small">Simulierte Alltagssituationen – alle Patientendaten sind fiktiv.</p>` + area.scenarios.map((s) => {
        const r = progress.data.scenarios[area.id + '/' + s.id];
        return `<div class="sc-card"><div class="sc-title">${esc(s.title)}</div><p class="small">${esc(s.summary || '')}</p>
          <div class="sc-meta"><span>⏱ ${esc(s.duration || '5 min')}</span><span>${(s.steps || []).length} Schritte</span>${r ? `<span class="ok">✓ ${r.score}/${r.max}</span>` : ''}</div>
          <button class="btn primary small" data-sc="${s.id}">Szenario starten</button></div>`;
      }).join('') : '<p class="muted">Für diesen Bereich sind noch keine Szenarien hinterlegt.</p>';
      $$('[data-sc]', body).forEach((b) => b.addEventListener('click', () => startScenario(b.getAttribute('data-sc'))));
    } else if (tab === 'challenges') {
      const TYPE = { find: ['🔎', 'Gerät finden'], match: ['🔀', 'Zuordnen'], quiz: ['❓', 'Wissensfrage'], component: ['🧩', 'Komponente'], alarm: ['🚨', 'Alarm erkennen'], sequence: ['🔗', 'Geräteverbund'] };
      body.innerHTML = area.challenges.length ? `<p class="muted small">${area.challenges.filter((c, i) => progress.data.challenges[area.id + '/' + i] === true).length} von ${area.challenges.length} gelöst.</p>
        <ul class="ch-list">${area.challenges.map((c, i) => {
          const st = progress.data.challenges[area.id + '/' + i];
          const t = TYPE[c.type] || ['❓', c.type];
          return `<li><button data-ch="${i}" class="${st === true ? 'solved' : st === false ? 'failed' : ''}"><span class="ch-ico">${t[0]}</span><span><small>${t[1]}</small><b>${esc(c.title || c.prompt)}</b></span><span class="check">${st === true ? '✓' : ''}</span></button></li>`;
        }).join('')}</ul>` : '<p class="muted">Keine Aufgaben hinterlegt.</p>';
      $$('[data-ch]', body).forEach((b) => b.addEventListener('click', () => startChallenge(Number(b.getAttribute('data-ch')))));
    } else if (tab === 'info') {
      body.innerHTML = `<h3>Lernziele</h3><ul class="goals">${(area.goals || []).map((g) => `<li>${esc(g)}</li>`).join('')}</ul>
        ${area.intro ? `<h3>Über diesen Bereich</h3><div class="prose">${area.intro}</div>` : ''}
        ${area.safety ? `<h3>Sicherheit im Bereich</h3><ul class="goals">${area.safety.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>` : ''}
        <div class="note">Hinweis: Diese Lernumgebung vereinfacht klinische und technische Zusammenhänge. Herstellerangaben sind Beispiele für typische Anbieter. Maßgeblich sind stets Gebrauchsanweisung, Einweisung nach MPBetreibV und interne Standards.</div>`;
    }
  }

  /* =================================================================
     Geräteinformation (Drawer)
     ================================================================= */
  function onDeviceClick(id) {
    if (!ctx) return;
    if (ctx.mode && ctx.mode.onDevice) { ctx.mode.onDevice(id); return; }
    openDevice(id);
  }

  function openDevice(id, tab) {
    const area = ctx.area;
    const d = area.devices.find((x) => x.id === id);
    if (!d) return;
    progress.seeDevice(area.id, id);
    drawLabels();
    $$('[data-device]', ctx.svg).forEach((g) => g.classList.toggle('selected', g.getAttribute('data-device') === id));
    if (ctx.network) drawNetwork(); else drawNetwork(id);
    const drawer = $('.drawer', ctx.main.parentNode) || $('.drawer');
    const inner = $('.drawer-inner', drawer);
    const tabs = [
      ['overview', 'Überblick'],
      ['components', 'Komponenten', d.components],
      ['measurements', 'Messwerte', d.measurements],
      ['alarms', 'Alarme', d.alarms],
      ['connections', 'Verbund', d.connections],
      ['safety', 'Sicherheit', d.safety],
    ].filter((t) => t.length === 2 || (t[2] && t[2].length));
    inner.innerHTML = `
      <div class="dr-head">
        <div class="dr-preview"><svg></svg></div>
        <div class="dr-title">
          <small>${esc(d.category || 'Medizingerät')}</small>
          <h2>${esc(d.name)}</h2>
          ${d.manufacturers ? `<div class="mfr"><span>Typische Hersteller (Beispiele):</span> ${d.manufacturers.map((m) => `<em>${esc(m)}</em>`).join(' ')}</div>` : ''}
          ${d.class ? `<div class="mfr"><span>Risikoklasse (MDR, typisch):</span> <em>${esc(d.class)}</em></div>` : ''}
        </div>
        <button class="dr-close" aria-label="Schließen">✕</button>
      </div>
      <div class="dr-tabs">${tabs.map((t) => `<button data-t="${t[0]}">${t[1]}</button>`).join('')}
        ${d.sim ? `<a class="dr-sim" href="#/lab/${d.sim}">▶ Simulation</a>` : ''}</div>
      <div class="dr-body"></div>`;
    // Vorschau: Gerät aus Szene klonen
    const src = ctx.svg.querySelector(`[data-device="${id}"]`);
    const pv = $('.dr-preview svg', inner);
    if (src) {
      const b = src.getBBox();
      const pad = 10;
      pv.setAttribute('viewBox', `${b.x - pad} ${b.y - pad} ${b.width + pad * 2} ${b.height + pad * 2}`);
      pv.innerHTML = MTS.draw.defs();
      const clone = src.cloneNode(true);
      clone.removeAttribute('tabindex');
      clone.classList.remove('selected', 'dev', 'dev-alarm');
      $$('[data-wave] polyline', clone).forEach((p) => p.remove());
      pv.appendChild(clone);
      const stopPv = MTS.Live.bindSvg(pv, ctx.model);
      drawer._stopPv && drawer._stopPv();
      drawer._stopPv = stopPv;
    }
    const body = $('.dr-body', inner);
    const renderTab = (t) => {
      $$('.dr-tabs button', inner).forEach((b) => b.classList.toggle('active', b.getAttribute('data-t') === t));
      body.innerHTML = deviceTab(d, t);
      body.scrollTop = 0;
      $$('[data-goto]', body).forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); openDevice(a.getAttribute('data-goto'), 'connections'); }));
      if (t === 'connections') drawConnGraph(d, $('.conn-graph', body));
    };
    $$('.dr-tabs button', inner).forEach((b) => b.addEventListener('click', () => renderTab(b.getAttribute('data-t'))));
    $('.dr-close', inner).addEventListener('click', closeDrawer);
    renderTab(tab || 'overview');
    drawer.hidden = false;
    requestAnimationFrame(() => drawer.classList.add('open'));
    // Gerätespezifischer Hook (z. B. Schaltflächen im Infofenster)
    if (d.onOpen) d.onOpen({ body, model: ctx.model, ctx });
  }
  MTS.openDevice = (id, tab) => openDevice(id, tab);

  function closeDrawer() {
    const drawer = $('.drawer');
    if (!drawer || drawer.hidden) return;
    drawer.classList.remove('open');
    drawer._stopPv && drawer._stopPv();
    drawer._stopPv = null;
    setTimeout(() => { drawer.hidden = true; }, 250);
    if (ctx) {
      $$('[data-device]', ctx.svg).forEach((g) => g.classList.remove('selected'));
      drawNetwork();
    }
  }

  function deviceTab(d, t) {
    const area = ctx.area;
    if (t === 'overview') {
      return `
        <section><h3>Medizinischer Zweck</h3><div class="prose">${d.purpose || ''}</div></section>
        <section><h3>Technische Funktion</h3><div class="prose">${d.function || ''}</div></section>
        ${d.facts ? `<section><h3>Kennwerte</h3><table class="kv">${d.facts.map((f) => `<tr><th>${esc(f[0])}</th><td>${esc(f[1])}</td></tr>`).join('')}</table></section>` : ''}
        ${d.tip ? `<div class="tip">💡 ${d.tip}</div>` : ''}`;
    }
    if (t === 'components') {
      return `<ol class="comp">${d.components.map((c) => `<li><b>${esc(c.name)}</b><span>${c.desc || ''}</span></li>`).join('')}</ol>`;
    }
    if (t === 'measurements') {
      return `<table class="meas"><thead><tr><th>Messgröße</th><th>Einheit</th><th>Typischer Bereich*</th></tr></thead><tbody>
        ${d.measurements.map((m) => `<tr><td><b>${esc(m.name)}</b>${m.desc ? `<small>${m.desc}</small>` : ''}</td><td>${esc(m.unit || '–')}</td><td>${esc(m.normal || '–')}</td></tr>`).join('')}
        </tbody></table><p class="muted small">* Orientierungswerte für Erwachsene (sofern nicht anders angegeben). Zielbereiche werden individuell ärztlich festgelegt.</p>`;
    }
    if (t === 'alarms') {
      return `<div class="alarms">${d.alarms.map((a) => `<div class="alarm-card prio-${a.prio || 'medium'}">
        <div class="alarm-top"><span class="prio">${PRIO[a.prio] || 'Mittel'}</span><b>${esc(a.name)}</b></div>
        <div><span class="lbl">Mögliche Ursachen:</span> ${a.cause || ''}</div>
        <div><span class="lbl">Reaktion:</span> ${a.action || ''}</div></div>`).join('')}</div>
        <p class="muted small">Alarmprioritäten nach IEC 60601-1-8: Hoch (rot, sofortige Reaktion), Mittel (gelb, zeitnahe Reaktion), Niedrig (gelb/cyan, Aufmerksamkeit).</p>`;
    }
    if (t === 'connections') {
      return `<div class="conn-graph"></div>
        <ul class="conn">${d.connections.map((c) => {
          const T = CONN_TYPES[c.type] || CONN_TYPES.daten;
          const target = c.to && area.devices.find((x) => x.id === c.to);
          return `<li><i style="background:${T.color}"></i><div><b>${target ? `<a href="#" data-goto="${target.id}">${esc(target.name)}</a>` : esc(c.label || c.to || '')}</b>
            <small>${T.label}</small><span>${c.desc || ''}</span></div></li>`;
        }).join('')}</ul>`;
    }
    if (t === 'safety') {
      return `<ul class="safety">${d.safety.map((s) => `<li>${s}</li>`).join('')}</ul>`;
    }
    return '';
  }

  function drawConnGraph(d, el) {
    const conns = d.connections || [];
    const W = 460, H = 280, cx = W / 2, cy = H / 2;
    const R = 105;
    const nodes = conns.map((c, i) => {
      const a = -Math.PI / 2 + (i / conns.length) * Math.PI * 2;
      const target = c.to && ctx.area.devices.find((x) => x.id === c.to);
      return { x: cx + Math.cos(a) * R * 1.55, y: cy + Math.sin(a) * R, c, name: target ? (target.short || target.name) : (c.label || c.to), id: target && target.id };
    });
    const wrap = (txt, n) => {
      const words = String(txt).split(' ');
      const lines = [''];
      words.forEach((w) => { if ((lines[lines.length - 1] + ' ' + w).trim().length > n) lines.push(w); else lines[lines.length - 1] = (lines[lines.length - 1] + ' ' + w).trim(); });
      return lines.slice(0, 2);
    };
    let s = `<svg viewBox="0 0 ${W} ${H}" class="cg">`;
    nodes.forEach((n) => {
      const T = CONN_TYPES[n.c.type] || CONN_TYPES.daten;
      s += `<line x1="${cx}" y1="${cy}" x2="${n.x}" y2="${n.y}" stroke="${T.color}" stroke-width="3" ${T.dash ? `stroke-dasharray="${T.dash}"` : ''}/>`;
    });
    nodes.forEach((n) => {
      const T = CONN_TYPES[n.c.type] || CONN_TYPES.daten;
      const lines = wrap(n.name, 16);
      s += `<g class="cg-node ${n.id ? 'link' : ''}" ${n.id ? `data-goto="${n.id}"` : ''}><rect x="${n.x - 62}" y="${n.y - 18}" width="124" height="36" rx="9" fill="#fff" stroke="${T.color}" stroke-width="2"/>
        ${lines.map((l, i) => `<text x="${n.x}" y="${n.y + (lines.length === 1 ? 4 : -2 + i * 12)}" text-anchor="middle" font-size="10.5">${esc(l)}</text>`).join('')}</g>`;
    });
    const cl = wrap(d.short || d.name, 14);
    s += `<rect x="${cx - 66}" y="${cy - 22}" width="132" height="44" rx="11" fill="var(--accent, #0f7ea3)"/>`;
    s += cl.map((l, i) => `<text x="${cx}" y="${cy + (cl.length === 1 ? 5 : -2 + i * 13)}" text-anchor="middle" font-size="12" font-weight="700" fill="#fff">${esc(l)}</text>`).join('');
    s += '</svg>';
    el.innerHTML = s;
    $$('[data-goto]', el).forEach((g) => g.addEventListener('click', () => openDevice(g.getAttribute('data-goto'), 'connections')));
  }

  /* =================================================================
     Szenario-Engine
     ================================================================= */
  function setOverlay(html) {
    const ov = $('.scene-overlay', ctx.main);
    if (html == null) { ov.hidden = true; ov.innerHTML = ''; return ov; }
    ov.hidden = false;
    ov.innerHTML = html;
    return ov;
  }
  function highlight(ids) {
    const layer = $('.hl-layer', ctx.svg);
    $$('.pulse-ring', layer).forEach((n) => n.remove());
    (ids || []).forEach((id) => {
      const b = bboxOf(id);
      if (b) layer.insertAdjacentHTML('beforeend', `<rect class="pulse-ring" x="${b.x - 10}" y="${b.y - 10}" width="${b.width + 20}" height="${b.height + 20}" rx="14"/>`);
    });
  }
  function resetPatient() {
    ctx.model.targets = null;
    ctx.model.set(JSON.parse(JSON.stringify(ctx.baseline)));
    ctx.extraAlarms = [];
  }

  function questionHtml(q, name) {
    const multi = Array.isArray(q.correct);
    return `<div class="q"><div class="q-text">${q.q}</div>
      <div class="opts">${q.options.map((o, i) => `<label class="opt"><input type="${multi ? 'checkbox' : 'radio'}" name="${name}" value="${i}"><span>${o}</span></label>`).join('')}</div>
      ${multi ? '<p class="muted small">Mehrere Antworten möglich.</p>' : ''}</div>`;
  }
  function evalQuestion(q, root, name) {
    const chosen = $$(`input[name="${name}"]:checked`, root).map((i) => Number(i.value));
    const corr = Array.isArray(q.correct) ? q.correct.slice().sort() : [q.correct];
    const ok = chosen.length === corr.length && chosen.slice().sort().every((v, i) => v === corr[i]);
    $$('.opt', root).forEach((l, i) => {
      l.classList.add(corr.includes(i) ? 'is-correct' : chosen.includes(i) ? 'is-wrong' : 'is-neutral');
      $('input', l).disabled = true;
    });
    return { ok, chosen };
  }

  function startScenario(scId) {
    const sc = ctx.area.scenarios.find((s) => s.id === scId);
    if (!sc) return;
    closeDrawer();
    endMode();
    resetPatient();
    if (sc.vitals) ctx.model.set(sc.vitals);
    let step = -1;
    let score = 0, max = 0;
    const side = $('.side-body', ctx.main);
    $$('.tabs button', ctx.main).forEach((b) => b.classList.toggle('active', b.getAttribute('data-tab') === 'scenarios'));
    ctx.mode = { type: 'scenario', onDevice: (id) => openDevice(id) };

    const intro = () => {
      side.innerHTML = `<div class="sc-run">
        <div class="ls-flag">LERNSZENARIO · FIKTIVER PATIENT</div>
        <h3>${esc(sc.title)}</h3>
        ${sc.patient ? `<div class="patient-card"><div class="pc-row"><span class="pc-avatar">👤</span><div><b>${esc(sc.patient.name)}</b><small>${esc(sc.patient.info || '')}</small></div></div>
          <p>${sc.patient.history || ''}</p></div>` : ''}
        <div class="prose">${sc.intro || ''}</div>
        <div class="sc-actions"><button class="btn primary" data-next>Beginnen →</button><button class="btn ghost" data-quit>Abbrechen</button></div></div>`;
      bind();
    };
    const bind = () => {
      const n = $('[data-next]', side);
      n && n.addEventListener('click', next);
      const q = $('[data-quit]', side);
      q && q.addEventListener('click', quit);
    };
    const next = () => {
      step++;
      if (step >= sc.steps.length) return finish();
      const st = sc.steps[step];
      if (st.vitals) {
        if (st.instant) ctx.model.set(st.vitals);
        else ctx.model.transition(st.vitals, st.duration || 6);
        if (st.vitals.rhythm) ctx.model.set({ rhythm: st.vitals.rhythm });
        if (st.vitals.ventMode) ctx.model.set({ ventMode: st.vitals.ventMode });
      }
      ctx.extraAlarms = st.alarms || [];
      highlight(st.highlight);
      if (st.openDevice) openDevice(st.openDevice);
      const qn = 'scq' + step;
      side.innerHTML = `<div class="sc-run">
        <div class="ls-flag">LERNSZENARIO · Schritt ${step + 1}/${sc.steps.length}</div>
        <div class="sc-progress"><i style="width:${((step) / sc.steps.length) * 100}%"></i></div>
        <h3>${esc(st.title || '')}</h3>
        <div class="prose">${st.text || ''}</div>
        ${st.question ? questionHtml(st.question, qn) : ''}
        <div class="feedback" hidden></div>
        <div class="sc-actions">
          ${st.question ? '<button class="btn primary" data-check>Antwort prüfen</button>' : '<button class="btn primary" data-next>Weiter →</button>'}
          <button class="btn ghost" data-quit>Abbrechen</button></div></div>`;
      bind();
      const chk = $('[data-check]', side);
      if (chk) chk.addEventListener('click', () => {
        const qroot = $('.q', side);
        if (!$$(`input[name="${qn}"]:checked`, qroot).length) { toast('Bitte eine Antwort wählen.'); return; }
        const r = evalQuestion(st.question, qroot, qn);
        max++;
        if (r.ok) score++;
        const fb = $('.feedback', side);
        fb.hidden = false;
        fb.className = 'feedback ' + (r.ok ? 'good' : 'bad');
        fb.innerHTML = `<b>${r.ok ? '✓ Richtig.' : '✗ Nicht ganz.'}</b> ${st.question.explain || ''}`;
        chk.outerHTML = `<button class="btn primary" data-next>${step + 1 >= sc.steps.length ? 'Abschließen' : 'Weiter →'}</button>`;
        bind();
      });
    };
    const finish = () => {
      highlight([]);
      ctx.extraAlarms = [];
      progress.scenario(ctx.area.id, sc.id, score, max);
      side.innerHTML = `<div class="sc-run done"><div class="ls-flag">LERNSZENARIO ABGESCHLOSSEN</div>
        <h3>${esc(sc.title)}</h3><div class="score-big">${score}<span>/${max}</span></div>
        <div class="prose">${sc.debrief || ''}</div>
        <div class="sc-actions"><button class="btn primary" data-again>Erneut spielen</button><button class="btn" data-back>Zur Übersicht</button></div></div>`;
      $('[data-again]', side).addEventListener('click', () => startScenario(sc.id));
      $('[data-back]', side).addEventListener('click', () => { quit(); });
    };
    const quit = () => { highlight([]); endMode(); resetPatient(); showTab('scenarios'); };
    intro();
  }

  /* =================================================================
     Herausforderungen
     ================================================================= */
  function endMode() {
    if (!ctx) return;
    if (ctx.mode && ctx.mode.cleanup) ctx.mode.cleanup();
    ctx.mode = null;
    setOverlay(null);
    ctx.svg.classList.remove('find-mode');
    highlight([]);
    drawLabels();
  }

  function startChallenge(i) {
    const area = ctx.area;
    const c = area.challenges[i];
    if (!c) return;
    closeDrawer();
    endMode();
    resetPatient();
    const side = $('.side-body', ctx.main);
    $$('.tabs button', ctx.main).forEach((b) => b.classList.toggle('active', b.getAttribute('data-tab') === 'challenges'));
    const done = (ok, explain) => {
      progress.challenge(area.id, i, ok);
      const fb = $('.feedback', side);
      fb.hidden = false;
      fb.className = 'feedback ' + (ok ? 'good' : 'bad');
      fb.innerHTML = `<b>${ok ? '✓ Richtig gelöst!' : '✗ Leider nicht korrekt.'}</b> ${explain || c.explain || ''}`;
      const act = $('.sc-actions', side);
      act.innerHTML = `${i + 1 < area.challenges.length ? '<button class="btn primary" data-nextc>Nächste Aufgabe →</button>' : ''}<button class="btn" data-retry>Wiederholen</button><button class="btn ghost" data-list>Übersicht</button>`;
      const nx = $('[data-nextc]', act);
      nx && nx.addEventListener('click', () => startChallenge(i + 1));
      $('[data-retry]', act).addEventListener('click', () => startChallenge(i));
      $('[data-list]', act).addEventListener('click', () => { endMode(); resetPatient(); showTab('challenges'); });
    };
    const header = `<div class="ls-flag">AUFGABE ${i + 1}/${area.challenges.length}</div><h3>${esc(c.title || '')}</h3><div class="prose">${c.prompt || ''}</div>`;
    const footer = `<div class="feedback" hidden></div><div class="sc-actions"></div>`;

    if (c.type === 'find') {
      ctx.svg.classList.add('find-mode');
      let tries = 0;
      ctx.mode = {
        type: 'find',
        onDevice: (id) => {
          if ($('.feedback', side).hidden === false) return;
          tries++;
          const target = Array.isArray(c.target) ? c.target : [c.target];
          if (target.includes(id)) {
            highlight([id]);
            done(true, c.explain);
          } else {
            const dn = area.devices.find((d) => d.id === id);
            toast(`Das ist: <b>${esc(dn ? dn.name : id)}</b> – versuchen Sie es noch einmal.`, 'warn');
            if (tries >= 3) { highlight(target); done(false, c.explain); }
          }
        },
      };
      drawLabels();
      side.innerHTML = header + `<p class="muted small">Die Beschriftungen sind ausgeblendet. Klicken Sie das gesuchte Gerät in der Raumansicht an (max. 3 Versuche).</p>` + footer;
      $('.sc-actions', side).innerHTML = '<button class="btn ghost" data-list>Abbrechen</button>';
      $('[data-list]', side).addEventListener('click', () => { endMode(); showTab('challenges'); });
      return;
    }
    ctx.mode = { type: c.type };

    if (c.type === 'quiz' || c.type === 'component' || c.type === 'alarm') {
      if (c.vitals) {
        ctx.model.set(c.vitals);
      }
      if (c.alarms) ctx.extraAlarms = c.alarms;
      if (c.highlight) highlight(c.highlight);
      if (c.device) openDeviceSilently(c.device);
      side.innerHTML = header + questionHtml(c, 'chq') + footer;
      $('.sc-actions', side).innerHTML = '<button class="btn primary" data-check>Antwort prüfen</button>';
      $('[data-check]', side).addEventListener('click', () => {
        const qroot = $('.q', side);
        if (!$$('input[name="chq"]:checked', qroot).length) { toast('Bitte eine Antwort wählen.'); return; }
        const r = evalQuestion(c, qroot, 'chq');
        done(r.ok);
      });
      return;
    }

    if (c.type === 'match') {
      const lefts = c.pairs.map((p, k) => ({ k, html: p.left ? esc(p.left) : esc((area.devices.find((d) => d.id === p.device) || {}).name || p.device) }));
      const rights = shuffle(c.pairs.map((p, k) => ({ k, html: esc(p.right) })));
      const sel = {};
      side.innerHTML = header + `<p class="muted small">Wählen Sie links einen Begriff und dann rechts die passende Zuordnung.</p>
        <div class="match"><div class="mcol left">${lefts.map((l) => `<button data-l="${l.k}">${l.html}</button>`).join('')}</div>
        <div class="mcol right">${rights.map((r) => `<button data-r="${r.k}">${r.html}</button>`).join('')}</div></div>` + footer;
      let activeL = null;
      const colors = ['#0f7ea3', '#d35400', '#2e8b6f', '#7d5fb2', '#c0392b', '#b8860b', '#a83279', '#3c8d40'];
      const refresh = () => {
        $$('[data-l]', side).forEach((b) => {
          const k = Number(b.getAttribute('data-l'));
          b.classList.toggle('active', activeL === k);
          b.style.borderColor = sel[k] != null ? colors[k % colors.length] : '';
          b.style.boxShadow = sel[k] != null ? `inset 6px 0 0 ${colors[k % colors.length]}` : '';
        });
        $$('[data-r]', side).forEach((b) => {
          const k = Number(b.getAttribute('data-r'));
          const owner = Object.keys(sel).find((l) => sel[l] === k);
          b.style.borderColor = owner != null ? colors[owner % colors.length] : '';
          b.style.boxShadow = owner != null ? `inset -6px 0 0 ${colors[owner % colors.length]}` : '';
        });
      };
      $$('[data-l]', side).forEach((b) => b.addEventListener('click', () => { activeL = Number(b.getAttribute('data-l')); refresh(); }));
      $$('[data-r]', side).forEach((b) => b.addEventListener('click', () => {
        if (activeL == null) { toast('Bitte zuerst links einen Begriff wählen.'); return; }
        const r = Number(b.getAttribute('data-r'));
        Object.keys(sel).forEach((l) => { if (sel[l] === r) delete sel[l]; });
        sel[activeL] = r;
        const nextL = lefts.find((l) => sel[l.k] == null);
        activeL = nextL ? nextL.k : null;
        refresh();
      }));
      $('.sc-actions', side).innerHTML = '<button class="btn primary" data-check>Zuordnung prüfen</button>';
      $('[data-check]', side).addEventListener('click', () => {
        if (Object.keys(sel).length < lefts.length) { toast('Bitte alle Begriffe zuordnen.'); return; }
        let ok = true;
        $$('[data-l]', side).forEach((b) => {
          const k = Number(b.getAttribute('data-l'));
          const good = sel[k] === k;
          if (!good) ok = false;
          b.classList.add(good ? 'is-correct' : 'is-wrong');
          b.disabled = true;
        });
        $$('[data-r]', side).forEach((b) => (b.disabled = true));
        const sol = c.pairs.map((p, k) => `<li><b>${lefts[k].html}</b> → ${esc(p.right)}</li>`).join('');
        done(ok, (c.explain || '') + `<ul class="sol">${sol}</ul>`);
      });
      return;
    }

    if (c.type === 'sequence') {
      let order = shuffle(c.items.map((t, k) => ({ k, t })));
      if (order.every((o, k) => o.k === k) && order.length > 1) order = order.reverse();
      const render = () => {
        $('.seq', side).innerHTML = order.map((o, idx) => `<li><span class="num">${idx + 1}</span><span class="txt">${esc(o.t)}</span>
          <span class="mv"><button data-up="${idx}" ${idx === 0 ? 'disabled' : ''} aria-label="nach oben">▲</button><button data-down="${idx}" ${idx === order.length - 1 ? 'disabled' : ''} aria-label="nach unten">▼</button></span></li>`).join('');
        $$('[data-up]', side).forEach((b) => b.addEventListener('click', () => { const k = Number(b.getAttribute('data-up')); [order[k - 1], order[k]] = [order[k], order[k - 1]]; render(); }));
        $$('[data-down]', side).forEach((b) => b.addEventListener('click', () => { const k = Number(b.getAttribute('data-down')); [order[k + 1], order[k]] = [order[k], order[k + 1]]; render(); }));
      };
      if (c.highlight) highlight(c.highlight);
      side.innerHTML = header + `<p class="muted small">Bringen Sie die Elemente mit ▲/▼ in die richtige Reihenfolge.</p><ol class="seq"></ol>` + footer;
      render();
      $('.sc-actions', side).innerHTML = '<button class="btn primary" data-check>Reihenfolge prüfen</button>';
      $('[data-check]', side).addEventListener('click', () => {
        const ok = order.every((o, k) => o.k === k);
        $$('.seq li', side).forEach((li, k) => li.classList.add(order[k].k === k ? 'is-correct' : 'is-wrong'));
        $$('.seq button', side).forEach((b) => (b.disabled = true));
        done(ok, (c.explain || '') + `<ol class="sol">${c.items.map((t) => `<li>${esc(t)}</li>`).join('')}</ol>`);
      });
      return;
    }
    side.innerHTML = header + '<p>Unbekannter Aufgabentyp.</p>';
  }
  function openDeviceSilently(id) { highlight([id]); }

  /* =================================================================
     Simulationslabor
     ================================================================= */
  function renderLab(main, simId) {
    const list = Array.from(sims.values()).sort((a, b) => (a.order || 99) - (b.order || 99));
    if (!simId || !sims.has(simId)) {
      main.innerHTML = `<div class="page"><div class="crumbs"><a href="#/">Lageplan</a> › <span>Simulationslabor</span></div>
        <h1>Simulationslabor</h1>
        <p class="lead">Vereinfachte, wissenschaftlich nachvollziehbare Modelle der wichtigsten Mess- und Therapieprinzipien. Alle Parameter lassen sich verändern; die Auswirkungen werden live berechnet.</p>
        <div class="sim-grid">${list.map((s) => `<a class="sim-tile" href="#/lab/${s.id}"><span class="sim-ico">${esc(s.icon || '📈')}</span><b>${esc(s.name)}</b><span>${esc(s.summary || '')}</span></a>`).join('')}</div>
        ${list.length ? '' : '<p class="muted">Noch keine Simulationen registriert.</p>'}</div>`;
      return;
    }
    const sim = sims.get(simId);
    main.innerHTML = `<div class="page lab">
      <div class="crumbs"><a href="#/">Lageplan</a> › <a href="#/lab">Simulationslabor</a> › <span>${esc(sim.name)}</span></div>
      <div class="lab-head"><h1>${esc(sim.icon || '')} ${esc(sim.name)}</h1>
        <div class="lab-nav">${list.map((s) => `<a href="#/lab/${s.id}" class="${s.id === simId ? 'active' : ''}" title="${esc(s.name)}">${esc(s.icon || '•')}</a>`).join('')}</div></div>
      <div class="lab-flag">Vereinfachtes Lehrmodell – nicht für diagnostische oder therapeutische Zwecke.</div>
      <div class="lab-body">
        <div class="lab-stage card"></div>
        <aside class="lab-theory card"><h3>Hintergrund</h3><div class="prose">${sim.theory || ''}</div>
          ${sim.devices ? `<h3>Verwandte Geräte</h3><ul class="goals">${sim.devices.map((d) => `<li><a href="#/area/${d[0]}/device/${d[1]}">${esc(d[2])}</a></li>`).join('')}</ul>` : ''}</aside>
      </div></div>`;
    const stage = $('.lab-stage', main);
    const c = sim.mount(stage, { live: MTS.Live, PatientModel: MTS.PatientModel, toast, esc });
    if (typeof c === 'function') addCleanup(c);
  }

  /* =================================================================
     Herausforderungen – Übersicht über alle Bereiche
     ================================================================= */
  function renderChallengeHub(main) {
    const rows = LAYOUT.filter((l) => areas.has(l.id)).map((l) => {
      const a = areas.get(l.id);
      const solved = a.challenges.filter((c, i) => progress.data.challenges[a.id + '/' + i] === true).length;
      return `<div class="hub-row card" style="--accent:${l.color}"><div class="hub-ico">${l.icon}</div><div class="hub-main"><b>${esc(a.name)}</b>
        <div class="bar"><i style="width:${a.challenges.length ? (solved / a.challenges.length) * 100 : 0}%"></i></div>
        <small>${solved}/${a.challenges.length} Aufgaben gelöst · ${a.scenarios.length} Szenarien</small></div>
        <div class="hub-act">${a.challenges.map((c, i) => `<a class="chip ${progress.data.challenges[a.id + '/' + i] === true ? 'ok' : ''}" href="#/area/${a.id}/challenge/${i}" title="${esc(c.title || '')}">${i + 1}</a>`).join('')}</div></div>`;
    }).join('');
    main.innerHTML = `<div class="page"><div class="crumbs"><a href="#/">Lageplan</a> › <span>Herausforderungen</span></div>
      <h1>Interaktive Herausforderungen</h1>
      <p class="lead">Finden Sie Geräte, ordnen Sie Aufgaben zu, identifizieren Sie Komponenten, erkennen Sie Alarme und erklären Sie Geräteverbünde – direkt in den Raumansichten.</p>
      ${rows}</div>`;
  }

  /* =================================================================
     Lernfortschritt
     ================================================================= */
  function renderProgress(main) {
    let tot = { dev: 0, devAll: 0, sc: 0, scAll: 0, ch: 0, chAll: 0 };
    const rows = LAYOUT.filter((l) => areas.has(l.id)).map((l) => {
      const a = areas.get(l.id);
      const st = progress.areaStats(a);
      tot.dev += st.dev; tot.devAll += a.devices.length; tot.sc += st.sc; tot.scAll += a.scenarios.length; tot.ch += st.ch; tot.chAll += a.challenges.length;
      return `<tr><td><a href="#/area/${a.id}">${l.icon} ${esc(a.name)}</a></td><td>${st.dev}/${a.devices.length}</td><td>${st.sc}/${a.scenarios.length}</td><td>${st.ch}/${a.challenges.length}</td>
        <td><div class="bar"><i style="width:${st.pct}%;background:${l.color}"></i></div></td></tr>`;
    }).join('');
    const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
    main.innerHTML = `<div class="page"><div class="crumbs"><a href="#/">Lageplan</a> › <span>Lernfortschritt</span></div>
      <h1>Lernfortschritt</h1>
      <div class="grid3">
        <div class="card kpi"><b>${pct(tot.dev, tot.devAll)} %</b><span>Geräte erkundet (${tot.dev}/${tot.devAll})</span></div>
        <div class="card kpi"><b>${pct(tot.sc, tot.scAll)} %</b><span>Szenarien abgeschlossen (${tot.sc}/${tot.scAll})</span></div>
        <div class="card kpi"><b>${pct(tot.ch, tot.chAll)} %</b><span>Aufgaben gelöst (${tot.ch}/${tot.chAll})</span></div>
      </div>
      <div class="card"><table class="prog"><thead><tr><th>Bereich</th><th>Geräte</th><th>Szenarien</th><th>Aufgaben</th><th>Gesamt</th></tr></thead><tbody>${rows}</tbody></table></div>
      <p class="muted small">Der Fortschritt wird nur lokal in Ihrem Browser gespeichert.</p>
      <button class="btn ghost" id="reset-prog">Fortschritt zurücksetzen</button></div>`;
    $('#reset-prog').addEventListener('click', () => { if (confirm('Gesamten Lernfortschritt löschen?')) { progress.reset(); route(); } });
  }

  /* =================================================================
     Über / Hinweise
     ================================================================= */
  function renderAbout(main) {
    main.innerHTML = `<div class="page narrow"><div class="crumbs"><a href="#/">Lageplan</a> › <span>Hinweise</span></div>
      <h1>Hinweise zur Lernumgebung</h1>
      <div class="card prose">
        <h3>Zweck</h3><p>Der MedTech Simulator ist eine Lernumgebung, die den Einsatz von Medizintechnik im klinischen Alltag veranschaulicht – für Auszubildende und Studierende in Medizintechnik, Pflege, Medizin, Anästhesietechnik und Rettungsdienst.</p>
        <h3>Wichtige Einschränkungen</h3>
        <ul><li><b>Kein Medizinprodukt.</b> Die Anwendung dient ausschließlich der Lehre und darf nicht für Diagnose, Therapie oder Gerätebedienung am Patienten verwendet werden.</li>
        <li><b>Fiktive Daten.</b> Alle Patienten, Namen, Befunde und Werte sind frei erfunden. Ähnlichkeiten mit realen Personen sind zufällig.</li>
        <li><b>Vereinfachte Modelle.</b> Die Simulationen bilden physiologische und technische Prinzipien qualitativ korrekt, aber stark vereinfacht ab.</li>
        <li><b>Hersteller.</b> Herstellernamen werden als Beispiele typischer Anbieter einer Geräteklasse genannt. Die gezeigten Geräte sind generische Darstellungen und keinem realen Produkt nachgebildet.</li>
        <li><b>Normen &amp; Regeln.</b> Verweise (z. B. MDR, MPBetreibV, IEC 60601) dienen der Orientierung; maßgeblich sind die jeweils gültigen Fassungen, Gebrauchsanweisungen und hausinternen Standards.</li></ul>
        <h3>Bedienung</h3><ul><li>Lageplan → Bereich wählen → Gerät in der Raumansicht anklicken.</li><li>„Geräteverbund“ blendet Daten-, Gas-, Flüssigkeits- und Energieverbindungen ein.</li>
        <li>Alarmtöne sind standardmäßig aus und lassen sich in der Raumansicht aktivieren.</li><li>Tastatur: Tab zum Navigieren, Enter zum Öffnen, Esc schließt das Infofenster.</li></ul>
        <h3>Technik</h3><p>Reines HTML, CSS und JavaScript (SVG &amp; Canvas). Keine 3D-Hardware, keine Installation, kein Server notwendig – läuft auch offline direkt aus dem Dateisystem.</p>
      </div></div>`;
  }

  /* =================================================================
     Start
     ================================================================= */
  function init() {
    progress.load();
    window.addEventListener('hashchange', route);
    // Drawer per Klick außerhalb schließen
    document.addEventListener('click', (e) => {
      const drawer = $('.drawer');
      if (!drawer || drawer.hidden) return;
      if (drawer.contains(e.target)) return;
      if (e.target.closest('[data-device], .tag, .dev-list, .tabs, .scene-toolbar, .side')) return;
      closeDrawer();
    });
    route();
  }
  MTS.boot = init;
  MTS._internals = { route, startScenario: (id) => startScenario(id), startChallenge: (i) => startChallenge(i), endMode: () => endMode() };
})();
