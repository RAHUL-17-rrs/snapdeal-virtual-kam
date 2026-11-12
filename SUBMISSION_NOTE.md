# Mini AI Virtual KAM: AI models and voice technology

**Live demo:** https://snapdeal-virtual-kam-bice.vercel.app (open in Chrome or Edge)

## What it is
"Priya" is a voice agent that acts as a seller's Key Account Manager (KAM). She doesn't wait for questions. She spots a seller whose numbers are falling, calls them, works out the cause from data and asks only what the data can't tell her. She then **makes fixes on the account once the seller says yes**, logs the seller's own tasks, forecasts the recovery, books a follow-up and passes payment or legal issues to a human.

## Two ways to try it
1. **Speak to Priya yourself:** open a seller, click **Call seller now**, then press **Speak** (or the space bar) and talk using your own microphone. Press **Interrupt** to cut in while she speaks, and **End call** to get the summary. Use Chrome or Edge and allow mic access.
2. **Play auto demo:** one click runs a complete call with no microphone needed. A demo seller voice (Gnani, "Avinash") speaks scripted lines, Gnani speech-to-text transcribes them, and **Priya answers live**. On-screen captions explain what each step shows.

## Models and voice stack
| Layer | Technology | Why |
|---|---|---|
| Brain (LLM) | **OpenAI `gpt-4.1-mini`** with function calling (16 tools). Claude is also supported and is used when an Anthropic key is set | Fast, reliable tool use for real-time voice |
| Text-to-speech | **Gnani Vachana TTS**, model `timbre-v3.0`, voice **Shivani**, Indian English, 0.9× speed | A natural Indian voice that suits Indian sellers. One request per reply, so the voice stays consistent |
| Speech-to-text (live mic) | Browser **Web Speech API** (`en-IN`), push-to-talk | Low latency and no setup; handles Indian English and Hinglish |
| Speech-to-text (auto demo) | **Gnani Prisma `prisma-v3.0`** | The seller is voiced by a second Gnani voice (Avinash) and transcribed by Gnani, so the demo is a real speech-in, speech-out loop |
| Backend | Node.js, deployed on **Vercel** | Each turn is stateless: the browser holds the call state |

## How a turn works
1. **Detect.** Monitoring rules flag the account (for example, sales down more than 20% or cancellations above 10%), and Priya calls the seller.
2. **Diagnose.** Calculated in code, not by the LLM: a sales bridge splits the drop by cause (stock-outs, cancellations, lost Buy Box, seasonality, visibility). The LLM only explains the numbers, so it can't invent them.
3. **Prioritise.** Fixes are ranked by rupees recoverable per month and how easy they are.
4. **Clarify.** One question at a time ("supplier or cash flow?"), and the plan changes with the answer.
5. **Act.** `execute_action` makes changes on the account: pause out-of-stock listings, set stock alerts, enrol in a sale, match price, add a pickup slot. It is **blocked unless the seller said yes**.
6. **Commit, forecast, follow up.** The seller's tasks are logged with due dates. A forecast and a follow-up with a success metric are always recorded, and code enforces this.
7. **Escalate.** Payment, legal and suspension issues always go to a human, even if the LLM forgets. This is also enforced in code.

## Assumptions
The five metrics in the brief are used as given. Everything else is mock data, labelled `ASSUMPTION` in the code: 4 sellers with different root causes, stock levels, cancellation reasons, pricing and Buy Box data, and rating drivers.
