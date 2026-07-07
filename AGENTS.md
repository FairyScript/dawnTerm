# AGENTS.md — dawnTerm

## Commands

```bash
bun install          # install dependencies
bun dev              # interactive dev: Bun.serve + electrobun (Ctrl+C kills both)
bun dev:check         # agent mode: auto-starts app, exits after 15s
bunx tsc --noEmit     # type-check
```

There are no test, typecheck, or lint scripts in `package.json`. Formatting is handled by `oxfmt`, linting by `oxlint` (run via `bunx`). No test files exist in the project.

## Architecture

```
src/
  bun/index.ts             # Main process — Electrobun BrowserWindow, RPC handlers
  bun/terminal.ts          # PTY manager: Bun.Terminal lifecycle (create/write/resize/close)
  shared/types.ts          # WindowRPCType shared between bun ↔ renderer
  mainview/                # Renderer (React 19 app)
    main.tsx               # React entry point (mounts to #app)
    App.tsx                # Root component — dockview layout + state
    style.css              # Tailwind CSS 4 + --dt-* theme variables
    components/
      TitleBar.tsx         # Custom cross-platform title bar
      DropdownMenu.tsx     # @headlessui/react Menu wrapper
      PanelToggle.tsx      # Edge group visibility toggle buttons
      panels/
        TerminalPanel.tsx  # xterm.js terminal: Fit/WebGL/Unicode11/Ligatures/WebLinks
        SettingsPanel.tsx  # Placeholder panel
        AboutPanel.tsx     # Placeholder panel
    utils/
      LayoutStorage.ts     # dockview layout persistence (debounced, ~/.config/dawnTerm/layout.json)
  scripts/
    dev.ts               # Dev runner: Bun.serve + electrobun spawn with cleanup & --timeout agent mode
```

The main process (`src/bun/`) and renderer (`src/mainview/`) communicate via Electrobun's typed RPC. Window control messages flow from TitleBar → `Electroview.rpc.send.*` → `src/bun/index.ts` RPC handlers.

## Conventions

### All panels use dockview — never traditional modals/overlays

- Dialogs = dynamically created floating panels (`floating: true`)
- Settings = new dockview tab
- Use `api.getPanel(id)` to check for duplicates before creating; if exists, call `.api.setActive()`

### TitleBar drag regions

- Container: `electrobun-webkit-app-region-drag` (allows window drag)
- Interactive children (buttons, menus): `electrobun-webkit-app-region-no-drag` (prevents drag on clicks)
- macOS uses native traffic light buttons via `titleBarStyle: "hiddenInset"`; Windows/Linux render custom minimize/maximize/close buttons

### Theming uses --dt-* CSS variables

All custom component styles reference `--dt-*` variables defined in `style.css` `@theme` block. Never hardcode color values. `dt = dawn-term` prefix.

### React Compiler is active

Configured via `bun-plugin-tailwind` + `babel-plugin-react-compiler` in `bunfig.toml`. All React code must comply with React Compiler rules (no mutate-after-render, follow Rules of React).

### Layout persistence

`LayoutStorage` debounces saves (500ms) to `~/.config/dawnTerm/layout.json`. First launch uses default layout. Save/load failures are silently swallowed — no user-facing errors.

## Configuration files

| File | Purpose |
|---|---|
| `bunfig.toml` | Bun serve config, plugins (tailwind, react-compiler) |
| `electrobun.config.ts` | App name/ID, build settings, copy targets |
| `tsconfig.json` | TypeScript (ESNext target, bundler module resolution) |
| `.oxfmtrc.json` | Formatter config (singleQuote, no semicolons) |

## Platform quirks

- `navigator.platform` detection determines whether to show custom window buttons (non-macOS) or rely on native traffic lights (macOS)
- `fixWindowLayout()` in `src/bun/index.ts` is a workaround for an Electrobun rendering glitch on window creation
