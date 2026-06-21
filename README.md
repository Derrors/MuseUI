# MuseUI

[简体中文](./README.zh-CN.md)

MuseUI is a browser-only AI interface and image design generator. It helps you create UI mockups, social images, covers, infographics, stickers, logos, and other visual drafts from prompts and reference images.

The app is a static Vite + React SPA. It has no backend, no authentication, and no server database. Users provide their own AI API keys in the browser settings, and those keys are stored locally in the browser.

![MuseUI showcase](./docs/show-case.png)

## Features

- Text-to-image UI mockup generation
- OpenAI-compatible API profile configuration
- Canvas workspace with generated artboards
- Reference image, color, and layout inputs
- Skill modes for covers, infographics, comics, slide decks, logos, stickers, and more
- Local IndexedDB project and history storage
- Bilingual UI: English and Chinese

## Non-goals

- MuseUI does not provide hosted AI APIs, bundled API keys, or a backend proxy.
- MuseUI does not upload projects, generated images, or API settings to a MuseUI server.
- MuseUI is not affiliated with, endorsed by, or sponsored by any AI provider or brand referenced in design templates.

## Privacy Model

- API keys are stored in browser localStorage.
- Projects and generated history are stored locally in IndexedDB.
- The app does not ship with any backend service.
- No API key is required at build time.

## Change Log

### 2026-06-21

- Upgraded local persistence with separate IndexedDB stores for image assets, thumbnails, and generation tasks.
- Added generation task records for image creation flows, including prompt, API profile, model metadata, output image ids, and image asset ids.
- Added Docker packaging with an Nginx static runtime and optional `/api-proxy/` forwarding for self-hosted deployments.
- Added a release workflow for tagged builds, web artifacts, and GHCR Docker images.

### 2026-06-20

- Refactored generation logic into focused domain modules for generation config, generated image metadata, skill prompting, canvas artboard transforms, project snapshots, and API profile normalization.
- Reworked API configuration around OpenAI-compatible profiles. Text model presets are limited to `gpt-5.4` and `gpt-5.5`; the image model preset is `gpt-image-2`.
- Improved mobile responsiveness across the main workspace, top controls, API entry points, and API settings panels.
- Removed legacy proxy recommendation content and old compatibility paths that no longer match the current OpenAI-compatible API flow.
- Fixed DEV request monitor clearing and preserved the latest regeneration prompt in generated image history/details.
- Added regression coverage for generation helpers, project config snapshots, and regeneration metadata.

## Getting Started

### Prerequisites

- Node.js 20+
- npm

### Install

```bash
npm install
```

### Run Locally

```bash
npm run dev
```

The development server runs on `http://localhost:3003` by default.

### Docker Deployment

Build and run the static web image:

```bash
docker build -t muse-ui .
docker run --rm -p 3003:80 muse-ui
```

Open `http://localhost:3003`.

MuseUI is still a browser-first app. The Docker image serves the built SPA with Nginx; it does not add a server database or authentication layer.

Optional API proxy for self-hosted environments:

```bash
docker run --rm -p 3003:80 \
  -e ENABLE_API_PROXY=true \
  -e API_PROXY_URL=https://api.openai.com/v1 \
  muse-ui
```

Then configure a MuseUI API profile with Base URL `/api-proxy`. Use this only when you intentionally want the container to forward API requests.

### Configure AI APIs

Open the app and use the API settings button in the top-right corner.

Recommended Base URL:

- OpenAI-compatible root: `https://api.openai.com/v1`

MuseUI appends endpoint paths such as `/chat/completions`, `/images/generations`, and `/models` automatically.

The app is designed to be configured through the browser UI. `.env.example` is intentionally only a local notes file; no API key is required at build time.

## Brand and Template Notice

Some design templates mention third-party brand names or visual systems as style references. These references are descriptive only. MuseUI is not affiliated with those brands, and users are responsible for ensuring that generated outputs comply with applicable trademark, copyright, platform, and usage rules.

See [NOTICE.md](./NOTICE.md) for additional third-party reference notes.

## Scripts

```bash
npm run dev
npm run build
npm run preview
npx vitest run
```

## Security

Do not commit real API keys, database URLs, webhook URLs, or other credentials. See [SECURITY.md](./SECURITY.md) for reporting guidance.

## Contributing

Contributions are welcome. See [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

MIT. See [LICENSE](./LICENSE).
