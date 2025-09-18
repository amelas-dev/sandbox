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
- 🧪 **Unit tests** for dataset parsing, merge substitution, and filename templating (run with `bun test`).

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
   bun test
   ```

## Project Structure

- `src/App.tsx` – Application shell, drag-and-drop wiring, autosave status bar.
- `src/components/` – UI panels, editor shell, dialogs, and shadcn-inspired primitives.
- `src/editor/` – Custom Tiptap merge tag node and React view.
- `src/lib/` – Dataset parsing, merge helpers, export utilities, and shared types.
- `src/store/` – Zustand store with persistence and template defaults.
- `tests/` – Bun unit tests covering parsing and merge helpers.

## Notes

- PDF/DOCX/HTML export relies on dynamic imports (`html-to-image`, `jspdf`, `docx`, `JSZip`) that load on demand.
- XLSX support (`xlsx` package) is also lazy-loaded, keeping the initial bundle lean.
- The app stores templates and preferences in `localStorage`; toggle the “ephemeral dataset” preference to avoid retaining imported data.

Enjoy designing investor-ready documents in minutes! ✨
