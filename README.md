# PeerTutor - University Tutoring Platform

A complete peer-to-peer tutoring platform built for university students. Students can find tutors, book sessions, process payments, and communicate in real-time.

## Features

### For Students
- **Find Tutors**: Search by subject, price, and rating
- **Book Sessions**: Interactive calendar with real-time availability
- **Secure Payments**: Multiple payment methods (JazzCash, EasyPaisa, Stripe, Bank Transfer)
- **Real-Time Chat**: Message tutors before and after booking
- **Session Management**: View, cancel, and rate completed sessions
- **Payment History**: Track all payments and download invoices

### For Tutors
- **Profile Management**: Set hourly rates, subjects, and availability
- **Schedule Control**: Block unavailable time slots
- **Booking Requests**: Accept or decline student requests
- **Earnings Dashboard**: Track income with monthly breakdowns
- **Payment Verification**: Confirm receipt of student payments
- **Withdrawals**: Request earnings payout

### Platform
- **Real-Time Messaging**: WebSocket-powered chat system
- **Payment Processing**: End-to-end payment flow with verification
- **Invoice Generation**: Automatic PDF-ready invoices
- **Rating System**: Post-session reviews with average calculation
- **Account Management**: Profile editing and account deletion

## Tech Stack

- **Frontend**: Next.js 16 + React 19 + TypeScript
- **Styling**: Tailwind CSS 4 with custom design system
- **Database**: MongoDB + Mongoose
- **Authentication**: JWT with HTTP-only cookies
- **Real-Time**: Socket.io for messaging
- **Fonts**: Playfair Display (headings) + DM Sans (body)

## Project Structure

```
src/
├── app/                    # Next.js app router
│   ├── api/               # API endpoints
│   │   ├── auth/          # Authentication
│   │   ├── sessions/      # Session management + payments
│   │   ├── tutor/         # Tutor earnings, withdrawals
│   │   ├── messages/      # Chat system
│   │   └── socket/        # WebSocket server
│   └── dashboard/         # Dashboard pages
├── components/            # React components
│   ├── dashboard/         # Dashboard shell, navigation
│   └── payment/           # Payment gateway, invoices
├── models/                # Mongoose schemas
│   ├── User.ts
│   ├── Session.ts         # Extended with payment fields
│   ├── Payment.ts
│   ├── Withdrawal.ts
│   ├── Invoice.ts
│   ├── Message.ts
│   └── Conversation.ts
└── lib/                   # Utilities
    ├── auth.ts           # JWT handling
    ├── db.ts             # Database connection
    └── socket.ts         # Socket client
```

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB instance

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd PeerTutor
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables (`.env`):
```
MONGODB_URI=mongodb://localhost:27017/peertutor
JWT_SECRET=your-secret-key
NEXT_PUBLIC_API_URL=http://localhost:3000
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

### Build for Production
```bash
npm run build
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `DELETE /api/auth/delete` - Delete account

### Sessions
- `GET /api/sessions` - List sessions
- `POST /api/sessions` - Create booking
- `PATCH /api/sessions/[id]` - Update session
- `POST /api/sessions/[id]/pay` - Process payment
- `POST /api/sessions/[id]/verify-payment` - Tutor verification
- `POST /api/sessions/[id]/review` - Submit review

### Tutors
- `GET /api/tutors` - Search tutors
- `GET /api/tutors/[id]` - Tutor profile
- `GET /api/tutors/[id]/slots` - Available slots
- `GET /api/tutor/earnings` - Earnings data
- `POST /api/tutor/withdraw` - Request withdrawal

### Messaging
- `GET /api/conversations` - List conversations
- `GET /api/messages` - Get messages
- `POST /api/messages` - Send message
- `POST /api/messages/read` - Mark as read

--- 

