# Contributing

Thanks for your interest in MuseUI.

## Development

```bash
npm install
npm run dev
```

Before opening a pull request, please run:

```bash
npm run build
npx vitest run
```

## Guidelines

- Keep the app browser-only unless a proposal has been discussed first.
- Do not commit API keys, credentials, generated secrets, local `.env` files, or private logs.
- Prefer focused pull requests with a clear description and screenshots for UI changes.
- Keep user-facing copy bilingual when changing shared UI surfaces.

## Reporting Bugs

Please include:

- Steps to reproduce
- Expected behavior
- Actual behavior
- Browser and OS
- Console errors, if any
