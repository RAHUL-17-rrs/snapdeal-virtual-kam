// Snapdeal Virtual KAM: voice front-end + Claude tool-using agent that OWNS the seller's problem.
// Ownership loop: Detect -> Diagnose -> Prioritise -> Clarify -> Act -> Commit -> Forecast -> Follow through -> Escalate
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { getSeller, diagnose, detectAlerts, sizeOpportunities, executeAction, projectRecovery, ACTION_TYPES, revenueBridge, skuTable, healthScore, portfolio, PROGRAMS } from "./seller-data.mjs";
const SCRIPTED_SELLER = "SD-SLR-48213"; // the offline scripted demo only covers Rajesh

const here = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;
const EFFORT = process.env.KAM_EFFORT || "low"; // low effort keeps voice latency down

// Brain: pick the LLM provider from available keys (override with KAM_PROVIDER=claude|openai|offline).
const PROVIDER = process.env.KAM_PROVIDER
  || (process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN ? "claude" : process.env.OPENAI_API_KEY ? "openai" : "offline");
const MODEL = process.env.KAM_MODEL || (PROVIDER === "openai" ? "gpt-4.1-mini" : "claude-opus-5-5");
const LIVE = PROVIDER !== "offline";
const client = PROVIDER === "claude" ? new Anthropic() : null;
const oai = process.env.OPENAI_API_KEY ? new OpenAI() : null;

// Voice: ElevenLabs -> OpenAI TTS -> browser speechSynthesis.
const ELEVEN_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVEN_VOICE = process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM"; // premade "Rachel"; set an Indian-English voice id from your ElevenLabs Voice Library
const ELEVEN_MODEL = process.env.ELEVENLABS_MODEL || "eleven_flash_v2_5"; // lowest-latency model, multilingual (handles Hinglish)
const GNANI_KEY = process.env.GNANI_API_KEY;
const TTS = process.env.KAM_TTS || (GNANI_KEY ? "gnani" : ELEVEN_KEY ? "elevenlabs" : oai ? "openai" : "browser");

// Account memory that persists across calls (in-memory; a CRM in production).
const ACCOUNT = {}; // sellerId -> { lastCall }

// ---------------------------------------------------------------- prompt
const basePrompt = (sl) => `You are "Priya", Snapdeal's AI Virtual Key Account Manager (KAM), on a live VOICE call with a seller.
Seller: ${sl.name}, ${sl.business} (${sl.city}), id ${sl.seller_id}, category ${sl.category}. Address them as "${sl.name.split(" ")[0]} ji".
Every seller has a different root cause (stock, dispatch, pricing or Buy Box, seasonality, promotions). Diagnose from the tools; never assume the same story as another seller. Only offer actions that fit this seller's issues.

You are not a Q&A bot. You OWN this seller's growth outcome. Your loop:
DETECT (alerts) -> DIAGNOSE (data, never guess) -> PRIORITISE (rupee impact, biggest and easiest first) -> CLARIFY (ask only what data can't tell you) -> ACT (execute fixes you can do yourself, with consent) -> COMMIT (log seller-owned tasks) -> FORECAST (show expected recovery) -> FOLLOW THROUGH (book a check-in with a success metric) -> ESCALATE when needed.

RULES
- Numbers come only from tools. Lead with the rupee impact taken from the tools, never an example figure.
- Recommend at most 3 actions, ranked. Tailor them to what the seller tells you (e.g. cash-flow problem -> restock only the top 2 SKUs first; supplier problem -> send a reorder request and suggest a backup supplier).
- Don't just advise: offer to do it. "Shall I pause those listings and switch on stock alerts for you now?" When the seller says yes, call execute_action with seller_consent=true. Never execute without a clear yes.
- Things only the seller can do (restocking, paying a supplier) go to create_action_item with owner "seller" and a due date.
- After agreeing the plan, call project_recovery and tell the seller the expected outcome. Then schedule_follow_up with a measurable success metric.
- Escalate with escalate_to_human for payment or settlement disputes, policy or legal issues, account suspension, or a seller who is upset and asks for a person. Tell the seller a human colleague will call them back within the SLA the tool returns. Never promise the issue itself will be resolved by then. If you tell the seller you are escalating, you must call escalate_to_human in that same turn.
- OFF-SCRIPT QUESTIONS: if the seller asks something outside the current step (pricing, rating, ads, sale rules, fulfilment, payouts, returns, a specific product), answer it in 1-2 sentences using get_pricing_insight, get_rating_insight, get_program_info or get_sku_details. Then steer back to the open item in the plan with one question. Never ignore a seller's question.
- Before end_call, if anything was agreed: call project_recovery with the opportunity ids you acted on, and schedule_follow_up with a measurable success metric. Saying "I will check back" is not enough; it must be booked.
- Wrap up with end_call when the seller is done or the plan is complete, then give a 2-sentence spoken recap.

VOICE STYLE (your text is converted to speech)
- 1 or 2 short sentences, under 40 words per turn. Give one number per turn, not a list of numbers. One question per turn.
- Never confuse percent with rupees: "down thirty-two percent" and "sixty-five thousand rupees" are different facts.
- No markdown, lists, emojis or symbols. Say "rupees", "percent", amounts as "thirty thousand rupees" or "one point seven lakh rupees".
- Soft, polite and patient, like a helpful relationship manager: thank the seller, acknowledge how they feel before giving numbers ("I understand, that is worrying"), never sound blunt or pushy. If the seller uses Hindi or Hinglish, reply in simple Hinglish.
- Speech-to-text can garble words; infer the intent sensibly.`;

const MODE_BRIEF = {
  inbound: `CALL TYPE: INBOUND. The seller called you. You've already greeted them. Call run_sales_diagnosis and get_opportunities before explaining anything.`,
  outbound: `CALL TYPE: OUTBOUND, PROACTIVE. Your monitoring flagged this account and YOU are calling the seller. First call get_account_alerts, run_sales_diagnosis and get_opportunities. Then open: greet them by name, say why you're calling (the alert, in one line with the rupee impact), and ask if they have two minutes to fix it together.`,
  followup: `CALL TYPE: DAY-7 FOLLOW-UP. You promised a check-in. First call get_progress_since_last_call. Open by greeting, then report results honestly: what's done and working (with numbers), and what slipped. Push to unblock what slipped (e.g. offer to chase the supplier, suggest a backup supplier), log any new commitments, and book the next check-in.`,
};

// ---------------------------------------------------------------- tools
const obj = (properties = {}, required = []) => ({ type: "object", properties, required, additionalProperties: false });
const TOOLS = [
  { name: "get_account_alerts", description: "Monitoring alerts that tripped on this account (thresholds on sales, cancellations, stock, rating).", input_schema: obj() },
  { name: "run_sales_diagnosis", description: "Root-cause analysis of the sales drop with quantified issues and the causal chain.", input_schema: obj() },
  { name: "get_opportunities", description: "Fixes ranked by recoverable rupees per month and ease, with owner (kam or seller) and the basis for each estimate.", input_schema: obj() },
  { name: "get_inventory_status", description: "Top-selling SKUs with stock, days out of stock and last-month orders.", input_schema: obj() },
  { name: "get_cancellation_breakdown", description: "This month's cancellation reasons with their share.", input_schema: obj() },
  {
    name: "execute_action",
    description: "Carry out a fix directly on the seller's Snapdeal account. ONLY after the seller has clearly said yes on this call.",
    input_schema: obj({
      action_type: { type: "string", enum: Object.keys(ACTION_TYPES) },
      seller_consent: { type: "boolean", description: "true only if the seller explicitly agreed to this action" },
      note: { type: "string", description: "Optional detail, e.g. supplier name or quantities" },
    }, ["action_type", "seller_consent"]),
  },
  {
    name: "create_action_item",
    description: "Log a task in the action tracker that the seller must do (or that the KAM will do later), with a due date.",
    input_schema: obj({
      title: { type: "string" },
      owner: { type: "string", enum: ["seller", "kam"] },
      due_in_days: { type: "integer" },
      issue: { type: "string", enum: ["inventory", "cancellations", "visibility", "pricing", "other"] },
      expected_impact: { type: "string" },
    }, ["title", "owner", "due_in_days", "issue", "expected_impact"]),
  },
  {
    name: "project_recovery",
    description: "Forecast next month's sales if the chosen opportunities are carried out.",
    input_schema: obj({ opportunity_ids: { type: "array", items: { type: "string" }, description: "ids from get_opportunities" } }, ["opportunity_ids"]),
  },
  {
    name: "schedule_follow_up",
    description: "Book a proactive check-in call from the Virtual KAM with a measurable success metric.",
    input_schema: obj({ in_days: { type: "integer" }, agenda: { type: "string" }, success_metric: { type: "string" } }, ["in_days", "agenda", "success_metric"]),
  },
  {
    name: "escalate_to_human",
    description: "Hand off to a human KAM with full context when the issue is outside the agent's authority.",
    input_schema: obj({ reason: { type: "string" }, priority: { type: "string", enum: ["normal", "urgent"] }, context_for_human: { type: "string" } }, ["reason", "priority", "context_for_human"]),
  },
  { name: "get_pricing_insight", description: "Seller's prices vs category median, Buy Box status, and a verdict on whether pricing is a problem.", input_schema: obj() },
  { name: "get_rating_insight", description: "What is driving the seller rating change and how long recovery takes.", input_schema: obj() },
  {
    name: "get_program_info",
    description: "Snapdeal programs and policies: sale enrolment rules, sponsored ads, fulfilment, payment settlement cycle, returns, shipping/dispatch.",
    input_schema: obj({ topic: { type: "string", enum: Object.keys(PROGRAMS) } }, ["topic"]),
  },
  {
    name: "get_sku_details",
    description: "Everything about one product: stock, days out of stock, orders, lost revenue, price vs market. Match by SKU code or product name.",
    input_schema: obj({ query: { type: "string", description: "SKU code or product name, e.g. 'pressure cooker'" } }, ["query"]),
  },
  { name: "get_progress_since_last_call", description: "Progress on the commitments from the last call, plus the last 7 days of metrics.", input_schema: obj() },
  {
    name: "end_call",
    description: "Close the call with a structured summary shown to the seller. Call once, at the end.",
    input_schema: obj({
      key_issues: { type: "array", items: { type: "string" } },
      actions_taken_by_kam: { type: "array", items: { type: "string" } },
      seller_next_steps: { type: "array", items: { type: "string" } },
      expected_outcome: { type: "string" },
    }, ["key_issues", "actions_taken_by_kam", "seller_next_steps", "expected_outcome"]),
  },
];

// Every tool call is traced so the UI can show the agent's reasoning timeline.
const STAGE = { get_account_alerts: "Detect", run_sales_diagnosis: "Diagnose", get_inventory_status: "Diagnose", get_cancellation_breakdown: "Diagnose", get_opportunities: "Prioritise", execute_action: "Act", create_action_item: "Commit", project_recovery: "Forecast", schedule_follow_up: "Follow through", get_progress_since_last_call: "Follow through", get_pricing_insight: "Answer", get_rating_insight: "Answer", get_program_info: "Answer", get_sku_details: "Answer", escalate_to_human: "Escalate", end_call: "Close" };
function brief(name, input, out) {
  switch (name) {
    case "get_account_alerts": return `${out.length} alerts tripped: ${out.map((a) => a.rule).join(", ")}`;
    case "run_sales_diagnosis": return `Sales ${out.summary.sales_change_pct}%, ASP flat → volume problem. Top issue: ${out.issues[0].headline}`;
    case "get_opportunities": return out.map((o) => `#${o.rank} ${o.id} ₹${o.recoverable_rs.toLocaleString("en-IN")}`).join(" · ");
    case "get_inventory_status": return `${out.top_skus.filter((k) => k.stock === 0).length} of top ${out.top_skus.length} SKUs at zero stock`;
    case "get_cancellation_breakdown": return out.reasons.map((r) => `${r.reason.split(" - ")[0]} ${Math.round(r.share * 100)}%`).join(" · ");
    case "execute_action": return out.ok ? `consent=${input.seller_consent} → ${out.label} (${out.reference || "dup"})` : `BLOCKED: ${out.error}`;
    case "create_action_item": return `${input.owner}: ${input.title} (due ${input.due_in_days}d)`;
    case "project_recovery": return `₹${out.current_sales.toLocaleString("en-IN")} → ₹${out.projected_next_month.toLocaleString("en-IN")} via ${input.opportunity_ids.join(", ")}`;
    case "schedule_follow_up": return `${out.scheduled_for}: ${input.success_metric}`;
    case "escalate_to_human": return `${input.priority}: ${input.reason} → ${out.ticket}`;
    case "get_progress_since_last_call": return `${out.commitments.filter((c) => c.status === "done").length} done, ${out.commitments.filter((c) => c.status !== "done").length} slipped`;
    case "end_call": return "Summary generated";
    case "get_pricing_insight": return "Pricing is not the cause; only KH-101 is 4% above median";
    case "get_rating_insight": return `Rating ${out.last_month} → ${out.this_month}; main driver: ${out.drivers[0].driver}`;
    case "get_program_info": return `${input.topic}: ${out.info.slice(0, 80)}…`;
    case "get_sku_details": return out.found ? `${out.name}: stock ${out.stock}, lost ₹${out.lost_rs.toLocaleString("en-IN")}` : "SKU not found";
    default: return "";
  }
}
function runTool(s, name, input) {
  const t0 = performance.now();
  const out = runToolInner(s, name, input);
  try { s.trace.push({ stage: STAGE[name] || "Other", tool: name, detail: brief(name, input, out), ms: Math.round(performance.now() - t0), t: new Date().toLocaleTimeString("en-IN") }); } catch {}
  return out;
}
function runToolInner(s, name, input) {
  switch (name) {
    case "get_account_alerts": return (s.alerts = detectAlerts(s.seller));
    case "run_sales_diagnosis": return (s.diagnosis = diagnose(s.seller));
    case "get_opportunities": return (s.opportunities = sizeOpportunities(s.seller));
    case "get_inventory_status": return { total_live_skus: s.seller.total_live_skus, top_skus: skuTable(s.seller) };
    case "get_cancellation_breakdown": return { this_month_rate: s.seller.metrics.this_month.cancellation_rate, reasons: s.seller.cancellation_reasons, late_dispatch: s.seller.late_dispatch };
    case "execute_action": {
      if (input.seller_consent !== true) return { ok: false, error: "BLOCKED: seller consent required. Ask the seller first." };
      if (s.executed.some((e) => e.type === input.action_type)) return { ok: true, note: "already done on this call" };
      const r = executeAction(s.seller, input.action_type, input);
      if (r.ok) s.executed.push({ type: input.action_type, ...r, at: new Date().toLocaleTimeString() });
      return r;
    }
    case "create_action_item": {
      const item = { id: s.actions.length + 1, ...input, status: "open" };
      s.actions.push(item);
      return { ok: true, action_id: item.id };
    }
    case "project_recovery": return (s.projection = projectRecovery(s.seller, input.opportunity_ids || []));
    case "schedule_follow_up":
      s.followUp = { ...input, date: new Date(Date.now() + input.in_days * 864e5).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" }) };
      return { ok: true, scheduled_for: s.followUp.date };
    case "escalate_to_human":
      s.escalation = { ...input, ticket: "ESC-" + Math.floor(10000 + Math.random() * 9e4), sla: input.priority === "urgent" ? "within 2 hours" : "within 24 hours" };
      return { ok: true, ...s.escalation };
    case "get_pricing_insight": return s.seller.pricing;
    case "get_rating_insight": return s.seller.rating_insight;
    case "get_program_info": return { topic: input.topic, info: PROGRAMS[input.topic] || "No info on that topic; offer to check with the team." };
    case "get_sku_details": {
      const q = String(input.query || "").toLowerCase();
      const k = skuTable(s.seller).find((x) => x.sku.toLowerCase() === q || new RegExp(x.keywords).test(q) || x.name.toLowerCase().includes(q));
      if (!k) return { found: false, top_skus: s.seller.top_skus.map((x) => x.name) };
      return { found: true, ...k, pricing: s.seller.pricing.skus.find((p) => p.sku === k.sku) || null };
    }
    case "get_progress_since_last_call":
      return s.seller.day7 ? { ...s.seller.day7, previous_call: ACCOUNT[s.seller.seller_id]?.lastCall || null } : { note: "No previous call on record for this seller.", previous_call: ACCOUNT[s.seller.seller_id]?.lastCall || null };
    case "end_call":
      if (s.executed.length || s.actions.length) {
        const ids = [...new Set(s.executed.map((e) => e.opportunity).concat(s.actions.map((a) => ({ inventory: "restock", cancellations: "cancel", visibility: "sale", pricing: "price" })[a.issue])).filter(Boolean))];
        const valid = sizeOpportunities(s.seller).map((o) => o.id);
        if (!s.projection) runTool(s, "project_recovery", { opportunity_ids: ids.filter((id) => valid.includes(id)) });
        if (!s.followUp) runTool(s, "schedule_follow_up", { in_days: 7, agenda: "Review the agreed actions and this week's numbers", success_metric: "Sales trend up week on week; cancellations back to last month's level" });
        if (s.projection && !/Rs|₹/.test(input.expected_outcome || "")) input.expected_outcome = `${input.expected_outcome ? input.expected_outcome + ". " : ""}Projected sales next month: about Rs ${s.projection.projected_next_month.toLocaleString("en-IN")}`;
      }
      s.summary = input; s.ended = true;
      ACCOUNT[s.seller.seller_id] = { lastCall: { executed: s.executed.map((e) => e.label), seller_tasks: s.actions.map((a) => a.title), follow_up: s.followUp } };
      return { ok: true };
    default: return { error: `unknown tool ${name}` };
  }
}

// ---------------------------------------------------------------- agent loop (Claude)
async function claudeTurn(s, userText) {
  s.messages.push({ role: "user", content: userText });
  const toolsUsed = [];
  for (let i = 0; i < 10; i++) {
    const res = await client.messages.create({
      model: MODEL,
      max_tokens: 4000,
      output_config: { effort: EFFORT },
      system: [{ type: "text", text: basePrompt(s.seller), cache_control: { type: "ephemeral" } }, { type: "text", text: MODE_BRIEF[s.mode] }],
      tools: TOOLS,
      messages: s.messages,
    });
    s.messages.push({ role: "assistant", content: res.content });
    if (res.stop_reason === "refusal") return { reply: "Sorry, I can't help with that one. Shall we get back to your sales?", toolsUsed };
    const calls = res.content.filter((b) => b.type === "tool_use");
    if (res.stop_reason !== "tool_use" || calls.length === 0) {
      return { reply: res.content.filter((b) => b.type === "text").map((b) => b.text).join(" ").trim(), toolsUsed };
    }
    s.messages.push({
      role: "user",
      content: calls.map((c) => {
        toolsUsed.push(c.name);
        let out;
        try { out = runTool(s, c.name, c.input); } catch (e) { out = { error: String(e) }; }
        return { type: "tool_result", tool_use_id: c.id, content: JSON.stringify(out) };
      }),
    });
  }
  return { reply: "Let me pull that together and come back to you.", toolsUsed };
}

// ---------------------------------------------------------------- agent loop (OpenAI): same prompt, same tools
const OAI_TOOLS = TOOLS.map((t) => ({ type: "function", function: { name: t.name, description: t.description, parameters: t.input_schema } }));
async function openaiTurn(s, userText) {
  s.oaiMessages ??= [{ role: "system", content: basePrompt(s.seller) + "\n\n" + MODE_BRIEF[s.mode] }];
  s.oaiMessages.push({ role: "user", content: userText });
  const toolsUsed = [];
  for (let i = 0; i < 10; i++) {
    const res = await oai.chat.completions.create({ model: MODEL, messages: s.oaiMessages, tools: OAI_TOOLS, temperature: 0.4, max_tokens: 600 });
    const msg = res.choices[0].message;
    s.oaiMessages.push(msg);
    if (!msg.tool_calls?.length) return { reply: (msg.content || "").trim(), toolsUsed };
    for (const c of msg.tool_calls) {
      toolsUsed.push(c.function.name);
      let out;
      try { out = runTool(s, c.function.name, JSON.parse(c.function.arguments || "{}")); } catch (e) { out = { error: String(e) }; }
      s.oaiMessages.push({ role: "tool", tool_call_id: c.id, content: JSON.stringify(out) });
    }
  }
  return { reply: "Let me pull that together and come back to you.", toolsUsed };
}

// ---------------------------------------------------------------- text-to-speech proxy (keys stay server-side)
// Gnani allows only ONE active request per key, so requests are queued one at a time (and 429s retried).
// Without this, parallel requests were rejected and the browser fell back to a different voice.
let gnaniQueue = Promise.resolve();
function gnaniQueued(fn) { // run one Gnani request at a time, retrying 429s
  const job = gnaniQueue.then(async () => {
    for (let attempt = 0; attempt < 4; attempt++) {
      const r = await fn();
      if (r.status === 429) { await r.arrayBuffer().catch(() => {}); await new Promise((s) => setTimeout(s, 250 * (attempt + 1))); continue; }
      if (!r.ok) throw new Error(`Gnani ${r.status}: ${(await r.text()).slice(0, 200)}`);
      return r;
    }
    throw new Error("Gnani still rate-limited after retries");
  });
  gnaniQueue = job.catch(() => {});
  return job;
}

// voice/language/speed default to Priya's character (Shivani); the demo seller passes its own.
async function gnaniTtsBuffer(text, { voice, language, speed } = {}) {
  const r = await gnaniQueued(() => fetch("https://api.vachana.ai/api/v1/tts/inference", {
    method: "POST",
    headers: { "X-API-Key-ID": GNANI_KEY, "content-type": "application/json" },
    body: JSON.stringify({
      text,
      model: process.env.GNANI_TTS_MODEL || "timbre-v3.0",
      voice: voice || process.env.GNANI_VOICE || "Shivani",
      language: language || process.env.GNANI_LANGUAGE || "en-IN", // or "hi-en" for Hinglish, "auto"
      speed: speed ?? Number(process.env.GNANI_SPEED || 0.9), // 0.85 (slowest) to 1.15; 0.9 = calm, unhurried
      audio_config: { sample_rate: 24000, num_channels: 1, sample_width: 2, container: "mp3", bitrate: "64k" },
    }),
  }));
  return Buffer.from(await r.arrayBuffer());
}
async function gnaniTts(text) {
  return new Response(await gnaniTtsBuffer(text), { headers: { "content-type": "audio/mpeg" } });
}

// Gnani speech-to-text (Prisma). en-IN accepts English-Hindi mixed speech and returns Latin script.
async function gnaniStt(mp3Buffer) {
  const r = await gnaniQueued(() => {
    const form = new FormData();
    form.append("audio_file", new Blob([mp3Buffer], { type: "audio/mpeg" }), "seller.mp3");
    form.append("language_code", "en-IN");
    form.append("model", "prisma-v3.0");
    return fetch("https://api.vachana.ai/stt/v3", { method: "POST", headers: { "X-API-Key-ID": GNANI_KEY }, body: form });
  });
  const j = await r.json();
  return (j.transcript ?? j.output?.transcript ?? "").trim();
}

// Demo seller: speak the scripted line in a second Gnani voice, then run that audio through Gnani STT,
// so the agent receives what speech-to-text actually heard (a real voice pipeline, not pasted text).
async function demoSellerTurn(text, language) {
  const audio = await gnaniTtsBuffer(text, { voice: process.env.GNANI_SELLER_VOICE || "Avinash", language: language || "en-IN", speed: 1.0 });
  let transcript = "", sttOk = false, sttError = null;
  try { transcript = await gnaniStt(audio); sttOk = !!transcript; } catch (e) { sttError = String(e.message || e); }
  return { audio: audio.toString("base64"), transcript: transcript || text, scripted: text, stt_ok: sttOk, stt_error: sttError };
}

async function tts(text) {
  if (TTS === "gnani") return gnaniTts(text);
  if (TTS === "elevenlabs") {
    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${ELEVEN_VOICE}/stream?output_format=mp3_44100_128&optimize_streaming_latency=3`, {
      method: "POST",
      headers: { "xi-api-key": ELEVEN_KEY, "content-type": "application/json", accept: "audio/mpeg" },
      body: JSON.stringify({ text, model_id: ELEVEN_MODEL, voice_settings: { stability: 0.45, similarity_boost: 0.8, style: 0.2, use_speaker_boost: true } }),
    });
    if (!r.ok) throw new Error(`ElevenLabs ${r.status}: ${(await r.text()).slice(0, 200)}`);
    return r;
  }
  if (TTS === "openai") {
    const r = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: { authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "content-type": "application/json" },
      body: JSON.stringify({ model: process.env.OPENAI_TTS_MODEL || "tts-1", voice: process.env.OPENAI_TTS_VOICE || "nova", input: text, response_format: "mp3" }),
    });
    if (!r.ok) throw new Error(`OpenAI TTS ${r.status}: ${(await r.text()).slice(0, 200)}`);
    return r;
  }
  return null;
}

// ---------------------------------------------------------------- offline fallback (no API key)
// Scripted run of the same ownership loop with the same tools, so the demo never breaks.
const yes = (t) => /\b(yes|yeah|yep|sure|ok|okay|go ahead|please do|do it|haan|ha|theek|kar do|fine|alright)\b/.test(t);
const wantsHuman = (t) => /\b(payment|settlement|refund|penalty|suspend|legal|human|real person|manager)\b/.test(t);
const wantsEnd = (t) => /\b(bye|that's all|thats all|nothing else|no thanks|wrap|end the call)\b/.test(t);

function offlineTurn(s, text) {
  const t = text.toLowerCase();
  const toolsUsed = [];
  const call = (n, i = {}) => { toolsUsed.push(n); return runTool(s, n, i); };
  const out = (reply) => ({ reply, toolsUsed });
  if (s.seller.seller_id !== SCRIPTED_SELLER) return out(`Namaste ${s.seller.name.split(" ")[0]} ji. This seller needs the AI brain, so please add an OpenAI or Anthropic key. The offline scripted demo only covers Kumar Home and Kitchen.`);

  if (text !== "__START__" && wantsHuman(t) && !s.escalation) {
    call("escalate_to_human", { reason: "Seller raised a payment or policy issue", priority: "urgent", context_for_human: `Sales -32%, OOS 18, cancellations 14%. Seller said: "${text}"` });
    return out(`That needs a human colleague, so I've raised an urgent ticket and a senior KAM will call you within two hours with full context. Meanwhile, shall we continue fixing the stock issue?`);
  }

  // Off-script question: answer from data, then steer back to the open step (stage is NOT advanced).
  const isQuestion = /\b(what|why|how|should|can|could|do i|does|is it|are|will|would|tell me|kya|kaise|kyu|kyun)\b|\?/.test(t);
  const side = isQuestion ? offScript(t, call) : null;
  if (side && text !== "__START__") {
    const resume = s.mode === "followup" ? "Now, back to the pressure cooker restock. What's holding it up?"
      : { 0: "Shall I tell you what's really driving your drop?", 1: "Shall I tell you what's really driving your drop?", 2: "Coming back to the stock-outs, was it a supplier delay or cash flow?", 3: "So, shall I pause the zero-stock listings and switch on stock alerts for you?", 4: "Shall I enrol your in-stock products in the sale?" }[s.stage ?? 0] || "Anything else I can help with?";
    return out(side + " " + resume);
  }
  if (s.mode === "followup") return offlineFollowup(s, t, call, out);

  if (text === "__START__") { // outbound opening
    call("get_account_alerts"); call("run_sales_diagnosis"); call("get_opportunities");
    s.stage = 1;
    return out(`Namaste Rajesh ji, this is Priya, your Snapdeal Virtual Account Manager. I'm calling because my monitoring flagged your store: sales are down thirty-two percent this month, and I've found why. Do you have two minutes to fix it together?`);
  }
  s.stage ??= 0;
  if (s.stage <= 1) {
    if (!s.diagnosis) { call("run_sales_diagnosis"); call("get_opportunities"); }
    s.stage = 2;
    return out(`Your prices haven't changed, so this is entirely fewer orders. The main cause is stock: four of your top six bestsellers, including the pressure cooker, are at zero, which is costing you about thirty thousand rupees a month. Why did they run out, a supplier delay or cash flow?`);
  }
  if (s.stage === 2) {
    s.cause = /cash|money|fund|paisa|payment/.test(t) ? "cash" : "supplier";
    s.stage = 3;
    call("get_cancellation_breakdown");
    return out(`Understood. The stock-outs are also driving your cancellations up to fourteen percent, because orders come in for items you don't have, and that hurts your ranking. I can pause the zero-stock listings and switch on low-stock alerts for you right now. Shall I do that?`);
  }
  if (s.stage === 3) {
    s.stage = 4;
    if (!yes(t)) return out(`No problem. Just so you know, every oversold order lowers your rating further. Shall I at least switch on the stock alerts? It changes nothing else.`);
    call("execute_action", { action_type: "pause_oos_listings", seller_consent: true });
    call("execute_action", { action_type: "set_stock_alerts", seller_consent: true });
    return out(`Done, the zero-stock listings are paused and alerts are live, so no more oversold orders. The Winter Saver Sale starts in nine days. Shall I enrol your in-stock products${s.cause === "supplier" ? " and send your supplier a reorder request" : ""}?`);
  }
  if (s.stage === 4) {
    s.stage = 5;
    if (yes(t)) {
      call("execute_action", { action_type: "enrol_in_sale", seller_consent: true, sku_count: 10 });
      if (s.cause === "supplier") call("execute_action", { action_type: "send_supplier_reorder", seller_consent: true });
    }
    call("create_action_item", s.cause === "cash"
      ? { title: "Restock Pressure Cooker and Tawa first (top 2 by orders)", owner: "seller", due_in_days: 5, issue: "inventory", expected_impact: "~Rs 20k/month recovered with limited cash" }
      : { title: "Confirm supplier dispatch for 4 zero-stock SKUs; line up a backup supplier", owner: "seller", due_in_days: 5, issue: "inventory", expected_impact: "~Rs 30k/month recovered" });
    const p = call("project_recovery", { opportunity_ids: ["restock", "cancel", "sale"] });
    call("schedule_follow_up", { in_days: 7, agenda: "Review restock, cancellations and sale performance", success_metric: "Cancellation rate below 9%, zero-stock bestsellers 0" });
    return out(`Your one task is the restock within five days, and it's on your tracker. If we do all this, next month should be back to about ${(p.projected_next_month / 1e5).toFixed(1)} lakh rupees. I'll call you in seven days to check. Anything else?`);
  }
  return wrap(s, call, out);
}

function offScript(t, call) {
  if (/\b(pric|discount|cheap|costl|expensive|rate kam)/.test(t)) { call("get_pricing_insight"); return "Good question. Your prices aren't the problem: they're flat and in line with the market, so a blanket discount would only cut your margin. Only the pressure cooker is about four percent high, and we can match that once it's back in stock."; }
  if (/\b(rating|review|star)/.test(t)) { call("get_rating_insight"); return "Your rating fell from four point three to four mainly because of seller-side cancellations from stock-outs, plus some late dispatches. It's a rolling thirty-day score, so it should recover in three to four weeks once cancellations stop."; }
  if (/\b(ads?\b|advertis|sponsor|promot)/.test(t)) { call("get_program_info", { topic: "ads" }); return "Ads can help, but only on in-stock products, otherwise you pay for clicks you can't convert. I'd start with about three hundred rupees a day on your top five in-stock items after the restock."; }
  if (/\b(fulfil|warehouse|fast delivery)/.test(t)) { call("get_program_info", { topic: "fulfilment" }); return "Snapdeal Fulfilment stores your stock in our warehouse and gives you the Fast Delivery badge, which usually lifts conversion. You'd need at least twenty units per product."; }
  if (/\breturn/.test(t)) { call("get_program_info", { topic: "returns" }); return "Returns aren't a concern. Yours are four and a half percent, below the category average of six."; }
  if (/\b(sale|event|festival)\b/.test(t)) { call("get_program_info", { topic: "sale" }); return "The Winter Saver Sale starts in nine days. You need in-stock products and at least ten percent off, and I can enrol them for you."; }
  return null;
}

function offlineFollowup(s, t, call, out) {
  s.stage ??= 0;
  if (s.stage === 0) {
    call("get_progress_since_last_call"); s.stage = 1;
    return out(`Namaste Rajesh ji, Priya here for our seven-day check-in. Good news: stock alerts worked, there were zero oversold orders, and cancellations are down from fourteen to nine percent. But the pressure cooker is still out of stock, and it's your bestseller. What's holding it up?`);
  }
  if (s.stage === 1) {
    s.stage = 2;
    return out(`Got it. The pressure cooker alone brings in about sixty orders a month, so we can't wait. Shall I send a firm reorder to your supplier and share two backup suppliers from the Snapdeal network?`);
  }
  if (s.stage === 2) {
    s.stage = 3;
    if (yes(t)) call("execute_action", { action_type: "send_supplier_reorder", seller_consent: true, note: "escalated + 2 backup suppliers shared" });
    call("create_action_item", { title: "Place backup order for Pressure Cooker 3L if supplier misses Friday", owner: "seller", due_in_days: 3, issue: "inventory", expected_impact: "~Rs 31k/month (62 orders)" });
    call("schedule_follow_up", { in_days: 4, agenda: "Confirm pressure cooker back in stock before the sale peak", success_metric: "KH-101 stock > 0" });
    return out(`Done. If your supplier misses Friday, you place the backup order, and that's on your tracker. I'll check again in four days, before the sale peak. Anything else?`);
  }
  return wrap(s, call, out);
}

function wrap(s, call, out) {
  const d = s.diagnosis || diagnose(s.seller);
  call("end_call", {
    key_issues: s.mode === "followup" ? ["Pressure cooker still out of stock (supplier delay)", "Cancellations improved 14% -> 9%"] : d.issues.slice(0, 3).map((i) => i.headline),
    actions_taken_by_kam: s.executed.map((e) => e.label),
    seller_next_steps: s.actions.map((a) => `${a.title} (in ${a.due_in_days} days)`),
    expected_outcome: s.projection ? `Sales back to ~Rs ${s.projection.projected_next_month.toLocaleString("en-IN")} next month` : "Bestseller restocked before sale peak",
  });
  return out(`To recap: I've done my part on your account, and the restock is with you. I'll call you on ${s.followUp?.date || "the agreed day"} to check the numbers. Thank you, Rajesh ji!`);
}

// ---------------------------------------------------------------- http
const newSession = (mode, sellerId) => ({ mode, seller: getSeller(sellerId), trace: [], messages: [], actions: [], executed: [], followUp: null, summary: null, ended: false });
const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css" };
const state = (s) => ({ trace: s.trace, alerts: s.alerts, diagnosis: s.diagnosis, opportunities: s.opportunities, executed: s.executed, actions: s.actions, projection: s.projection, followUp: s.followUp, escalation: s.escalation, summary: s.summary, ended: s.ended });
const json = (res, code, body) => { res.writeHead(code, { "content-type": "application/json" }); res.end(JSON.stringify(body)); };

// Stateless: the browser holds the call state and sends it back each turn, so this runs on serverless
// platforms (Vercel functions keep no memory between requests). The seller profile is re-derived from its id.
const dehydrate = ({ seller, lock, ...rest }) => ({ ...rest, sellerId: seller.seller_id });
const hydrate = (c) => ({ ...c, seller: getSeller(c.sellerId) });
async function handleTurn(text, mode, sellerId, clientSession) {
  if (!mode && !clientSession) throw new Error("no session, start a call first");
  const s = mode ? newSession(mode, sellerId) : hydrate(clientSession);
  const out = await runTurn(s, text);
  return { ...out, session: dehydrate(s) };
}

async function runTurn(s, text) {
  const t0 = Date.now();
  let r;
  if (text === "__HANGUP__") { // seller pressed End call: close out silently with a summary
    if (s.ended) return { reply: "", toolsUsed: [], ...state(s) };
    if (LIVE) {
      const msg = "(The seller has hung up. Call end_call now with a summary of what was actually covered and agreed on this call. Then reply with one short closing sentence.)";
      r = PROVIDER === "openai" ? await openaiTurn(s, msg) : await claudeTurn(s, msg);
    } else {
      const toolsUsed = [];
      r = s.seller.seller_id === SCRIPTED_SELLER ? wrap(s, (n, i = {}) => { toolsUsed.push(n); return runTool(s, n, i); }, (reply) => ({ reply, toolsUsed })) : { reply: "", toolsUsed };
    }
    if (!s.ended) { // model didn't close it: close deterministically
      const d = s.diagnosis || diagnose(s.seller);
      runTool(s, "end_call", { key_issues: d.issues.slice(0, 3).map((i) => i.headline), actions_taken_by_kam: s.executed.map((e) => e.label), seller_next_steps: s.actions.map((a) => a.title), expected_outcome: s.projection ? `Sales back to ~Rs ${s.projection.projected_next_month.toLocaleString("en-IN")} next month` : "Call ended before a plan was agreed" });
    }
  } else if (text === "__START__" && s.mode === "inbound") {
    r = { reply: `Namaste ${s.seller.name.split(" ")[0]} ji, this is Priya, your Snapdeal Virtual Account Manager. I have your store dashboard open. How can I help you today?`, toolsUsed: [] };
    s.messages.push({ role: "user", content: "(call connected)" }, { role: "assistant", content: r.reply });
  } else if (LIVE) {
    let t = text, pre = [];
    if (text === "__START__") {
      // Load the account data up front so the opening line is grounded in real numbers (and needs one LLM round trip, not two).
      const names = s.mode === "followup" ? ["get_progress_since_last_call"] : ["get_account_alerts", "run_sales_diagnosis", "get_opportunities"];
      const data = Object.fromEntries(names.map((n) => (pre.push(n), [n, runTool(s, n, {})])));
      const L = s.seller.metrics.last_month, T = s.seller.metrics.this_month;
      const facts = `Key facts: sales went from ${L.sales.toLocaleString("en-IN")} rupees to ${T.sales.toLocaleString("en-IN")} rupees, a drop of ${(L.sales - T.sales).toLocaleString("en-IN")} rupees, which is ${Math.round((1 - T.sales / L.sales) * 100)} percent.`;
      t = "(Call connected, the seller has picked up.) " + facts + " These tool results are already loaded for you, so use them and don't call these tools again: " + JSON.stringify(data);
    }
    r = PROVIDER === "openai" ? await openaiTurn(s, t) : await claudeTurn(s, t);
    // Guardrail: payment, legal and suspension issues always reach a human, even if the model forgets the tool call.
    if (!s.escalation && text !== "__START__" && /\b(payment|payout|settlement|refund|penalty|legal|suspend|suspension)/i.test(text)) {
      runTool(s, "escalate_to_human", { reason: "Seller raised a payment or policy issue on the call", priority: "urgent", context_for_human: `${s.seller.business}: ${s.diagnosis?.issues?.[0]?.headline || "sales drop"}. Seller said: "${text}"` });
      r.toolsUsed.push("escalate_to_human");
      if (!/escalat|colleague|human|call you back/i.test(r.reply)) r.reply += ` I've also raised your payment issue with a human colleague, who will call you back within ${s.escalation.sla.replace("within ", "")}.`;
    }
    r.toolsUsed = [...pre, ...r.toolsUsed];
  } else {
    r = offlineTurn(s, text);
  }
  s.trace.push({ stage: "Respond", tool: LIVE ? `${PROVIDER}:${MODEL}` : "scripted", detail: `Turn completed in ${Date.now() - t0} ms, ${r.toolsUsed.length} tool call(s)`, ms: Date.now() - t0, t: new Date().toLocaleTimeString("en-IN") });
  console.log(`[${s.mode} ${Date.now() - t0}ms] seller: ${text}\n  kam: ${r.reply}\n  tools: ${r.toolsUsed.join(", ") || "-"}`);
  return { ...r, ...state(s) };
}

export async function handler(req, res) {
  try {
    const u = new URL(req.url, "http://localhost");
    const p = u.pathname;
    if (req.method === "GET" && p === "/api/seller") {
      const sl = getSeller(u.searchParams.get("id"));
      return json(res, 200, { seller: sl, alerts: detectAlerts(sl), bridge: revenueBridge(sl), skus: skuTable(sl), health: healthScore(sl), diagnosis: diagnose(sl), portfolio: portfolio(), hasDay7: !!sl.day7, scriptedOnly: !LIVE && sl.seller_id !== SCRIPTED_SELLER, mode: LIVE ? `${PROVIDER === "openai" ? "OpenAI" : "Claude"} ${MODEL}` : "offline scripted demo (no API key)", tts: TTS });
    }
    if (req.method === "POST" && p === "/api/tts") {
      let body = ""; for await (const c of req) body += c;
      const r = await tts(JSON.parse(body).text);
      if (!r) return json(res, 204, {});
      res.writeHead(200, { "content-type": "audio/mpeg", "cache-control": "no-store" });
      for await (const chunk of r.body) res.write(chunk);
      return res.end();
    }
    if (req.method === "POST" && p === "/api/demo-seller") {
      if (TTS !== "gnani") return json(res, 400, { error: "The auto demo needs GNANI_API_KEY (it uses Gnani for the seller's voice and speech-to-text)." });
      let body = ""; for await (const c of req) body += c;
      const { text, language } = JSON.parse(body);
      const out = await demoSellerTurn(text, language);
      console.log(`[demo seller] said: "${text}"  ->  STT heard: "${out.transcript}"${out.stt_ok ? "" : "  (STT failed, using script: " + out.stt_error + ")"}`);
      return json(res, 200, out);
    }
    if (req.method === "POST" && p === "/api/turn") {
      let body = ""; for await (const c of req) body += c;
      const { text, mode, sellerId, session } = JSON.parse(body);
      return json(res, 200, await handleTurn(text, mode, sellerId, session));
    }
    const file = path.join(here, "public", req.url === "/" ? "index.html" : path.normalize(req.url.split("?")[0]).replace(/^([/\\])+/, ""));
    if (!file.startsWith(path.join(here, "public")) || !fs.existsSync(file)) { res.writeHead(404); return res.end("not found"); }
    res.writeHead(200, { "content-type": MIME[path.extname(file)] || "application/octet-stream" });
    fs.createReadStream(file).pipe(res);
  } catch (e) {
    console.error(e);
    json(res, 500, { error: String(e.message || e) });
  }
}

// Local: `npm start` runs this file directly. On Vercel, the default export below is used instead.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) http.createServer(handler).listen(PORT, () => console.log(`Virtual KAM on http://localhost:${PORT}  brain: ${LIVE ? `${PROVIDER} ${MODEL}` : "OFFLINE scripted demo"}  voice: ${TTS}`));

// Vercel runs this file as a Node server function: the default export handles every request (API + static files).
export default handler;
