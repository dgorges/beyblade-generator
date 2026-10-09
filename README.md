# Beyblade Creator

Ein Web-Generator für eigene Beyblade-X-Teile, gebaut mit Vue 3, Three.js und manifold-3d (CSG).

## Prinzip
- 🔒 **Schnittstellenteile** stammen 1:1 aus einem Kit: Lock-Chip (Starter), Ringe und Bit-Anschluss. Sie werden nie verändert.
- 🎨 **Designteile** werden generiert: Gewichtsring, Basis mit Zinken und Bit-Spitze. Ihr Innenbereich wird aus dem Kit übernommen, damit alles passt. Der Außenbereich ist frei gestaltbar, inklusive Löchern.

## Grundlage
Standard-Grundlage ist das Modell **Wizard Rod** (`public/kits/wizard-rod/`). Es ist im Repository enthalten und wird auch online genutzt.

Optional lässt sich lokal **Iron Forest 4-80 High Needle** als zweite Grundlage einrichten. Dazu die STL-Dateien nach `reference/` kopieren und ausführen:

```bash
npm run kit:extract
```

Iron Forest erscheint nur in der lokalen Entwicklungsumgebung (Auswahl im Schritt „Fertig“). Fehlt es, wechselt die App automatisch zu Wizard Rod.

## Entwicklung
```bash
npm install
npm run dev
npm test
```

- `src/kits/`: je Kit Teile, Rollen, Aufbaupositionen, Schnittstellenzonen, Grenzwerte und Startwerte
- `src/geometry/engine.js`: CSG-Erzeugung der Designteile und Kollisionsprüfung
- `src/workers/geometry.worker.js`: Berechnung im Hintergrund
- `scripts/`: Werkzeuge zum Zerlegen, Vermessen und Positionieren der Kit-Teile
- `dev/inspect.html`: Inspektor für einzelne Kit-Körper

## Offene Punkte
Die Aufbaupositionen (`z`, `rot`, `flip` in der Kit-Datei) wurden rechnerisch per Kollisionsprüfung bestimmt. Die Lage der Innenteile des Lock-Chips (Drehrichtungs-Einsatz, Clip) ist geschätzt. Sie wirkt sich nur auf die Vorschau aus, nicht auf die gedruckten Teile.
