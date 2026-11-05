<div align="center">

# 🧩 Byte Frame Desk

**Small bytes, a clear structure.**

![Vue](https://img.shields.io/badge/Vue-3-42b883?style=for-the-badge&logo=vuedotjs&logoColor=ffffff)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178c6?style=for-the-badge&logo=typescript&logoColor=ffffff)
![Vite](https://img.shields.io/badge/Vite-8-646cff?style=for-the-badge&logo=vite&logoColor=ffffff)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06b6d4?style=for-the-badge&logo=tailwindcss&logoColor=ffffff)
![License](https://img.shields.io/badge/License-MIT-777777?style=for-the-badge)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

_Vue binary frame builder with a custom HEX model modifier, explicit endian fields, checked local-file reads, and BIN/TXT/JSON exports._

</div>

---

## ✨ Highlights

- **A clear wire layout:** Build a fictional D3 91 frame with type, sequence, length, payload, and XOR.
- **Custom Vue modifier:** Apply v-model.hex normalization while keeping invalid characters visible.
- **Explicit byte order:** Encode two-byte sequence/length fields with DataView.
- **A real binary view:** Inspect offsets, field names, decimal bytes, and bit patterns.
- **Checked local imports:** Validate file size, sync, exact length, and checksum before replacing fields.
- **Latest read wins:** Watcher cleanup and workspace revisions prevent obsolete file promises from overwriting current work.
- **Exact artifacts:** Download real BIN bytes, an annotated HEX/ASCII TXT, or complete BF JSON.

## 🧱 Project Structure

```text
public/
├── favicon.svg                         # Original project emblem
├── og.svg                              # Original social artwork
├── sample-frame.bin                    # Matching checked binary sample
├── font-licenses.txt                   # Font copyright and OFL licenses
└── sample-workspace.json               # Complete importable workspace
src/
├── components/
│   ├── HexPayload.vue
│   ├── BinaryImport.vue
│   ├── DataTools.vue                   # Workspace actions and restoration
│   ├── AppDialog.vue                   # Native Teleport modal and focus lifecycle
│   ├── AppIcon.vue                     # Original inline SVG icons
│   ├── DataExchange.vue                # Validated workspace import dialog
│   └── StudioHeader.vue                # Workspace branding and actions
├── domain/
│   ├── frame.ts                       # Pure validation, calculations, and exports
│   ├── shared.ts                       # Text, number, and provenance helpers
│   └── validation.ts                   # Strict unknown-input guards
├── services/
│   ├── draft.ts                        # Validated device-local persistence
│   └── files.ts                        # Downloads and deterministic identities
├── App.vue                             # Workspace and editor state
├── base.css                            # Tailwind, local fonts, and control defaults
├── style.css                           # Project theme tokens
└── main.ts                             # Vue application entry
tests/
├── *.test.ts                           # Native domain/composable/export tests
└── e2e/                                # Production browser workflows
```

Root files include Vite, TypeScript, Playwright, and Prettier configuration, an npm lockfile, the MIT license, and explicit `vercel.json`. The official scaffold’s default artwork and empty `src/assets` directory are removed. The shared generic development container stays unchanged.

## 🛠 Tech Stack

| Tool                          | Role                                                                        |
| ----------------------------- | --------------------------------------------------------------------------- |
| Vue 3.5                       | Typed SFCs, component contracts, reactive state, and lifecycle management   |
| TypeScript 6                  | Checked domain structures and component/composable inputs                   |
| Vite 8                        | Development server and static production bundles                            |
| Tailwind CSS 4                | Vite plugin, theme tokens, template utilities, and responsive/state styling |
| DM Sans + Bricolage Grotesque | Locally bundled Latin variable fonts                                        |
| Node.js 24+                   | Local CLI tools and native TypeScript tests                                 |
| Playwright                    | Chromium workflows against the production build                             |

The app requires no account, backend, remote data source, or extra UI library. All dependencies and CLI tools are installed locally inside this independent project.

## 🎨 Tailwind Styling

The Vite config enables `@tailwindcss/vite`. `base.css` imports Tailwind, defines font tokens, and uses `@apply` for small native control defaults. `style.css` defines project colors through `@theme`. Actual application templates use Tailwind utilities for grid/flex layouts, spacing, typography, borders, colors, responsive behavior, focus, and visible states.

`data-ui`, `data-project`, and domain identity attributes are explicit browser hooks. There are no orphan semantic styling classes. Reserved preview/list containers and internal overflow keep neighboring panels stable when modes, selected details, or results change. All application layout and visible-state classes use Tailwind utilities. Reduced-motion preferences shorten transitions.

Two Fontsource variable font files are bundled as hashed local assets. Their copyright and OFL text are in [font-licenses.txt](./public/font-licenses.txt). Favicon/social artwork and SVG interface icons are original project assets.

## 📦 Included Demo Data

The original **A small hello packet** uses little endian, type 16, sequence 4660 (0x1234), and payload 48656C6C6F21 (Hello!). Its 14 bytes are D3 91 10 34 12 06 00 48 65 6C 6C 6F 21 53. The public sample BIN contains exactly those bytes.

The matching [sample-frame.bin](./public/sample-frame.bin) contains the actual default wire bytes.

The complete [sample-workspace.json](./public/sample-workspace.json) includes valid provenance and is served as a public static file. The application imports this same JSON sample for first use and confirmed restoration.

## 🚀 Local Development

Use Node.js **24 or later**:

```bash
npm ci
npm run dev
```

Vite prints the local URL and binds to `0.0.0.0` for the shared container. Inspect a production bundle with:

```bash
npm run build
npm run preview
```

## 🧩 Vue Implementation

HexPayload uses [defineModel modifiers and a setter transform](https://vuejs.org/guide/components/v-model.html#handling-v-model-modifiers). The .hex modifier removes whitespace and uppercases text. The native input handler also reflects normalized text immediately when normalization returns the existing model value. Odd pairs and invalid non-whitespace characters remain visible until canonical validation rejects them.

A computed Uint8Array contains the exact frame. DataView writes unsigned two-byte fields in the saved mode. The decoder respects a supplied typed-array byteOffset/byteLength rather than reading unrelated backing-buffer bytes. BIN downloads copy actual bytes into an ArrayBuffer Blob; JSON contains only ordinary editable inputs.

BinaryImport keeps native File handles in shallowRef and owns an async watcher. onWatcherCleanup invalidates obsolete reads before their promises settle. Size is checked before arrayBuffer allocation. A captured workspace revision also travels with the decoded result; the parent rejects it after newer applied fields/imports/restoration. Reads cannot be aborted internally, but stale results cannot replace current state.

A file is interpreted using the saved mode at selection time, then fully validated before type/sequence/payload replacement. The workspace name/mode remain. Input values apply together; pending fields never alter current bytes or exports. No serial-port, device, socket, or network connection is opened.

The shared modal uses `Teleport`, a unique `useId` heading, and a post-flush watcher to synchronize Vue state with native `showModal`/`close`. Escape and focus return remain native. A queued close event cannot reset a modal that has already reopened.

## 💾 Local Drafts & Data Exchange

Validated workspace data is stored under `vue-byte-frame-desk:v1`. First-use and restored data are validated before use. Invalid saved JSON/schema falls back to the sample without immediately overwriting the damaged entry. A later valid change writes a new draft. Blocked storage leaves editing and downloads usable and shows a status message.

Import parses a detached candidate and replaces the workspace only after complete validation. Failure keeps current work and the saved draft intact. Workspace JSON is limited to **120,000 characters**. Known fields are rebuilt in canonical order; unknown fields and supplied provenance are not trusted or carried into the editable domain. Project markers are recomputed from validated data. Workspace name, saved endian mode, type, sequence, and canonical payload are persisted. Pending fields, byte selection, Files, async read status, revisions, and dialogs are transient.

| Field         | Accepted values                               |
| ------------- | --------------------------------------------- |
| version, name | 1; nonblank single-line title up to 80        |
| endian        | Actual string little or big                   |
| type          | Whole unsigned byte 0–255                     |
| sequence      | Whole unsigned 16-bit value 0–65535           |
| payload       | 0–128 complete HEX pairs, canonical uppercase |

JSON payloads are contiguous HEX; only the UI modifier accepts/removes whitespace. Invalid primitive types, odd pairs, non-HEX characters, excessive payloads, fractional/out-of-range integers, and unsupported versions reject candidates.

Wire offsets: sync D3 91 at 0–1; type at 2; sequence at 3–4; payload length at 5–6; payload starts at 7; checksum is last. Total size is 8 + payload length, bounded 8–136. XOR-8 covers type through payload, excluding sync/checksum. Decoder requires exact size and matching XOR.

BIN contains exactly the fictional wire frame with no added metadata bytes; its filename carries BF identity. TXT contains full name/marker, applied mode/fields, XOR coverage, hexadecimal offsets, complete HEX rows, and printable ASCII with other bytes shown as dots. JSON retains editable numeric fields, payload, mode, and provenance. The complete public sample-frame.bin can be imported after saving little-endian mode.

Download Blob URLs are revoked after download. Sample restoration uses a native confirmation dialog.

## ◈ Project Markers

- `BF` appears in the wordmark, project metadata, and workspace identity; original favicon/social artwork use a matching emblem.
- `BF-XXXXXXXX` is a deterministic 32-bit content stamp calculated from the canonical validated workspace, excluding supplied provenance.
- JSON provenance includes the project slug, `CodeSculptor`, and the marker. Downloaded artifacts carry the appropriate identity in filenames and/or metadata/content.
- Markers help identify configurations and artifacts; they are not cryptographic signatures or tamper-proof authorship claims.
- Author metadata and the MIT license retain CodeSculptor attribution.

## 🧭 Extension Notes & Nuances

- The protocol is invented for byte-layout exploration, not a device/manufacturer standard or transmission client.
- XOR-8 is a simple error check, not authentication or a cryptographic integrity guarantee. Byte permutations can preserve it.
- The wire contains no endian flag. Pick/apply the correct saved mode before import. Empty payloads have zero length in both modes, so the wrong mode can pass checks while interpreting sequence differently.
- JSON HEX is strict and contiguous; the UI modifier strips whitespace only, preserving invalid characters for visible correction.
- Applying fields or replacing the workspace invalidates pending file results. A later selected file supersedes earlier reads.
- Native file contents stay local and are never stored as File objects. Only decoded editable fields persist.
- Selected byte, read status, pending fields, native files, and dialogs are transient.
- Extend offsets, size bounds, checksum coverage, decoder, sample BIN, and all reports together for protocol changes.

The application and documentation are English. At 320 px panels stack, while larger screens use the shared grid. Scrollable data regions, named native controls, visible focus styles, and a single main landmark remain available across layouts.

## ✅ Build & Checks

```bash
npm run build
npm run format:check
npm test
npx playwright install chromium
npm run test:e2e
```

`build` runs `vue-tsc` before Vite. Native tests use Node’s built-in runner. Playwright starts the current production bundle with the local preview command and does not reuse another server. Build before browser tests so they inspect current output. `npm run format` formats maintained source; dependencies, generated output, lockfiles, and browser artifacts are excluded.

Six native tests verify exact sample bytes/XOR, both endian modes and all 129 payload lengths, nonzero array offsets, corrupt/truncated/oversized frames, strict HEX/primitives, empty-payload endian ambiguity, annotated TXT, and maximum JSON/binary size. Four browser workflows cover actual modifier text, numeric failures, endian persistence, byte inspection, exact BIN/public sample/TXT downloads, checked file imports, corrupted/oversized reads, and stale-read protection.

Shared browser workflows check valid/failed imports, persistence after reload, provenance downloads, blocked/corrupt storage, confirmed sample restoration, native modal reopening/Escape/focus, real Tailwind grid behavior, named visible controls, and overflow at 320–1440 px. A separate maximum-content case downloads and re-imports the complete escaped JSON workspace at 320 px. These are local production checks, not a deployed Vercel smoke test.

## ▲ Vercel Deployment

1. Import the repository and select this project folder as the Root Directory when deploying from the shared workspace.
2. Use the committed config: `npm ci`, `npm run build`, and output folder `dist`.
3. Check the root page, public sample/artwork, and main editor after deployment.

The explicit `vercel.json` rewrites only `/` to `/index.html` and permanently redirects `/index.html` to `/`. There are no client routes requiring a catch-all rewrite. Declared routes preserve missing-resource behavior. HTML and unhashed public files revalidate; Vite’s hashed JS/CSS/font assets receive one-year immutable caching. All responses include `X-Content-Type-Options: nosniff` and `Referrer-Policy: strict-origin-when-cross-origin`. The dev command accepts Vercel’s `$PORT` with `--strictPort`.

Used fields, route compilation, and generated asset/cache behavior are checked locally against the [official Vercel configuration schema](https://openapi.vercel.sh/vercel.json). Vite preview does not emulate deployment headers. SVG social artwork is included as an editable source; platforms requiring raster cards need a rendered image and an absolute deployed image URL.

## 📄 License

[MIT](./LICENSE) · Copyright (c) 2026 **CodeSculptor**. Bundled fonts retain separate OFL licenses.
