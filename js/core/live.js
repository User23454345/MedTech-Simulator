/* =====================================================================
   MedTech Simulator – Live-Engine
   Zentrale Animationsschleife, Monitor-Kurven (Sweep-Darstellung wie
   an realen Patientenmonitoren), Vitalwert-Bindung, akustische Alarme.
   ===================================================================== */
(function () {
  'use strict';
  const MTS = (window.MTS = window.MTS || {});
  const SVGNS = 'http://www.w3.org/2000/svg';

  /* ---------- Kurvendefinitionen: Werte-Funktion + Skalierung ---------- */
  const WAVES = {
    ecg:   { fn: (m, t) => m.ecg(t),          min: -0.6, max: 1.5,  color: '#3dff7a', seconds: 5 },
    pleth: { fn: (m, t) => m.pleth(t),        min: -0.05, max: 1.1, color: '#5ee7ff', seconds: 5 },
    art:   { fn: (m, t) => m.art(t),          min: 30,  max: 170,   color: '#ff4d5e', seconds: 5 },
    co2:   { fn: (m, t) => m.co2(t),          min: -2,  max: 55,    color: '#f5e663', seconds: 10 },
    paw:   { fn: (m, t) => m.vent(t).paw,     min: -2,  max: 40,    color: '#ffd166', seconds: 10 },
    flow:  { fn: (m, t) => m.vent(t).flow,    min: -60, max: 60,    color: '#7bdff2', seconds: 10 },
    vol:   { fn: (m, t) => m.vent(t).vol,     min: -20, max: 700,   color: '#c3a6ff', seconds: 10 },
  };

  /* ---------- Vitalwert-Formatierer ---------- */
  const VITALS = {
    hr: (m) => (['asystole', 'vf'].includes(m.state.rhythm) ? '---' : Math.round(m.state.hr)),
    spo2: (m) => (['asystole', 'vf'].includes(m.state.rhythm) ? '?' : Math.round(m.state.spo2)),
    nibp: (m) => Math.round(m.state.sbp) + '/' + Math.round(m.state.dbp),
    art: (m) => Math.round(m.state.sbp) + '/' + Math.round(m.state.dbp),
    map: (m) => '(' + m.map + ')',
    mapn: (m) => m.map,
    rr: (m) => Math.round(m.state.rr),
    etco2: (m) => Math.round(m.state.etco2),
    temp: (m) => m.state.temp.toFixed(1),
    fio2: (m) => Math.round(m.state.fio2 * 100),
    peep: (m) => Math.round(m.state.peep),
    vt: (m) => Math.round(m.state.ventMode === 'PC' ? m.ventDerived().vtCalc : m.state.vt),
    ppeak: (m) => Math.round(m.ventDerived().ppeak),
    pplat: (m) => Math.round(m.ventDerived().pplat),
    mv: (m) => m.ventDerived().mv.toFixed(1),
    mode: (m) => ({ VC: 'VC-CMV', PC: 'PC-CMV', CPAP: 'CPAP/ASB' }[m.state.ventMode] || m.state.ventMode),
  };

  /* ---------- Globale Schleife ---------- */
  const loop = {
    tasks: new Set(),
    running: false,
    t0: performance.now(),
    add(fn) {
      this.tasks.add(fn);
      if (!this.running) { this.running = true; requestAnimationFrame(this.frame); }
      return () => this.tasks.delete(fn);
    },
    frame(now) {
      const t = (now - loop.t0) / 1000;
      loop.tasks.forEach((fn) => {
        try { fn(t, now); } catch (e) { console.error(e); loop.tasks.delete(fn); }
      });
      if (loop.tasks.size) requestAnimationFrame(loop.frame);
      else loop.running = false;
    },
  };
  loop.frame = loop.frame.bind(loop);

  /* ---------- Sweep-Berechnung ---------- */
  // Liefert Punkte [x,y] in Pixel. Darstellung wie Monitor: Kurve wird von
  // links nach rechts überschrieben, vor dem Cursor bleibt eine Lücke.
  function sweepPoints(model, def, t, rect, n, seconds) {
    const sec = seconds || def.seconds;
    const sweepStart = Math.floor(t / sec) * sec;
    const cursor = (t - sweepStart) / sec;
    const gap = 0.035;
    const segs = [[], []];
    for (let i = 0; i <= n; i++) {
      const fx = i / n;
      let ti;
      let seg;
      if (fx <= cursor) { ti = sweepStart + fx * sec; seg = 0; }
      else if (fx > cursor + gap) { ti = sweepStart - sec + fx * sec; seg = 1; }
      else continue;
      const v = def.fn(model, ti);
      const fy = (v - def.min) / (def.max - def.min);
      const y = rect.y + rect.h - Math.max(-0.05, Math.min(1.05, fy)) * rect.h;
      segs[seg].push([rect.x + fx * rect.w, y]);
    }
    return { segs, cursorX: rect.x + cursor * rect.w };
  }

  /* ---------- SVG-Bindung ---------- */
  // Elemente im SVG: <g data-wave="ecg" data-rect="x,y,w,h" [data-seconds] [data-color]>
  //                  <text data-vital="hr">--</text>
  function bindSvg(root, model) {
    const disposers = [];
    const waves = [];
    root.querySelectorAll('[data-wave]').forEach((g) => {
      const kind = g.getAttribute('data-wave');
      let def = WAVES[kind];
      if (!def) return;
      if (g.hasAttribute('data-min') || g.hasAttribute('data-max')) {
        def = Object.assign({}, def, {
          min: g.hasAttribute('data-min') ? Number(g.getAttribute('data-min')) : def.min,
          max: g.hasAttribute('data-max') ? Number(g.getAttribute('data-max')) : def.max,
        });
      }
      const [x, y, w, h] = g.getAttribute('data-rect').split(',').map(Number);
      const color = g.getAttribute('data-color') || def.color;
      const seconds = Number(g.getAttribute('data-seconds')) || def.seconds;
      const p1 = document.createElementNS(SVGNS, 'polyline');
      const p2 = document.createElementNS(SVGNS, 'polyline');
      [p1, p2].forEach((p) => {
        p.setAttribute('fill', 'none');
        p.setAttribute('stroke', color);
        p.setAttribute('stroke-width', g.getAttribute('data-stroke') || '1.6');
        p.setAttribute('stroke-linejoin', 'round');
        p.setAttribute('vector-effect', 'non-scaling-stroke');
        g.appendChild(p);
      });
      const n = Math.max(60, Math.min(260, Math.round(w * 1.2)));
      waves.push({ kind, def, rect: { x, y, w, h }, seconds, p1, p2, n });
    });
    const vitals = Array.from(root.querySelectorAll('[data-vital]'));
    let lastVital = -1;
    const stop = loop.add((t, now) => {
      model.tick(now);
      for (const wv of waves) {
        const { segs } = sweepPoints(model, wv.def, t, wv.rect, wv.n, wv.seconds);
        wv.p1.setAttribute('points', segs[0].map((p) => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' '));
        wv.p2.setAttribute('points', segs[1].map((p) => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' '));
      }
      if (t - lastVital > 0.5) {
        lastVital = t;
        vitals.forEach((el) => {
          const f = VITALS[el.getAttribute('data-vital')];
          if (f) el.textContent = f(model);
        });
      }
    });
    disposers.push(stop);
    return () => disposers.forEach((d) => d());
  }

  /* ---------- Canvas-Hilfen (Simulationslabor) ---------- */
  function setupCanvas(canvas) {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const r = canvas.getBoundingClientRect();
    const w = Math.max(10, r.width), h = Math.max(10, r.height);
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, w, h };
  }
  function drawGrid(ctx, rect, opts) {
    const o = Object.assign({ minor: 8, major: 40, color: 'rgba(80,140,120,0.16)', majorColor: 'rgba(80,160,130,0.32)' }, opts || {});
    ctx.save();
    ctx.lineWidth = 1;
    for (let x = rect.x; x <= rect.x + rect.w; x += o.minor) {
      ctx.strokeStyle = (Math.round((x - rect.x) / o.minor) % (o.major / o.minor) === 0) ? o.majorColor : o.color;
      ctx.beginPath(); ctx.moveTo(x + 0.5, rect.y); ctx.lineTo(x + 0.5, rect.y + rect.h); ctx.stroke();
    }
    for (let y = rect.y; y <= rect.y + rect.h; y += o.minor) {
      ctx.strokeStyle = (Math.round((y - rect.y) / o.minor) % (o.major / o.minor) === 0) ? o.majorColor : o.color;
      ctx.beginPath(); ctx.moveTo(rect.x, y + 0.5); ctx.lineTo(rect.x + rect.w, y + 0.5); ctx.stroke();
    }
    ctx.restore();
  }
  function drawSweep(ctx, model, kind, t, rect, opts) {
    const def = Object.assign({}, WAVES[kind], opts || {});
    const n = Math.max(80, Math.round(rect.w));
    const { segs, cursorX } = sweepPoints(model, def, t, rect, n, def.seconds);
    ctx.save();
    ctx.strokeStyle = def.color;
    ctx.lineWidth = def.lineWidth || 2;
    ctx.lineJoin = 'round';
    ctx.shadowColor = def.color;
    ctx.shadowBlur = def.glow === false ? 0 : 4;
    segs.forEach((s) => {
      if (s.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(s[0][0], s[0][1]);
      for (let i = 1; i < s.length; i++) ctx.lineTo(s[i][0], s[i][1]);
      ctx.stroke();
    });
    ctx.restore();
    return cursorX;
  }

  /* ---------- Akustische Alarme (vereinfacht nach IEC 60601-1-8) ---------- */
  const audio = {
    enabled: false,
    ctx: null,
    lastPlay: 0,
    ensure() {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (AC) this.ctx = new AC();
      }
      return this.ctx;
    },
    tone(freq, start, dur, vol) {
      const ctx = this.ctx;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'triangle';
      o.frequency.value = freq;
      g.gain.setValueAtTime(0, start);
      g.gain.linearRampToValueAtTime(vol, start + 0.02);
      g.gain.setValueAtTime(vol, start + dur - 0.03);
      g.gain.linearRampToValueAtTime(0, start + dur);
      o.connect(g).connect(ctx.destination);
      o.start(start);
      o.stop(start + dur + 0.05);
    },
    // high: 10 Pulse (3+2 Muster, doppelt), medium: 3 Pulse, low: 2 Pulse
    play(prio) {
      if (!this.enabled || !this.ensure()) return;
      const ctx = this.ctx;
      if (ctx.state === 'suspended') ctx.resume();
      const now = ctx.currentTime + 0.05;
      const patterns = {
        high: { f: 880, d: 0.12, gaps: [0, 0.2, 0.4, 0.75, 0.95, 1.6, 1.8, 2.0, 2.35, 2.55], v: 0.12 },
        medium: { f: 660, d: 0.2, gaps: [0, 0.35, 0.7], v: 0.09 },
        low: { f: 520, d: 0.25, gaps: [0, 0.4], v: 0.06 },
      };
      const p = patterns[prio] || patterns.low;
      p.gaps.forEach((g) => this.tone(p.f, now + g, p.d, p.v));
    },
  };

  MTS.Live = { WAVES, VITALS, loop, bindSvg, setupCanvas, drawGrid, drawSweep, sweepPoints, audio };
})();
