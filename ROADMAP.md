# Roadmap

## v3, aktuell (0.3.x): Kit-basiert
- Grundlage ist standardmäßig **Wizard Rod**. **Iron Forest** ist lokal als zweite Grundlage verfügbar (Umschalten lokal im Schritt „Fertig“).
- Die 🔒 Schnittstellenteile kommen 1:1 aus dem jeweiligen Kit (`public/kits/<kit>/`).
- 🎨 Generiert werden Gewichtsring, Basis mit Zinken, Bit-Spitze und Löcher.
- Teile lassen sich ein- und ausblenden, ein Klick auf ein Teil öffnet den passenden Schritt, und der Start ist minimal.
- Der Export ist eine ZIP-Datei mit allen Teilen als STL in Druckausrichtung.
- Diese Variante bleibt als Backup erhalten, auch wenn v4 kommt.

## v4, vorgemerkt: generischer BX-Kern
Ein abstraktes Template, das nur die Schnittstellen enthält. Diese werden parametrisch nachgebaut statt aus dem Kit kopiert. Alles andere wird generiert.

- **Maße:** Startwerte aus [docs/BX-Schnittstellen.md](docs/BX-Schnittstellen.md). Gemessen sind die Kit-Werte, die Werte vom Original fehlen noch.
- **Zentrale Maßdatei:** z. B. `src/kits/bxCore.spec.js`. Alle Schnittstellenmaße und Toleranzen stehen an einer Stelle, damit sie sich nach Testdrucken nachjustieren lassen.
- **Ratchet:** frei wählbar (3-60, 4-60, 4-80, 5-70 …), generiert aus Anzahl der Vorsprünge × Höhe.
- **Kit-Auswahl:** In der UI lässt sich zwischen „BX-Kern (generisch)“ und „Iron Forest (Kit)“ umschalten.

### Offen vor dem Start
- Ohne Messschieber stammen die Maße aus Kit-Werten, dazu kommen Testdrucke und Foto-Abgleich mit Lineal.
- Prüfen, ob der gelbe Oberring (`p2-1`, 4 Nasen, 8,1 mm hoch) der eigentliche Ratchet „4-80“ ist. Dann sitzt er unter der Blade, und der Aufbau in `src/kits/ironForest.js` muss korrigiert werden.
- Klären, wo der Starter greift.
- Erster Testdruck: Bit plus Ratchet-Kern, um zu prüfen, ob der Bit einrastet.
