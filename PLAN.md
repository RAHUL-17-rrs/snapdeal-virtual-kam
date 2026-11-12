# Virtual KAM: from chatbot to owner of the problem

## The gap
A chatbot answers: "Your sales dropped because of stock-outs. You should restock."
A KAM **owns the outcome**. It notices before the seller does, sizes the problem in rupees, picks what to fix first, **does the fixes it can do itself**, holds the seller to what they agreed, and checks back to see whether the numbers moved.

## The ownership loop (what we build)

| # | Stage | What the agent does | How it's built |
|---|---|---|---|
| 1 | **Detect** | Watches seller metrics and raises alerts when thresholds break. It doesn't wait for the seller to call. | `detectAlerts()` rules engine. **Outbound call mode**: the KAM calls the seller and opens with the alert. |
| 2 | **Diagnose** | Breaks the drop into causes (orders vs price vs cancellations) and follows the causal chain. | Deterministic `diagnose()`. The LLM never does the arithmetic. |
| 3 | **Prioritise** | Puts a rupee value on each issue ("4 stock-outs ≈ ₹33k/month") and ranks by impact and ease. | `sizeOpportunities()` gives a ranked opportunity list with recoverable ₹. |
| 4 | **Clarify** | Asks only what the data can't show (why stock ran out: supplier, cash or forecasting?), then adapts the plan. | Prompt rule: one question per turn, based on the gaps in the data. |
| 5 | **Act** | **Carries out fixes itself after the seller agrees**: pauses out-of-stock listings, sets stock alerts, sends supplier reorder requests, enrols the seller in the sale, makes a price change. | `execute_action` tool (simulated seller-panel APIs) with a **consent gate**: it refuses without `seller_consent=true`. |
| 6 | **Commit** | Seller-owned tasks are logged with owner, due date and expected impact. | `create_action_item` → live action tracker |
| 7 | **Forecast** | Shows the seller "If we do these, sales go back to about ₹1.9L next month." | `project_recovery` tool recalculates the metrics from the actions taken. |
| 8 | **Follow through** | Books a check-in with a success metric, then on the check-in call **reviews progress** (done, slipped, results) and chases items that slipped. | `schedule_follow_up` + **"Day-7 follow-up call" mode** with memory of the commitments. |
| 9 | **Escalate** | Knows when to stop: payment disputes, policy or legal issues, an angry seller → hands off to a human KAM with context. | `escalate_to_human` tool |

## Guardrails
- Numbers come only from tools. Every action that changes the seller's account needs explicit spoken consent.
- Voice-first replies: short, one question at a time, no symbols.
- Offline scripted mode runs the same loop so the demo never breaks.

## Demo story (about 2 min)
1. **Outbound call:** "Rajesh ji, I'm calling because your sales are down 32% and I found why."
2. Diagnosis with rupee values → one clarifying question → plan.
3. Seller says "yes" → the agent **carries out** 3 fixes live (the panel updates) and logs 1 seller task.
4. Recovery forecast → follow-up booked → summary.
5. (Optional) **Day-7 follow-up call:** "Alerts are live and cancellations are down to 9%, but the pressure cooker restock hasn't arrived. Shall I chase your supplier again?"

## Out of scope (state in the discussion)
Real telephony (Exotel/Twilio), real seller APIs, cross-seller memory, streaming barge-in. All of these are on the production path.
