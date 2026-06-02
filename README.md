# PeerTutor — Peer-to-Peer University Tutoring Platform

> 🎓 **Book tutors. Pay securely. Learn better.** — A full-stack tutoring marketplace for university students.

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-green?logo=mongodb)](https://mongoosejs.com/)
[![Socket.io](https://img.shields.io/badge/Socket.io-Realtime-white?logo=socket.io&logoColor=black)](https://socket.io/)
[![Stripe](https://img.shields.io/badge/Stripe-Checkout-635bff?logo=stripe)](https://stripe.com/)

---

PeerTutor is a production-grade peer-to-peer tutoring marketplace where students find, book, and pay tutors — all without leaving the platform. It supports real-time chat, automated invoice generation, multi-gateway payment checkout, and per-role dashboards for students and tutors.

---

## 🚀 Key Architectural Pillars

- **Decoupled Multi-Gateway Payments**: Integrates Stripe, PayFast (JazzCash/Easypaisa), and FastPay. Auto-switches to interactive local sandbox mocks if credentials are absent — so the flow is always testable.
- **State-Machine Session Lifecycle**: Sessions advance through explicit states (`pending → accepted → paid → verified → reviewed`), preventing invalid transitions server-side.
- **Real-time Messaging**: Socket.io WebSocket server co-deployed alongside the Next.js API — shared auth, minimal overhead.
- **Role-Aware Dashboards**: Students see bookings and payment history; Tutors see earnings, withdrawal ledger, and per-session verification queue.

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | Next.js 15 (App Router), React 19, TypeScript |
| **Styling** | Tailwind CSS 4 with custom design tokens & glassmorphic UI |
| **Database** | MongoDB + Mongoose with compound indexes |
| **Auth** | JWT in HTTP-Only, SameSite=Lax cookies |
| **Real-time** | Socket.io — bidirectional messaging channel |
| **Payments** | Stripe Checkout · PayFast · FastPay (+ local sandbox fallback) |

---

## 🗺️ Session Lifecycle — Activity Diagram

> From the moment a student searches to a tutor getting paid — every state, every actor, every branch.

```mermaid
flowchart TD
    A([🎓 Student Opens Platform]) --> B[Search Tutors by Subject / Price / Rating]
    B --> C{Tutor found?}
    C -- No --> B
    C -- Yes --> D[📅 Select Available Time Slot]
    D --> E[Submit Booking Request]

    E --> F{⏳ Awaiting Tutor Response}
    F -- ❌ Declined --> G[Notify Student: Declined\nSuggest Alternative Tutors]
    G --> B
    F -- ✅ Accepted --> H[Session Confirmed!]

    H --> I[💬 Student & Tutor Chat Opens]
    I --> J[Session Day Arrives]

    J --> K[Choose Payment Method]
    K --> K1{Gateway}
    K1 -- JazzCash / Easypaisa --> L1[🟢 PayFast / FastPay API Call]
    K1 -- Credit / Debit Card --> L2[🟣 Stripe Checkout Session]
    K1 -- Bank Transfer --> L3[🏦 Manual Reference Generated]

    L1 --> M{Credentials\nconfigured?}
    L2 --> M
    M -- Yes --> N[🔒 Redirect to Live Gateway]
    M -- No --> N2[🛡️ Redirect to Sandbox Mock Gateway]
    N --> O[Student Authenticates Payment]
    N2 --> O
    L3 --> O

    O --> P{Payment\nOutcome}
    P -- ❌ Failed / Cancelled --> Q[Show Error Card\nAllow Retry]
    Q --> K
    P -- ✅ Success --> R[📋 Callback: Persist Transaction to DB]

    R --> S[Generate Invoice Automatically]
    S --> T[🔔 Notify Tutor: Payment Received]

    T --> U{Tutor Verifies\nPayment Receipt}
    U -- ❌ Disputes --> V[Flag for Admin Review]
    U -- ✅ Confirmed --> W[Mark Earnings as Available]

    W --> X[Session Completed ✅]
    X --> Y[Student Leaves Rating & Review ⭐]
    Y --> Z[Tutor Requests Withdrawal 💸]
    Z --> ZZ([🎉 Cycle Complete])

    style A fill:#4f46e5,color:#fff,stroke:none
    style ZZ fill:#059669,color:#fff,stroke:none
    style Q fill:#dc2626,color:#fff,stroke:none
    style V fill:#d97706,color:#fff,stroke:none
    style N fill:#7c3aed,color:#fff,stroke:none
    style N2 fill:#0891b2,color:#fff,stroke:none
    style H fill:#16a34a,color:#fff,stroke:none
```

---

## 💳 Payment Gateway Sequence

```mermaid
sequenceDiagram
    autonumber
    actor 🎓 Student
    participant Client as PeerTutor Client
    participant Server as PeerTutor Server
    participant GW as Payment Gateway API
    participant CB as Callback Page

    🎓 Student->>Client: Click "Pay Now" & select method
    Client->>Server: POST /api/sessions/[id]/pay { initiate: true }
    Note over Server: Checks env for gateway credentials
    alt 🔑 Credentials Found
        Server->>GW: Call Stripe / PayFast / FastPay
        GW-->>Server: redirectUrl + session token
    else 🛡️ Fallback (No Credentials)
        Server-->>Server: Generate local mock-gateway URL
    end
    Server-->>Client: Return redirectUrl
    Client->>🎓 Student: Redirect to checkout page
    🎓 Student->>Client: Authenticate (OTP / card / PIN)
    Client->>CB: Redirect to /dashboard/payments/callback
    CB->>Server: POST /pay { transactionId, paymentMethod }
    Server->>Server: Persist Payment record + mark session "paid"
    Server-->>CB: 200 OK
    CB->>🎓 Student: 🎉 Success card with receipt
```

---

## 📂 Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/               # Register · Login · Logout · Delete account
│   │   ├── sessions/[id]/      # Booking CRUD · Pay · Verify · Review
│   │   ├── tutor/              # Earnings · Withdrawals · Invoices
│   │   └── messages/           # Conversations · Send · Mark read
│   └── dashboard/
│       ├── payments/
│       │   ├── callback/       # Post-redirect status verification
│       │   └── mock-gateway/   # Interactive sandbox checkout emulator
│       └── sessions/           # Student & Tutor session tables
├── features/
│   ├── payments/               # PaymentGatewayModal · InvoiceViewer
│   └── sessions/               # All session REST handlers (server-side)
├── models/
│   ├── User.ts · Session.ts · Payment.ts
│   ├── Withdrawal.ts · Invoice.ts
│   └── Message.ts · Conversation.ts
└── lib/
    ├── paymentService.ts       # FastPay · PayFast · Stripe API clients
    ├── auth.ts                 # JWT sign / verify
    └── db.ts                   # Mongoose connection pool
```

---

## ⚙️ Setup & Installation

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

### Steps

```bash
# 1. Clone & install
git clone https://github.com/HaseebUllahButt/PeerTutor.git
cd PeerTutor
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env — at minimum set MONGODB_URI and JWT_SECRET
# Leave payment keys blank → automatically uses sandbox mock gateways

# 3. (Optional) Seed demo data
npx ts-node scripts/seed-payments.ts

# 4. Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🎯 End-to-End Testing Checklist

| Step | Action |
| :--- | :--- |
| 1️⃣ Register | Sign up as **Student** |
| 2️⃣ Book | Search → select tutor → pick slot → submit |
| 3️⃣ Accept | Log in as **Tutor** → My Sessions → Accept |
| 4️⃣ Pay | Back as **Student** → Pay Now → choose JazzCash / Stripe |
| 5️⃣ Gateway | Redirected to checkout (live or sandbox mock) |
| 6️⃣ Callback | Automatic redirect back → success card shown |
| 7️⃣ Verify | Tutor confirms receipt of payment |
| 8️⃣ Withdraw | Tutor requests payout to JazzCash / bank |

---

## 🔌 API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register student or tutor |
| `POST` | `/api/auth/login` | Login & receive session cookie |
| `GET` | `/api/sessions` | List all sessions for current user |
| `POST` | `/api/sessions/[id]/pay` | Initiate or finalize payment |
| `POST` | `/api/sessions/[id]/verify-payment` | Tutor confirms receipt |
| `GET` | `/api/tutor/earnings` | Earnings breakdown with monthly chart data |
| `POST` | `/api/tutor/withdraw` | Request withdrawal to mobile wallet / bank |
| `POST` | `/api/messages` | Send real-time chat message |
