# MuseUI

MuseUI is a browser-only AI interface and image design generator. It helps you create UI mockups, social images, covers, infographics, stickers, logos, and other visual drafts from prompts and reference images.

The app is a static Vite + React SPA. It has no backend, no authentication, and no server database. Users provide their own AI API keys in the browser settings, and those keys are stored locally in the browser.

## Features

- Text-to-image UI mockup generation
- Multi-provider API configuration for Gemini and OpenAI-compatible endpoints
- Canvas workspace with generated artboards
- Reference image, color, and layout inputs
- Skill modes for covers, infographics, comics, slide decks, logos, stickers, and more
- Local IndexedDB project and history storage
- Bilingual UI: English and Chinese

## Privacy Model

- API keys are stored in browser localStorage.
- Projects and generated history are stored locally in IndexedDB.
- The app does not ship with any backend service.
- No API key is required at build time.

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

### Configure AI APIs

Open the app and use the API settings button in the top-right corner.

Recommended official endpoints:

- Gemini: leave Base URL empty for the official API, or use `https://generativelanguage.googleapis.com`
- OpenAI text: `https://api.openai.com/v1/chat/completions`
- OpenAI image: `https://api.openai.com/v1/images/generations`

You can also copy `.env.example` to `.env` if you want to keep local notes for development, but the production app is designed to be configured through the browser UI.

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

MIT
