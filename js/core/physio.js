/* =====================================================================
   MedTech Simulator – Physiologie-Modell (vereinfacht, didaktisch)
   ---------------------------------------------------------------------
   Erzeugt aus einem Satz Vitalparameter zeitkontinuierliche Kurven:
     EKG (Gauß-Summenmodell nach McSharry et al. 2003, vereinfacht),
     Plethysmogramm (SpO2), arterielle Druckkurve, Kapnogramm,
     Atemwegsdruck / Flow / Volumen (Einkompartiment-Lungenmodell).
   ALLE WERTE SIND FIKTIV UND DIENEN AUSSCHLIESSLICH DER LEHRE.
   ===================================================================== */
(function () {
  'use strict';
  const MTS = (window.MTS = window.MTS || {});

  /* ---------- Hilfsfunktionen ---------- */
  const gauss = (x, mu, sigma) => Math.exp(-((x - mu) * (x - mu)) / (2 * sigma * sigma));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  // deterministisches Pseudo-Rauschen (damit Kurven reproduzierbar sind)
  function hashNoise(n) {
    const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return s - Math.floor(s);
  }

  /* ---------- Standardpatient (fiktiv) ---------- */
  const DEFAULTS = {
    rhythm: 'sinus', // sinus | af | vt | vf | asystole | paced | brady | stemi
    hr: 78,
    sbp: 122, dbp: 74,
    spo2: 97,
    rr: 14,
    etco2: 38,
    temp: 37.0,
    // Beatmung
    ventMode: 'VC', // VC (volumenkontrolliert) | PC (druckkontrolliert) | CPAP
    vt: 450,       // Tidalvolumen ml
    peep: 5,       // cmH2O
    pinsp: 15,     // cmH2O über PEEP (nur PC)
    fio2: 0.4,
    ie: 0.5,       // I:E = 1:2
    compliance: 50, // ml/cmH2O
    resistance: 10, // cmH2O/(l/s)
    perfusion: 1.0, // 0..1 Perfusionsindex-Faktor
    noise: 0.02,
  };

  /* ---------- EKG ---------- */
  // Wellen relativ zur Beat-Phase (0..1 bei 60/min skaliert)
  // [Zentrum (s), Breite (s), Amplitude (mV)]
  const PQRST = {
    P: [-0.20, 0.025, 0.12],
    Q: [-0.035, 0.010, -0.12],
    R: [0.0, 0.011, 1.15],
    S: [0.035, 0.012, -0.28],
    T: [0.26, 0.050, 0.30],
  };

  function ecgBeat(tb, rr, opts) {
    // tb: Zeit seit R-Zacke (s), kann negativ sein
    // QT-Korrektur nach Bazett: QT skaliert mit sqrt(RR)
    const qtScale = Math.sqrt(clamp(rr, 0.3, 2.0));
    let v = 0;
    if (!opts.noP) v += PQRST.P[2] * gauss(tb, PQRST.P[0] * Math.min(1, qtScale), PQRST.P[1]);
    const wide = opts.wide ? 2.6 : 1;
    v += PQRST.Q[2] * gauss(tb, PQRST.Q[0] * wide, PQRST.Q[1] * wide);
    v += (opts.rAmp || PQRST.R[2]) * gauss(tb, 0, PQRST.R[1] * wide);
    v += PQRST.S[2] * gauss(tb, PQRST.S[0] * wide, PQRST.S[1] * wide);
    const tAmp = opts.tInv ? -0.35 : PQRST.T[2];
    v += tAmp * gauss(tb, PQRST.T[0] * qtScale, PQRST.T[1] * qtScale * (opts.wide ? 1.6 : 1));
    if (opts.st) {
      // ST-Hebung: Plateau zwischen S und T
      v += opts.st * (1 / (1 + Math.exp(-(tb - 0.04) / 0.008))) * (1 / (1 + Math.exp((tb - 0.22 * qtScale) / 0.03)));
    }
    return v;
  }

  /* ---------- Beat-Zeitplan (für Arrhythmien mit variablem RR) ---------- */
  class BeatClock {
    constructor() {
      this.beats = [0];
      this.seed = 1;
    }
    reset() { this.beats = [0]; }
    // RR-Intervall in Abhängigkeit vom Rhythmus
    nextRR(state, i) {
      const base = 60 / clamp(state.hr || 1, 1, 300);
      switch (state.rhythm) {
        case 'af': return base * (0.6 + 0.8 * hashNoise(i * 3.7 + this.seed));
        case 'sinus': return base * (1 + 0.03 * Math.sin(i * 0.9)); // Respiratorische Sinusarrhythmie
        default: return base;
      }
    }
    // liefert {prev, last, next} um Zeit t (t darf auch in der Vergangenheit liegen)
    around(t, state) {
      const B = this.beats;
      while (B[B.length - 1] < t + 3) B.push(B[B.length - 1] + this.nextRR(state, B.length));
      let guard = 0;
      while (B[0] > t - 3 && guard++ < 400) B.unshift(B[0] - 60 / clamp(state.hr || 1, 1, 300));
      while (B.length > 8 && B[2] < t - 25) B.shift();
      // binäre Suche nach letztem Beat <= t
      let lo = 0, hi = B.length - 2;
      while (lo < hi) {
        const mid = (lo + hi + 1) >> 1;
        if (B[mid] <= t) lo = mid; else hi = mid - 1;
      }
      return { last: B[lo], next: B[lo + 1], prev: B[Math.max(0, lo - 1)] };
    }
  }

  /* ---------- Patientenmodell ---------- */
  class PatientModel {
    constructor(init) {
      this.state = Object.assign({}, DEFAULTS, init || {});
      this.clock = new BeatClock();
      this.listeners = new Set();
      this.targets = null; // für weiche Übergänge
    }
    set(patch) {
      const rhythmChanged = patch.rhythm && patch.rhythm !== this.state.rhythm;
      Object.assign(this.state, patch);
      if (rhythmChanged) this.clock.reset();
      this.emit();
    }
    // Weicher Übergang zu Zielwerten über "seconds"
    transition(patch, seconds) {
      const from = {};
      Object.keys(patch).forEach((k) => (from[k] = this.state[k]));
      this.targets = { from, to: patch, start: performance.now(), dur: (seconds || 5) * 1000 };
    }
    tick(now) {
      if (!this.targets) return;
      const { from, to, start, dur } = this.targets;
      const p = clamp((now - start) / dur, 0, 1);
      const patch = {};
      Object.keys(to).forEach((k) => {
        if (typeof to[k] === 'number' && typeof from[k] === 'number') patch[k] = from[k] + (to[k] - from[k]) * p;
        else if (p >= 1) patch[k] = to[k];
      });
      Object.assign(this.state, patch);
      if (p >= 1) this.targets = null;
      this.emit();
    }
    on(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); }
    emit() { this.listeners.forEach((fn) => fn(this.state)); }

    get map() { return Math.round((this.state.sbp + 2 * this.state.dbp) / 3); }

    /* ----- EKG in mV ----- */
    ecg(t) {
      const s = this.state;
      const n = s.noise * (hashNoise(t * 500) - 0.5);
      switch (s.rhythm) {
        case 'asystole':
          return 0.02 * Math.sin(t * 0.7) + n;
        case 'vf': {
          // chaotisches, unregelmäßiges Flimmern 4–8 Hz
          return 0.35 * Math.sin(2 * Math.PI * 5.2 * t + 2 * Math.sin(t * 1.3)) +
            0.2 * Math.sin(2 * Math.PI * 7.1 * t + Math.sin(t * 0.7)) +
            0.12 * Math.sin(2 * Math.PI * 3.3 * t) + n;
        }
        default: {
          const b = this.clock.around(t, s);
          const rr = b.next - b.last;
          const opts = {
            noP: s.rhythm === 'af' || s.rhythm === 'vt',
            wide: s.rhythm === 'vt' || s.rhythm === 'paced',
            st: s.rhythm === 'stemi' ? 0.25 : 0,
            rAmp: s.rhythm === 'vt' ? 1.4 : undefined,
            tInv: s.rhythm === 'vt',
          };
          let v = ecgBeat(t - b.last, rr, opts) + ecgBeat(t - b.next, rr, opts);
          if (s.rhythm === 'paced') {
            // Schrittmacher-Spike 20 ms vor QRS
            const dt = t - (b.next - 0.04);
            if (dt > 0 && dt < 0.004) v += 1.6;
            const dt2 = t - (b.last - 0.04);
            if (dt2 > 0 && dt2 < 0.004) v += 1.6;
          }
          if (s.rhythm === 'af') v += 0.05 * Math.sin(2 * Math.PI * 6.5 * t) + 0.03 * Math.sin(2 * Math.PI * 9.3 * t);
          return v + n;
        }
      }
    }

    /* ----- Herzzyklus-gekoppelte Druck-/Pulskurven ----- */
    _pulseShape(tb, rr) {
      // tb: Zeit seit R-Zacke; Pulswelle ~ 180 ms verzögert (Transitzeit)
      const t = tb - 0.18;
      if (t < 0) return null;
      const sys = 0.32 * Math.sqrt(clamp(rr, 0.3, 2)); // Systolendauer
      // Anstieg + Abfall + dikrote Kerbe
      const up = 1 - Math.exp(-t / 0.035);
      const down = Math.exp(-Math.max(0, t - 0.08) / (rr * 0.55));
      let v = up * down;
      v += 0.12 * gauss(t, sys + 0.04, 0.025); // dikrote Welle
      v -= 0.08 * gauss(t, sys, 0.012);        // Inzisur
      return clamp(v, 0, 1.2);
    }
    _cardiacPhase(t) {
      const s = this.state;
      if (s.rhythm === 'vf' || s.rhythm === 'asystole') return null; // keine Auswurfleistung
      const b = this.clock.around(t, s);
      const rr = b.next - b.last;
      const v1 = this._pulseShape(t - b.last, rr);
      const v0 = this._pulseShape(t - b.prev, b.last - b.prev);
      // Restwert des vorherigen Schlages (diastolischer Abfall)
      let v = v1 !== null ? v1 : 0;
      if (v0 !== null && t - b.last < 0.25) v = Math.max(v, v0);
      return { v, rr };
    }
    /** Arterieller Druck in mmHg */
    art(t) {
      const s = this.state;
      const ph = this._cardiacPhase(t);
      if (!ph) return 8 + 2 * Math.sin(t); // kein Auswurf – Druck fällt auf Mitteldruck des Gefäßsystems
      const pp = s.sbp - s.dbp;
      // Ventilationsbedingte Schwankung (Pulsdruckvariation)
      const resp = 1 + 0.04 * Math.sin((2 * Math.PI * t * s.rr) / 60);
      return s.dbp + pp * ph.v * resp;
    }
    /** Plethysmogramm (normiert 0..1, skaliert mit Perfusion) */
    pleth(t) {
      const s = this.state;
      const ph = this._cardiacPhase(t - 0.12); // periphere Transitzeit zusätzlich
      if (!ph) return 0.02 * hashNoise(t * 50);
      return ph.v * s.perfusion * 0.9;
    }

    /* ----- Atmung / Beatmung ----- */
    breath(t) {
      const s = this.state;
      const T = 60 / clamp(s.rr || 1, 1, 60);
      const ph = ((t % T) + T) % T;
      const ti = T * (s.ie / (1 + s.ie)); // Inspirationszeit
      return { T, ph, ti, te: T - ti, insp: ph < ti };
    }
    /** Atemwegsdruck (cmH2O), Flow (l/min), Volumen (ml) – Einkompartiment-Modell
        Bewegungsgleichung: Paw = PEEP + V/C + R·V' */
    vent(t) {
      const s = this.state;
      const { ph, ti, te, insp } = this.breath(t);
      const C = s.compliance / 1000; // l/cmH2O
      const R = s.resistance;       // cmH2O/(l/s)
      const tau = R * C;            // Zeitkonstante (s)
      let V, F, P; // l, l/s, cmH2O
      if (s.ventMode === 'PC' || s.ventMode === 'CPAP') {
        const dP = s.ventMode === 'CPAP' ? 0 : s.pinsp;
        const Vmax = dP * C;
        const Vend = Vmax * (1 - Math.exp(-ti / tau));
        if (insp) {
          V = Vmax * (1 - Math.exp(-ph / tau));
          F = (dP / R) * Math.exp(-ph / tau);
          P = s.peep + dP;
        } else {
          const te_ = ph - ti;
          V = Vend * Math.exp(-te_ / tau);
          F = -(Vend / tau) * Math.exp(-te_ / tau);
          P = s.peep;
        }
        if (s.ventMode === 'CPAP') {
          // Spontanatmung um CPAP-Niveau
          const vt = s.vt / 1000;
          V = vt * 0.5 * (1 - Math.cos((2 * Math.PI * ph) / (ti + te)));
          F = vt * 0.5 * Math.sin((2 * Math.PI * ph) / (ti + te)) * (2 * Math.PI / (ti + te));
          P = s.peep - 1.5 * Math.sin((2 * Math.PI * ph) / (ti + te));
        }
      } else {
        // Volumenkontrolle: konstanter Flow (Rechteck)
        const vt = s.vt / 1000;
        const flow = vt / ti;
        if (insp) {
          V = flow * ph;
          F = flow;
          P = s.peep + V / C + R * F;
        } else {
          const te_ = ph - ti;
          V = vt * Math.exp(-te_ / tau);
          F = -(vt / tau) * Math.exp(-te_ / tau);
          P = s.peep;
        }
      }
      return { paw: P, flow: F * 60, vol: V * 1000, insp };
    }
    /** Spitzen- und Plateaudruck (VC) */
    ventDerived() {
      const s = this.state;
      const C = s.compliance / 1000;
      const { ti } = this.breath(0);
      if (s.ventMode === 'VC') {
        const vt = s.vt / 1000;
        const flow = vt / ti;
        const pplat = s.peep + vt / C;
        const ppeak = pplat + s.resistance * flow;
        return { ppeak, pplat, mv: (s.vt * s.rr) / 1000, drivingP: pplat - s.peep };
      }
      const tau = s.resistance * C;
      const vt = s.pinsp * C * (1 - Math.exp(-ti / tau)) * 1000;
      return { ppeak: s.peep + s.pinsp, pplat: s.peep + s.pinsp, mv: (vt * s.rr) / 1000, vtCalc: vt, drivingP: s.pinsp };
    }
    /** Kapnogramm (mmHg) – Phasen I–IV */
    co2(t) {
      const s = this.state;
      if (s.rhythm === 'vf' || s.rhythm === 'asystole') return 0; // kein Kreislauf -> kein CO2-Transport
      const { ph, ti, te, insp } = this.breath(t);
      if (insp) {
        // Inspiration: CO2 fällt schnell auf 0
        return s.etco2 * Math.exp(-ph / 0.05);
      }
      const x = ph - ti;
      const rise = 1 / (1 + Math.exp(-(x - 0.12) / 0.03)); // Phase II
      const plateau = 0.92 + 0.08 * Math.min(1, x / te);  // Phase III leicht ansteigend
      return s.etco2 * rise * plateau;
    }

    /* ----- Alarmprüfung (Grenzwerte konfigurierbar) ----- */
    checkAlarms(limits) {
      const s = this.state;
      const L = Object.assign({}, MTS.DEFAULT_LIMITS, limits || {});
      const a = [];
      if (s.rhythm === 'asystole') a.push({ id: 'asys', prio: 'high', text: 'ASYSTOLIE' });
      if (s.rhythm === 'vf') a.push({ id: 'vf', prio: 'high', text: 'KAMMERFLIMMERN' });
      if (s.rhythm === 'vt') a.push({ id: 'vt', prio: 'high', text: 'V-TACH' });
      if (!['asystole', 'vf'].includes(s.rhythm)) {
        if (s.hr > L.hrHigh) a.push({ id: 'hrH', prio: s.hr > L.hrHigh + 30 ? 'high' : 'medium', text: 'HF HOCH ' + Math.round(s.hr) });
        if (s.hr < L.hrLow) a.push({ id: 'hrL', prio: s.hr < L.hrLow - 10 ? 'high' : 'medium', text: 'HF NIEDRIG ' + Math.round(s.hr) });
        if (s.rhythm === 'af') a.push({ id: 'af', prio: 'low', text: 'VORHOFFLIMMERN' });
      }
      if (s.spo2 < L.spo2Low) a.push({ id: 'spo2', prio: s.spo2 < 85 ? 'high' : 'medium', text: 'SpO₂ NIEDRIG ' + Math.round(s.spo2) });
      if (s.sbp > L.sbpHigh) a.push({ id: 'sbpH', prio: 'medium', text: 'ART SYS HOCH ' + Math.round(s.sbp) });
      if (s.sbp < L.sbpLow) a.push({ id: 'sbpL', prio: s.sbp < 70 ? 'high' : 'medium', text: 'ART SYS NIEDRIG ' + Math.round(s.sbp) });
      if (s.rr > L.rrHigh) a.push({ id: 'rrH', prio: 'medium', text: 'AF HOCH ' + Math.round(s.rr) });
      if (s.etco2 > L.etco2High) a.push({ id: 'co2H', prio: 'medium', text: 'etCO₂ HOCH ' + Math.round(s.etco2) });
      if (s.etco2 < L.etco2Low && s.etco2 > 0) a.push({ id: 'co2L', prio: 'medium', text: 'etCO₂ NIEDRIG ' + Math.round(s.etco2) });
      if (s.ventMode !== 'CPAP') {
        const d = this.ventDerived();
        if (d.ppeak > L.pawHigh) a.push({ id: 'paw', prio: 'high', text: 'Paw HOCH ' + Math.round(d.ppeak) });
      }
      const order = { high: 0, medium: 1, low: 2 };
      return a.sort((x, y) => order[x.prio] - order[y.prio]);
    }
  }

  MTS.DEFAULT_LIMITS = {
    hrHigh: 120, hrLow: 50, spo2Low: 90, sbpHigh: 160, sbpLow: 90,
    rrHigh: 30, etco2High: 50, etco2Low: 28, pawHigh: 35,
  };
  MTS.PatientModel = PatientModel;
  MTS.util = Object.assign(MTS.util || {}, { gauss, clamp, hashNoise });
})();
