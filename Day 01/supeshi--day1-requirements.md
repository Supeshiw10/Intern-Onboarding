# LearnLanka — Requirements Document

## 1. Problem Statement

- LearnLanka is a Colombo-based online tutoring platform for O/L and A/L students. It helps students find vetted tutors by subject, grade, language, and price. Students can book one-hour sessions and pay using cards or eZ Cash. Tutors can manage their availability and accept or decline bookings. They can also cancel sessions with at least 12 hours' notice and receive weekly bank transfers. The platform charges a 15% commission on completed sessions. Both students and tutors can rate each other and leave comments after sessions. Operations staff can monitor bookings, payments, users, ratings, and exceptions. The system must show search results within 800 milliseconds for 95% of searches. The booking service must be available 99.5% of the time each month. It must support 200 video sessions at the same time. The platform must be mobile-friendly, especially for Android users, and support Sinhala, Tamil, and English. It must comply with Sri Lanka's Personal Data Protection Act 2022. Payment data must not be stored on LearnLanka servers. The platform will use Azure services, PayHere for payments, and Sampath Vishwa for tutor payouts.


## 2. Personas

- **Student**

- **Goals:**

1. Find a suitable tutor quickly.
2. Compare tutors by price, language, and rating.
3. Book a convenient one-hour session.
4. Make a secure payment.
5. Attend the online session.
6. Rate and comment the tutor after the session.

- **Frustrations:** 

1. Available slots clash with school hours and other classes.
2. Payment fails, or the student is unsure whether it went through (card or eZ Cash).
3. Search results are slow or fail on a weak mobile data connection.
4. Video call lags, drops, or uses too much data.
5. Cancelled sessions without clear communication.

     -**Tutor**

- **Goals:** 

1. Create a profile with subjects, grades, languages, and hourly price.
2. Publish available time slots.
3. Accept suitable bookings and conduct sessions.
4. Receive weekly playouts 
5. Rate and comment on the student after the session.

- **Frustrations:** 

1. Unpredictable bookings
2. Unclear cancellation rules
3. Payment delays
4. Difficulty managing availability.
5. Video call drops or poor internet during a session.

-**Operations Admin**

- **Goals:** 

1. Verify and approve tutors before they appear in search. 
2. Monitor bookings, sessions, and payments in one place. 
3. Handle complaints, disputes, and refund requests.
4. Track the 15% commission and run the weekly tutor payouts.

- **Frustrations:** 

1. Missing transaction information
2. Unclear booking states
3. Unresolved payment issues
4. No alert when payments, payouts, or video sessions fail.


## 3. Functional Requirements

-**Student**

1.	FR-S1: The platform must allow a Student to search for tutors by subject, grade, language (Sinhala, Tamil, or English), and price band.
2.	FR-S10: The platform must allow t Student to choose the app language (Sinhala, Tamil, or English), and all screens must appear in the selected language.
3.	FR-S2: The platform must show a tutor's name, languages, hourly price, and average rating in the search results.
4.	FR-S4: The platform must allow a student to select an available one-hour session and submit a booking.
5.	FR-S5: The platform must allow a Student to pay for a booking by card or eZ Cash.
6.	FR-S7: The platform must notify a Student when a booking is confirmed, declined, or cancelled by the tutor.
7.	FR-S8: The platform must allow a Student to join the online session from the booking at the scheduled time.
8.	FR-S9: The platform must allow a Student to rate a Tutor from 1 to 5 stars and submit a one-line comment after a completed session.

-**Tutor**

1.	FR-T1: The platform must allow a Tutor to create a profile with subjects, grades, languages, and an hourly price.
2.	FR-T2: The platform must allow a Tutor to publish and remove availability slots. A booked slot must not be shown to other students.
3.	FR-T3: The platform must allow a Tutor to accept or decline each booking request.
4.	FR-T4: The platform must allow a Tutor to cancel a booked session only if the session starts in 12 hours or more.
5.	FR-T5: The platform must allow a Tutor to join the online session from the booking at the scheduled time.
6.	FR-T6: The platform must allow a Tutor to rate a Student from 1 to 5 stars and submit a one-line comment after a completed session.
7.	FR-T7: The platform must allow a Tutor to view earnings for each completed session, including the 15% platform commission and the net amount.
8.	FR-T8: The platform must allow a Tutor to save bank account details and receive a weekly payout by bank transfer.

-**Operations Admin**

1.	FR-A1: The platform must allow an Operations Admin to approve or reject a tutor.
2.	FR-A2: The platform must allow an Operations Admin to view all bookings, sessions, and payments with their current status.
3.	FR-A3: The platform must deduct a 15% commission from every completed session.
4.	FR-A4: The platform must allow an Operations Admin to run the weekly tutor payout.
5.	FR-A5: The platform must allow an Operations Admin to record a dispute or refund request and its outcome against the related booking.


## 4. Non-Functional Requirements

| Category | Metric | Target | How we'll measure it |
|---|---|---|---|
| Performance | Tutor search API response time, p95 from a Sri Lankan ISP | < 800 ms | Azure Application Insights and synthetic tests run from a Sri Lankan network |
| Availability | Successful booking endpoint requests | >= 99.5% per calendar month | Azure Monitor and synthetic checks on the booking endpoint |
| Concurrency | Active video sessions | >= 200 simultaneous sessions during the first 6 months | Video provider dashboard (Daily.co) |
| Privacy | Consent capture and deletion request flow, per Sri Lanka PDPA 2022 | 100% of required consent events recorded before applicable processing. Every valid deletion request receives a recorded status and completion outcome. | Application audit records |
| Payment security | Payment-card data stored by LearnLanka | Never stored on LearnLanka servers. Payments handled by a PCI-DSS-compliant gateway. | Database/storage audit and security review |
| Localisation | Supported UI languages | Sinhala, Tamil, and English available from launch | UI test checklist |
| Mobile usability | Expected Android usage | Android represents >= 80% of expected usage | Analytics after launch |


## 5. Assumptions

1. Every session is one-to-one (one Tutor and one Student) and lasts exactly one hour.
2. A Student must be registered and authenticated before making a booking.
3. Under-18 students (most O/L students) use their own account, and a parent or guardian pays and gives permission for them.
4. A Tutor must be approved/vetted by LearnLanka.
5. Each party can submit one rating and one one-line comment per completed session. Ratings and comments cannot be edited after submission.
6. The 15% commission is calculated from the completed session price before the Tutor payout.
7. All prices are in Sri Lankan Rupees (LKR), and all times are shown in Sri Lanka time.
8. If a Tutor cancels, or declines after payment, the Student gets a full refund.
9. Payment gateway fees are paid by LearnLanka and are not deducted from the Tutor's share.
10. A Tutor sets their own hourly price. LearnLanka does not set or limit it.
11. Users get notifications for bookings, cancellations, and payouts through notification or SMS.


## 6. Out of Scope

1.	Building or operating LearnLanka's own payment-card processing infrastructure.
2.	Creating a native iOS application.
3.	AI-based tutor recommendations or automated tutor matching.
4.	Group tutoring or multi-student classes.
5.	Public tutor advertising or promotion tools.
6.	Advanced learning-management features such as assignments, grading, course content, or progress tracking.
7.	International currencies and international payment methods.
