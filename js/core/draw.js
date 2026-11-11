/* =====================================================================
   MedTech Simulator – SVG-Zeichenbibliothek
   Alle Funktionen liefern SVG-Markup als String. Koordinatensystem der
   Raumszenen: viewBox="0 0 1600 900"  (Wand 0–560, Boden 560–900).
   Geräte werden mit D.dev(id, inner) als klickbare Gruppe markiert.
   ===================================================================== */
(function () {
  'use strict';
  const MTS = (window.MTS = window.MTS || {});
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const D = {};
  D.esc = esc;

  /* ---------- Gemeinsame Definitionen (Gradienten, Filter) ---------- */
  D.defs = function () {
    return `<defs>
      <linearGradient id="g-wall" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#e9eef2"/><stop offset="1" stop-color="#d5dde3"/></linearGradient>
      <linearGradient id="g-wall-accent" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#cfe3ea"/><stop offset="1" stop-color="#b8d2dc"/></linearGradient>
      <linearGradient id="g-floor" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#b9c4c9"/><stop offset="1" stop-color="#8f9ca3"/></linearGradient>
      <linearGradient id="g-plastic" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#fbfcfd"/><stop offset="0.55" stop-color="#e6ebef"/><stop offset="1" stop-color="#c9d1d8"/></linearGradient>
      <linearGradient id="g-plastic-v" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#d3dae0"/></linearGradient>
      <linearGradient id="g-dark" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#3a4550"/><stop offset="1" stop-color="#1e252c"/></linearGradient>
      <linearGradient id="g-metal" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#8a959e"/><stop offset="0.45" stop-color="#e3e8ec"/><stop offset="1" stop-color="#7d8891"/></linearGradient>
      <linearGradient id="g-metal-v" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#e3e8ec"/><stop offset="1" stop-color="#8a959e"/></linearGradient>
      <linearGradient id="g-screen" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#0b1418"/><stop offset="1" stop-color="#05090b"/></linearGradient>
      <linearGradient id="g-glass" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#ffffff" stop-opacity="0.18"/><stop offset="0.5" stop-color="#ffffff" stop-opacity="0.02"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></linearGradient>
      <linearGradient id="g-window" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#9fd3f0"/><stop offset="0.7" stop-color="#d9eef8"/><stop offset="1" stop-color="#eaf5f9"/></linearGradient>
      <linearGradient id="g-blanket" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#9cc7e6"/><stop offset="1" stop-color="#6c9ec4"/></linearGradient>
      <linearGradient id="g-skin" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#f1c9a8"/><stop offset="1" stop-color="#d9a785"/></linearGradient>
      <linearGradient id="g-mattress" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#f6f8fa"/><stop offset="1" stop-color="#cfd8de"/></linearGradient>
      <linearGradient id="g-green" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#4caf8a"/><stop offset="1" stop-color="#2e7d63"/></linearGradient>
      <linearGradient id="g-or-green" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#5fa89a"/><stop offset="1" stop-color="#3f7f73"/></linearGradient>
      <linearGradient id="g-fluid" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#e8f6ff" stop-opacity="0.85"/><stop offset="1" stop-color="#bfe3f7" stop-opacity="0.85"/></linearGradient>
      <radialGradient id="g-lamp" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stop-color="#fffbe8"/><stop offset="0.6" stop-color="#fff2c2"/><stop offset="1" stop-color="#e8d79a"/></radialGradient>
      <radialGradient id="g-light-cone" cx="0.5" cy="0" r="1">
        <stop offset="0" stop-color="#fffbe0" stop-opacity="0.55"/><stop offset="1" stop-color="#fffbe0" stop-opacity="0"/></radialGradient>
      <radialGradient id="g-shadow" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stop-color="#000" stop-opacity="0.32"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
      <filter id="f-soft" x="-10%" y="-10%" width="120%" height="130%">
        <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#0b2030" flood-opacity="0.28"/></filter>
      <filter id="f-glow" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="2.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      <pattern id="p-tiles" width="80" height="80" patternUnits="userSpaceOnUse">
        <rect width="80" height="80" fill="none"/><path d="M80 0H0V80" fill="none" stroke="#ffffff" stroke-opacity="0.18" stroke-width="2"/></pattern>
      <pattern id="p-grid-screen" width="10" height="10" patternUnits="userSpaceOnUse">
        <path d="M10 0H0V10" fill="none" stroke="#1d3a33" stroke-width="0.5"/></pattern>
    </defs>`;
  };

  /* ---------- Raum ---------- */
  D.room = function (o) {
    o = Object.assign({ wall: 'url(#g-wall)', accent: 'url(#g-wall-accent)', floor: 'url(#g-floor)', window: true, door: false, title: '', sign: '' }, o || {});
    let s = '';
    s += `<rect x="0" y="0" width="1600" height="560" fill="${o.wall}"/>`;
    s += `<rect x="0" y="380" width="1600" height="180" fill="${o.accent}" opacity="0.9"/>`;
    s += `<rect x="0" y="376" width="1600" height="6" fill="#ffffff" opacity="0.7"/>`;
    // Decke
    s += `<rect x="0" y="0" width="1600" height="34" fill="#f4f7f9"/><rect x="0" y="34" width="1600" height="3" fill="#c5ced5"/>`;
    // Boden in Perspektive
    s += `<path d="M0 560 H1600 V900 H0 Z" fill="${o.floor}"/>`;
    for (let i = 0; i <= 20; i++) {
      const xTop = i * 80;
      const xBot = 800 + (xTop - 800) * 1.9;
      s += `<line x1="${xTop}" y1="560" x2="${xBot}" y2="900" stroke="#ffffff" stroke-opacity="0.13" stroke-width="2"/>`;
    }
    [585, 618, 662, 720, 795, 890].forEach((y) => (s += `<line x1="0" y1="${y}" x2="1600" y2="${y}" stroke="#ffffff" stroke-opacity="0.13" stroke-width="2"/>`));
    s += `<rect x="0" y="552" width="1600" height="10" fill="#7d8a92"/>`;
    // Glanz auf dem Boden
    s += `<ellipse cx="800" cy="640" rx="620" ry="50" fill="#ffffff" opacity="0.07"/>`;
    if (o.window) s += D.window(o.windowX || 1280, 90, 250, 220);
    if (o.door) s += D.door(o.doorX || 60, 150);
    if (o.sign) s += D.sign(o.signX || 660, 52, o.sign);
    // Deckenleuchten
    [300, 800, 1300].forEach((x) => {
      s += `<rect x="${x - 110}" y="34" width="220" height="10" rx="3" fill="#fbfbf5" stroke="#d8dcd8"/>`;
      s += `<path d="M${x - 110} 44 L${x - 260} 560 L${x + 260} 560 L${x + 110} 44 Z" fill="url(#g-light-cone)" opacity="0.25"/>`;
    });
    return s;
  };
  D.window = function (x, y, w, h) {
    return `<g>
      <rect x="${x - 8}" y="${y - 8}" width="${w + 16}" height="${h + 16}" rx="4" fill="#cfd8de"/>
      <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#g-window)"/>
      <path d="M${x} ${y + h * 0.78} q ${w * 0.25} -30 ${w * 0.5} -8 t ${w * 0.5} -14 V${y + h} H${x} Z" fill="#9cc49a" opacity="0.7"/>
      <path d="M${x} ${y + h * 0.86} q ${w * 0.3} -18 ${w * 0.6} -2 t ${w * 0.4} -10 V${y + h} H${x} Z" fill="#7fae80" opacity="0.8"/>
      <line x1="${x + w / 2}" y1="${y}" x2="${x + w / 2}" y2="${y + h}" stroke="#cfd8de" stroke-width="6"/>
      <line x1="${x}" y1="${y + h * 0.42}" x2="${x + w}" y2="${y + h * 0.42}" stroke="#cfd8de" stroke-width="4"/>
      <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#g-glass)"/>
      <rect x="${x - 16}" y="${y + h + 8}" width="${w + 32}" height="10" rx="2" fill="#e3e8ec" stroke="#b9c3ca"/>
      <rect x="${x - 26}" y="${y - 20}" width="${w * 0.22}" height="${h + 40}" fill="#d9e6ec" opacity="0.9"/>
      <rect x="${x + w - w * 0.22 + 26}" y="${y - 20}" width="${w * 0.22}" height="${h + 40}" fill="#d9e6ec" opacity="0.9"/>
    </g>`;
  };
  D.door = function (x, y, label) {
    return `<g>
      <rect x="${x}" y="${y}" width="190" height="410" fill="#c8d3da" stroke="#9aa7b0" stroke-width="3"/>
      <rect x="${x + 14}" y="${y + 14}" width="162" height="396" fill="#e7edf1"/>
      <rect x="${x + 40}" y="${y + 50}" width="110" height="120" rx="4" fill="url(#g-window)" stroke="#9aa7b0" stroke-width="2"/>
      <rect x="${x + 140}" y="${y + 220}" width="26" height="8" rx="3" fill="#8c979f"/>
      ${label ? `<text x="${x + 95}" y="${y - 10}" text-anchor="middle" font-size="16" fill="#5b6a74" font-weight="600">${esc(label)}</text>` : ''}
    </g>`;
  };
  D.sign = function (x, y, text) {
    return `<g><rect x="${x}" y="${y}" width="${text.length * 11 + 40}" height="34" rx="6" fill="#0f5a73"/>
      <text x="${x + 20}" y="${y + 23}" font-size="17" font-weight="700" fill="#fff" letter-spacing="1">${esc(text)}</text></g>`;
  };
  D.shadow = function (cx, cy, rx, ry) {
    return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry || rx * 0.18}" fill="url(#g-shadow)"/>`;
  };
  D.wheel = function (x, y, r) {
    r = r || 9;
    return `<circle cx="${x}" cy="${y}" r="${r}" fill="#2b333a"/><circle cx="${x}" cy="${y}" r="${r * 0.4}" fill="#8a959e"/>`;
  };
  D.text = function (x, y, t, o) {
    o = Object.assign({ size: 14, fill: '#334', anchor: 'start', weight: 400, family: '' }, o || {});
    return `<text x="${x}" y="${y}" font-size="${o.size}" fill="${o.fill}" text-anchor="${o.anchor}" font-weight="${o.weight}" ${o.family ? `font-family="${o.family}"` : ''}>${esc(t)}</text>`;
  };

  /* ---------- Klickbares Gerät ---------- */
  D.dev = function (id, inner, o) {
    o = o || {};
    return `<g class="dev" data-device="${id}" tabindex="0" role="button" ${o.label ? `aria-label="${esc(o.label)}"` : ''}>${inner}</g>`;
  };

  /* ---------- Bildschirm mit Live-Kurven ---------- */
  // waves: [{kind:'ecg', label:'II', vital:'hr', unit:'/min', color}]
  D.screenWaves = function (x, y, w, h, waves, o) {
    o = Object.assign({ numerics: true, header: true }, o || {});
    const numW = o.numerics ? Math.min(150, w * 0.3) : 0;
    const top = o.header ? 16 : 4;
    const rowH = (h - top - 4) / waves.length;
    let s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="url(#g-screen)"/>`;
    if (o.header) {
      s += `<rect x="${x}" y="${y}" width="${w}" height="14" fill="#13222a"/>`;
      s += `<text x="${x + 6}" y="${y + 10.5}" font-size="8.5" fill="#9fb5bf" font-family="monospace">${esc(o.title || 'BETT 3 · LERNSZENARIO')}</text>`;
      s += `<text x="${x + w - 6}" y="${y + 10.5}" font-size="8.5" fill="#ff6b6b" font-family="monospace" text-anchor="end" data-alarmtext="1"></text>`;
    }
    waves.forEach((wv, i) => {
      const ry = y + top + i * rowH;
      const def = (MTS.Live && MTS.Live.WAVES[wv.kind]) || { color: '#3f6' };
      const color = wv.color || def.color;
      s += `<text x="${x + 5}" y="${ry + 10}" font-size="8" fill="${color}" font-family="monospace">${esc(wv.label || wv.kind.toUpperCase())}</text>`;
      s += `<g data-wave="${wv.kind}" data-rect="${x + 4},${ry + 3},${w - numW - 10},${rowH - 6}" data-color="${color}" ${wv.seconds ? `data-seconds="${wv.seconds}"` : ''}></g>`;
      if (o.numerics && wv.vital) {
        const nx = x + w - numW;
        s += `<line x1="${nx}" y1="${ry + 2}" x2="${nx}" y2="${ry + rowH - 2}" stroke="#1d2f37"/>`;
        s += `<text x="${nx + 6}" y="${ry + 11}" font-size="8" fill="${color}" font-family="monospace">${esc(wv.vlabel || '')}</text>`;
        const fs = Math.min(rowH * 0.62, 30);
        s += `<text x="${x + w - 8}" y="${ry + rowH * 0.5 + fs * 0.36}" font-size="${fs}" fill="${color}" font-family="monospace" font-weight="700" text-anchor="end" data-vital="${wv.vital}">--</text>`;
        if (wv.vital2) s += `<text x="${x + w - 8}" y="${ry + rowH - 4}" font-size="${Math.max(8, fs * 0.38)}" fill="${color}" font-family="monospace" text-anchor="end" data-vital="${wv.vital2}">--</text>`;
        if (wv.unit) s += `<text x="${nx + 6}" y="${ry + rowH - 5}" font-size="7.5" fill="${color}" opacity="0.8" font-family="monospace">${esc(wv.unit)}</text>`;
      }
    });
    s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="url(#g-glass)"/>`;
    return s;
  };

  /* ---------- Patientenmonitor ---------- */
  D.monitor = function (o) {
    o = Object.assign({ x: 0, y: 0, w: 300, h: 210, arm: true, waves: null, title: 'BETT 3 · LERNSZENARIO' }, o);
    const { x, y, w, h } = o;
    const waves = o.waves || [
      { kind: 'ecg', label: 'II', vital: 'hr', vlabel: 'HF', unit: '/min' },
      { kind: 'art', label: 'ART', vital: 'art', vital2: 'map', vlabel: 'ART', unit: 'mmHg' },
      { kind: 'pleth', label: 'Pleth', vital: 'spo2', vlabel: 'SpO₂', unit: '%' },
      { kind: 'co2', label: 'CO₂', vital: 'etco2', vlabel: 'etCO₂', unit: 'mmHg' },
    ];
    let s = '';
    if (o.arm) {
      s += `<rect x="${x + w / 2 - 8}" y="${y - (o.armLen || 60)}" width="16" height="${o.armLen || 60}" fill="url(#g-metal)"/>`;
      s += `<rect x="${x + w / 2 - 22}" y="${y - 12}" width="44" height="14" rx="3" fill="#7d8891"/>`;
    }
    s += `<rect x="${x - 10}" y="${y - 10}" width="${w + 20}" height="${h + 34}" rx="12" fill="url(#g-plastic)" stroke="#a9b4bc" filter="url(#f-soft)"/>`;
    s += D.screenWaves(x, y, w, h, waves, { title: o.title });
    // Bedienleiste
    s += `<rect x="${x}" y="${y + h + 6}" width="${w}" height="14" rx="4" fill="#dfe5ea"/>`;
    for (let i = 0; i < 5; i++) s += `<rect x="${x + 10 + i * 22}" y="${y + h + 9}" width="16" height="8" rx="2" fill="#b7c2ca"/>`;
    s += `<circle cx="${x + w - 16}" cy="${y + h + 13}" r="5" fill="#2fbf71"/>`;
    // Alarmleuchte oben
    s += `<rect x="${x + w - 50}" y="${y - 16}" width="40" height="8" rx="4" fill="#5b6770" class="alarm-lamp"/>`;
    return s;
  };

  /* ---------- Krankenbett mit (fiktivem) Patienten ---------- */
  D.bed = function (o) {
    const src = o || {};
    o = Object.assign({ x: 400, y: 560, w: 560, patient: true, intubated: false, headRaise: 30, blanket: 'url(#g-blanket)', cannula: false }, o);
    const { x, y, w } = o; // y = Höhe der Liegefläche
    let s = D.shadow(x + w / 2, y + 190, w * 0.62, 24);
    // Fahrgestell
    s += `<rect x="${x + 30}" y="${y + 120}" width="${w - 60}" height="18" rx="6" fill="#6f7b84"/>`;
    s += `<rect x="${x + w / 2 - 70}" y="${y + 40}" width="140" height="84" rx="8" fill="#8995a0"/>`;
    s += `<rect x="${x + w / 2 - 50}" y="${y + 50}" width="100" height="64" rx="6" fill="#a7b2bb"/>`;
    s += D.wheel(x + 50, y + 150, 13) + D.wheel(x + w - 50, y + 150, 13);
    // Rahmen
    s += `<rect x="${x}" y="${y + 18}" width="${w}" height="26" rx="6" fill="#d6dde3" stroke="#9aa6af"/>`;
    // Kopf-/Fußteil
    s += `<rect x="${x - 18}" y="${y - 70}" width="22" height="116" rx="8" fill="url(#g-plastic)" stroke="#9aa6af"/>`;
    s += `<rect x="${x + w - 4}" y="${y - 40}" width="22" height="86" rx="8" fill="url(#g-plastic)" stroke="#9aa6af"/>`;
    s += `<rect x="${x + w - 2}" y="${y - 30}" width="14" height="20" rx="2" fill="#4a7fa0" opacity="0.8"/>`;
    // Matratze: Fußteil flach, Kopfteil um headRaise° um Gelenk H angehoben
    const t = 22;
    const a = (o.headRaise * Math.PI) / 180;
    const L = w * 0.36;
    const H = { x: x + w * 0.38, y: y };
    const dx = -Math.cos(a), dy = -Math.sin(a); // Richtung Gelenk -> Kopfende
    const nx = -Math.sin(a), ny = Math.cos(a);  // Normale "nach unten"
    const E = { x: H.x + dx * L, y: H.y + dy * L };
    s += `<rect x="${H.x - 4}" y="${y}" width="${x + w - 6 - H.x + 4}" height="${t}" rx="6" fill="url(#g-mattress)" stroke="#b3bec6"/>`;
    s += `<path d="M${H.x} ${H.y} L${E.x} ${E.y} L${E.x + nx * t} ${E.y + ny * t} L${H.x} ${H.y + t} Z" fill="url(#g-mattress)" stroke="#b3bec6" stroke-linejoin="round"/>`;
    // Rückenteil-Mechanik
    s += `<path d="M${(H.x + E.x) / 2 + nx * t} ${(H.y + E.y) / 2 + ny * t} L${(H.x + E.x) / 2 + 30} ${y + 18}" stroke="#8995a0" stroke-width="6"/>`;
    if (o.patient) {
      const up = (k) => ({ x: -nx * k, y: -ny * k }); // senkrecht zur Liegefläche nach oben
      const along = (k) => ({ x: E.x - dx * k, y: E.y - dy * k }); // vom Kopfende Richtung Gelenk
      const hc = { x: along(34).x + up(24).x, y: along(34).y + up(24).y };
      // Kissen
      s += `<ellipse cx="${along(40).x + up(8).x}" cy="${along(40).y + up(8).y}" rx="46" ry="13" transform="rotate(${o.headRaise === 0 ? 0 : -o.headRaise} ${along(40).x + up(8).x} ${along(40).y + up(8).y})" fill="#ffffff" stroke="#d3dbe1"/>`;
      // Körper unter der Decke
      const sh = { x: along(84).x + up(17).x, y: along(84).y + up(17).y };
      const hip = { x: H.x + up(17).x * 0.5, y: H.y - 17 };
      const feet = { x: x + w - 40, y: y - 15 };
      s += `<path d="M${sh.x} ${sh.y} L${hip.x} ${hip.y} L${feet.x} ${feet.y}" stroke="#5b87a8" stroke-width="38" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`;
      s += `<path d="M${sh.x} ${sh.y} L${hip.x} ${hip.y} L${feet.x} ${feet.y}" stroke="${o.blanket}" stroke-width="34" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`;
      s += `<path d="M${feet.x - 6} ${feet.y - 18} q 16 -14 22 6" stroke="#5b87a8" fill="none" stroke-width="2" opacity="0.6"/>`;
      s += `<path d="M${hip.x + 40} ${hip.y - 12} q 90 -8 180 -4" stroke="#ffffff" fill="none" stroke-width="2" opacity="0.35"/>`;
      // Hals + Kopf
      s += `<path d="M${hc.x} ${hc.y} L${sh.x} ${sh.y}" stroke="url(#g-skin)" stroke-width="20" stroke-linecap="round"/>`;
      s += `<circle cx="${hc.x}" cy="${hc.y}" r="23" fill="url(#g-skin)" stroke="#c99777"/>`;
      s += `<path d="M${hc.x - 22} ${hc.y + 2} q -4 -26 20 -27 q 12 -1 18 6 q -16 0 -22 10 Z" fill="#6b5446" opacity="0.9"/>`;
      s += `<circle cx="${hc.x + 9}" cy="${hc.y - 5}" r="2" fill="#4a3a30"/>`;
      // Arm auf der Decke
      const elbow = { x: hip.x - 10, y: hip.y - 14 };
      s += `<path d="M${sh.x + 6} ${sh.y - 6} L${elbow.x} ${elbow.y} L${elbow.x + 70} ${elbow.y + 2}" stroke="url(#g-skin)" stroke-width="13" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`;
      s += `<rect x="${elbow.x + 66}" y="${elbow.y - 6}" width="15" height="11" rx="3" fill="#ff4d5e" opacity="0.95"/>`; // SpO2-Clip
      const mouth = { x: hc.x + 20, y: hc.y + 4 };
      if (o.intubated) {
        s += `<path d="M${mouth.x - 4} ${mouth.y} l 26 -4" stroke="#e9f2f7" stroke-width="7" stroke-linecap="round"/>`;
        s += `<path d="M${mouth.x - 4} ${mouth.y} l 26 -4" stroke="#8fb9d1" stroke-width="2" stroke-linecap="round"/>`;
        s += `<rect x="${mouth.x - 8}" y="${mouth.y - 6}" width="10" height="12" rx="2" fill="#ffffff" stroke="#9fb4c0"/>`;
      }
      if (o.cannula) s += `<path d="M${mouth.x - 2} ${mouth.y - 8} q 12 6 0 14" stroke="#bfe4f5" stroke-width="3" fill="none"/>`;
      if (o.mask) s += `<ellipse cx="${mouth.x}" cy="${mouth.y - 2}" rx="11" ry="14" fill="#e8f6fb" fill-opacity="0.7" stroke="#8fb9d1" stroke-width="2"/>`;
      o.headPos = src.headPos = { x: hc.x, y: hc.y, mouth, chest: { x: (sh.x + hip.x) / 2, y: (sh.y + hip.y) / 2 - 10 }, hand: { x: elbow.x + 72, y: elbow.y } };
    }
    // Seitengitter
    s += `<rect x="${x + w * 0.45}" y="${y - 30}" width="${w * 0.42}" height="40" rx="10" fill="none" stroke="#c0cad1" stroke-width="7" opacity="0.85"/>`;
    s += `<line x1="${x + w * 0.5}" y1="${y - 10}" x2="${x + w * 0.82}" y2="${y - 10}" stroke="#c0cad1" stroke-width="4" opacity="0.8"/>`;
    return s;
  };

  /* ---------- Infusionsständer ---------- */
  D.ivPole = function (o) {
    o = Object.assign({ x: 0, y: 860, h: 520, bags: [{ label: 'NaCl 0,9 %', fill: 0.7 }] }, o);
    const { x, y, h } = o;
    let s = D.shadow(x, y + 6, 60, 10);
    s += `<rect x="${x - 3}" y="${y - h}" width="6" height="${h}" fill="url(#g-metal)"/>`;
    s += `<path d="M${x - 50} ${y} L${x} ${y - 14} L${x + 50} ${y}" stroke="#7d8891" stroke-width="6" fill="none"/>`;
    s += D.wheel(x - 50, y + 2, 7) + D.wheel(x + 50, y + 2, 7);
    s += `<path d="M${x - 44} ${y - h + 6} H${x + 44}" stroke="#9aa5ad" stroke-width="5" stroke-linecap="round"/>`;
    o.bags.forEach((b, i) => {
      const bx = x - 40 + i * 46, by = y - h + 12;
      s += `<path d="M${bx + 16} ${by} v8" stroke="#9aa5ad" stroke-width="2"/>`;
      s += `<rect x="${bx}" y="${by + 8}" width="34" height="62" rx="8" fill="#f2fbff" fill-opacity="0.75" stroke="#9cc1d6"/>`;
      s += `<rect x="${bx + 2}" y="${by + 8 + 62 * (1 - b.fill)}" width="30" height="${60 * b.fill}" rx="6" fill="${b.color || 'url(#g-fluid)'}"/>`;
      s += `<rect x="${bx + 5}" y="${by + 20}" width="24" height="16" fill="#ffffff" opacity="0.9"/>`;
      s += `<text x="${bx + 17}" y="${by + 31}" font-size="5.5" text-anchor="middle" fill="#245">${esc(b.label || '')}</text>`;
      s += `<path d="M${bx + 17} ${by + 70} v14" stroke="#cfe6f2" stroke-width="3"/>`;
      s += `<rect x="${bx + 13}" y="${by + 82}" width="8" height="16" rx="2" fill="#e9f6fb" stroke="#9cc1d6"/>`;
    });
    return s;
  };

  /* ---------- Spritzenpumpe ---------- */
  D.syringePump = function (x, y, w, o) {
    o = Object.assign({ drug: 'Medikament', rate: '5,0 ml/h', color: '#ffe08a', running: true }, o || {});
    w = w || 150;
    const h = w * 0.36;
    let s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="5" fill="url(#g-plastic-v)" stroke="#9aa6af"/>`;
    // Spritze
    s += `<rect x="${x + 8}" y="${y + 6}" width="${w * 0.62}" height="${h * 0.32}" rx="3" fill="#f7fbff" stroke="#9ab"/>`;
    s += `<rect x="${x + 10}" y="${y + 8}" width="${w * 0.4}" height="${h * 0.32 - 4}" rx="2" fill="${o.color}" opacity="0.75"/>`;
    s += `<rect x="${x + 8 + w * 0.62}" y="${y + 8}" width="${w * 0.12}" height="${h * 0.32 - 4}" fill="#cfd6dc"/>`;
    // Display
    s += `<rect x="${x + 8}" y="${y + h * 0.5}" width="${w * 0.52}" height="${h * 0.4}" rx="2" fill="#0c2a1f"/>`;
    s += `<text x="${x + 11}" y="${y + h * 0.5 + h * 0.17}" font-size="${h * 0.15}" fill="#7dffb5" font-family="monospace">${esc(o.drug)}</text>`;
    s += `<text x="${x + 11}" y="${y + h * 0.5 + h * 0.34}" font-size="${h * 0.15}" fill="#7dffb5" font-family="monospace">${esc(o.rate)}</text>`;
    // Tasten
    for (let i = 0; i < 3; i++) s += `<rect x="${x + w * 0.66 + i * w * 0.1}" y="${y + h * 0.58}" width="${w * 0.08}" height="${h * 0.26}" rx="2" fill="#c3ccd3"/>`;
    s += `<circle cx="${x + w - 8}" cy="${y + 8}" r="3" fill="${o.running ? '#2fbf71' : '#f0a500'}" class="${o.running ? 'blink-slow' : ''}"/>`;
    return s;
  };
  /* ---------- Pumpen-Dockingstation mit mehreren Spritzenpumpen ---------- */
  D.pumpStack = function (o) {
    o = Object.assign({ x: 0, y: 0, w: 150, pumps: [{}, {}, {}], pole: true }, o);
    const h = o.w * 0.36;
    let s = '';
    s += `<rect x="${o.x - 8}" y="${o.y - 10}" width="${o.w + 16}" height="${o.pumps.length * (h + 6) + 16}" rx="6" fill="#c3ccd3" stroke="#8f9aa2"/>`;
    s += `<rect x="${o.x - 8}" y="${o.y - 26}" width="${o.w + 16}" height="18" rx="5" fill="#dfe5ea" stroke="#8f9aa2"/>`;
    s += `<text x="${o.x + o.w / 2}" y="${o.y - 13}" font-size="9" text-anchor="middle" fill="#455">DOCKINGSTATION</text>`;
    o.pumps.forEach((p, i) => (s += D.syringePump(o.x, o.y + i * (h + 6), o.w, p)));
    return s;
  };

  /* ---------- Volumetrische Infusionspumpe ---------- */
  D.volPump = function (x, y, w, o) {
    o = Object.assign({ drug: 'Ringer', rate: '80 ml/h', vtbi: '420 ml' }, o || {});
    w = w || 110;
    const h = w * 1.25;
    let s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="url(#g-plastic-v)" stroke="#9aa6af" filter="url(#f-soft)"/>`;
    s += `<rect x="${x + 8}" y="${y + 8}" width="${w - 16}" height="${h * 0.32}" rx="3" fill="#0c2a1f"/>`;
    s += `<text x="${x + 13}" y="${y + 22}" font-size="${w * 0.09}" fill="#7dffb5" font-family="monospace">${esc(o.drug)}</text>`;
    s += `<text x="${x + 13}" y="${y + 22 + w * 0.12}" font-size="${w * 0.12}" fill="#7dffb5" font-family="monospace" font-weight="700">${esc(o.rate)}</text>`;
    s += `<text x="${x + 13}" y="${y + 22 + w * 0.24}" font-size="${w * 0.08}" fill="#7dffb5" font-family="monospace">VTBI ${esc(o.vtbi)}</text>`;
    // Pumpentür mit Schlauch
    s += `<rect x="${x + 8}" y="${y + h * 0.42}" width="${w * 0.45}" height="${h * 0.5}" rx="4" fill="#d8e0e6" stroke="#9aa6af"/>`;
    s += `<path d="M${x + 8 + w * 0.22} ${y + h * 0.42} v${h * 0.5}" stroke="#bfe0f0" stroke-width="4"/>`;
    for (let i = 0; i < 6; i++) s += `<rect x="${x + 14 + w * 0.12}" y="${y + h * 0.46 + i * h * 0.07}" width="${w * 0.2}" height="${h * 0.03}" fill="#97a3ac"/>`;
    for (let r = 0; r < 4; r++) for (let c = 0; c < 2; c++) s += `<rect x="${x + w * 0.6 + c * w * 0.17}" y="${y + h * 0.45 + r * h * 0.11}" width="${w * 0.13}" height="${h * 0.07}" rx="2" fill="#c3ccd3"/>`;
    s += `<circle cx="${x + w - 12}" cy="${y + h - 12}" r="4" fill="#2fbf71" class="blink-slow"/>`;
    return s;
  };

  /* ---------- Beatmungsgerät (Intensiv) ---------- */
  D.ventilator = function (o) {
    const src = o || {};
    o = Object.assign({ x: 0, y: 300, scale: 1, waves: true }, o);
    const { x, y } = o;
    const k = o.scale;
    const W = 230 * k, H = 520 * k;
    let s = D.shadow(x + W / 2, y + H + 6, W * 0.7, 14);
    // Fahrwagen
    s += `<rect x="${x + W * 0.42}" y="${y + 200 * k}" width="${W * 0.16}" height="${280 * k}" fill="url(#g-metal)"/>`;
    s += `<rect x="${x + W * 0.05}" y="${y + H - 28 * k}" width="${W * 0.9}" height="${18 * k}" rx="6" fill="#59656e"/>`;
    s += D.wheel(x + W * 0.1, y + H - 6 * k, 10 * k) + D.wheel(x + W * 0.9, y + H - 6 * k, 10 * k) + D.wheel(x + W * 0.5, y + H - 6 * k, 10 * k);
    // Basiseinheit (Pneumatik)
    s += `<rect x="${x + W * 0.08}" y="${y + 210 * k}" width="${W * 0.84}" height="${150 * k}" rx="10" fill="url(#g-plastic)" stroke="#9aa6af" filter="url(#f-soft)"/>`;
    s += `<rect x="${x + W * 0.14}" y="${y + 230 * k}" width="${W * 0.3}" height="${18 * k}" rx="4" fill="#cfd8de"/>`;
    s += `<text x="${x + W * 0.5}" y="${y + 345 * k}" font-size="${10 * k}" fill="#6a7780" text-anchor="middle" font-weight="700">BEATMUNG</text>`;
    // Ports: Inspiration / Exspiration
    s += `<circle cx="${x + W * 0.25}" cy="${y + 290 * k}" r="${13 * k}" fill="#4f9fd1" stroke="#2f6f96" stroke-width="3"/>`;
    s += `<circle cx="${x + W * 0.25}" cy="${y + 290 * k}" r="${6 * k}" fill="#1c3b4f"/>`;
    s += `<circle cx="${x + W * 0.55}" cy="${y + 290 * k}" r="${13 * k}" fill="#9aa5ad" stroke="#6b7780" stroke-width="3"/>`;
    s += `<circle cx="${x + W * 0.55}" cy="${y + 290 * k}" r="${6 * k}" fill="#2c3338"/>`;
    s += `<text x="${x + W * 0.25}" y="${y + 318 * k}" font-size="${8 * k}" text-anchor="middle" fill="#456">INSP</text>`;
    s += `<text x="${x + W * 0.55}" y="${y + 318 * k}" font-size="${8 * k}" text-anchor="middle" fill="#456">EXSP</text>`;
    s += `<rect x="${x + W * 0.7}" y="${y + 272 * k}" width="${W * 0.14}" height="${36 * k}" rx="4" fill="#e5ebef" stroke="#9aa6af"/>`;
    // Bildschirm
    s += `<rect x="${x}" y="${y}" width="${W}" height="${190 * k}" rx="12" fill="url(#g-plastic)" stroke="#9aa6af" filter="url(#f-soft)"/>`;
    const sx = x + 10 * k, sy = y + 10 * k, sw = W - 20 * k, sh = 150 * k;
    s += `<rect x="${sx}" y="${sy}" width="${sw}" height="${sh}" rx="4" fill="url(#g-screen)"/>`;
    s += `<rect x="${sx}" y="${sy}" width="${sw}" height="${13 * k}" fill="#13222a"/>`;
    s += `<text x="${sx + 4}" y="${sy + 9.5 * k}" font-size="${8 * k}" fill="#9fd" font-family="monospace" data-vital="mode">VC-CMV</text>`;
    s += `<text x="${sx + sw - 4}" y="${sy + 9.5 * k}" font-size="${8 * k}" fill="#ff6b6b" font-family="monospace" text-anchor="end" data-ventalarm="1"></text>`;
    if (o.waves) {
      const gw = sw * 0.68, gh = (sh - 16 * k) / 3;
      [['paw', 'Paw'], ['flow', 'Flow'], ['vol', 'V']].forEach((p, i) => {
        const gy = sy + 15 * k + i * gh;
        s += `<text x="${sx + 3}" y="${gy + 8 * k}" font-size="${7 * k}" fill="${MTS.Live ? MTS.Live.WAVES[p[0]].color : '#fd6'}" font-family="monospace">${p[1]}</text>`;
        s += `<g data-wave="${p[0]}" data-rect="${sx + 2},${gy + 2},${gw},${gh - 4}" data-stroke="1.3"></g>`;
      });
      const nx = sx + gw + 6 * k;
      const nums = [['ppeak', 'Ppeak', '#ffd166'], ['peep', 'PEEP', '#ffd166'], ['vt', 'VTe', '#c3a6ff'], ['mv', 'MV', '#c3a6ff'], ['rr', 'f', '#7bdff2'], ['fio2', 'FiO₂', '#9fd']];
      nums.forEach((n, i) => {
        const ny = sy + 22 * k + i * 22 * k;
        s += `<text x="${nx}" y="${ny}" font-size="${6.5 * k}" fill="${n[2]}" font-family="monospace">${n[1]}</text>`;
        s += `<text x="${sx + sw - 4}" y="${ny + 10 * k}" font-size="${12 * k}" fill="${n[2]}" font-family="monospace" font-weight="700" text-anchor="end" data-vital="${n[0]}">--</text>`;
      });
    }
    s += `<rect x="${sx}" y="${sy}" width="${sw}" height="${sh}" rx="4" fill="url(#g-glass)"/>`;
    // Drehknopf + Tasten
    s += `<circle cx="${x + W - 30 * k}" cy="${y + 175 * k}" r="${10 * k}" fill="#3e4a53" stroke="#9aa6af" stroke-width="2"/>`;
    for (let i = 0; i < 5; i++) s += `<rect x="${x + 14 * k + i * 26 * k}" y="${y + 168 * k}" width="${20 * k}" height="${12 * k}" rx="3" fill="#c3ccd3"/>`;
    s += `<rect x="${x + W - 70 * k}" y="${y - 10 * k}" width="${40 * k}" height="${8 * k}" rx="4" fill="#5b6770" class="alarm-lamp"/>`;
    o.ports = src.ports = { insp: { x: x + W * 0.25, y: y + 290 * k }, exp: { x: x + W * 0.55, y: y + 290 * k } };
    return s;
  };

  /* ---------- Beatmungsschläuche (Y-Stück zum Patienten) ---------- */
  D.circuit = function (p1, p2, target) {
    const mid = { x: (p1.x + target.x) / 2, y: Math.max(p1.y, target.y) + 80 };
    const tube = (a, color) => `<path d="M${a.x} ${a.y} C ${a.x + 40} ${a.y + 120}, ${mid.x} ${mid.y + 40}, ${target.x - 30} ${target.y + 30} S ${target.x} ${target.y + 6} ${target.x} ${target.y}" fill="none" stroke="${color}" stroke-width="13" stroke-linecap="round" opacity="0.92"/>
      <path d="M${a.x} ${a.y} C ${a.x + 40} ${a.y + 120}, ${mid.x} ${mid.y + 40}, ${target.x - 30} ${target.y + 30} S ${target.x} ${target.y + 6} ${target.x} ${target.y}" fill="none" stroke="#ffffff" stroke-width="13" stroke-dasharray="2 5" opacity="0.35"/>`;
    return tube(p1, '#9ccbe6') + tube(p2, '#c2d3de');
  };

  /* ---------- Kabel / Leitung ---------- */
  D.cable = function (d, color, width) {
    return `<path d="${d}" fill="none" stroke="${color || '#3a4a55'}" stroke-width="${width || 3}" stroke-linecap="round" opacity="0.85"/>`;
  };

  /* ---------- Deckenversorgungseinheit ---------- */
  D.pendant = function (o) {
    const src = o || {};
    o = Object.assign({ x: 0, y: 37, h: 300, w: 120 }, o);
    const { x, y, h, w } = o;
    let s = `<rect x="${x + w / 2 - 14}" y="${y}" width="28" height="${h * 0.3}" fill="url(#g-metal)"/>`;
    s += `<rect x="${x}" y="${y + h * 0.3}" width="${w}" height="${h * 0.7}" rx="8" fill="url(#g-plastic)" stroke="#9aa6af" filter="url(#f-soft)"/>`;
    // Gasanschlüsse (Farbcodierung nach ISO 32 / DIN EN ISO 9170)
    const gases = [['O₂', '#ffffff', '#2c6fb5'], ['AIR', '#1d1d1d', '#ffffff'], ['VAC', '#f2d300', '#333']];
    gases.forEach((g, i) => {
      const gy = y + h * 0.36 + i * 30;
      s += `<rect x="${x + 12}" y="${gy}" width="${w - 24}" height="24" rx="4" fill="#eef2f5" stroke="#b5bfc7"/>`;
      s += `<circle cx="${x + 30}" cy="${gy + 12}" r="8" fill="${g[1]}" stroke="#555"/>`;
      s += `<text x="${x + 46}" y="${gy + 16}" font-size="10" font-weight="700" fill="#345">${g[0]}</text>`;
    });
    const sy = y + h * 0.36 + 96;
    for (let i = 0; i < 4; i++) {
      s += `<rect x="${x + 12 + (i % 2) * ((w - 24) / 2)}" y="${sy + Math.floor(i / 2) * 26}" width="${(w - 30) / 2}" height="22" rx="3" fill="${i === 3 ? '#e06b6b' : '#e9edf0'}" stroke="#aab"/>`;
      s += `<circle cx="${x + 12 + (i % 2) * ((w - 24) / 2) + (w - 30) / 4 - 4}" cy="${sy + Math.floor(i / 2) * 26 + 11}" r="2.2" fill="#444"/>`;
      s += `<circle cx="${x + 12 + (i % 2) * ((w - 24) / 2) + (w - 30) / 4 + 4}" cy="${sy + Math.floor(i / 2) * 26 + 11}" r="2.2" fill="#444"/>`;
    }
    s += `<rect x="${x + 12}" y="${sy + 56}" width="${w - 24}" height="14" rx="3" fill="#2f6f96"/><text x="${x + w / 2}" y="${sy + 66}" font-size="8" text-anchor="middle" fill="#fff">LAN · Notruf</text>`;
    o.ports = src.ports = { o2: { x: x + 30, y: y + h * 0.36 + 12 }, air: { x: x + 30, y: y + h * 0.36 + 42 }, vac: { x: x + 30, y: y + h * 0.36 + 72 } };
    return s;
  };

  /* ---------- Absaugung (Wandvakuum mit Sekretbehälter) ---------- */
  D.suction = function (o) {
    o = Object.assign({ x: 0, y: 300, fill: 0.25 }, o);
    const { x, y } = o;
    let s = `<rect x="${x}" y="${y}" width="70" height="52" rx="8" fill="url(#g-plastic)" stroke="#9aa6af" filter="url(#f-soft)"/>`;
    s += `<circle cx="${x + 35}" cy="${y + 24}" r="17" fill="#ffffff" stroke="#9aa6af"/>`;
    for (let i = 0; i < 9; i++) {
      const a = Math.PI * (0.8 + (i / 8) * 1.4);
      s += `<line x1="${x + 35 + 13 * Math.cos(a)}" y1="${y + 24 + 13 * Math.sin(a)}" x2="${x + 35 + 16 * Math.cos(a)}" y2="${y + 24 + 16 * Math.sin(a)}" stroke="#555" stroke-width="1"/>`;
    }
    s += `<line x1="${x + 35}" y1="${y + 24}" x2="${x + 26}" y2="${y + 15}" stroke="#d33" stroke-width="2"/>`;
    s += `<text x="${x + 35}" y="${y + 47}" font-size="6.5" text-anchor="middle" fill="#456">-kPa</text>`;
    s += `<rect x="${x + 28}" y="${y + 52}" width="14" height="10" fill="#c3ccd3"/>`;
    // Behälter
    s += `<rect x="${x + 5}" y="${y + 62}" width="60" height="96" rx="8" fill="#f3f8fb" fill-opacity="0.7" stroke="#8fb0c4"/>`;
    s += `<rect x="${x + 8}" y="${y + 62 + 96 * (1 - o.fill)}" width="54" height="${96 * o.fill - 4}" rx="6" fill="#e8d7a8" opacity="0.8"/>`;
    s += `<rect x="${x + 2}" y="${y + 58}" width="66" height="10" rx="3" fill="#2f6f96"/>`;
    for (let i = 1; i < 5; i++) s += `<line x1="${x + 52}" y1="${y + 62 + i * 19}" x2="${x + 62}" y2="${y + 62 + i * 19}" stroke="#6a8"/>`;
    s += `<path d="M${x + 60} ${y + 63} q 30 10 26 80 t -20 120" fill="none" stroke="#d6eef8" stroke-width="5" opacity="0.9"/>`;
    s += `<rect x="${x - 20}" y="${y + 6}" width="20" height="16" fill="#f2d300" stroke="#9a8"/>`;
    return s;
  };

  /* ---------- Generisches Gerät mit Display ---------- */
  D.box = function (o) {
    o = Object.assign({ x: 0, y: 0, w: 160, h: 120, screen: true, screenH: 0.45, label: '', color: 'url(#g-plastic)', lines: [], cart: false, buttons: 4, screenColor: '#7dffb5', radius: 10, shadow: true }, o);
    const { x, y, w, h } = o;
    let s = '';
    if (o.cart) {
      const ch = o.cartH || 220;
      s += D.shadow(x + w / 2, y + h + ch + 6, w * 0.7, 12);
      s += `<rect x="${x + w * 0.42}" y="${y + h}" width="${w * 0.16}" height="${ch - 30}" fill="url(#g-metal)"/>`;
      s += `<rect x="${x + w * 0.05}" y="${y + h + ch * 0.45}" width="${w * 0.9}" height="12" rx="4" fill="#c3ccd3"/>`;
      s += `<rect x="${x}" y="${y + h + ch - 30}" width="${w}" height="16" rx="6" fill="#59656e"/>`;
      s += D.wheel(x + 10, y + h + ch - 8, 9) + D.wheel(x + w - 10, y + h + ch - 8, 9);
    } else if (o.shadow && o.floor) {
      s += D.shadow(x + w / 2, y + h + 4, w * 0.6, 10);
    }
    s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${o.radius}" fill="${o.color}" stroke="#9aa6af" filter="url(#f-soft)"/>`;
    if (o.screen) {
      const sx = x + w * 0.08, sy = y + h * 0.08, sw = w * 0.84, sh = h * o.screenH;
      s += `<rect x="${sx}" y="${sy}" width="${sw}" height="${sh}" rx="3" fill="url(#g-screen)"/>`;
      o.lines.forEach((l, i) => {
        s += `<text x="${sx + 6}" y="${sy + 12 + i * Math.min(13, (sh - 6) / Math.max(1, o.lines.length))}" font-size="${Math.min(10, sh / (o.lines.length + 1.5))}" fill="${o.screenColor}" font-family="monospace">${esc(l)}</text>`;
      });
      s += `<rect x="${sx}" y="${sy}" width="${sw}" height="${sh}" rx="3" fill="url(#g-glass)"/>`;
    }
    const by = y + h * (o.screen ? o.screenH + 0.18 : 0.6);
    for (let i = 0; i < o.buttons; i++) s += `<rect x="${x + w * 0.08 + i * (w * 0.84 / o.buttons)}" y="${by}" width="${w * 0.84 / o.buttons - 6}" height="${Math.min(14, h * 0.1)}" rx="3" fill="#c3ccd3"/>`;
    if (o.label) s += `<text x="${x + w / 2}" y="${y + h - 8}" font-size="${Math.min(11, w / 12)}" text-anchor="middle" fill="#5b6a74" font-weight="700" letter-spacing="0.5">${esc(o.label)}</text>`;
    return s;
  };

  /* ---------- Schrank / Arbeitsfläche ---------- */
  D.cabinet = function (o) {
    o = Object.assign({ x: 0, y: 420, w: 300, h: 140, color: '#e7ecef', top: '#c9d2d8', doors: 3 }, o);
    let s = D.shadow(o.x + o.w / 2, o.y + o.h + 4, o.w * 0.55, 10);
    s += `<rect x="${o.x}" y="${o.y}" width="${o.w}" height="${o.h}" rx="4" fill="${o.color}" stroke="#a8b3bb"/>`;
    s += `<rect x="${o.x - 8}" y="${o.y - 10}" width="${o.w + 16}" height="12" rx="3" fill="${o.top}" stroke="#a8b3bb"/>`;
    const dw = o.w / o.doors;
    for (let i = 0; i < o.doors; i++) {
      s += `<rect x="${o.x + i * dw + 6}" y="${o.y + 8}" width="${dw - 12}" height="${o.h - 16}" rx="3" fill="none" stroke="#b9c3ca"/>`;
      s += `<rect x="${o.x + i * dw + dw / 2 - 12}" y="${o.y + 18}" width="24" height="5" rx="2" fill="#8c979f"/>`;
    }
    return s;
  };

  /* ---------- Desinfektionsspender ---------- */
  D.sanitizer = function (x, y) {
    return `<g><rect x="${x}" y="${y}" width="34" height="70" rx="6" fill="#ffffff" stroke="#9aa6af"/>
      <rect x="${x + 6}" y="${y + 10}" width="22" height="34" rx="3" fill="#cfe9f7"/>
      <text x="${x + 17}" y="${y + 31}" font-size="6" text-anchor="middle" fill="#245" font-weight="700">DESI</text>
      <rect x="${x + 12}" y="${y + 70}" width="10" height="10" fill="#9aa6af"/></g>`;
  };

  MTS.draw = D;
})();
