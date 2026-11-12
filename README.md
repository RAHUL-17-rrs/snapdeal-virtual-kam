# Snapdeal Virtual KAM: a voice agent that owns a seller's sales problem

**Live demo:** https://snapdeal-virtual-kam-bice.vercel.app (use Chrome or Edge and allow the microphone)

"Priya" is a voice-first AI Key Account Manager. She doesn't wait for questions. She spots a seller whose numbers are falling and calls them. She works out the cause from data, asks only what the data can't tell her, and **makes fixes on the account once the seller agrees**. She also logs the seller's own tasks, forecasts the recovery, books a follow-up, and hands payment or policy issues to a human.

## Features
- **Portfolio priority queue:** sellers ranked by revenue at risk, so the agent decides who to call.
- **Ownership loop:** Detect, Diagnose, Prioritise, Act (only with consent), Commit, Forecast, Follow up, Escalate.
- **Four sellers with different root causes:** stock-outs, late dispatch, a lost Buy Box and a seasonal dip. The same agent works out each one.
- **Analytics:** a sales bridge splitting the drop by cause, lost revenue per product, a health score, and a live timeline of every step the agent takes. The diagnosis and fixes appear as Priya explains them.
- **Voice:** Gnani Vachana voice (Shivani), push-to-talk with Speak and Interrupt buttons, and Hinglish support.
- **Auto demo:** a scripted seller, voiced by Gnani and transcribed by Gnani speech-to-text, talks to the live agent.

## Stack
OpenAI `gpt-4.1-mini` with function calling (Claude also supported) · Gnani Vachana TTS and Prisma STT · Browser Web Speech API · Node.js · Vercel

## Run locally
```bash
npm install
cp .env.example .env   # add OPENAI_API_KEY and GNANI_API_KEY
npm start              # http://localhost:3000
```
With no keys, it runs an offline scripted demo for the first seller with the browser voice.

## Files
| File | What it is |
|---|---|
| `server.mjs` | Agent loop, 16 tools, prompts, guardrails, TTS/STT proxy, HTTP handler (local server and Vercel) |
| `seller-data.mjs` | Mock seller data and deterministic analytics (diagnosis, sales bridge, opportunity sizing, forecast) |
| `public/index.html` | Voice UI, dashboard and auto-demo player |
| `SUBMISSION_NOTE.md` | Note on the AI models and voice technology |
| `DEMO_SCRIPT.md` | Demo script, recording guide and test plan |
| `PLAN.md` | Design of the ownership loop |

Mock data only. All assumptions beyond the assignment's sample metrics are labelled `ASSUMPTION` in `seller-data.mjs`.
