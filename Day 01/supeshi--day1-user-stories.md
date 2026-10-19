# LearnLanka — User Story Set v0.1
	
## Story 1: Search for tutors

**As a** Student
**I want** to search for tutors by subject, grade, language, and price band
**So that** I can quickly find a tutor who suits my needs

### Acceptance Criteria

- **Given** a logged-in Student on the search screen **when** they select subject "Biology", language "Sinhala", and a price band "LKR 5,000 - 8,000" and tap "Search" **then** every result matches all selected filters.
- **Given** a search has results **when** the results load **then** each card shows the Tutor's name, language, hourly price, and average rating.
- **Given** a valid search is submitted **when** the results are returned **then** the first page returned within 800 ms at the 95th percentile.
- **Given** no Tutor matches the filters **when** the search finishes **then** the Student sees a "No tutors found" message and a prompt to change the filters.

### INVEST self-check

- [ ] Independent
- [x] Negotiable
- [x] Valuable
- [x] Estimable
- [x] Small
- [x] Testable
	
---

## Story 2: Book and pay for a one-hour session

**As a** Student
**I want** to book an available one-hour slot and pay by card or eZ Cash
**So that** my session is secured with the tutor I chose
	
### Acceptance Criteria

- **Given** a Tutor has an available slot **when** the Student selects it and submits a booking **then** the booking is created with status "pending".
- **Given** the Tutor has accepted the booking **when** the Student pays by card or eZ Cash and the payment succeeds **then** the booking status changes to "confirmed" and the Student receives a notification.
- **Given** the payment fails **when** the Student returns to the app **then** no confirmed booking exists and the Student sees a clear failure message with a retry option.

### INVEST self-check

- [x] Independent
- [x] Negotiable
- [x] Valuable
- [x] Estimable
- [ ] Small 
- [x] Testable
	
---

## Story 3: Publish availability slots

**As a** Tutor
**I want** to publish and remove my available time slots
**So that** Students can only book times when I am actually available.

### Acceptance Criteria

- **Given** an approved Tutor on the availability screen **when** they add a one-hour slot for a future date and time **then** the slot appears in search and on their profile.
- **Given** a slot is already booked **when** another Student views the Tutor's profile **then** that slot is not shown.
- **Given** a slot has no booking **when** the Tutor removes it **then** it disappears from the Tutor's profile immediately.
- **Given** the Tutor tries to add a slot in the past **when** they save **then** the system rejects it with an error message.

### INVEST self-check

- [x] Independent
- [x] Negotiable
- [x] Valuable
- [x] Estimable
- [x] Small
- [x] Testable

---

## Story 4: Accept or decline a booking request

**As a** Tutor
**I want** to accept or decline each booking request
**So that** I only teach sessions that I can actually deliver

### Acceptance Criteria

- **Given** a Student has submitted a booking request **when** the Tutor opens their requests **then** they see the Student's name, grade, subject, and the requested date and time.
- **Given** a pending request **when** the Tutor taps "Accept" **then** the status changes to "accepted" and the Student is notified to pay.
- **Given** a pending request **when** the Tutor taps "Decline" **then** the status changes to "declined", the slot becomes available again, and the Student is notified.
- **Given** a request is still pending when the session start time passes **when** the time is reached **then** the request expires and the Student is notified. (The expiry rule needs to be confirmed.)

### INVEST self-check

- [ ] Independent 
- [x] Negotiable
- [x] Valuable
- [ ] Estimable 
- [x] Small
- [x] Testable

---

## Story 5: Approve or reject a Tutor

**As an** Operations Admin
**I want** to review and approve or reject new Tutors
**So that** only vetted Tutors appear to Students

### Acceptance Criteria

- **Given** a new Tutor has registered **when** the Admin opens the review list **then** the Tutor appears with status "pending approval" and their submitted details.
- **Given** a pending Tutor **when** the Admin approves them **then** the Tutor can publish slots and appears in search results.
- **Given** a pending Tutor **when** the Admin rejects them **then** the Tutor does not appear in search and is notified of the rejection.
- **Given** a user who is not an Operations Admin **when** they try to open the review list **then** access is denied.

### INVEST self-check

- [x] Independent
- [x] Negotiable
- [x] Valuable
- [ ] Estimable 
- [x] Small
- [x] Testable

---

## Story 6: Run the weekly Tutor payout

**As an** Operations Admin
**I want** to see each Tutor's weekly earnings after the 15% commission and prepare the bank transfer
**So that** Tutors are paid correctly and on time

### Acceptance Criteria

- **Given** it is the weekly payout day **when** the Admin opens the payout screen **then** each Tutor with completed sessions in the previous week is listed with gross amount, 15% commission, and net amount.
- **Given** a session was cancelled or refunded **when** the payout is calculated **then** it is not included and no commission is charged on it.
- **Given** a payout is listed **when** the Admin marks it as paid or failed **then** the status is recorded with the date, and the Tutor can see it.
- **Given** a Tutor has no saved bank details **when** the payout is calculated **then** that Tutor is flagged and excluded from the transfer file.

### INVEST self-check

- [ ] Independent 
- [x] Negotiable
- [x] Valuable
- [ ] Estimable 
- [ ] Small 
- [x] Testable

