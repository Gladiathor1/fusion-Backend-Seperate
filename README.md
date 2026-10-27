# FusionGPT — Back End

Standalone back end for [FusionGPT](https://github.com/Gladiathor1/fusionGpt-Test), a multi-modal AI chat app. It is split out from the main repo so it can be deployed on its own (e.g. Docker or Vercel) while the React front end is hosted separately.

The server is a Node.js/Express + TypeScript app based on the [chat-with-gpt](https://github.com/cogentapps/chat-with-gpt) server, extended with a LangChain-powered autonomous agent.

## What it does

- **Proxies AI APIs** so API keys stay on the server:
  - OpenAI chat completions (streaming and non-streaming)
  - OpenAI Whisper speech-to-text
  - ElevenLabs text-to-speech and voice list
- **Autonomous agent** (`/chatapi/proxies/autonomous`) — breaks a goal into tasks and executes them with LangChain tools: web search (Serper), image generation, code and summarisation
- **User accounts & sessions** — local login with Passport (SQLite session store) or Auth0
- **Chat sync & sharing** — Yjs-based sync between devices, shareable chat links
- **Live tracking** — Socket.IO connection for usage events
- **Storage** — local SQLite by default, or S3 when `S3_BUCKET` is set; relational data via Knex (SQLite / MySQL / Postgres)

## API overview

| Method | Path | Description |
| --- | --- | --- |
| GET | `/chatapi/health` | Health check |
| GET | `/chatapi/session` | Current session / user |
| POST | `/chatapi/y-sync` | Sync chat data (Yjs) |
| GET | `/chatapi/legacy-sync` | Legacy sync |
| POST | `/chatapi/delete` | Delete a chat |
| POST | `/chatapi/share` | Share a chat |
| GET | `/chatapi/share/:id` | Get a shared chat |
| POST | `/chatapi/proxies/openai/v1/chat/completions` | OpenAI chat proxy |
| POST | `/chatapi/proxies/openal/whisper` | Whisper transcription proxy |
| POST | `/chatapi/proxies/elevenlabs/v1/text-to-speech/:voiceID` | ElevenLabs TTS proxy |
| GET | `/chatapi/proxies/elevenlabs/v1/voices` | ElevenLabs voices |
| POST | `/chatapi/proxies/autonomous` | Run the autonomous agent |

The OpenAI and ElevenLabs routes are only registered when the matching API key is configured.

## Getting started

### Prerequisites

- Node.js 18+
- An OpenAI API key (ElevenLabs and Serper keys are optional)

### Configure

```bash
cp .example.env .env
```

| Variable | Purpose |
| --- | --- |
| `OPENAI_API_KEY` | Chat completions & Whisper |
| `ELEVENLABS_API_KEY` | Text-to-speech |
| `SERPER_API_KEY` | Web-search tool for the agent |
| `PORT` | Server port (default `3001`) |
| `AUTH_SECRET` | Session secret (random if unset) |
| `S3_BUCKET` / `DEFAULT_S3_REGION` | Use S3 instead of local SQLite |
| `RATE_LIMIT_MAX` / `RATE_LIMIT_WINDOW_MS` | API rate limiting |

More options (database, TLS, Auth0, public site URL) can go in `data/config.yaml`; see [`src/config.ts`](src/config.ts).

**TLS:** for local HTTPS run `sh generate-self-signed-certificate.sh` and point the `tls` config at the generated files. Certificates and keys are git-ignored.

**CORS:** the allowed origin is set in `src/index.ts` (default `https://localhost:3000`); change it to match where the front end is hosted.

### Run

```bash
npm install
npm start
```

### Docker

```bash
docker build -t fusiongpt-backend .
docker run -p 3000:3000 --env-file .env fusiongpt-backend
```

`vercel.json` contains the build settings for deploying to Vercel.

## License

MIT. Based on chat-with-gpt by Cogent Apps.
