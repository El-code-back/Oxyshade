# OxyShade MVP

OxyShade MVP is a lightweight three-language website for explaining the prototype and collecting pilot or partnership requests.

## Why this stack

The project uses plain HTML, CSS and JavaScript with a small Node.js server. This keeps the MVP fast, easy to host and easy to edit without a build pipeline. Later it can evolve into Next.js, Nuxt or a CMS-backed site if the team adds a model catalog, sensor dashboard, installation map, CRM integration or a client account area.

## Run locally

```bash
npm start
```

Open `http://localhost:3000`.

On Windows PowerShell, if script execution policy blocks `npm`, use:

```bash
npm.cmd start
```

or:

```bash
node server.js
```

Submitted forms are saved to `data/leads.jsonl` locally. In production, the same form can also send each request to Telegram.

## Edit content

All website copy is in `public/content.js`.

To change a text, edit the matching language object:

- `ru` for Russian
- `kg` for Kyrgyz
- `en` for English

To add a language, add a new top-level object in `public/content.js`, add its code to `LANGS` in `public/app.js`, and make sure every key has a translation.

## Forms and Telegram notifications

The site posts form requests to `POST /api/lead`. The handler validates required fields, checks a hidden honeypot field, saves the request locally when possible and sends it to Telegram when these environment variables are configured:

```bash
TELEGRAM_BOT_TOKEN=123456:bot-token-from-botfather
TELEGRAM_CHAT_ID=123456789
```

Optional:

```bash
TELEGRAM_MESSAGE_THREAD_ID=1
SAVE_LEADS_TO_FILE=false
```

Setup:

1. Create a bot in Telegram through `@BotFather` and copy the token.
2. Send any message to the bot from the founder account, or add the bot to a private team group.
3. Open `https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/getUpdates` and copy the `chat.id`.
4. Add `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` in Vercel Project Settings → Environment Variables.
5. Redeploy the project.

Keep server-side validation even if a database or CRM is connected later.

## Analytics

The frontend emits `oxyshade:analytics` browser events for language changes, CTA clicks, navigation clicks and lead submissions. Set `window.OXY_ANALYTICS_ID` in `public/index.html` or replace the `track` function in `public/app.js` with Google Analytics, Plausible or another analytics provider.

## Communication guardrails

Do not claim that OxyShade cleans toxic air, is a certified air purifier, or absorbs CO2 better than trees. Publish effectiveness claims only after the team has measured prototype data and a documented method.
