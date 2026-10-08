# Beyblade Creator

Ein Web-Generator für eigene Beyblade-X-Teile, gebaut mit Vue 3, Three.js und manifold-3d (CSG).

## Prinzip
- 🔒 **Schnittstellenteile** stammen 1:1 aus einem gekauften Kit: Lock-Chip (Starter), Oberring, Ratchet-Kern und Bit-Anschluss. Sie werden nie verändert.
- 🎨 **Designteile** werden generiert: Gewichtsring, Basis mit Zinken und Bit-Spitze. Ihr Innenbereich wird aus dem Kit übernommen, damit alles passt. Der Außenbereich ist frei gestaltbar, inklusive Löchern.

## Kit einrichten (einmalig)
Die STL-Dateien des Kits (z. B. „Iron Forest 4-80 High Needle“ von VinCoda) nach `reference/` kopieren und dann ausführen:

```bash
npm run kit:extract
```

Das Skript zerlegt die Farbplatten in Einzelteile nach `public/kits/iron-forest/`. `reference/` und `public/kits/` sind per gitignore ausgeschlossen. Die Kit-Dateien sind nur für den privaten Gebrauch gedacht.

## Entwicklung
```bash
npm install
npm run dev
npm test
```

- `src/kits/ironForest.js`: Teile, Rollen, Aufbaupositionen und Schnittstellenzonen
- `src/geometry/engine.js`: CSG-Erzeugung der Designteile und Kollisionsprüfung
- `src/workers/geometry.worker.js`: Berechnung im Hintergrund
- `scripts/`: Werkzeuge zum Zerlegen, Vermessen und Positionieren der Kit-Teile
- `dev/inspect.html`: Inspektor für einzelne Kit-Körper

## Offene Punkte
Die Aufbaupositionen (`z`, `rot`, `flip` in der Kit-Datei) wurden rechnerisch per Kollisionsprüfung bestimmt. Die Lage der Innenteile des Lock-Chips (Drehrichtungs-Einsatz, Clip) ist geschätzt. Sie wirkt sich nur auf die Vorschau aus, nicht auf die gedruckten Teile.
