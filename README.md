# Beyblade Creator v0.2

Vue 3 + JavaScript + Vite + Three.js prototype for a browser-only Beyblade X parametric creator.

## Neu in v0.2

- 4-step workflow: **Blade → Ratchet → Bit → Preview**
- Blade is the freely editable, printable top component; the center is treated as a future fixed compatibility zone.
- Ratchet is **selectable but locked** and is not exported.
- Bit has a fixed upper interface concept and an editable lower tip/contact geometry.
- 3D preview assembles all three components and supports an exploded view.
- Blade and Bit can be exported as separate STL files.
- JSON project files and localStorage remain browser-only.
- Responsive desktop/mobile UI and light/dark mode.

## Start

```bash
npm install
npm run dev
```

Then open the URL shown by Vite, normally `http://localhost:5173`.

## Important

The geometry in this version is an architectural prototype. It intentionally does **not** claim to reproduce official Beyblade X dimensions, locking geometry, tolerances or competition legality. Before the exporter is used for real interchangeable parts, the exact dimensions of the relevant interfaces should be measured/verified and implemented as dedicated compatibility geometry.
