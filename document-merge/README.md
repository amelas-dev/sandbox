# Investor Document Studio

Investor Document Studio is a single-page React + TypeScript application for crafting beautiful investor-ready documents powered by merge tags. Import CSV/JSON/XLSX datasets, drag fields directly into the editor, preview any record inline, and export personalized PDFs, DOCX files, or HTML bundles.

## Features

- 📥 **Flexible import** via CSV, JSON array, or Excel (XLSX) with header normalization and preview.
- 🧩 **Drag-and-drop merge tags** powered by `@dnd-kit`, plus double-click quick insert.
- ✍️ **Tiptap-based designer** with typography, tables, images, highlights, and custom merge tag pills.
- 🧭 **Layout controls** for page size, orientation, margins, zoom, and grid guides.
- 👀 **Record preview** selector that updates all sample values inline.
- 🧾 **Generation workflow** for PDF/DOCX/HTML exports with automatic ZIP packaging when multiple records are generated.
- 💾 **Local persistence** with autosave (configurable via preferences) backed by `localStorage`.
- 🧪 **Unit tests** for dataset parsing, merge substitution, and filename templating (run with `npm run test`).

## Getting Started

1. **Install dependencies**

   ```bash
   npm install
   # or
   bun install
   ```

2. **Start the Vite dev server**

   ```bash
   npm run dev
   ```

   The app runs on [http://localhost:5173](http://localhost:5173).

3. **Run tests**

   ```bash
   npm run test
   ```

## Project Structure

- `src/App.tsx` – Application shell, drag-and-drop wiring, autosave status bar.
- `src/components/` – UI panels, editor shell, dialogs, and shadcn-inspired primitives.
- `src/editor/` – Custom Tiptap merge tag node and React view.
- `src/lib/` – Dataset parsing, merge helpers, export utilities, and shared types.
- `src/store/` – Zustand store with persistence and template defaults.
- `tests/` – Vitest suites covering parsing logic, merge helpers, and regression cases.
- `docs/` – Compliance artifacts including the full `AUDIT.md` prepared for this release.

## Notes

- PDF/DOCX/HTML export relies on dynamic imports (`html-to-image`, `jspdf`, `docx`, `JSZip`) that load on demand.
- XLSX support (`xlsx` package) is also lazy-loaded, keeping the initial bundle lean.
- The app stores templates and preferences in `localStorage`; toggle the “ephemeral dataset” preference to avoid retaining imported data.

Enjoy designing investor-ready documents in minutes! ✨

## Environment setup (recommended)

These steps make it easy to get a reproducible environment on macOS (zsh).

- Recommended Node version: 18.x (the repo's tooling works with Node 18+). A `.nvmrc` file is provided.
- The project supports both npm and Bun for dependency installation. Tests run through Vitest using the npm scripts defined in `package.json`.

1. Install Node (recommended via nvm) and switch to the project's Node version:

```bash
# install nvm if you don't have it: https://github.com/nvm-sh/nvm#install--update-script
nvm install 18
nvm use 18
```

2. Use the included setup script to install dependencies (it prefers Bun for installation speed if available, but tests run via npm/vitest):

```bash
chmod +x scripts/setup.sh
./scripts/setup.sh
```

The script will run either `bun install` or `npm install` depending on what's available. If you'd rather run the package manager directly:

```bash
# with npm
npm install

# with bun
bun install
```

3. Start the dev server:

```bash
npm run dev
```

The app will be available at http://localhost:5173

4. Run tests

```bash
npm run test
```

Notes

- Tests execute in a jsdom environment through Vitest. Coverage reports are emitted to `coverage/` when running locally.
- If you see TypeScript errors from `tsc`, make sure devDependencies were installed and you're using Node 18+.

