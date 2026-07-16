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

Submitted forms are saved to `data/leads.jsonl`.

## Edit content

All website copy is in `public/content.js`.

To change a text, edit the matching language object:

- `ru` for Russian
- `kg` for Kyrgyz
- `en` for English

To add a language, add a new top-level object in `public/content.js`, add its code to `LANGS` in `public/app.js`, and make sure every key has a translation.

## Forms and notifications

The server handles `POST /api/lead`, validates required fields, checks a hidden honeypot field and stores each request as JSONL. For production, replace or extend the save step in `server.js` with one of these:

- send an email through an email API
- forward the lead to a CRM
- post the request to a private webhook
- save the lead in a database

Keep server-side validation even if a CRM or email service is connected.

## Analytics

The frontend emits `oxyshade:analytics` browser events for language changes, CTA clicks, navigation clicks and lead submissions. Set `window.OXY_ANALYTICS_ID` in `public/index.html` or replace the `track` function in `public/app.js` with Google Analytics, Plausible or another analytics provider.

## Communication guardrails

Do not claim that OxyShade cleans toxic air, is a certified air purifier, or absorbs CO2 better than trees. Publish effectiveness claims only after the team has measured prototype data and a documented method.
