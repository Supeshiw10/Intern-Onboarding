# LearnLanka — Ambiguity Hunt Log

## Brief reference

LearnLanka is a Colombo-based online tutoring platform for **O/L and A/L students**. It helps students find **vetted tutors** by subject, grade, language, and price. Students can **book one-hour sessions and pay using cards or eZ Cash**. Tutors must be able to publish availability slots, accept or decline bookings, and **cancel with at least 12 hours notice**. The platform must charge a **15% commission on every completed session** and pay tutors weekly via bank transfer. Both parties must be able to **rate each other (1-5 stars) and leave a one-line comment after the session.**&#x50;rivacy: comply with Sri Lanka Personal Data Protection Act 2022 — **consent capture, deletion request flow\.Video calling will be outsourced to a third-party (Daily.co or 100ms)** — not built in-house. **All UI strings must support Sinhala, Tamil, and English from launch.**


## Findings

# LearnLanka — Requirements Ambiguity and Clarification Questions

| # | Quote | Why ambiguous | Clarification question | Priority |
|---|---|---|---|---|
| 1 | “vetted tutors” | The approval criteria and owner of vetting are not defined. Each check (ID, qualifications, interview) needs its own admin screen, so every extra check adds more work. | What documents and checks must a Tutor pass before approval, who does the check, and how long should it take? | H |
| 2 | “O/L and A/L students” | Most are under 18, but the brief says nothing about parent consent, who pays, or who owns the account. | Do Students under 18 need parent or guardian consent? Can a parent pay on behalf of the Student? | H |
| 3 | “book a 1-hour session and pay via card or eZ Cash” | The brief doesn’t say whether the Student is charged at booking request or after the Tutor accepts, and this changes the payment and refund flow. | Is the Student charged when they request a booking, or only after the Tutor accepts? | H |
| 4 | “cancel with at least 12 hours notice” | Only Tutors are mentioned. It is unclear what happens if a Tutor cancels inside 12 hours, and whether Students can cancel at all. Cancellation consequences are not defined. | What happens when a Tutor cancels a booking less than 12 hours before the session? Can Students cancel a booking at all? How are refunds handled when either side cancels inside 12 hours? | H |
| 5 | “pay tutors weekly via bank transfer” | The payout day, cutoff time, minimum amount, and what happens when a transfer fails are not given. | Which day is payout made, how are failed payouts handled? Is there a minimum amount a Tutor must earn within the week? | H |
| 6 | “rate each other (1-5 stars) and leave a one-line comment” | Not clear who can see the ratings, whether they can be edited, or how abusive comments are handled. No character limit or moderation rules are specified. | Who can see ratings of Students, can ratings be edited or removed, and what is the maximum comment length? | M |
| 7 | “15% commission on every completed session” | It’s unclear if 15% is before or after gateway fees. | When is a session “completed”, and is the 15% calculated on the full session price before gateway fees? | H |
| 8 | “Video calling will be outsourced (Daily.co or 100ms)” | The provider is not chosen. The brief doesn’t mention whether sessions are recorded. | Which video provider will be used for the sessions, Daily.co or 100ms, and can sessions be recorded? | M |
| 9 | “deletion request flow” | It is unclear what data can actually be deleted when a user asks for deletion. It is also unclear how this works when some financial or legal records must be kept. | Which personal data must be deleted or retained after a valid request? | H |
| 10 | “all UI strings must support Sinhala, Tamil, and English” | It is unclear whether tutor-generated content and comments also need translation. | Does multilingual support apply only to system UI strings, or also to tutor profiles and user generated comments? | M |


## Results Summary

| Metric | Target | Achieved |
|---|---|---|
| Items found | 10+ | 10 |
| High-priority items | 5+ | 7 |
| Items convertible to test cases | 5+ | 8 |


## Top 3 questions to ask the founders

- 1. Is the Student charged when they request a booking, or only after the Tutor accepts, and what is refunded when either side cancels?

- 2. Do Students under 18 need parent or guardian consent, and can a parent pay on their behalf?

- 3. What are the operational or legal rules for Tutor pay-outs, cancellations, and personal data deletion?


## Reflection

- What kind of ambiguity tripped you up most?

The most difficult ambiguity was where a short business statement hides several workflow decisions. For example, “book and pay” sounds simple, but confirmation timing, payment failure, Tutor acceptance, cancellation, refunds, and payout eligibility all affect the actual requirements.


- Which question is most likely to change the architecture if answered?

The booking and payment workflow is the most likely to change the architecture because it determines when a booking is confirmed, when money is collected through card or eZ Cash, how payment failures are handled, and how refunds or payment reversals are issued under company policy.