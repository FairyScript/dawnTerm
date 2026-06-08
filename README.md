# dawnTerm

A cross-platform desktop terminal application built with Bun, React 19, and Electrobun.

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime / Bundler | Bun |
| Desktop Framework | Electrobun |
| UI Framework | React 19 |
| Styling | Tailwind CSS 4 |
| Panel Layout | dockview-react |
| Language | TypeScript |

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (latest)

### Install Dependencies

```bash
bun install
```

### Development

```bash
bun dev
```

This runs the Electrobun dev process and Bun dev server concurrently.

## Project Structure

```
src/
  bun/              # Main process (Electrobun window, RPC handlers)
  shared/           # Shared type definitions
  mainview/         # Renderer (React app)
    components/     # UI components (TitleBar, panels, etc.)
```

## License

[MIT](LICENSE)
