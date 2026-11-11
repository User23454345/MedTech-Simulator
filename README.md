# MedTech Simulator

**Interaktive virtuelle Krankenhausumgebung, die Medizintechnik im klinischen Einsatz vermittelt.**

Gehen Sie durch ein virtuelles Lernkrankenhaus, untersuchen Sie Medizingeräte direkt am (fiktiven) Patientenbett,
verstehen Sie Mess- und Therapieprinzipien in interaktiven Simulationen und testen Sie Ihr Wissen in klinischen
Lernszenarien und Herausforderungen.

> ⚠️ **Lernumgebung – kein Medizinprodukt.** Alle Patientendaten sind fiktiv. Die Modelle sind didaktisch vereinfacht
> und dürfen nicht zur Diagnose, Therapie oder Gerätebedienung am Patienten verwendet werden.

## Starten

Keine Installation, kein Build, kein Server nötig:

```bash
# einfach im Browser öffnen
xdg-open index.html        # Linux
open index.html            # macOS
```

Alternativ über einen beliebigen statischen Webserver (z. B. `python3 -m http.server`) oder GitHub Pages.
Läuft auf normalen Laptops, Tablets und Smartphones – ohne 3D-Hardware (SVG + Canvas).

## Inhalte

| Bereich | Schwerpunkte |
|---|---|
| **Intensivstation** (vollständig ausgearbeitet) | Patientenmonitor, Intensivbeatmung, Befeuchter, Deckenversorgung, Absaugung, Spritzen- & Infusionspumpen, invasive Druckmessung, Intensivbett, Defibrillator |
| Operationssaal | Narkosegerät, HF-Chirurgie, Laparoskopie, OP-Tisch & -Leuchte, Wärmetherapie |
| Notaufnahme | Schockraum, Monitor-Defibrillator, Transportbeatmung, Notfallsonografie, Schnellinfusion |
| Radiologie | CT, MRT, Röntgen, Ultraschall, Kontrastmittelinjektor, PACS, Strahlenschutz |
| Normalstation | Spot-Check-Monitoring & Frühwarnscores, O₂-Therapie, Infusionspumpe, POCT |
| Aufwachraum | Postoperative Überwachung, Kapnografie, High-Flow-O₂, PCA-Pumpe, Wärmetherapie |
| Dialyse | Hämodialysegerät, Dialysator, extrakorporaler Kreislauf, Wasseraufbereitung |
| Labor | Blutgasanalyse, Hämatologie, Klinische Chemie, Gerinnung, Präanalytik, Qualitätskontrolle |
| Neonatologie | Inkubator, Neonatalbeatmung, Fototherapie, transkutane Messung, Kleinstraten-Pumpen |
| Herzkatheterlabor | Angiografieanlage, Hämodynamik, Kontrastmittelinjektor, Strahlenschutz, Herzunterstützung |

Jedes Gerät bietet: **Bezeichnung, typische Hersteller (Beispiele), medizinischer Zweck, technische Funktion,
Komponenten, Messwerte, typische Alarme, Verbindungen zu anderen Geräten** (inkl. Verbundgrafik) und **Sicherheitsaspekte**.

**Simulationslabor:** EKG · Pulsoxymetrie · Blutdruck (oszillometrisch & invasiv) · Atemphysiologie/Beatmung ·
Infusion · Defibrillation · Bildgebung (Röntgen, CT, Ultraschall, MRT).

**Herausforderungen:** Gerät finden · Geräte ihren Aufgaben zuordnen · Komponenten identifizieren ·
simulierte Alarme erkennen · Geräteverbünde erklären.

## Funktionen der Raumansicht

- **Live-Kurven** (EKG, arterieller Druck, Pleth, Kapnogramm, Beatmungsdruck/-flow/-volumen) aus einem
  gemeinsamen Physiologie-Modell – Szenarien verändern die Werte in Echtzeit.
- **Geräteverbund** blendet Daten-, Gas-, Flüssigkeits-, Energie- und Patientenverbindungen ein.
- **Alarmsystem** mit Prioritäten nach IEC 60601-1-8 (optional akustisch).
- **Lernfortschritt** wird lokal im Browser gespeichert.
- Tastaturbedienung (Tab/Enter/Esc), responsive Darstellung.

## Entwicklung

Siehe [`docs/ENTWICKLUNG.md`](docs/ENTWICKLUNG.md) für Architektur und Datenformate.
Browser-Schnellcheck (benötigt Playwright):

```bash
node tools/check.js '#/area/icu' "MTS.openDevice('vent')" screenshot.png
```

## Lizenz & Haftung

Nur für Lehrzwecke. Herstellernamen dienen als Beispiele typischer Anbieter einer Geräteklasse; die dargestellten
Geräte sind generische Illustrationen und keinem realen Produkt nachgebildet.
