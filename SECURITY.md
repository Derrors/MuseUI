# Security Policy

## Reporting a Vulnerability

Please report security issues privately to the project maintainers. Do not open a public issue containing credentials, exploit details, or private user data.

## Credential Handling

MuseUI is a client-side app. Users configure their own AI provider keys in the browser. Those keys are stored locally by the browser and are not sent to any MuseUI backend.

Never commit:

- `.env` files
- API keys
- Database URLs
- Webhook URLs
- Access tokens
- Cloud storage secrets

If a credential is accidentally committed, revoke and rotate it immediately. Removing it from the latest commit is not enough if it has entered Git history.
