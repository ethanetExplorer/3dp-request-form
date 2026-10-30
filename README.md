# 3D Print Request Studio

A browser-based 3D printing request form and quote estimator. Customers can preview 3D models, configure print settings and materials, and review estimated costs. The included admin console lets an operator customize the form, materials, presets, pricing, and theme.

> **Demo only:** This project has no server-side authentication or order submission. The admin password is checked in the browser, and submitting the form only displays a locally generated confirmation; it does not send or save an order. The default admin password is `admin123`. Do not deploy this app with real customer data or treat its estimates as production quotes.

## Features

- Interactive 3D model preview with file uploads for STL, STEP, and STP files
- Included sample models, including procedural STL examples and a STEP sample
- Multiple print jobs, model quantities, and configurable nozzle, layer height, infill, walls, and supports
- Material selection and instant estimates for filament use, print time, and price
- Admin console for managing materials, print presets, pricing, business details, and appearance
- Responsive customer form with validation and an order-summary confirmation

The estimator uses mesh measurements and configurable heuristics; it is not a full slicing engine and does not generate G-code.

## Requirements

- Node.js 20.19+ or 22.12+
- npm

## Getting started

```bash
npm install
npm run dev
```

Open the local URL printed by Vite (by default, `http://localhost:5174`).

## Available scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Type-check the project and create a production build in `dist/` |
| `npm run preview` | Serve the production build locally |

## Model files

STL files are parsed in the browser. STEP/STP files are parsed with the included OpenCASCADE WebAssembly module, served from `public/`. Keep `public/occt-import-js.js` and `public/occt-import-js.wasm` together when deploying; the app expects these assets at the site root.

## Tech stack

React 19, TypeScript, Vite, Tailwind CSS 4, and Three.js.
