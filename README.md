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

## Teilen
„Teilen“ erzeugt ein Vorschaubild und einen Link, der das komplette Design komprimiert im URL-Hash (`#bey=…`) enthält. Öffnet jemand den Link, wird das Design nach Rückfrage geladen. WhatsApp und E-Mail verschicken den Link. Auf dem Handy schickt „Teilen …“ Bild und Projektdatei direkt über das System-Teilen-Menü.

## CSS-Konventionen
- Die Stylesheets liegen in nummerierten Ebenen unter `src/css/` (`1-settings` bis `6-utilities`). Sie werden in `src/main.js` per `import.meta.glob` in dieser Reihenfolge geladen.
- Farben: Die Palette steht in `1-settings/colors.css` als `--color-<farbe>-<stufe>`, z. B. `--color-indigo-500`. Hell/Dunkel wird über die Theme-Variablen `--theme-*` in `1-settings/theme.css` umgeschaltet. Außerhalb der Palette stehen keine festen Farbwerte, auch der 3D-Viewer liest seine Farben aus diesen Variablen.
- Abstände, Radien, Schriftgrößen und Schatten stehen in `1-settings/tokens.css`.
- Klassen folgen BEM mit `b_`-Präfix, z. B. `b_stepper__step--active`. Elemente, die JavaScript anspricht, tragen zusätzlich eine `bJS_`-Klasse, z. B. `bJS_share-dialog`.

## Icons
Die Icons stammen aus der Sammlung [Wave Oval Interface Icons](https://www.svgrepo.com/collection/wave-oval-interface-icons/) (CC0) und liegen in `src/assets/icons/`.

## Passwortschutz (GitHub Pages)
Ist in GitHub unter Settings → Secrets and variables → Actions das Repository-Secret `APP_PASSWORD` gesetzt, baut die Action eine Passwortabfrage ein. Das Passwort selbst landet nicht im Build, nur ein PBKDF2-Hash. Der Browser merkt sich die Freigabe, bis sich das Passwort ändert. Lokal (`npm run dev`) gibt es keine Abfrage.

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
