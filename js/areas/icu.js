/* =====================================================================
   Bereich: INTENSIVSTATION (vollständig ausgearbeitet – Referenzbereich)
   Ein Intensivbettplatz mit beatmetem, fiktivem Lernpatienten.
   ===================================================================== */
(function () {
  'use strict';

  /* ---------------- Raumszene ---------------- */
  function render(D) {
    let s = D.room({ window: true, windowX: 1180, door: true, doorX: 40, sign: 'INTENSIVSTATION · BETTPLATZ 3', signX: 1180 });
    // Wandschiene & Handdesinfektion
    s += `<rect x="240" y="300" width="1340" height="10" rx="3" fill="#b8c3ca"/>`;
    s += D.sanitizer(1120, 330);

    // Bett mit Patient (Kopfteil 30° – VAP-Prophylaxe)
    const bedOpts = { x: 600, y: 575, w: 560, patient: true, intubated: true, headRaise: 30 };
    const bedSvg = D.bed(bedOpts);
    const head = bedOpts.headPos;

    // Notfallwagen + Defibrillator (an der Tür)
    const defib = D.box({ x: 52, y: 556, w: 170, h: 230, screen: false, color: '#d9443f', buttons: 0, radius: 6, floor: true })
      + `<rect x="60" y="572" width="154" height="44" rx="4" fill="#c23a35"/><rect x="60" y="624" width="154" height="44" rx="4" fill="#c23a35"/><rect x="60" y="676" width="154" height="44" rx="4" fill="#c23a35"/><rect x="60" y="728" width="154" height="44" rx="4" fill="#c23a35"/>`
      + [594, 646, 698, 750].map((y) => `<rect x="117" y="${y - 3}" width="40" height="6" rx="3" fill="#f3c6c4"/>`).join('')
      + D.wheel(70, 796, 9) + D.wheel(204, 796, 9)
      + D.box({ x: 62, y: 452, w: 150, h: 104, screenH: 0.42, lines: ['AED/MANUELL', 'EKG II  --'], label: '', buttons: 3, color: 'url(#g-plastic-v)' })
      + `<circle cx="196" cy="530" r="9" fill="#e53935"/><text x="196" y="534" font-size="9" text-anchor="middle" fill="#fff" font-weight="800">⚡</text>`
      + `<rect x="74" y="532" width="40" height="18" rx="4" fill="#f2b705"/><text x="94" y="545" font-size="8" text-anchor="middle" font-weight="700">1 2 3</text>`
      + `<rect x="70" y="440" width="40" height="14" rx="3" fill="#3a4550"/><rect x="164" y="440" width="40" height="14" rx="3" fill="#3a4550"/>`;

    // Beatmungsgerät
    const ventOpts = { x: 250, y: 300, scale: 1 };
    const vent = D.ventilator(ventOpts);
    const P = ventOpts.ports;

    // Atemgasbefeuchter (an der Gerätesäule)
    const humid = `<rect x="486" y="520" width="66" height="96" rx="8" fill="url(#g-plastic)" stroke="#9aa6af" filter="url(#f-soft)"/>
      <rect x="494" y="528" width="50" height="22" rx="3" fill="#0c2a1f"/><text x="519" y="543" font-size="10" text-anchor="middle" fill="#7dffb5" font-family="monospace">37°C</text>
      <rect x="490" y="586" width="58" height="46" rx="6" fill="#e9f5fb" fill-opacity="0.8" stroke="#8fb0c4"/>
      <rect x="493" y="612" width="52" height="17" rx="4" fill="#bfe3f7" opacity="0.9"/>
      <rect x="500" y="558" width="38" height="8" rx="3" fill="#c3ccd3"/><circle cx="530" cy="572" r="3" fill="#f0a500"/>
      <text x="519" y="601" font-size="7" text-anchor="middle" fill="#345">Kammer</text>`;

    // Deckenversorgungseinheit
    const pendantOpts = { x: 560, y: 37, h: 380, w: 124 };
    const pendant = D.pendant(pendantOpts);

    // Absaugung (an der Versorgungseinheit)
    const suction = D.suction({ x: 700, y: 236, fill: 0.22 });

    // Patientenmonitor (an Deckenarm)
    const monitor = D.monitor({ x: 820, y: 112, w: 300, h: 200, armLen: 75, title: 'BETT 3 · LERNPATIENT (FIKTIV)' });

    // Spritzenpumpen-Dockingstation
    const dock = D.pumpStack({
      x: 1214, y: 340, w: 150, pumps: [
        { drug: 'Noradrenalin', rate: '4,0 ml/h', color: '#ffd1dc' },
        { drug: 'Propofol 2%', rate: '12,0 ml/h', color: '#f3f3f3' },
        { drug: 'Sufentanil', rate: '3,5 ml/h', color: '#d9f0ff' },
      ],
    });

    // IV-Ständer + volumetrische Pumpe
    const pole = D.ivPole({ x: 1480, y: 860, h: 600, bags: [{ label: 'Ringer', fill: 0.62 }, { label: 'Ernährung', fill: 0.8, color: '#fff3d6' }] });
    const volpump = D.volPump(1412, 420, 104, { drug: 'Ringer', rate: '80 ml/h', vtbi: '420 ml' });

    // Druckaufnehmer (auf Herzhöhe = Phlebostatische Achse)
    const tY = 548;
    const transducer = `<rect x="1416" y="${tY - 26}" width="128" height="58" rx="6" fill="#e8eef2" stroke="#9aa6af"/>
      <rect x="1424" y="${tY - 6}" width="112" height="14" rx="3" fill="#f6fbff" stroke="#9ab"/>
      <rect x="1446" y="${tY - 18}" width="26" height="38" rx="4" fill="#ffffff" stroke="#4f9fd1" stroke-width="2"/>
      <rect x="1452" y="${tY - 12}" width="14" height="10" rx="2" fill="#e53935"/>
      <path d="M1480 ${tY + 1} h24" stroke="#4f9fd1" stroke-width="3"/>
      <rect x="1500" y="${tY - 10}" width="14" height="22" rx="3" fill="#2b7bb9"/>
      <text x="1480" y="${tY + 26}" font-size="8" text-anchor="middle" fill="#345">Herzhöhe ▸</text>
      <rect x="1500" y="${tY - 70}" width="18" height="40" rx="3" fill="#f2fbff" stroke="#9cc1d6"/>
      <rect x="1494" y="${tY - 78}" width="30" height="10" rx="3" fill="#7b5ea7"/>
      <text x="1509" y="${tY - 82}" font-size="7" text-anchor="middle" fill="#345">300 mmHg</text>`;

    // ---- Leitungen (liegen hinter den Geräten) ----
    let lines = '';
    // Gasversorgung Deckeneinheit -> Beatmungsgerät
    lines += D.cable(`M${pendantOpts.ports.o2.x} ${pendantOpts.ports.o2.y} C 520 200, 470 250, 470 400`, '#ffffff', 5);
    lines += D.cable(`M${pendantOpts.ports.o2.x} ${pendantOpts.ports.o2.y} C 520 200, 470 250, 470 400`, '#2c6fb5', 2);
    lines += D.cable(`M${pendantOpts.ports.air.x} ${pendantOpts.ports.air.y} C 530 260, 478 300, 478 410`, '#1d1d1d', 4);
    // Strom
    lines += D.cable('M600 470 C 560 500, 500 470, 460 500', '#3a4a55', 3);
    // EKG-Kabel + SpO2 + Arterie zum Monitor
    lines += D.cable(`M970 336 C 960 420, 860 470, ${head.chest.x} ${head.chest.y}`, '#2f2f2f', 3);
    lines += D.cable(`M990 336 C 1000 430, 880 520, ${head.hand.x + 8} ${head.hand.y}`, '#e8e8e8', 3);
    lines += D.cable(`M1010 336 C 1150 380, 1300 470, 1450 ${tY}`, '#2b7bb9', 3);
    lines += D.cable(`M1420 ${tY + 2} C 1300 640, 900 610, ${head.hand.x - 6} ${head.hand.y + 4}`, '#d1495b', 2.5);
    // Infusionsleitungen -> ZVK (Hals rechts)
    lines += D.cable(`M1220 360 C 1100 420, 800 430, ${head.x + 22} ${head.y + 24}`, '#bfe3f7', 3);
    lines += D.cable(`M1220 420 C 1100 460, 800 450, ${head.x + 22} ${head.y + 26}`, '#bfe3f7', 3);
    lines += D.cable(`M1420 560 C 1300 600, 900 520, ${head.x + 24} ${head.y + 28}`, '#d6eef8', 3);
    // Absaugschlauch
    lines += D.cable(`M766 340 C 790 420, 760 460, ${head.mouth.x + 18} ${head.mouth.y - 4}`, '#d6eef8', 4);

    // Beatmungsschlauch-System (Insp blau, Exsp grau) -> über Befeuchter zum Tubus
    const target = { x: head.mouth.x + 30, y: head.mouth.y - 6 };
    const circuit = `<path d="M${P.insp.x} ${P.insp.y} C ${P.insp.x + 40} ${P.insp.y + 40}, 470 640, 519 616" fill="none" stroke="#9ccbe6" stroke-width="11" stroke-linecap="round"/>
      <path d="M519 528 C 540 470, 610 440, ${target.x - 10} ${target.y + 2}" fill="none" stroke="#9ccbe6" stroke-width="11" stroke-linecap="round"/>
      <path d="M${P.exp.x} ${P.exp.y} C ${P.exp.x + 60} ${P.exp.y + 140}, 640 620, ${target.x - 4} ${target.y + 10}" fill="none" stroke="#c2d3de" stroke-width="11" stroke-linecap="round"/>
      <path d="M519 528 C 540 470, 610 440, ${target.x - 10} ${target.y + 2}" fill="none" stroke="#fff" stroke-width="11" stroke-dasharray="2 5" opacity="0.4"/>
      <path d="M${P.exp.x} ${P.exp.y} C ${P.exp.x + 60} ${P.exp.y + 140}, 640 620, ${target.x - 4} ${target.y + 10}" fill="none" stroke="#fff" stroke-width="11" stroke-dasharray="2 5" opacity="0.4"/>
      <circle cx="${target.x - 4}" cy="${target.y + 4}" r="9" fill="#e9f2f7" stroke="#8fb9d1" stroke-width="2"/>`;

    // Zusammensetzen – Reihenfolge = Tiefenstaffelung
    s += D.dev('pendant', pendant);
    s += D.dev('monitor', monitor);
    s += lines;
    s += D.dev('bed', bedSvg);
    s += D.dev('defib', defib);
    s += D.dev('vent', vent);
    s += circuit;
    s += D.dev('humid', humid);
    s += D.dev('suction', suction);
    s += pole;
    s += D.dev('syringe', dock);
    s += D.dev('volpump', volpump);
    s += D.dev('transducer', transducer);
    return s;
  }

  /* ---------------- Geräte ---------------- */
  const devices = [
    {
      id: 'monitor', name: 'Patientenmonitor (Bettplatzmonitor)', short: 'Patientenmonitor', icon: '📈', category: 'Überwachung / Monitoring',
      manufacturers: ['Philips', 'GE HealthCare', 'Dräger', 'Mindray', 'Nihon Kohden'], class: 'IIb', sim: 'ecg',
      purpose: '<p>Kontinuierliche Überwachung der Vitalfunktionen kritisch kranker Patienten. Der Monitor erkennt lebensbedrohliche Zustände (z. B. Kammerflimmern, Asystolie, Hypoxämie, Hypotonie) und alarmiert das Personal – lokal am Bett und über das Netzwerk an der Zentrale.</p>',
      function: `<p>Der Monitor ist modular aufgebaut: Messmodule erfassen analoge Biosignale, digitalisieren sie (typisch 250–1000 Abtastungen/s beim EKG) und werten sie mit Algorithmen aus.</p>
        <ul><li><b>EKG:</b> Differenzverstärker misst Potentialdifferenzen zwischen Elektroden (µV–mV). Filter (z. B. 0,5–40 Hz Monitormodus) unterdrücken Netzbrumm und Bewegungsartefakte. Die QRS-Detektion liefert die Herzfrequenz, Arrhythmie-Algorithmen klassifizieren Rhythmen.</li>
        <li><b>SpO₂:</b> Pulsoxymetrie mit Rot- (660 nm) und Infrarotlicht (940 nm) – siehe Simulation.</li>
        <li><b>Invasiver Blutdruck:</b> Druckwandler (Wheatstone-Brücke) wandelt Druck in eine Spannung.</li>
        <li><b>NIBP:</b> Oszillometrie mit Manschette.</li>
        <li><b>Kapnografie:</b> Infrarotabsorption von CO₂ (Hauptstrom- oder Nebenstromverfahren).</li>
        <li><b>Temperatur:</b> NTC-Thermistor (z. B. Blasen- oder Ösophagussonde).</li></ul>
        <p>Grenzwerte sind patientenindividuell einstellbar. Über das Krankenhausnetz (oft eigenes Monitoring-Netz) werden Kurven, Trends und Alarme an die Zentrale und das PDMS übertragen.</p>`,
      facts: [['Kurvenkanäle', 'typisch 4–8 gleichzeitig'], ['Netzwerk', 'eigenes Monitoring-LAN / HL7 an PDMS'], ['Akku', 'Transportfähigkeit, ca. 1–4 h'], ['Norm (Beispiel)', 'IEC 60601-2-27 (EKG-Überwachung)']],
      components: [
        { name: 'Display / Bedienoberfläche', desc: 'Touchscreen mit Kurven-, Zahlen- und Trenddarstellung; Alarmanzeige mit Farbcodierung.' },
        { name: 'Messmodule (Plug-in-Module)', desc: 'EKG/Resp, SpO₂, NIBP, 2× invasiver Druck, Temperatur, CO₂ – teilweise als Transportmodul (Multiparameter-Modul).' },
        { name: 'Patientenkabel & Sensoren', desc: '3-/5-/12-adriges EKG-Kabel, SpO₂-Clip, NIBP-Manschette, Druckwandlerkabel, Temperatursonde.' },
        { name: 'Signalverarbeitung (CPU)', desc: 'Digitalisierung, Filterung, QRS-Detektion, Arrhythmieanalyse, Alarmlogik.' },
        { name: 'Alarmsystem', desc: 'Optische Alarmleuchte (rot/gelb/cyan) und akustische Signale nach IEC 60601-1-8.' },
        { name: 'Netzwerkschnittstelle', desc: 'Anbindung an Zentrale, PDMS und ggf. Alarmierungssysteme (Pager/DECT).' },
        { name: 'Netzteil & Akku', desc: 'Unterbrechungsfreier Betrieb bei Transport oder Stromausfall.' },
      ],
      measurements: [
        { name: 'Herzfrequenz (HF)', unit: '/min', normal: '60–100', desc: 'aus EKG (QRS) oder Pulskurve' },
        { name: 'EKG-Ableitungen', unit: 'mV', normal: 'Sinusrhythmus', desc: 'Rhythmus, ST-Strecken-Analyse' },
        { name: 'SpO₂', unit: '%', normal: '94–98 (Ziel ärztlich festgelegt)', desc: 'funktionelle Sauerstoffsättigung' },
        { name: 'Invasiver arterieller Druck (ART)', unit: 'mmHg', normal: 'MAP ≥ 65 (Zielwert)', desc: 'systolisch/diastolisch/Mitteldruck, Schlag-zu-Schlag' },
        { name: 'NIBP', unit: 'mmHg', normal: '< 140/90', desc: 'intermittierend, oszillometrisch' },
        { name: 'etCO₂', unit: 'mmHg', normal: '35–45', desc: 'endtidales CO₂, Kapnogramm' },
        { name: 'Atemfrequenz', unit: '/min', normal: '12–20', desc: 'Impedanzpneumografie oder aus CO₂' },
        { name: 'Temperatur', unit: '°C', normal: '36,3–37,4', desc: 'Kerntemperatur' },
        { name: 'ZVD', unit: 'mmHg', normal: '2–8 (Trend wichtiger als Einzelwert)', desc: 'zentralvenöser Druck' },
      ],
      alarms: [
        { name: 'Asystolie / Kammerflimmern / V-Tach', prio: 'high', cause: 'lebensbedrohliche Rhythmusstörung – oder Artefakt (Elektrode ab, Bewegung).', action: 'Sofort Patient beurteilen (Bewusstsein, Puls, etCO₂, Druckkurve). Bei Bestätigung Reanimation / Defibrillation.' },
        { name: 'SpO₂ niedrig', prio: 'high', cause: 'Hypoxämie, Tubusproblem, Sensor verrutscht, schlechte Perfusion, Bewegung.', action: 'Pleth-Kurve prüfen (Signalqualität), Patient und Beatmung prüfen (DOPE), FiO₂ ggf. erhöhen.' },
        { name: 'ART systolisch niedrig', prio: 'medium', cause: 'Hypotonie, Katecholaminpumpe leer/okkludiert, gedämpfte Kurve, Druckwandler zu hoch.', action: 'Kurvenform prüfen, Nullabgleich/Höhe kontrollieren, Pumpen prüfen, Arzt informieren.' },
        { name: 'Elektrode ab / Ableitung prüfen', prio: 'low', cause: 'Elektrode gelöst, Gel ausgetrocknet, Kabelbruch.', action: 'Elektroden wechseln, Haut vorbereiten.' },
        { name: 'Technischer Alarm: NIBP-Messung fehlgeschlagen', prio: 'low', cause: 'Bewegung, falsche Manschettengröße, Leckage.', action: 'Manschette prüfen, Messung wiederholen.' },
      ],
      connections: [
        { to: 'transducer', type: 'daten', desc: 'Druckwandler liefert die Brückenspannung für die invasive Blutdruckkurve (ART).' },
        { to: 'vent', type: 'daten', desc: 'Optional: Übernahme von Beatmungsparametern und Alarmen (Gerätekommunikation, z. B. über Schnittstelle/PDMS).' },
        { to: 'bed', type: 'patient', desc: 'Patientenanschluss über EKG-Elektroden, SpO₂-Sensor, Temperatursonde, NIBP-Manschette.' },
        { to: 'pendant', type: 'strom', desc: 'Stromversorgung und Netzwerk (LAN) über die Deckenversorgungseinheit.' },
        { label: 'Zentrale Überwachung / PDMS', type: 'daten', desc: 'Kurven, Trends und Alarme werden an den Stationsstützpunkt und das Patientendaten-Managementsystem übertragen.' },
      ],
      safety: [
        'Alarmgrenzen patientenindividuell einstellen – zu weite Grenzen verpassen Ereignisse, zu enge erzeugen <b>Alarmmüdigkeit</b>.',
        'Alarme nie dauerhaft stumm schalten; Alarmpausen sind zeitlich begrenzt.',
        'Bei Defibrillation: defibrillationsgeschützte Patientenkabel/Anwendungsteile (Typ CF/BF mit Defibrillationsschutz) verwenden.',
        'EKG-Elektroden regelmäßig wechseln; Artefakte nicht mit Rhythmusstörungen verwechseln – immer erst den Patienten ansehen.',
        'Funktionsprüfung und sicherheitstechnische Kontrollen (STK) nach Herstellervorgabe/MPBetreibV.',
      ],
      tip: 'Merksatz: <b>„Behandle den Patienten, nicht den Monitor.“</b> Ein Alarm ist ein Hinweis – die Bestätigung erfolgt am Patienten.',
    },
    {
      id: 'vent', name: 'Intensivbeatmungsgerät', short: 'Beatmungsgerät', icon: '🫁', category: 'Therapie / Beatmung',
      manufacturers: ['Dräger', 'Hamilton Medical', 'Getinge', 'Löwenstein Medical', 'Medtronic'], class: 'IIb', sim: 'resp',
      purpose: '<p>Übernimmt oder unterstützt die Atmung bei respiratorischer Insuffizienz (z. B. Pneumonie, ARDS, nach Operationen, bei Bewusstlosigkeit). Ziel ist ausreichende Oxygenierung (O₂-Aufnahme) und Ventilation (CO₂-Abgabe) bei möglichst lungenschonender Beatmung.</p>',
      function: `<p>Druckluft und Sauerstoff aus der zentralen Gasversorgung werden im <b>Gasmischer</b> auf die eingestellte FiO₂ gemischt. Ein elektronisch gesteuertes <b>Inspirationsventil</b> dosiert den Flow, ein <b>Exspirationsventil</b> hält den PEEP. <b>Flow- und Drucksensoren</b> regeln jede Atemphase in Echtzeit (Regelkreis).</p>
        <p>Grundlage ist die <b>Bewegungsgleichung des respiratorischen Systems</b>:<br><code>Paw = PEEP + V/C + R · V'</code><br>(Druck = Elastischer Anteil + Resistiver Anteil). Daraus folgt: Steigt der Atemwegswiderstand R (z. B. Sekret), steigt bei Volumenkontrolle der Spitzendruck, der Plateaudruck bleibt gleich.</p>
        <ul><li><b>Volumenkontrolle (VC):</b> festes Tidalvolumen, konstanter Flow – Druck ist Ergebnis.</li>
        <li><b>Druckkontrolle (PC):</b> fester Inspirationsdruck – Volumen ist Ergebnis (abhängig von Compliance und Widerstand).</li>
        <li><b>Assistierte Modi (CPAP/ASB, PSV):</b> Patient atmet spontan, Gerät unterstützt (Trigger über Flow/Druck).</li></ul>`,
      facts: [['Tidalvolumen (lungenprotektiv)', '≈ 6 ml/kg Standardkörpergewicht'], ['PEEP', 'typisch 5–15 cmH₂O'], ['Plateaudruck', 'Ziel ≤ 30 cmH₂O'], ['Driving Pressure', 'Ziel ≤ 15 cmH₂O'], ['Gasversorgung', 'O₂ und AIR, ca. 5 bar']],
      components: [
        { name: 'Gaseinlässe O₂ / AIR mit Filter', desc: 'Anschluss an die zentrale Gasversorgung (ca. 5 bar) mit Rückschlagventilen.' },
        { name: 'Gasmischer (Blender)', desc: 'Stellt die gewünschte Sauerstoffkonzentration (FiO₂ 21–100 %) ein.' },
        { name: 'Inspirationsventil (Proportionalventil)', desc: 'Dosiert den Gasflow millisekundengenau.' },
        { name: 'O₂-Sensor', desc: 'Kontrolliert die tatsächliche FiO₂ (galvanische Zelle oder paramagnetisch).' },
        { name: 'Schlauchsystem mit Y-Stück', desc: 'Inspirations- und Exspirationsschenkel; Wasserfallen bei Heizdraht-freien Systemen.' },
        { name: 'Flowsensor (proximal oder exspiratorisch)', desc: 'Hitzdraht-Anemometer oder Differenzdrucksensor; misst Flow und Volumen.' },
        { name: 'Exspirationsventil', desc: 'Öffnet in der Exspiration und hält den PEEP aufrecht.' },
        { name: 'Bakterien-/Virenfilter (HME-Filter)', desc: 'Schützt Gerät und Umgebung; bei aktiver Befeuchtung nicht zusätzlich HME einsetzen!' },
        { name: 'Steuereinheit & Bildschirm', desc: 'Einstellungen, Kurven (Druck, Flow, Volumen), Loops, Alarme.' },
        { name: 'Notfall-/Sicherheitsventil', desc: 'Ermöglicht Spontanatmung von Raumluft bei Geräteausfall; Überdruckventil begrenzt Paw.' },
        { name: 'Akku', desc: 'Pufferung bei Stromausfall und für Transporte.' },
      ],
      measurements: [
        { name: 'Spitzendruck (Ppeak)', unit: 'cmH₂O', normal: '< 35', desc: 'max. Atemwegsdruck – enthält resistiven Anteil' },
        { name: 'Plateaudruck (Pplat)', unit: 'cmH₂O', normal: '≤ 30', desc: 'Druck bei Nullflow – spiegelt Alveolardruck' },
        { name: 'PEEP', unit: 'cmH₂O', normal: '5–15', desc: 'positiver endexspiratorischer Druck' },
        { name: 'Exspiratorisches Tidalvolumen (VTe)', unit: 'ml', normal: '≈ 6 ml/kg SKG', desc: '' },
        { name: 'Atemminutenvolumen (MV)', unit: 'l/min', normal: '5–8', desc: 'VT × Atemfrequenz' },
        { name: 'Atemfrequenz (f)', unit: '/min', normal: '12–20', desc: '' },
        { name: 'FiO₂', unit: '%', normal: '21–100 (so niedrig wie möglich)', desc: 'inspiratorische O₂-Fraktion' },
        { name: 'Compliance (Cstat)', unit: 'ml/cmH₂O', normal: '50–100 (gesund)', desc: 'VT / (Pplat − PEEP)' },
        { name: 'Resistance', unit: 'cmH₂O/(l/s)', normal: '5–15 (intubiert)', desc: '(Ppeak − Pplat) / Flow' },
      ],
      alarms: [
        { name: 'Atemwegsdruck hoch (Paw hoch)', prio: 'high', cause: 'Sekret, abgeknickter Tubus, Husten/Pressen, Bronchospasmus, Pneumothorax.', action: 'DOPE-Schema: Dislokation, Obstruktion (absaugen), Pneumothorax, Equipment. Ggf. manuell mit Beatmungsbeutel beatmen.' },
        { name: 'Diskonnektion / Leckage', prio: 'high', cause: 'Schlauchsystem gelöst, Cuffleckage, Tubusdislokation.', action: 'Verbindungen prüfen, Cuffdruck messen (20–30 cmH₂O), Tubuslage kontrollieren.' },
        { name: 'Minutenvolumen niedrig', prio: 'high', cause: 'Leckage, Obstruktion, unzureichende Spontanatmung.', action: 'Patient und Schlauchsystem prüfen, Einstellungen anpassen.' },
        { name: 'Apnoe', prio: 'high', cause: 'Fehlende Spontanatmung im assistierten Modus (Sedierung).', action: 'Apnoe-Ventilation greift; Ursache klären, Modus anpassen.' },
        { name: 'O₂-Versorgung ausgefallen', prio: 'high', cause: 'Zentrale Gasversorgung gestört, Schlauch abgezogen.', action: 'Anschluss prüfen, auf O₂-Flasche wechseln, Beatmungsbeutel bereithalten.' },
        { name: 'FiO₂ Abweichung', prio: 'medium', cause: 'O₂-Sensor verbraucht oder nicht kalibriert.', action: 'O₂-Sensor kalibrieren/tauschen.' },
      ],
      connections: [
        { to: 'pendant', type: 'gas', desc: 'O₂ und Druckluft (AIR) aus der zentralen Gasversorgung über Schnellkupplungen (NIST/DISS).' },
        { to: 'humid', type: 'gas', desc: 'Inspirationsgas wird über die Befeuchterkammer geleitet, erwärmt und angefeuchtet.' },
        { to: 'bed', type: 'patient', desc: 'Schlauchsystem → Y-Stück → Endotrachealtubus → Lunge.' },
        { to: 'monitor', type: 'daten', desc: 'Beatmungsdaten und Alarme an Monitor/PDMS; etCO₂ wird oft am Monitor gemessen.' },
        { to: 'suction', type: 'mechanisch', desc: 'Geschlossenes Absaugsystem am Y-Stück erlaubt Absaugen ohne Diskonnektion (PEEP bleibt erhalten).' },
      ],
      safety: [
        'Beatmungsbeutel mit Maske und O₂-Anschluss muss an jedem Beatmungsplatz griffbereit sein.',
        'Vor Inbetriebnahme Geräteselbsttest (Dichtigkeit, Sensoren, Compliance des Schlauchsystems) durchführen.',
        'Alarmgrenzen (Paw, MV, Apnoe) bei jeder Schichtübergabe kontrollieren.',
        'Lungenprotektive Beatmung: VT ≈ 6 ml/kg SKG, Pplat ≤ 30 cmH₂O, Driving Pressure möglichst ≤ 15 cmH₂O.',
        'Nur eine Befeuchtungsart verwenden: aktiver Befeuchter <b>oder</b> HME-Filter – beides zusammen erhöht den Widerstand massiv.',
        'Oberkörperhochlage 30–45° zur Prophylaxe beatmungsassoziierter Pneumonien (VAP).',
      ],
      tip: 'Ppeak steigt, Pplat bleibt gleich → <b>Widerstandsproblem</b> (Sekret, Tubus). Ppeak und Pplat steigen → <b>Complianceproblem</b> (Pneumothorax, Atelektase, Lungenödem).',
    },
    {
      id: 'humid', name: 'Aktiver Atemgasbefeuchter', short: 'Befeuchter', icon: '💧', category: 'Therapie / Beatmungszubehör',
      manufacturers: ['Fisher & Paykel Healthcare', 'Hamilton Medical', 'Teleflex'], class: 'IIa',
      purpose: '<p>Bei Intubation werden Nase und Rachen umgangen, die das Atemgas normalerweise erwärmen und befeuchten. Der Befeuchter konditioniert das Inspirationsgas auf ca. 37 °C und 44 mg/l absolute Feuchte, um Sekreteindickung, Schleimhautschäden und Tubusverlegung zu verhindern.</p>',
      function: '<p>Eine Heizplatte erwärmt Wasser in einer Befeuchterkammer (Pass-over-Prinzip). Das Inspirationsgas strömt über die Wasseroberfläche und nimmt Wasserdampf auf. Ein beheizter Inspirationsschlauch (Heizdraht) verhindert Kondensation. Zwei Temperatursonden (Kammerausgang und Patientennähe) regeln die Heizleistung in einem geschlossenen Regelkreis.</p>',
      components: [
        { name: 'Heizplatte & Basisgerät', desc: 'Regelt Kammer- und Schlauchtemperatur.' },
        { name: 'Befeuchterkammer', desc: 'Einweg-Kammer mit Schwimmerventil; Füllung über Sterilwasserbeutel (selbstfüllend).' },
        { name: 'Beheizter Inspirationsschlauch', desc: 'Heizdraht verhindert Kondensat („Regenrinne“).' },
        { name: 'Temperatursonden', desc: 'Messen Kammerauslass und Y-Stück-Temperatur.' },
      ],
      measurements: [
        { name: 'Temperatur am Y-Stück', unit: '°C', normal: '≈ 37 (invasiv)', desc: '' },
        { name: 'Kammertemperatur', unit: '°C', normal: '≈ 37–40', desc: '' },
        { name: 'Absolute Feuchte', unit: 'mg H₂O/l', normal: '≈ 44', desc: 'entspricht 100 % rel. Feuchte bei 37 °C' },
      ],
      alarms: [
        { name: 'Temperatur zu hoch', prio: 'high', cause: 'Sonde nicht im Gasstrom, Regelungsfehler.', action: 'Sondenposition prüfen – Verbrennungsgefahr der Atemwege!' },
        { name: 'Kammer leer / Wassermangel', prio: 'medium', cause: 'Wasserbeutel leer.', action: 'Sterilwasser nachfüllen/Beutel wechseln.' },
        { name: 'Sonde diskonnektiert', prio: 'medium', cause: 'Temperatursonde gelöst.', action: 'Sonde korrekt einstecken.' },
      ],
      connections: [
        { to: 'vent', type: 'gas', desc: 'Liegt im Inspirationsschenkel zwischen Beatmungsgerät und Patient.' },
        { to: 'bed', type: 'patient', desc: 'Konditioniertes Atemgas erreicht den Patienten über das Y-Stück.' },
        { to: 'pendant', type: 'strom', desc: 'Netzstrom für Heizplatte und Heizdraht.' },
      ],
      safety: [
        'Niemals gleichzeitig mit einem HME-Filter verwenden.',
        'Nur Sterilwasser (Aqua dest.) verwenden; Kammer nicht manuell überfüllen.',
        'Kondensat Richtung Wasserfalle, nie zum Patienten laufen lassen (Aspirationsgefahr).',
      ],
    },
    {
      id: 'pendant', name: 'Deckenversorgungseinheit (Medienversorgung)', short: 'Deckenversorgung', icon: '🔌', category: 'Infrastruktur',
      manufacturers: ['Dräger', 'Getinge', 'Ondal Medical Systems', 'Baxter (Hillrom/Trumpf Medical)'], class: 'IIb (als Teil der Gasversorgung)',
      purpose: '<p>Stellt am Bettplatz alle „Medien“ bereit: medizinische Gase, Vakuum, Strom, Netzwerk und Patientenruf. Durch die Deckenmontage bleibt der Boden frei (Reinigung, Notfallzugang), und Geräte lassen sich ergonomisch positionieren.</p>',
      function: `<p>Die Gase kommen aus der <b>zentralen Gasversorgungsanlage</b> des Krankenhauses (Sauerstoff-Tank/Flaschenbatterie, Druckluftkompressor, Vakuumpumpen) über Rohrleitungen mit ca. 5 bar (O₂, AIR) bzw. Unterdruck (VAC). Die Entnahmestellen sind gasartspezifisch codiert, damit Verwechslungen technisch ausgeschlossen sind.</p>
        <p>Farbcodierung nach ISO 32: <b>O₂ weiß</b>, <b>Druckluft schwarz-weiß</b>, <b>Vakuum gelb</b>, N₂O blau. Steckdosen sind meist an verschiedene Stromkreise angeschlossen – auch an die <b>Sicherheitsstromversorgung</b> (oft durch Farbe gekennzeichnet, abhängig vom Haus).</p>`,
      components: [
        { name: 'Tragarm / Drehgelenke', desc: 'Positionierbar, mit Bremsen; Traglast für Monitor und Pumpen.' },
        { name: 'Gasentnahmestellen (O₂, AIR, VAC)', desc: 'Gasartspezifische Schnellkupplungen – Verwechslungsschutz.' },
        { name: 'Steckdosen (allgemein / Sicherheitsstromversorgung)', desc: 'Lebenswichtige Geräte an die Sicherheitsversorgung.' },
        { name: 'Potentialausgleich', desc: 'Verhindert Spannungsdifferenzen zwischen Geräten im Patientenumfeld.' },
        { name: 'Netzwerk- & Rufanschlüsse', desc: 'LAN für Monitoring, Schwesternruf.' },
        { name: 'Geräteträger / Schienen', desc: 'Normschienen zur Befestigung von Zubehör.' },
      ],
      measurements: [
        { name: 'Versorgungsdruck O₂ / AIR', unit: 'bar', normal: '≈ 5 (4–5,5)', desc: 'überwacht durch zentrale Alarmanlage' },
        { name: 'Vakuum', unit: 'kPa (Unterdruck)', normal: '−60 bis −90 (Netz)', desc: '' },
      ],
      alarms: [
        { name: 'Zentrale Gasalarmanlage', prio: 'high', cause: 'Druckabfall in der Rohrleitung, Störung der Versorgung.', action: 'Haustechnik/Medizintechnik informieren, auf Flaschenversorgung umstellen, Notfallplan.' },
      ],
      connections: [
        { to: 'vent', type: 'gas', desc: 'O₂ und AIR für das Beatmungsgerät.' },
        { to: 'suction', type: 'gas', desc: 'Vakuum für die Absaugeinrichtung.' },
        { to: 'monitor', type: 'strom', desc: 'Strom & LAN.' },
        { to: 'syringe', type: 'strom', desc: 'Strom für die Pumpen-Dockingstation.' },
        { to: 'humid', type: 'strom', desc: 'Strom für den Befeuchter.' },
        { label: 'Zentrale Gasversorgung (Tank, Kompressor, Vakuumpumpe)', type: 'gas', desc: 'Versorgung über Rohrleitungsnetz.' },
      ],
      safety: [
        'Lebenserhaltende Geräte an Steckdosen der Sicherheitsstromversorgung anschließen.',
        'Gasentnahmestellen nie mit Adaptern „passend machen“ – Verwechslungsgefahr!',
        'Ölfreie und fettfreie Handhabung von O₂-Anschlüssen (Brandgefahr).',
        'Absperrventile der Station kennen (Brandfall).',
      ],
    },
    {
      id: 'suction', name: 'Absaugeinrichtung (Vakuumregler mit Sekretbehälter)', short: 'Absaugung', icon: '🌀', category: 'Therapie',
      manufacturers: ['Medela', 'ATMOS MedizinTechnik', 'Dräger', 'Greggersen'], class: 'IIa',
      purpose: '<p>Entfernt Sekret aus Mund, Rachen und Atemwegen (endotracheal), um die Atemwege frei zu halten. Bei beatmeten Patienten essenziell, weil der Hustenreflex eingeschränkt ist.</p>',
      function: '<p>Ein Vakuumregler reduziert das Unterdruck-Netz auf einen einstellbaren Sog (für Erwachsene typischerweise ca. −200 mbar / −20 kPa, Herstellervorgaben beachten). Ein Sekretbehälter mit Überlaufschutz (Schwimmer) und hydrophobem Filter schützt das Vakuumnetz vor Flüssigkeit. Beim <b>geschlossenen Absaugsystem</b> bleibt der Katheter in einer Schutzhülle am Y-Stück – so wird nicht diskonnektiert, PEEP und Hygiene bleiben erhalten.</p>',
      components: [
        { name: 'Vakuumregler mit Manometer', desc: 'Einstellung und Anzeige des Sogs.' },
        { name: 'Sekretbehälter / Einwegbeutel', desc: 'Mit Skalierung zur Bilanzierung und Überlaufschutz.' },
        { name: 'Bakterienfilter / Überlaufschutz', desc: 'Schützt die zentrale Vakuumanlage.' },
        { name: 'Absaugschlauch & Katheter', desc: 'Offen (Einmalkatheter) oder geschlossen (Inline-System).' },
      ],
      measurements: [
        { name: 'Sog', unit: 'kPa / mbar', normal: 'ca. −20 kPa (Erw., endotracheal)', desc: 'patientenabhängig, geringer bei Kindern' },
        { name: 'Sekretmenge', unit: 'ml', normal: '–', desc: 'Dokumentation, Bilanz' },
      ],
      alarms: [
        { name: 'Kein Sog', prio: 'medium', cause: 'Filter nass/verstopft, Behälter voll, Leck, Vakuumnetz gestört.', action: 'Behälter/Filter tauschen, Dichtigkeit prüfen.' },
      ],
      connections: [
        { to: 'pendant', type: 'gas', desc: 'Anschluss an die gelbe Vakuum-Entnahmestelle.' },
        { to: 'vent', type: 'mechanisch', desc: 'Geschlossenes Absaugsystem am Y-Stück des Beatmungsschlauchs.' },
        { to: 'bed', type: 'patient', desc: 'Absaugkatheter über Tubus in die Trachea.' },
      ],
      safety: [
        'Vor endotrachealem Absaugen präoxygenieren; Absaugdauer kurz halten (≈ 10–15 s).',
        'Funktionsprüfung des Sogs bei Schichtbeginn – Absaugung muss sofort einsatzbereit sein.',
        'Hygiene: Einmalmaterial, Behälter rechtzeitig wechseln.',
      ],
    },
    {
      id: 'syringe', name: 'Spritzenpumpen mit Dockingstation', short: 'Spritzenpumpen', icon: '💉', category: 'Therapie / Infusion',
      manufacturers: ['B. Braun', 'Fresenius Kabi', 'BD', 'ICU Medical'], class: 'IIb', sim: 'infusion',
      purpose: '<p>Präzise, kontinuierliche Gabe hochwirksamer Medikamente in kleinen Volumina – z. B. Katecholamine (Noradrenalin), Sedativa (Propofol), Opioide (Sufentanil), Insulin. Schon kleine Förderschwankungen können hier Blutdruck oder Bewusstsein stark beeinflussen.</p>',
      function: `<p>Ein Schrittmotor treibt über eine Gewindespindel den Spritzenantrieb, der den Kolben mit konstanter Geschwindigkeit vorschiebt. Die Förderrate ergibt sich aus Vorschub × Spritzenquerschnitt; die Pumpe erkennt Spritzentyp/Größe (Spritzenhalter-Sensor) und muss korrekt kalibriert sein.</p>
        <p>Ein <b>Kraftsensor</b> am Antrieb misst den Gegendruck → <b>Okklusionsalarm</b>. Medikamentenbibliotheken (<b>Dose Error Reduction Software</b>) mit Soft- und Hard-Limits verhindern Programmierfehler. Die Dockingstation versorgt die Pumpen mit Strom und vernetzt sie (z. B. mit PDMS).</p>
        <p>Wichtig: Bei kleinen Raten (< 1 ml/h) dauert es nach Start oder Okklusion lange, bis der Fluss stabil ist (<b>Anlaufverhalten</b>, Spiel im Antrieb, Compliance der Spritze).</p>`,
      facts: [['Förderrate', '0,01–1200 ml/h (geräteabhängig)'], ['Genauigkeit', 'typ. ± 2 % (mechanisch)'], ['Spritzengrößen', '2–50/60 ml'], ['Okklusionsdruck', 'mehrstufig einstellbar']],
      components: [
        { name: 'Spritzenhalter mit Größenerkennung', desc: 'Fixiert Spritze, erkennt Spritzengröße.' },
        { name: 'Antriebskopf mit Kolbenhalter', desc: 'Schiebt Kolben vor; Anti-Siphon-Sicherung gegen freien Fluss.' },
        { name: 'Schrittmotor & Spindel', desc: 'Präziser Vorschub.' },
        { name: 'Kraftsensor (Druckmessung)', desc: 'Erkennt Okklusionen.' },
        { name: 'Bedienfeld & Medikamentenbibliothek', desc: 'Rate, Dosis (µg/kg/min), Grenzwerte.' },
        { name: 'Akku & Dockingstation', desc: 'Stromversorgung, Datenkommunikation.' },
      ],
      measurements: [
        { name: 'Förderrate', unit: 'ml/h', normal: 'nach Verordnung', desc: '' },
        { name: 'Dosis', unit: 'µg/kg/min, mg/h', normal: 'nach Verordnung', desc: 'z. B. Noradrenalin 0,05–0,5 µg/kg/min (Beispiel)' },
        { name: 'Restvolumen / Restzeit', unit: 'ml / min', normal: '–', desc: 'Voralarm vor Spritzenende' },
        { name: 'Förderdruck', unit: 'mmHg / bar', normal: 'niedrig', desc: 'Druckanstieg = Hinweis auf Okklusion' },
      ],
      alarms: [
        { name: 'Okklusion', prio: 'high', cause: 'Abgeknickte Leitung, geschlossener Dreiwegehahn, verstopfter Katheter.', action: 'Ursache beheben – vorher Druck entlasten, um Bolusgabe zu vermeiden!' },
        { name: 'Spritze leer', prio: 'high', cause: 'Spritze vollständig entleert.', action: 'Rechtzeitig Wechsel vorbereiten (bei Katecholaminen: überlappender Wechsel / Doppelpumpe).' },
        { name: 'Voralarm Spritzenende', prio: 'low', cause: 'Restzeit z. B. < 5 min.', action: 'Neue Spritze vorbereiten.' },
        { name: 'Akku schwach', prio: 'medium', cause: 'Pumpe nicht gedockt.', action: 'An Strom anschließen.' },
        { name: 'Spritzenkolben nicht erfasst', prio: 'medium', cause: 'Spritze falsch eingelegt.', action: 'Spritze korrekt einlegen – Gefahr des freien Flusses!' },
      ],
      connections: [
        { to: 'bed', type: 'fluid', desc: 'Über Perfusorleitungen und Mehrlumen-ZVK zum Patienten.' },
        { to: 'pendant', type: 'strom', desc: 'Strom über Dockingstation.' },
        { to: 'monitor', type: 'daten', desc: 'Indirekt: Wirkung von Katecholaminen ist am Blutdruck (ART) sichtbar; Pumpendaten oft ans PDMS.' },
        { label: 'PDMS / Medikamentenbibliothek-Server', type: 'daten', desc: 'Dokumentation der Raten, Aktualisierung der Medikamentenbibliothek.' },
      ],
      safety: [
        'Pumpe auf Herzhöhe oder darunter positionieren; Höhenänderungen der Spritze verursachen ungewollte Boli (Siphon-Effekt).',
        'Nur vom Hersteller freigegebene Spritzen verwenden; Spritzentyp korrekt auswählen.',
        'Katecholamine über eigenes Lumen, nicht mit Bolus-Injektionen auf derselben Leitung.',
        'Spritzenwechsel bei Katecholaminen ohne Unterbrechung planen (z. B. zweite Pumpe vorbereitet).',
        'Beschriftung von Spritze und Leitung (Medikament, Konzentration, Uhrzeit).',
      ],
    },
    {
      id: 'volpump', name: 'Volumetrische Infusionspumpe', short: 'Infusionspumpe', icon: '🧴', category: 'Therapie / Infusion',
      manufacturers: ['B. Braun', 'Fresenius Kabi', 'Baxter', 'BD'], class: 'IIb', sim: 'infusion',
      purpose: '<p>Kontrollierte Gabe größerer Flüssigkeitsmengen (Volumenersatz, Elektrolytlösungen, parenterale Ernährung, Antibiotika-Kurzinfusionen) mit definierter Rate und Volumen.</p>',
      function: '<p>Ein <b>Peristaltik-Mechanismus</b> (linear: mehrere Finger drücken nacheinander den Schlauch ab) fördert die Flüssigkeit in einem speziellen Pumpensegment des Infusionsbestecks. Die Rate ergibt sich aus Hubvolumen × Hubfrequenz. Sensoren erkennen <b>Luft im System</b> (Ultraschall), <b>Druck vor und hinter der Pumpe</b> (Okklusion stromauf/stromab) und ob die Tür korrekt geschlossen ist. Eine Free-Flow-Klemme verhindert unkontrollierten Durchfluss beim Öffnen der Tür.</p>',
      components: [
        { name: 'Peristaltik-Pumpwerk', desc: 'Lineare Finger- oder Rollenmechanik.' },
        { name: 'Pumpentür mit Free-Flow-Schutz', desc: 'Verhindert freien Durchfluss.' },
        { name: 'Luftdetektor (Ultraschall)', desc: 'Erkennt Luftblasen in der Leitung.' },
        { name: 'Drucksensoren (proximal / distal)', desc: 'Okklusionserkennung vor und nach der Pumpe.' },
        { name: 'Tropfensensor (optional)', desc: 'Kontrolliert Fluss aus dem Infusionsbehälter.' },
        { name: 'Infusionsbesteck mit Pumpensegment', desc: 'Gerätespezifisches Einmalmaterial.' },
      ],
      measurements: [
        { name: 'Förderrate', unit: 'ml/h', normal: 'nach Verordnung', desc: '' },
        { name: 'VTBI (Volume to be infused)', unit: 'ml', normal: '–', desc: 'noch zu infundierendes Volumen' },
        { name: 'Infundiertes Volumen', unit: 'ml', normal: '–', desc: 'für die Bilanz' },
      ],
      alarms: [
        { name: 'Luft in Leitung', prio: 'high', cause: 'Infusionsbehälter leer, Luftblase im System.', action: 'Pumpe gestoppt lassen, Luft entfernen, Leitung neu entlüften.' },
        { name: 'Okklusion distal (patientenseitig)', prio: 'high', cause: 'Abgeknickte Leitung, Hahn zu, Zugang paravasal.', action: 'Leitung prüfen, Zugang kontrollieren.' },
        { name: 'Okklusion proximal', prio: 'medium', cause: 'Rollenklemme zu, Behälter-Belüftung fehlt.', action: 'Klemme öffnen, Belüftung prüfen.' },
        { name: 'VTBI erreicht', prio: 'low', cause: 'Infusion beendet.', action: 'KVO-Rate läuft – neue Infusion oder Beenden.' },
      ],
      connections: [
        { to: 'bed', type: 'fluid', desc: 'Über Infusionsbesteck und ZVK/Venenverweilkanüle zum Patienten.' },
        { to: 'pendant', type: 'strom', desc: 'Strom.' },
      ],
      safety: [
        'Nur das freigegebene, gerätespezifische Infusionsbesteck verwenden.',
        'Leitung vollständig entlüften – Luftembolie-Gefahr.',
        'Bei paralleler Infusion mit Schwerkraftinfusion Rückschlagventile verwenden.',
      ],
    },
    {
      id: 'transducer', name: 'Invasive Druckmessung (Druckwandler-Set)', short: 'Druckwandler', icon: '🎚️', category: 'Überwachung / Hämodynamik',
      manufacturers: ['Edwards Lifesciences', 'ICU Medical', 'BD', 'Utah Medical'], class: 'IIa', sim: 'bp',
      labelPos: 'bottom',
      purpose: '<p>Schlag-zu-Schlag-Messung des arteriellen Blutdrucks über einen arteriellen Katheter (meist A. radialis). Unverzichtbar bei instabilen Patienten, Katecholamintherapie und für häufige Blutgasanalysen.</p>',
      function: `<p>Die Druckwelle wird über eine flüssigkeitsgefüllte, nicht dehnbare Leitung auf einen <b>piezoresistiven Druckwandler</b> übertragen. Dessen Membran verformt Dehnungsmessstreifen in einer <b>Wheatstone-Brücke</b> – die Brückenspannung (typ. 5 µV/V/mmHg) ist proportional zum Druck.</p>
        <p>Eine <b>Druckspülung</b> (NaCl-Beutel in Druckmanschette, 300 mmHg) spült kontinuierlich ca. 3 ml/h, damit der Katheter nicht thrombosiert.</p>
        <p><b>Nullabgleich</b> gegen Atmosphärendruck und korrekte <b>Höhe</b> des Wandlers (Phlebostatische Achse, ca. 4. ICR / mittlere Axillarlinie) sind entscheidend: 10 cm Höhenfehler ≈ 7,4 mmHg Messfehler (1 mmHg ≈ 1,36 cmH₂O).</p>
        <p>Die Qualität der Kurve hängt vom dynamischen Verhalten ab (Eigenfrequenz, Dämpfung): Luftblasen oder Gerinnsel → <b>überdämpft</b> (abgeflachte Kurve, Systole unterschätzt); lange, weiche Leitungen → <b>unterdämpft</b> (Überschwingen, Systole überschätzt). Prüfung mit dem <b>Fast-Flush-Test</b>.</p>`,
      components: [
        { name: 'Arterieller Katheter', desc: 'Meist A. radialis oder A. femoralis.' },
        { name: 'Druckstabile Verbindungsleitung', desc: 'Kurz, steif, ohne Luftblasen.' },
        { name: 'Dreiwegehähne', desc: 'Zur Blutentnahme und zum Nullabgleich.' },
        { name: 'Druckwandler (Transducer)', desc: 'Membran mit Dehnungsmessstreifen (Wheatstone-Brücke).' },
        { name: 'Spülsystem (Flush Device)', desc: 'Kontinuierliche Spülung ~3 ml/h; Schnellspülung per Zuglasche.' },
        { name: 'Druckinfusionsmanschette', desc: 'Hält den Spülbeutel auf ca. 300 mmHg.' },
        { name: 'Wandlerkabel', desc: 'Verbindung zum Druckmodul des Monitors.' },
      ],
      measurements: [
        { name: 'Systolischer Druck', unit: 'mmHg', normal: '100–140', desc: '' },
        { name: 'Diastolischer Druck', unit: 'mmHg', normal: '60–90', desc: '' },
        { name: 'Mittlerer arterieller Druck (MAP)', unit: 'mmHg', normal: '≥ 65 (Zielwert Intensiv)', desc: '≈ DAP + 1/3 (SAP − DAP)' },
        { name: 'Pulsdruckvariation (PPV)', unit: '%', normal: '< 12 (bei kontrollierter Beatmung)', desc: 'Hinweis auf Volumenreagibilität' },
      ],
      alarms: [
        { name: 'Druckkurve gedämpft', prio: 'medium', cause: 'Luftblase, Gerinnsel, Katheter an Gefäßwand, Spülbeutel leer/Druck zu niedrig.', action: 'Fast-Flush-Test, Luft entfernen, Druckbeutel prüfen.' },
        { name: 'Diskonnektion / Druck fällt auf 0', prio: 'high', cause: 'Leitung offen – Blutungsgefahr!', action: 'Sofort Verbindung prüfen.' },
        { name: 'Nullabgleich erforderlich', prio: 'low', cause: 'Neuer Wandler, Lageänderung.', action: 'Nullabgleich auf Herzhöhe durchführen.' },
      ],
      connections: [
        { to: 'monitor', type: 'daten', desc: 'Wandlerkabel → Druckmodul des Monitors.' },
        { to: 'bed', type: 'fluid', desc: 'Flüssigkeitssäule zum arteriellen Katheter des Patienten.' },
      ],
      safety: [
        'Arterielle Zugänge eindeutig kennzeichnen (rot) – niemals Medikamente arteriell injizieren!',
        'Wandler auf Höhe der phlebostatischen Achse; nach Lageänderungen nachjustieren.',
        'Druckbeutel immer ausreichend gefüllt und auf ca. 300 mmHg.',
        'Verbindungen gut sichtbar lagern – eine Diskonnektion kann rasch zu großem Blutverlust führen.',
      ],
    },
    {
      id: 'bed', name: 'Intensivpflegebett mit (fiktivem) Lernpatienten', short: 'Intensivbett', icon: '🛏️', category: 'Lagerung / Patient',
      manufacturers: ['Baxter (Hillrom)', 'Stryker', 'LINET', 'Arjo'], class: 'I bzw. IIa (je nach Ausstattung)',
      labelPos: 'bottom', anchor: [760, 540],
      purpose: '<p>Ermöglicht sichere Lagerung, Mobilisation und Pflege kritisch kranker Patienten: Oberkörperhochlage, Kantenstellung, CPR-Funktion, Waage, Dekubitusprophylaxe. Hier liegt der fiktive Lernpatient – intubiert, beatmet und an alle Systeme angeschlossen.</p>',
      function: '<p>Elektromotorische Verstellung (Höhe, Rückenteil, Beinteil, Trendelenburg/Anti-Trendelenburg) über Handschalter und Pflegebedienteil. Die <b>CPR-Schnellabsenkung</b> bringt das Rückenteil sofort in Flachlage. Integrierte Wiegezellen ermöglichen die Gewichtsbestimmung (z. B. für Bilanz und Medikamentendosierung). Wechseldruck- oder Mikrostimulationsmatratzen dienen der Dekubitusprophylaxe. Ein Winkelanzeiger dokumentiert die 30°-Oberkörperhochlage.</p>',
      components: [
        { name: 'Liegefläche mit Rücken-/Beinteil', desc: 'Mehrfach segmentiert, röntgendurchlässig (Rückenteil).' },
        { name: 'Hubsäulen / Motoren', desc: 'Elektrische Verstellung.' },
        { name: 'Seitengitter mit Bedienelementen', desc: 'Sturzschutz, integrierte Bedienung.' },
        { name: 'CPR-Hebel', desc: 'Notfall-Flachstellung für Reanimation.' },
        { name: 'Wiegesystem', desc: 'Integrierte Wiegezellen.' },
        { name: 'Therapiematratze', desc: 'Wechseldruck, Dekubitusprophylaxe.' },
      ],
      measurements: [
        { name: 'Oberkörperhochlage', unit: '°', normal: '30–45 (VAP-Prophylaxe)', desc: '' },
        { name: 'Patientengewicht', unit: 'kg', normal: '–', desc: '' },
      ],
      alarms: [
        { name: 'Bett-Ausstiegsalarm', prio: 'medium', cause: 'Patient verlässt das Bett.', action: 'Patient sichern.' },
        { name: 'Bremse nicht aktiv', prio: 'low', cause: 'Bremse gelöst.', action: 'Bremse feststellen.' },
      ],
      connections: [
        { to: 'monitor', type: 'patient', desc: 'Sensoren am Patienten.' },
        { to: 'vent', type: 'patient', desc: 'Endotrachealtubus.' },
        { to: 'syringe', type: 'fluid', desc: 'Zentraler Venenkatheter (ZVK).' },
        { to: 'transducer', type: 'fluid', desc: 'Arterieller Katheter.' },
        { to: 'pendant', type: 'strom', desc: 'Netzanschluss des Bettes.' },
      ],
      safety: [
        'Vor dem Verstellen: Leitungen, Tubus und Drainagen auf Zug prüfen.',
        'Bett-Bremsen immer feststellen.',
        'Quetschgefahr bei Seitengittern und beim Absenken beachten.',
      ],
    },
    {
      id: 'defib', name: 'Defibrillator auf Notfallwagen', short: 'Defibrillator', icon: '⚡', category: 'Notfall / Therapie',
      manufacturers: ['ZOLL', 'Philips', 'corpuls (GS Elektromedizinische Geräte)', 'Stryker (Physio-Control)', 'SCHILLER'], class: 'IIb (III bei implantierbaren)', sim: 'defib',
      labelPos: 'top',
      purpose: '<p>Beendigung lebensbedrohlicher Herzrhythmusstörungen: <b>Defibrillation</b> bei Kammerflimmern und pulsloser ventrikulärer Tachykardie, <b>Kardioversion</b> (R-Zacken-synchronisiert) bei instabilen Tachykardien, <b>externe Schrittmacherstimulation</b> bei bradykarden Rhythmusstörungen.</p>',
      function: `<p>Ein Kondensator wird über einen Hochspannungswandler geladen (gespeicherte Energie E = ½ · C · U²). Bei Auslösung entlädt er sich über die Klebeelektroden durch den Thorax. Moderne Geräte verwenden <b>biphasische Impulse</b> (Strom kehrt die Richtung um) – wirksamer bei geringerer Energie (typ. 120–200 J, herstellerabhängig) als monophasische (360 J).</p>
        <p>Die <b>Thoraximpedanz</b> (typ. 50–150 Ω) wird vor der Abgabe gemessen; das Gerät passt Spannung/Pulsdauer an (Impedanzkompensation). Im <b>synchronisierten Modus</b> erfolgt die Abgabe auf der R-Zacke, um eine Auslösung in der vulnerablen Phase (T-Welle) zu vermeiden.</p>`,
      components: [
        { name: 'Hochspannungskondensator & Ladeschaltung', desc: 'Speichert die Energie.' },
        { name: 'Klebeelektroden / Paddles', desc: 'Anterolaterale oder anterior-posteriore Position.' },
        { name: 'EKG-Analyse (AED-Modus)', desc: 'Automatische Rhythmusanalyse.' },
        { name: 'Synchronisationsschaltung', desc: 'R-Zacken-Triggerung für Kardioversion.' },
        { name: 'Schrittmachermodul', desc: 'Transkutanes Pacing.' },
        { name: 'Akku, Selbsttest, Protokollspeicher', desc: 'Tägliche Einsatzbereitschaft.' },
        { name: 'Notfallwagen', desc: 'Medikamente, Atemwegsmaterial, Zugänge – nach Standard bestückt.' },
      ],
      measurements: [
        { name: 'Energie', unit: 'J', normal: 'biphasisch typ. 120–200 (Herstellerangabe)', desc: '' },
        { name: 'Thoraximpedanz', unit: 'Ω', normal: '50–150', desc: '' },
        { name: 'EKG / Herzfrequenz', unit: '/min', normal: '–', desc: '' },
      ],
      alarms: [
        { name: 'Schock empfohlen (AED)', prio: 'high', cause: 'Defibrillierbarer Rhythmus erkannt.', action: 'Alle weg vom Patienten – Schock auslösen.' },
        { name: 'Elektroden prüfen', prio: 'medium', cause: 'Impedanz zu hoch, Elektrode lose.', action: 'Elektroden andrücken/ersetzen.' },
        { name: 'Selbsttest fehlgeschlagen', prio: 'medium', cause: 'Akku, Hardware.', action: 'Gerät austauschen, Medizintechnik informieren.' },
      ],
      connections: [
        { to: 'bed', type: 'patient', desc: 'Klebeelektroden am Thorax des Patienten.' },
        { to: 'monitor', type: 'mechanisch', desc: 'Der Bettmonitor muss defibrillationsgeschützt sein; Rhythmus wird auf beiden Geräten angezeigt.' },
      ],
      safety: [
        'Vor der Schockabgabe: laut „Alle weg vom Patienten!“, Sauerstoffquelle vom Thorax entfernen (Brandgefahr).',
        'Bei Kardioversion SYNC-Modus aktivieren – nach jedem Schock prüfen, ob SYNC noch aktiv ist (geräteabhängig).',
        'Tägliche Einsatzbereitschaftsprüfung dokumentieren.',
        'Elektroden nicht über implantierten Schrittmacher/ICD kleben (Abstand ≥ 8 cm).',
      ],
    },
  ];

  /* ---------------- Lernszenarien ---------------- */
  const scenarios = [
    {
      id: 'uebernahme', title: 'Übernahme am Beatmungsplatz', duration: '6 min', summary: 'Orientierung am Bettplatz: Welche Geräte sind angeschlossen, wie arbeiten sie zusammen und was zeigen sie an?',
      patient: { name: 'Lernpatient „A. Muster“ (fiktiv)', info: '64 J. · 78 kg · Tag 2 auf der ITS', history: 'Fiktiver Verlauf: Pneumonie mit respiratorischer Insuffizienz, intubiert und kontrolliert beatmet. Kreislaufunterstützung mit Noradrenalin, Analgosedierung mit Propofol und Sufentanil.' },
      vitals: { hr: 92, sbp: 118, dbp: 64, spo2: 95, rr: 16, etco2: 39, temp: 38.2, ventMode: 'VC', vt: 450, peep: 8, fio2: 0.5, compliance: 42, resistance: 12 },
      intro: '<p>Sie übernehmen den Bettplatz zum Frühdienst. Verschaffen Sie sich einen strukturierten Überblick über alle Geräte – von „oben nach unten“ und „vom Patienten weg“.</p>',
      steps: [
        { title: 'Überblick verschaffen', highlight: ['monitor'], text: '<p>Der Blick geht zuerst auf den <b>Patientenmonitor</b>. Sie sehen vier Kurven: EKG (grün), arterielle Druckkurve (rot), Plethysmogramm (cyan) und Kapnogramm (gelb).</p>',
          question: { q: 'Welche Kurve ermöglicht eine Blutdruckmessung von Herzschlag zu Herzschlag?', options: ['Das Plethysmogramm (SpO₂)', 'Die arterielle Druckkurve (ART) über den Druckwandler', 'Die NIBP-Manschette', 'Das Kapnogramm'], correct: 1, explain: 'Die invasive Messung über einen arteriellen Katheter und Druckwandler liefert Schlag-zu-Schlag-Werte. Die NIBP misst nur intermittierend.' } },
        { title: 'Beatmung prüfen', highlight: ['vent'], text: '<p>Das <b>Beatmungsgerät</b> läuft im Modus VC-CMV (volumenkontrolliert). Eingestellt: VT 450 ml, f 16/min, PEEP 8 cmH₂O, FiO₂ 50 %. Beobachten Sie die Druckkurve: Sie steigt in der Inspiration linear an.</p>',
          question: { q: 'Der Patient wiegt 78 kg, ist 1,76 m groß (Standardkörpergewicht ≈ 71 kg). Ist das Tidalvolumen lungenprotektiv?', options: ['Ja, ≈ 6,3 ml/kg SKG – im Zielbereich', 'Nein, es ist zu niedrig – Ziel sind 10–12 ml/kg', 'Das hängt nur vom Körpergewicht in kg ab', 'Das lässt sich ohne Blutgas nicht beurteilen'], correct: 0, explain: '450 ml / 71 kg ≈ 6,3 ml/kg Standardkörpergewicht – lungenprotektiv. Bezugsgröße ist das aus Größe und Geschlecht berechnete Standardkörpergewicht, nicht das tatsächliche Gewicht.' } },
        { title: 'Gasversorgung & Befeuchtung', highlight: ['pendant', 'humid'], text: '<p>Das Beatmungsgerät erhält Sauerstoff und Druckluft aus der <b>Deckenversorgung</b>. Das Inspirationsgas läuft über den <b>aktiven Befeuchter</b>.</p>',
          question: { q: 'Warum darf bei aktivem Befeuchter KEIN zusätzlicher HME-Filter eingesetzt werden?', options: ['Der Filter würde Sauerstoff absorbieren', 'Der HME-Filter saugt sich mit Wasser voll – Widerstand steigt bis zur Verlegung', 'Der Befeuchter würde zu heiß', 'Es gibt keinen Grund, beides ist empfohlen'], correct: 1, explain: 'Ein HME-Filter im aktiv befeuchteten System nimmt Wasser auf, der Atemwegswiderstand steigt stark an – bis zur kompletten Verlegung.' } },
        { title: 'Medikamentenpumpen', highlight: ['syringe'], text: '<p>In der Dockingstation laufen drei Spritzenpumpen: Noradrenalin 4 ml/h, Propofol 2 % 12 ml/h, Sufentanil 3,5 ml/h.</p>',
          question: { q: 'Welche Pumpe ist für die Kreislaufstabilität am kritischsten – und was folgt daraus?', options: ['Propofol – sie muss immer zuerst gewechselt werden', 'Noradrenalin – Unterbrechungen führen rasch zum Blutdruckabfall; Spritzenwechsel ohne Förderpause planen', 'Sufentanil – Unterbrechung führt zu Hypertonie', 'Alle sind gleich kritisch'], correct: 1, explain: 'Noradrenalin hat eine sehr kurze Halbwertszeit (≈ 2–3 min). Schon kurze Förderunterbrechungen (leere Spritze, Okklusion, Wechsel) führen zu Blutdruckabfällen.' } },
        { title: 'Invasive Druckmessung', highlight: ['transducer'], text: '<p>Der <b>Druckwandler</b> hängt am Infusionsständer. Er muss auf Höhe der phlebostatischen Achse (Herzhöhe) stehen.</p>',
          question: { q: 'Der Wandler rutscht 20 cm unter Herzhöhe. Was passiert mit dem angezeigten Druck?', options: ['Er wird ca. 15 mmHg zu hoch angezeigt', 'Er wird ca. 15 mmHg zu niedrig angezeigt', 'Nichts – der Nullabgleich kompensiert das', 'Die Kurve verschwindet'], correct: 0, explain: '20 cmH₂O hydrostatische Säule ≈ 14,7 mmHg. Liegt der Wandler tiefer, lastet zusätzlich die Flüssigkeitssäule auf ihm → zu hohe Werte.' } },
        { title: 'Notfallbereitschaft', highlight: ['defib', 'suction'], text: '<p>Zum Abschluss prüfen Sie die Notfallausstattung: Absaugung mit ausreichendem Sog, Beatmungsbeutel am Platz, Defibrillator mit dokumentiertem Selbsttest.</p>',
          question: { q: 'Welche Prüfungen gehören zur Übernahme eines Beatmungsplatzes? (mehrere richtig)', options: ['Funktion der Absaugung prüfen', 'Beatmungsbeutel mit Maske vorhanden', 'Alarmgrenzen von Monitor und Beatmungsgerät kontrollieren', 'Alle Alarme für die Schicht stumm schalten'], correct: [0, 1, 2], explain: 'Absaugung, Beutel und Alarmgrenzen sind Pflicht-Checks. Alarme werden niemals dauerhaft stumm geschaltet.' } },
      ],
      debrief: '<p>Sie haben die wichtigsten Geräte eines Intensivbettplatzes und ihre Zusammenarbeit kennengelernt: Die <b>Deckenversorgung</b> liefert Gase und Strom, das <b>Beatmungsgerät</b> sichert die Atmung, <b>Pumpen</b> dosieren Medikamente, deren Wirkung der <b>Monitor</b> über <b>Druckwandler</b> und Sensoren sichtbar macht.</p>',
    },
    {
      id: 'sekret', title: 'Alarm: Atemwegsdruck hoch, SpO₂ fällt', duration: '5 min', summary: 'Ein Hochdruckalarm am Beatmungsgerät – erkennen Sie Ursache und richtiges Vorgehen?',
      patient: { name: 'Lernpatient „A. Muster“ (fiktiv)', info: '64 J. · beatmet, VC-CMV', history: 'Fiktiver Verlauf: zunehmend zähes Bronchialsekret in den letzten Stunden.' },
      vitals: { hr: 90, sbp: 120, dbp: 66, spo2: 96, rr: 16, etco2: 38, ventMode: 'VC', vt: 450, peep: 8, fio2: 0.4, compliance: 42, resistance: 12 },
      intro: '<p>Es ist ruhig auf der Station. Beobachten Sie den Monitor und das Beatmungsgerät aufmerksam.</p>',
      steps: [
        { title: 'Alarm!', vitals: { resistance: 48, spo2: 90, etco2: 46, hr: 108 }, duration: 8, highlight: ['vent'], alarms: [{ id: 'vent-paw', prio: 'high', text: 'Paw HOCH (Beatmung)', device: 'vent', source: 'vent' }],
          text: '<p>Das Beatmungsgerät alarmiert: <b>Atemwegsdruck hoch</b>. Die Paw-Kurve zeigt einen deutlich höheren Spitzendruck. Die SpO₂ fällt, die Herzfrequenz steigt.</p><p>Beobachten Sie die Werte am Beatmungsgerät (Ppeak) – sie ändern sich gerade.</p>',
          question: { q: 'Der Spitzendruck steigt stark, der Plateaudruck bleibt nahezu gleich. Worauf deutet das hin?', options: ['Erhöhter Atemwegswiderstand (z. B. Sekret, abgeknickter Tubus)', 'Verminderte Lungen-Compliance (z. B. Pneumothorax)', 'Leckage im Schlauchsystem', 'Defekter O₂-Sensor'], correct: 0, explain: 'Ppeak − Pplat ist der resistive Anteil (R × Flow). Steigt nur Ppeak, liegt ein Widerstandsproblem vor. Bei Complianceproblemen steigen Ppeak und Pplat gemeinsam.' } },
        { title: 'Systematisch vorgehen', highlight: ['vent', 'bed'], text: '<p>Sie gehen nach dem <b>DOPE-Schema</b> vor.</p>',
          question: { q: 'Wofür steht DOPE?', options: ['Dosis, Oxygenierung, Puls, EKG', 'Dislokation, Obstruktion, Pneumothorax, Equipment', 'Diskonnektion, Okklusion, PEEP, Exspiration', 'Druck, O₂, Perfusion, Elektrolyte'], correct: 1, explain: 'DOPE: Dislokation des Tubus, Obstruktion (Sekret, Abknicken), Pneumothorax, Equipment-Versagen (Gerät, Schläuche, Gasversorgung).' } },
        { title: 'Absaugen', highlight: ['suction'], vitals: { resistance: 12, spo2: 96, etco2: 39, hr: 92 }, duration: 10, alarms: [],
          text: '<p>Der Tubus liegt korrekt, die Thoraxexkursion ist seitengleich. Beim Auskultieren hören Sie Rasselgeräusche. Nach Präoxygenierung saugen Sie über das <b>geschlossene Absaugsystem</b> zähes Sekret ab. Beobachten Sie, wie der Spitzendruck fällt und die SpO₂ wieder steigt.</p>',
          question: { q: 'Welchen Vorteil hat das geschlossene Absaugsystem beim beatmeten Patienten?', options: ['Es saugt stärker', 'Keine Diskonnektion: PEEP bleibt erhalten, weniger Derecruitment und Kontamination', 'Es ersetzt die Befeuchtung', 'Es misst den Cuffdruck'], correct: 1, explain: 'Beim geschlossenen System bleibt der Kreis geschlossen – PEEP und Oxygenierung bleiben weitgehend erhalten, das Personal ist vor Aerosolen geschützt.' } },
        { title: 'Nachbereitung', text: '<p>Die Werte haben sich normalisiert. Sie dokumentieren das Ereignis und prüfen die Befeuchtung (Temperatur am Y-Stück, Wasserstand).</p>',
          question: { q: 'Warum prüfen Sie nach diesem Ereignis den Atemgasbefeuchter?', options: ['Unzureichende Befeuchtung begünstigt zähes Sekret und Tubusverlegung', 'Der Befeuchter steuert den PEEP', 'Der Befeuchter misst die SpO₂', 'Gar nicht – kein Zusammenhang'], correct: 0, explain: 'Trockenes Atemgas dickt Sekret ein. Eine korrekte Klimatisierung (37 °C, 44 mg/l) ist Prophylaxe gegen Sekretverhalt.' } },
      ],
      debrief: '<p>Die Bewegungsgleichung <code>Paw = PEEP + V/C + R·V\'</code> erklärt, warum ein erhöhter Widerstand bei Volumenkontrolle vor allem den Spitzendruck erhöht. Geräte hängen zusammen: <b>Befeuchter → Sekretkonsistenz → Widerstand → Beatmungsdruck → Oxygenierung (SpO₂)</b>.</p>',
    },
    {
      id: 'noradrenalin', title: 'Blutdruckabfall: Spritzenpumpe Noradrenalin', duration: '5 min', summary: 'Der arterielle Druck fällt plötzlich. Liegt es am Patienten – oder an der Technik?',
      patient: { name: 'Lernpatient „A. Muster“ (fiktiv)', info: '64 J. · Noradrenalin 0,1 µg/kg/min', history: 'Fiktiver Verlauf: septischer Schock, stabil unter Katecholamintherapie.' },
      vitals: { hr: 94, sbp: 116, dbp: 62, spo2: 96, rr: 16, etco2: 38 },
      intro: '<p>Der Kreislauf ist unter Noradrenalin stabil (MAP ≈ 80 mmHg). Achten Sie auf den Monitor.</p>',
      steps: [
        { title: 'MAP fällt', vitals: { sbp: 82, dbp: 44, hr: 112 }, duration: 12, highlight: ['monitor', 'syringe'], alarms: [{ id: 'syr-occ', prio: 'high', text: 'OKKLUSION Spritzenpumpe 1', device: 'syringe' }],
          text: '<p>Die arterielle Druckkurve fällt ab, die Herzfrequenz steigt. Gleichzeitig alarmiert die <b>Spritzenpumpe 1 (Noradrenalin): Okklusion</b>.</p>',
          question: { q: 'Was ist der wahrscheinlichste Zusammenhang?', options: ['Zufall – die Pumpe hat nichts mit dem Blutdruck zu tun', 'Die Noradrenalinzufuhr ist unterbrochen (Okklusion) – die Wirkung lässt rasch nach', 'Der Druckwandler ist defekt', 'Die Beatmung ist schuld'], correct: 1, explain: 'Noradrenalin wirkt nur Minuten. Eine Okklusion (z. B. geschlossener Dreiwegehahn) stoppt die Zufuhr – der Blutdruck fällt.' } },
        { title: 'Ursache beheben – aber richtig', highlight: ['syringe'], text: '<p>Sie finden einen versehentlich geschlossenen Dreiwegehahn am ZVK. In der Leitung hat sich Druck aufgebaut (die Pumpe hat weiter gegen den Widerstand geschoben).</p>',
          question: { q: 'Was müssen Sie VOR dem Öffnen des Dreiwegehahns beachten?', options: ['Nichts, einfach öffnen', 'Druck im System entlasten (z. B. über Pumpe/Leitung), um einen unkontrollierten Noradrenalin-Bolus zu vermeiden', 'Die Pumpe auf maximale Rate stellen', 'Die Spritze entfernen und neu aufziehen'], correct: 1, explain: 'Der aufgestaute Druck würde beim Öffnen einen Bolus des hochpotenten Medikaments auslösen – Gefahr von hypertensiven Krisen und Arrhythmien. Viele Pumpen bieten eine automatische Bolusreduktion.' } },
        { title: 'Stabilisierung', vitals: { sbp: 114, dbp: 62, hr: 96 }, duration: 12, alarms: [], text: '<p>Nach Druckentlastung und Öffnen des Hahns läuft das Noradrenalin wieder. Beobachten Sie, wie der Blutdruck innerhalb weniger Minuten ansteigt.</p>',
          question: { q: 'Welche Maßnahmen senken das Risiko einer Förderunterbrechung bei Katecholaminen? (mehrere richtig)', options: ['Eigenes Lumen für Katecholamine', 'Überlappender Spritzenwechsel mit vorbereiteter zweiter Pumpe', 'Restzeit-Voralarm beachten', 'Katecholamine über dieselbe Leitung wie Bolusgaben'], correct: [0, 1, 2], explain: 'Eigenes Lumen, Doppelpumpen-Wechsel und Beachtung der Voralarme verhindern Unterbrechungen und Boli. Bolusgaben über die Katecholaminleitung spülen Katecholamin unkontrolliert ein.' } },
      ],
      debrief: '<p>Technik und Physiologie sind eng gekoppelt: Eine <b>Pumpenokklusion</b> zeigt sich zuerst am <b>Monitor</b> (ART). Typische technische Abhängigkeit: Spritzenpumpe → ZVK → Kreislauf → Druckwandler → Monitor.</p>',
    },
    {
      id: 'vf', title: 'Notfall: Kammerflimmern am Bettplatz', duration: '4 min', summary: 'Der Monitor zeigt plötzlich Kammerflimmern. Artefakt oder echter Notfall?',
      patient: { name: 'Lernpatient „A. Muster“ (fiktiv)', info: '64 J. · beatmet', history: 'Fiktiver Verlauf: Elektrolytstörung (Hypokaliämie) bekannt.' },
      vitals: { hr: 88, sbp: 118, dbp: 64, spo2: 96, etco2: 38 },
      intro: '<p>Achten Sie auf den Monitor. Alarmtöne können Sie oben in der Raumansicht aktivieren.</p>',
      steps: [
        { title: 'Alarm: Kammerflimmern', vitals: { rhythm: 'vf' }, instant: true, highlight: ['monitor'],
          text: '<p>Der Monitor zeigt ein chaotisches EKG und alarmiert mit höchster Priorität. Gleichzeitig verschwinden arterielle Druckkurve und Pleth-Kurve, das etCO₂ fällt ab.</p>',
          question: { q: 'Woran erkennen Sie, dass es sich NICHT um ein Bewegungsartefakt handelt?', options: ['Am lauten Alarm', 'Die arterielle Druckkurve ist flach und das etCO₂ fällt – kein Auswurf', 'An der Uhrzeit', 'Das EKG ist grün'], correct: 1, explain: 'Plausibilitätsprüfung über mehrere, unabhängige Parameter: Ohne Herzauswurf gibt es keine Pulswelle (ART, Pleth) und kein CO₂-Transport zur Lunge.' } },
        { title: 'Defibrillation', highlight: ['defib'], text: '<p>Reanimationsalarm, Thoraxkompressionen beginnen. Der Defibrillator wird gebracht, die Klebeelektroden angebracht.</p>',
          question: { q: 'Was ist vor der Schockabgabe beim beatmeten Patienten besonders zu beachten?', options: ['Beatmungsgerät ausschalten und Tubus entfernen', 'Niemand berührt Patient/Bett, Sauerstoffquelle nicht über dem Thorax (Brandgefahr) – geschlossenes Beatmungssystem kann konnektiert bleiben', 'Monitor ausstecken', 'SYNC-Modus aktivieren'], correct: 1, explain: 'Bei Kammerflimmern wird unsynchronisiert defibrilliert. Freie O₂-Quellen (Maske, diskonnektierter Schlauch) vom Thorax entfernen; ein geschlossenes Beatmungssystem bleibt in der Regel konnektiert.' } },
        { title: 'ROSC', vitals: { rhythm: 'sinus', hr: 104, sbp: 96, dbp: 54, etco2: 42 }, instant: true, text: '<p>Nach dem Schock: Sinusrhythmus. Die arterielle Kurve kehrt zurück, das etCO₂ steigt deutlich an.</p>',
          question: { q: 'Warum ist ein plötzlicher etCO₂-Anstieg unter Reanimation ein gutes Zeichen?', options: ['Er zeigt eine Hyperventilation', 'Er zeigt einen wiederhergestellten Kreislauf (ROSC): CO₂ wird wieder zur Lunge transportiert', 'Er bedeutet, dass der Sensor defekt ist', 'Er hat keine Bedeutung'], correct: 1, explain: 'etCO₂ spiegelt bei konstanter Beatmung die Lungenperfusion wider. Ein abrupter Anstieg ist ein frühes Zeichen für ROSC.' } },
      ],
      debrief: '<p>Monitor, Druckmessung, Kapnografie und Defibrillator bilden im Notfall einen Verbund: Der Monitor <b>erkennt</b>, ART und etCO₂ <b>bestätigen</b>, der Defibrillator <b>therapiert</b>, die Kurven zeigen den <b>Erfolg</b>.</p>',
    },
  ];

  /* ---------------- Herausforderungen ---------------- */
  const challenges = [
    { type: 'find', title: 'Finde das Beatmungsgerät', prompt: 'Klicken Sie in der Raumansicht auf das Gerät, das die Atmung des Patienten übernimmt.', target: 'vent', explain: 'Das Intensivbeatmungsgerät steht links neben dem Bett. Erkennbar an Bildschirm mit Druck-, Flow- und Volumenkurven und den Anschlüssen für Inspiration (blau) und Exspiration.' },
    { type: 'find', title: 'Wo wird der arterielle Druck gemessen?', prompt: 'Finden Sie die Komponente, die die arterielle Druckwelle in ein elektrisches Signal umwandelt.', target: 'transducer', explain: 'Der Druckwandler hängt auf Herzhöhe am Infusionsständer. Die rote Leitung führt zum arteriellen Katheter.' },
    { type: 'find', title: 'Vakuum gesucht', prompt: 'Ein Patient muss sofort abgesaugt werden. Welches Gerät benötigen Sie?', target: 'suction', explain: 'Die Absaugeinrichtung mit Vakuumregler und Sekretbehälter hängt an der Deckenversorgung (gelber Vakuumanschluss).' },
    { type: 'match', title: 'Geräte und Aufgaben zuordnen', prompt: 'Ordnen Sie jedem Gerät seine Hauptaufgabe zu.', pairs: [
      { device: 'vent', right: 'Sichert Oxygenierung und CO₂-Elimination' },
      { device: 'syringe', right: 'Dosiert hochwirksame Medikamente in kleinen Volumina' },
      { device: 'monitor', right: 'Überwacht Vitalparameter und alarmiert' },
      { device: 'humid', right: 'Erwärmt und befeuchtet das Atemgas' },
      { device: 'pendant', right: 'Liefert Gase, Vakuum, Strom und Netzwerk' },
    ], explain: '' },
    { type: 'component', title: 'Komponente identifizieren: Beatmung', prompt: 'Welche Komponente des Beatmungsgeräts hält in der Exspiration den PEEP aufrecht?', options: ['Inspirationsventil', 'Gasmischer', 'Exspirationsventil', 'O₂-Sensor'], correct: 2, highlight: ['vent'], explain: 'Das Exspirationsventil öffnet in der Ausatmung nur so weit, dass der eingestellte positive endexspiratorische Druck (PEEP) erhalten bleibt.' },
    { type: 'component', title: 'Komponente identifizieren: Druckmessung', prompt: 'Welches Messprinzip steckt im Druckwandler der invasiven Blutdruckmessung?', options: ['Dehnungsmessstreifen in einer Wheatstone-Brücke', 'Ultraschall-Doppler', 'Infrarot-Absorption', 'Oszillometrie'], correct: 0, highlight: ['transducer'], explain: 'Die Membran verformt Dehnungsmessstreifen, deren Widerstandsänderung in einer Wheatstone-Brücke eine druckproportionale Spannung erzeugt.' },
    { type: 'alarm', title: 'Simulierten Alarm erkennen', prompt: 'Sehen Sie sich den Monitor an: Welche Situation liegt vor?', vitals: { rhythm: 'af', hr: 138, sbp: 102, dbp: 60 }, highlight: ['monitor'], options: ['Sinustachykardie', 'Tachyarrhythmia absoluta bei Vorhofflimmern', 'Kammerflimmern', 'Asystolie'], correct: 1, explain: 'Unregelmäßige RR-Abstände, fehlende P-Wellen und eine flimmernde Grundlinie sprechen für Vorhofflimmern – hier mit schneller Überleitung (HF > 100/min).' },
    { type: 'alarm', title: 'Alarm: SpO₂ – echt oder Artefakt?', prompt: 'Die SpO₂ zeigt 84 %. Die Pleth-Kurve ist sehr flach, alle anderen Parameter (etCO₂, ART, Beatmungsdrücke) sind unverändert. Was tun Sie zuerst?', vitals: { spo2: 84, perfusion: 0.15 }, highlight: ['monitor'], options: ['Sofort FiO₂ auf 100 % und Arzt rufen, ohne den Patienten anzusehen', 'Patienten ansehen, Sensorsitz und Perfusion (kalte Finger?) prüfen, ggf. Sensor umsetzen – parallel Plausibilität prüfen', 'Alarm stumm schalten', 'Den Alarmgrenzwert auf 80 % senken'], correct: 1, explain: 'Eine sehr flache Pleth-Kurve (niedrige Perfusion) macht die Messung unzuverlässig. Erst den Patienten beurteilen und den Sensor prüfen – Artefakte nicht übersehen, aber auch echte Hypoxämien nicht wegdiskutieren.' },
    { type: 'sequence', title: 'Geräteverbund erklären: Invasive Druckmessung', prompt: 'Bringen Sie die Signalkette der invasiven Blutdruckmessung in die richtige Reihenfolge – vom Patienten zur Anzeige.', items: ['Arterie (Druckwelle)', 'Arterieller Katheter', 'Flüssigkeitsgefüllte Druckleitung', 'Druckwandler (Wheatstone-Brücke)', 'Wandlerkabel', 'Druckmodul des Monitors (Verstärker, A/D-Wandler)', 'Anzeige: Kurve und Zahlenwerte'], highlight: ['transducer', 'monitor'], explain: 'Mechanisches Drucksignal → hydraulische Übertragung → elektrische Wandlung → Verstärkung/Digitalisierung → Anzeige.' },
    { type: 'sequence', title: 'Geräteverbund erklären: Weg des Sauerstoffs', prompt: 'Ordnen Sie den Weg des Sauerstoffs von der Versorgung bis in die Lunge.', items: ['Zentrale Gasversorgung (Tank)', 'Rohrleitungsnetz', 'Entnahmestelle an der Deckenversorgung', 'Gasmischer im Beatmungsgerät', 'Inspirationsventil', 'Atemgasbefeuchter', 'Y-Stück & Endotrachealtubus', 'Alveolen'], highlight: ['pendant', 'vent', 'humid'], explain: 'Sauerstoff fließt aus der zentralen Versorgung über die Deckenversorgung ins Beatmungsgerät, wird gemischt, dosiert, befeuchtet und über den Tubus in die Lunge geleitet.' },
    { type: 'quiz', title: 'Sicherheit: Farbcodierung', prompt: 'Welche Farbe kennzeichnet nach ISO 32 die Entnahmestelle für Vakuum?', options: ['Weiß', 'Schwarz/Weiß', 'Gelb', 'Blau'], correct: 2, highlight: ['pendant'], explain: 'O₂ = weiß, Druckluft = schwarz/weiß, Vakuum = gelb, N₂O = blau (Farben nach ISO 32).' },
    { type: 'quiz', title: 'Technische Abhängigkeit', prompt: 'Die zentrale Sauerstoffversorgung fällt aus. Welche Geräte am Bettplatz sind direkt betroffen? (mehrere richtig)', options: ['Beatmungsgerät (FiO₂ nicht mehr erreichbar)', 'Patientenmonitor', 'O₂-Flowmeter für Beatmungsbeutel', 'Spritzenpumpen'], correct: [0, 2], explain: 'Das Beatmungsgerät verliert die O₂-Quelle (es alarmiert und läuft ggf. mit Druckluft weiter), auch der Beatmungsbeutel kann nicht mehr mit O₂ angereichert werden – Ersatz: O₂-Flaschen. Monitor und Pumpen sind elektrisch versorgt.' },
  ];

  MTS.registerArea({
    id: 'icu',
    name: 'Intensivstation',
    status: 'full',
    color: '#0f7ea3',
    description: 'Intensivbettplatz mit einem beatmeten, fiktiven Lernpatienten: Monitoring, Beatmung, Infusionstherapie und Notfallausstattung im Verbund.',
    goals: [
      'Die Geräte eines Intensivbettplatzes benennen und ihre Aufgaben erklären.',
      'Die angezeigten Messwerte und Kurven interpretieren (EKG, ART, SpO₂, etCO₂, Paw/Flow/Volumen).',
      'Technische Abhängigkeiten verstehen: Gasversorgung, Strom, Daten, Flüssigkeitswege.',
      'Typische Alarme erkennen und priorisieren; Artefakte von echten Ereignissen unterscheiden.',
      'Sicherheitsaspekte am Beatmungsplatz kennen (Beatmungsbeutel, Alarmgrenzen, Befeuchtung, Katecholamine).',
    ],
    intro: '<p>Auf der Intensivstation werden Patienten mit lebensbedrohlichen Erkrankungen rund um die Uhr überwacht und behandelt. Ein Bettplatz ist eine kleine „technische Insel“: Gase, Strom und Daten kommen aus der Deckenversorgung; Beatmungsgerät, Pumpen und Monitor arbeiten im Verbund. Klicken Sie auf <b>„Geräteverbund“</b>, um die Verbindungen sichtbar zu machen.</p>',
    safety: [
      'Beatmungsbeutel mit Maske an jedem Bettplatz griffbereit.',
      'Lebenserhaltende Geräte an die Sicherheitsstromversorgung.',
      'Einweisung in jedes Medizinprodukt vor der Anwendung (MPBetreibV).',
      'Händedesinfektion vor und nach Patientenkontakt (5 Momente).',
    ],
    patient: { hr: 92, sbp: 118, dbp: 64, spo2: 95, rr: 16, etco2: 39, temp: 38.2, ventMode: 'VC', vt: 450, peep: 8, fio2: 0.5, compliance: 42, resistance: 12 },
    scene: { viewBox: '0 0 1600 900', render },
    devices,
    scenarios,
    challenges,
  });
})();
