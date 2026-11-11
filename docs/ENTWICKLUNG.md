# MedTech Simulator – Entwicklerdokumentation

Reines HTML/CSS/JavaScript ohne Build-Schritt und ohne Abhängigkeiten. Alle Skripte sind klassische
`<script>`-Dateien (keine ES-Module), damit die Anwendung auch direkt per `file://` läuft.
Globaler Namensraum: `window.MTS`.

## Verzeichnisstruktur

```
index.html            Einstieg; bindet alle Skripte ein (Reihenfolge: core → areas → sim → MTS.boot())
css/styles.css        Gesamtes Styling (inkl. Bausteine für Simulationen: .sim-screen, .sim-controls, .ctrl, .seg, .readouts …)
js/core/physio.js     MTS.PatientModel – Physiologie-Modell (EKG, Pleth, ART, CO₂, Beatmung), Alarmprüfung
js/core/live.js       MTS.Live – Animationsschleife, Sweep-Kurven (SVG/Canvas), Vitalwert-Bindung, Alarmtöne
js/core/draw.js       MTS.draw – SVG-Zeichenbibliothek (Raum, Bett, Monitor, Beatmungsgerät, Pumpen, …)
js/core/app.js        Router, Lageplan, Raumansicht, Geräte-Infofenster, Szenario- & Aufgaben-Engine, Fortschritt
js/areas/<id>.js      Ein Krankenhausbereich pro Datei (MTS.registerArea)
js/sim/<id>.js        Eine Simulation pro Datei (MTS.registerSim)
```

Bereichs-IDs (fest im Lageplan): `icu, or, er, radiology, ward, pacu, dialysis, lab, neo, cathlab`.
Simulations-IDs: `ecg, spo2, bp, resp, infusion, defib, imaging`.

## Bereich registrieren

`js/areas/icu.js` ist der vollständig ausgearbeitete Referenzbereich.

```js
MTS.registerArea({
  id: 'or', name: 'Operationssaal', status: 'full', color: '#2e8b6f',
  description: 'Ein Satz unter der Überschrift',
  goals: ['Lernziel …'], intro: '<p>HTML</p>', safety: ['…'],
  patient: { /* optional: Startwerte für MTS.PatientModel → Live-Kurven in der Szene */ },
  limits: { /* optional: Alarmgrenzen, Standard MTS.DEFAULT_LIMITS */ },
  scene: { viewBox: '0 0 1600 900', render: (D) => svgString, onMount: ({svg, model, area, ctx}) => cleanupFn },
  devices: [ /* siehe unten */ ],
  scenarios: [ /* siehe unten */ ],
  challenges: [ /* siehe unten */ ],
});
```

### Szene
`render(D)` liefert SVG-Markup (ohne `<svg>`-Hülle) für das Koordinatensystem 1600 × 900
(Wand y 0–560, Boden 560–900). Jedes Gerät wird mit `D.dev('<deviceId>', innerSvg)` umschlossen – der
Kern macht diese Gruppen klickbar, beschriftet sie und zeichnet Verbund-Linien zwischen ihren Mittelpunkten.
Leitungen/Kabel gehören **nicht** in Gerätegruppen (sonst wird die Bounding-Box riesig).

Live-Elemente in der Szene:
- `<g data-wave="ecg|pleth|art|co2|paw|flow|vol" data-rect="x,y,w,h">` → animierte Kurve aus dem PatientModel
  (optional `data-min`/`data-max` für eigene Skalierung, z. B. Neonatologie; `data-seconds`, `data-color`)
- `<text data-vital="hr|spo2|nibp|art|map|rr|etco2|temp|fio2|peep|vt|ppeak|pplat|mv|mode">` → Zahlenwert
- `class="alarm-lamp"` → leuchtet in Alarmfarbe; `data-alarmtext` → Alarmtext des Monitors

Wichtige Helfer in `MTS.draw` (D): `defs, room, window, door, sign, shadow, wheel, text, dev, screenWaves,
monitor, bed, ivPole, syringePump, pumpStack, volPump, ventilator, circuit, cable, pendant, suction, box,
cabinet, sanitizer`. Gradienten: `url(#g-plastic)`, `url(#g-plastic-v)`, `url(#g-metal)`, `url(#g-dark)`,
`url(#g-screen)`, `url(#g-glass)`, `url(#g-or-green)`, `url(#g-green)`, `url(#g-fluid)`, `url(#g-lamp)` …
Filter: `url(#f-soft)` (Schatten), `url(#f-glow)`.

`D.bed(opts)` schreibt nach dem Aufruf `opts.headPos = {x, y, mouth, chest, hand}` (Anker für Kabel).
`D.ventilator(opts)` → `opts.ports.insp/exp`, `D.pendant(opts)` → `opts.ports.o2/air/vac`.

### Gerät
```js
{
  id: 'vent', name: 'Vollständiger Name', short: 'Kurzlabel', icon: '🫁', category: 'Therapie / Beatmung',
  manufacturers: ['Beispielhersteller', …],      // reale, typische Anbieter der GERÄTEKLASSE – keine Produktnamen
  class: 'IIb',                                  // optional: typische MDR-Risikoklasse
  sim: 'resp',                                   // optional: Link ins Simulationslabor
  labelPos: 'top'|'bottom', labelOffset: [dx,dy], anchor: [x,y],   // optional Layout-Hilfen
  purpose: '<p>HTML</p>', function: '<p>HTML</p>',
  facts: [['Kennwert', 'Wert'], …],              // optional
  components: [{ name, desc }],
  measurements: [{ name, unit, normal, desc }],
  alarms: [{ name, prio: 'high'|'medium'|'low', cause, action }],
  connections: [{ to: '<deviceId im selben Bereich>' | undefined, label: 'Text falls kein Gerät', type: 'daten'|'gas'|'fluid'|'strom'|'patient'|'mechanisch', desc }],
  safety: ['HTML-Text', …],
  tip: 'HTML',                                   // optional
}
```

### Lernszenario
```js
{
  id, title, duration: '5 min', summary,
  patient: { name: 'Lernpatient „…“ (fiktiv)', info: 'Alter · Kontext', history: 'Fiktiver Verlauf …' },
  vitals: { …PatientModel-Werte beim Start },
  intro: '<p>…</p>',
  steps: [{
    title, text: '<p>…</p>',
    highlight: ['deviceId'],                       // pulsierender Rahmen
    vitals: { hr: 120, … }, duration: 8, instant: false,   // weicher Übergang der Live-Werte
    alarms: [{ id, prio, text, device: 'deviceId', source }],  // zusätzliche Gerätealarme (Alarmleiste + Blinken)
    question: { q, options: [...], correct: 1 | [0,2], explain },
  }],
  debrief: '<p>…</p>',
}
```

### Herausforderungen
| type | Felder |
|------|--------|
| `find` | `title, prompt, target: 'deviceId' \| ['a','b'], explain` – Nutzer klickt in der Szene (Labels ausgeblendet) |
| `match` | `title, prompt, pairs: [{ device \| left, right }], explain` |
| `quiz` / `component` / `alarm` | `title, prompt, options, correct, explain, highlight?, vitals?, alarms?` |
| `sequence` | `title, prompt, items: [korrekte Reihenfolge], highlight?, explain` |

Pro Bereich sollten alle fünf Herausforderungsarten aus dem Lehrplan vorkommen:
Gerät finden · Zuordnen · Komponente identifizieren · Alarm erkennen · Geräteverbund erklären.

## Simulation registrieren

```js
MTS.registerSim({
  id: 'ecg', name: 'EKG', icon: '💓', order: 1, summary: 'Ein Satz für die Kachel',
  theory: '<p>HTML für die Hintergrund-Spalte (Formeln, Normwerte, Quellen)</p>',
  devices: [['icu', 'monitor', 'Patientenmonitor (Intensivstation)']],   // Links zu Geräten
  mount(el, api) {            // el = leere Bühne; api = { live: MTS.Live, PatientModel, toast, esc }
    el.innerHTML = '…';
    const stop = MTS.Live.loop.add((t, now) => { /* zeichnen */ });
    return () => stop();      // Aufräumen beim Verlassen
  },
});
```

Canvas-Helfer: `MTS.Live.setupCanvas(canvas) → {ctx, w, h}` (HiDPI), `MTS.Live.drawGrid(ctx, rect)`,
`MTS.Live.drawSweep(ctx, model, 'ecg', t, rect, {color, seconds, min, max})`.
CSS-Bausteine: `.sim-screen`, `.sim-controls`, `.ctrl` (label/output/input), `.seg` (Segment-Buttons),
`.readouts/.readout`, `.sim-note`.

## Inhaltliche Leitlinien

- **Nur fiktive Patientendaten**, Szenarien klar als Lernszenario gekennzeichnet.
- Fachlich korrekt, aber didaktisch vereinfacht. Normwerte als Orientierung für Erwachsene (sofern nicht anders angegeben).
- Herstellernamen nur als Beispiele typischer Anbieter einer Geräteklasse; die Grafiken bilden kein reales Produkt nach.
- Sprache: Deutsch, Fachbegriffe korrekt (MDR, MPBetreibV, IEC 60601-…), Sicherheitsaspekte immer mitdenken.
