# Virtual KAM: demo script and test plan

## 1. What the demo has to prove (mapped to the scoring)

| Scoring area (marks) | What the viewer must see | Where in the demo |
|---|---|---|
| Voice interaction and natural conversation (30) | Two-way speech, a natural Indian voice, the seller interrupting Priya, short turns, Hinglish | Steps 2–8, especially 3 (Hinglish) and 5 (interruption) |
| Understanding seller queries (20) | Priya understands Hinglish, an off-plan question and a constraint ("cash is tight"), and changes her plan | Steps 3, 4, 5 |
| Quality of business recommendations (20) | Rupee-sized, ranked, specific fixes tied to the data; the advice changes for a different seller | Steps 3–7, then 9–10 (TechNest) |
| AI implementation and workflow (20) | Agent timeline of tool calls, numbers calculated in code, consent before changes, escalation guardrail, Gnani speech-to-text in the loop | Visible all through; call it out in steps 6 and 7 |
| Creativity and execution (10) | Proactive outbound call from a ranked portfolio, actions taken (not just advice), forecast, booked follow-up, human hand-off | Steps 1, 2, 6, 7, 8 |

## 2. The auto demo (about 2 minutes)

**Play auto demo** runs this by itself. The **seller's lines** are spoken in a second Gnani voice (*Avinash*), then transcribed by **Gnani speech-to-text**. Priya answers whatever speech-to-text heard. **Priya's side is fully live**: not scripted, so her exact words differ slightly on each run. Captions at the bottom name what each moment shows.

| # | What happens | Seller says (Gnani voice "Avinash") | What to look for |
|---|---|---|---|
| 1 | Portfolio view | (none) | 12 sellers ranked by money at risk. Kumar Home & Kitchen is top, marked "Call today". |
| 2 | Priya calls the seller | (none) | Opening line with the real numbers (down 32%, about ₹65,000). The progress track lights Detect, Diagnose, Prioritise. |
| 3 | Hinglish | "Haan ji, bataiye. What exactly went wrong this month?" | Root cause: 4 of the top 6 products out of stock, about ₹30k lost. The sales bridge and bestseller rows highlight. |
| 4 | Off-plan question | "Hmm. Should I just reduce my prices to get sales back?" | "Prices are at market, cutting won't help", then she steers back to the plan. |
| 5 | Interruption | "Sorry, one second. My supplier delayed the shipment, and cash is a bit tight this month." (cuts in 3.5 s into her reply) | Her reply is marked *interrupted*. The plan adapts: restock only the top 2 products first. |
| 6 | Consent, then action | "Yes, please go ahead and do that." | "Done by Priya" fills in: stock alerts, zero-stock listings paused. |
| 7 | Commit, escalate | "Yes please. Enrol my in-stock products in the sale too. And my last payment settlement has been pending for two weeks." | Sale enrolment, a restock task on the to-do list, an urgent ticket to a human KAM. |
| 8 | Close | "Okay, that's all for now. Thank you, Priya." | Forecast (about ₹1.72L next month), follow-up date booked, call summary. |
| 9 | Different seller | (none) | TechNest: Priya opens with a lost Buy Box to a price war. Different chart, different diagnosis. |
| 10 | Advice changes | "Yes, tell me. Should I cut prices on everything?" | Here pricing **is** the problem: match price on 4 products only, and protect margin. |
| 11 | End call | (none) | Hanging up mid-call still produces a summary. |

## 3. How to record it (Windows)

1. Run `npm start` and open **http://localhost:3000 in Chrome**, maximised, zoom 100%. Close other tabs that make sound.
2. Turn the speaker volume up so the recording captures both voices.
3. Start recording, with **one** of these:
   - **Xbox Game Bar:** click the Chrome window, then press **Win + Alt + R** to start and stop. Video and audio are saved to `Videos\Captures`.
   - **Snipping Tool:** press **Win + Shift + R**, select the browser window, make sure **system audio** is on, then press Start.
4. Click **Seller workspace**, then **Play auto demo (Gnani seller voice)**. Leave the mouse alone until the caption says the demo is complete, about 2.5 minutes.
5. Stop recording. Trim the start and end if needed (Clipchamp or the Photos app).

**Recommended:** the brief asks for "a real voice conversation". The auto demo uses a synthetic seller voice, so also record **20–30 seconds of yourself talking to Priya**, using the Speak button and your own voice. Either append it to the video, or make it a second short clip.

## 4. Manual test plan (run before recording)

| Area | Test | Pass if |
|---|---|---|
| Voice | Every Priya reply | Always the same Shivani voice, calm pace, no second voice |
| Push-to-talk | After Priya speaks | The mic stays off until you press **Speak** (or the space bar) |
| Interrupt | Press **Interrupt** mid-reply | She stops at once and the mic opens |
| Send | Press **Send** after talking | Your words appear and Priya replies |
| Silence | Press Speak, say nothing | "Didn't catch that", and nothing is sent |
| End call | Press **End call** while Priya is thinking | Hangs up at once; the summary appears without being spoken |
| Hinglish | "Mera stock khatam ho gaya, kya karun?" | Priya understands and replies in simple Hinglish |
| Off-plan | Ask about rating, ads, returns or fulfilment | A short data-based answer, then she steers back |
| Consent | Say "No, don't change anything" when she offers | Nothing appears under "Done by Priya" |
| Escalation | Mention a payment, refund or penalty | An urgent ticket appears with a callback time |
| Sellers | Call Urban Threads, TechNest, Kids Kingdom | Different root causes: dispatch, Buy Box, seasonality |
| Follow-up | Kumar Home & Kitchen, then **Day-7 follow-up call** | Reports what worked and chases the pressure-cooker restock |
| Typing | Type a reply instead of speaking | Works the same as voice |
| No mic | Firefox, or mic blocked | A clear message to type instead |
