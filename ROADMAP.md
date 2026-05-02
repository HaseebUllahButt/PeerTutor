# PeerTutor Development Roadmap - Complete

**Status**: Post Phase 2 (Advanced Scheduling + Session Management)
**Last Updated**: May 2, 2026

---

## ✅ COMPLETED - What Has Been Done

### Phase 0: Foundation & Auth (Foundation)
1. ✅ User authentication (JWT + cookies)
2. ✅ User model with student/tutor roles
3. ✅ Session model with booking system
4. ✅ MongoDB database setup
5. ✅ Registration & login endpoints
6. ✅ Account deletion with cascade

### Phase 1: Tutor Profile & Availability (Foundation)
1. ✅ Simple availability (same hours all week)
2. ✅ Advanced availability (different hours per day)
3. ✅ Block unavailable slots (manual blocking)
4. ✅ Availability API with real-time slot generation
5. ✅ Tutor profile page with schedule editor
6. ✅ Search tutors with filtering

### Phase 2: Student Booking & Session Management (Complete)
1. ✅ **Tutor search & discovery**
   - Search page with tutor cards
   - Filter by subject/price/rating
   - Display tutor stats (rating, rate, cancellation rate)

2. ✅ **Enhanced booking modal**
   - Step 1: Select date/time + subject
   - Step 2: Review booking details
   - Tutor info preview (rating, rate, cancel rate, bio)
   - Session duration & pricing display
   - 24-hour acceptance window info

3. ✅ **Session management - Student side**
   - View all booked sessions
   - Filter by status (all/pending/accepted/declined)
   - Cancel sessions with optional reason
   - See cancellation status in history

4. ✅ **Session management - Tutor side**
   - View pending booking requests
   - Accept/decline requests
   - View accepted sessions history
   - Cancel accepted sessions with reason tracking

5. ✅ **Session completion flow**
   - Sessions marked complete only after scheduled time
   - "Mark as Complete" button for tutor
   - Session enters completed state with timestamp

6. ✅ **Session ratings & reviews**
   - Student rates session (1-5 stars)
   - Optional review text
   - Rating modal UI
   - Tutor average rating auto-calculated

7. ✅ **Cancellation rate tracking**
   - Auto-calculated when tutor cancels
   - Formula: (cancelledCount / totalSessions) * 100
   - Displayed on tutor cards (search page)
   - Displayed on tutor profile
   - Color-coded (red if >20%)

### Phase 3: UI/UX Polish (Complete)
1. ✅ Improved booking modal with 2-step flow
2. ✅ Better time slot visualization
3. ✅ Professional modal header with tutor stats
4. ✅ Review step before confirmation
5. ✅ Enhanced styling & visual hierarchy

---

## 📊 Current Status by Feature Area

| Feature | Status | Progress |
|---------|--------|----------|
| Authentication | ✅ Complete | 100% |
| Tutor Profiles | ✅ Complete | 100% |
| Availability Management | ✅ Complete | 100% |
| Student Search | ✅ Complete | 100% |
| Booking Flow | ✅ Complete | 100% |
| Session Management | ✅ Complete | 100% |
| Ratings & Reviews | ✅ Complete | 100% |
| Cancellation Tracking | ✅ Complete | 100% |
| Earnings Dashboard UI | 🔶 Partial | 20% |
| Payment Processing | ❌ Not Started | 0% |
| Messaging | ❌ Not Started | 0% |
| Analytics | 🔶 Partial | 30% |
| Admin Dashboard | ❌ Not Started | 0% |

---

## ⏳ TO DO - Next 6+ Phases

### **PHASE 4: Messaging & Communication**

**Purpose**: Enable real-time tutor-student communication

#### Phase 4 Step 1: Message Model & API
- [ ] Create Message schema (sender, receiver, content, timestamp, read status)
- [ ] Create Conversation schema (participants, last message, createdAt)
- [ ] Message endpoints:
  - `POST /api/messages` - Send message
  - `GET /api/conversations` - Get all conversations
  - `GET /api/conversations/[id]/messages` - Get messages in conversation
  - `PATCH /api/messages/[id]` - Mark as read

#### Phase 4 Step 2: Messaging UI - Student Side
- [ ] Messages page with conversation list
- [ ] Unread badge on conversations
- [ ] Click to open conversation detail
- [ ] Message input & send button
- [ ] Message timestamps
- [ ] Scroll to latest message

#### Phase 4 Step 3: Messaging UI - Tutor Side
- [ ] Same as student (symmetric)
- [ ] Notifications for new messages
- [ ] Quick reply from booking requests

#### Phase 4 Step 4: Real-time Features (Optional)
- [ ] WebSocket integration (Socket.io)
- [ ] Live message delivery
- [ ] "User is typing..." indicator
- [ ] Online/offline status

---

### **PHASE 5: Earnings & Payment Integration**

**Purpose**: Track tutor earnings and process payments

**Current Status**: 🔶 PARTIALLY IMPLEMENTED (UI only, 20% complete)
- ✅ Earnings dashboard UI exists
- ✅ Shows session breakdown with earnings
- ✅ Displays total earned (placeholder calculation)
- ❌ NO Payment model in database
- ❌ NO Payment API endpoints
- ❌ Hardcoded Rs. 500 per session (should use tutor's hourly rate)
- ❌ No actual payment processing
- ❌ No withdrawal system
- ❌ No invoice generation

#### Phase 5 Step 1: Payment Model & Earnings Tracking
- [ ] Create Payment schema (amount, session, tutor, status, timestamp)
- [ ] Auto-create payment record when session completed
- [ ] Earnings calculation = completed sessions × tutor's hourly rate (not hardcoded 500)
- [ ] Track payment status: pending → processed → paid
- [ ] Create Withdrawal model (amount, bank_account, status, date)

#### Phase 5 Step 2: Earnings Backend API
- [ ] `GET /api/tutor/earnings` - Monthly/yearly breakdown
- [ ] `GET /api/tutor/payments` - Payment history
- [ ] `POST /api/tutor/withdraw` - Request withdrawal
- [ ] `GET /api/tutor/payouts` - Payout history
- [ ] Payment calculation logic

#### Phase 5 Step 3: Enhance Earnings Dashboard UI
- [ ] Use real hourly rates from tutor profile (not hardcoded 500)
- [ ] Show earnings breakdown: pending vs completed
- [ ] Monthly earnings graph/chart
- [ ] Filter by date range
- [ ] Withdraw funds UI (bank account form)
- [ ] Payout history

#### Phase 5 Step 4: Payment Integration (Choose One)
- [ ] Stripe integration (international)
- [ ] JazzCash integration (Pakistan)
- [ ] EasyPaisa integration (Pakistan)
- [ ] Payment processing on student side
- [ ] Auto-release to tutor after completion (or N days)

#### Phase 5 Step 5: Invoice & Receipts
- [ ] Generate PDF invoices
- [ ] Email receipts to student & tutor
- [ ] Invoice archive in user dashboard

---

### **PHASE 6: Notifications & Alerts**

**Purpose**: Keep users informed of important events

#### Phase 6 Step 1: Notification Model & System
- [ ] Create Notification schema (user, type, content, read, createdAt)
- [ ] Notification types: booking_request, booking_accepted, session_complete, new_message, etc.
- [ ] Notification endpoints:
  - `GET /api/notifications` - Get all notifications
  - `PATCH /api/notifications/[id]` - Mark as read
  - `DELETE /api/notifications/[id]` - Delete

#### Phase 6 Step 2: In-App Notifications
- [ ] Bell icon in header with unread count
- [ ] Notification dropdown panel
- [ ] Clear old notifications

#### Phase 6 Step 3: Email Notifications
- [ ] Email templates for each event type
- [ ] Send email on: booking request, acceptance, rejection, session reminder (24h before)
- [ ] Email preference settings

#### Phase 6 Step 4: Push Notifications (Optional)
- [ ] Browser push notifications
- [ ] Mobile push (if app exists)
- [ ] Permission handling

---

### **PHASE 7: Reviews & Testimonials System**

**Purpose**: Build social proof and trust

#### Phase 7 Step 1: Enhanced Review Model
- [ ] Extend rating to include: comment, anonymous option, helpful counter
- [ ] Create Review schema (rating, comment, student, tutor, session, verified purchase)
- [ ] Review moderation (flag inappropriate content)

#### Phase 7 Step 2: Tutor Reviews Page
- [ ] Public reviews page showing all ratings/comments
- [ ] Filter by rating (5★, 4★, etc.)
- [ ] Sort by recent/helpful/rating
- [ ] Tutor response to reviews
- [ ] Review statistics chart

#### Phase 7 Step 3: Student Reviews (Optional)
- [ ] Tutors can rate students (punctuality, communication, etc.)
- [ ] Mutual review system
- [ ] Student badges (reliable, great communicator, etc.)

#### Phase 7 Step 4: Testimonials Display
- [ ] Featured reviews on tutor profile
- [ ] Review highlights on tutor card (search page)
- [ ] Aggregate stats (avg rating, total reviews)

---

### **PHASE 8: Admin Dashboard & Moderation**

**Purpose**: Monitor platform health and manage users

#### Phase 8 Step 1: Admin Panel Setup
- [ ] Create Admin role in User model
- [ ] Admin authentication & authorization
- [ ] Admin-only routes protection
- [ ] Admin dashboard layout

#### Phase 8 Step 2: User Management
- [ ] View all users (students/tutors)
- [ ] User status: active/suspended/banned
- [ ] Suspend/ban users
- [ ] View user details & sessions
- [ ] Delete user account (admin action)

#### Phase 8 Step 3: Session Management & Disputes
- [ ] View all sessions with status
- [ ] Dispute resolution interface
- [ ] Approve/deny refund requests
- [ ] Handle cancellation appeals

#### Phase 8 Step 4: Platform Analytics
- [ ] Total users, sessions, revenue
- [ ] Active users (weekly/monthly)
- [ ] Top tutors by rating/earnings
- [ ] Cancellation rate monitoring
- [ ] Revenue breakdown

#### Phase 8 Step 5: Content Moderation
- [ ] Flag inappropriate reviews/messages
- [ ] Review flagged content
- [ ] Delete offensive reviews
- [ ] Warn/suspend users for violations

---

### **PHASE 9: Advanced Features & Optimizations**

**Purpose**: Add competitive features and improve performance

#### Phase 9 Step 1: Tutor Verification & Badges
- [ ] Document upload (ID, degree)
- [ ] Manual admin verification
- [ ] "Verified" badge on profile
- [ ] Trust score calculation

#### Phase 9 Step 2: Session Rescheduling
- [ ] Allow student to propose reschedule
- [ ] Tutor approve/reject reschedule
- [ ] Automatic slot release & rebooking

#### Phase 9 Step 3: Group Sessions
- [ ] Allow tutors to offer group sessions
- [ ] Multiple students booking same time
- [ ] Group session management

#### Phase 9 Step 4: Performance Tracking
- [ ] Cache frequently accessed tutors
- [ ] Optimize search queries
- [ ] CDN for static assets
- [ ] Database indexing

#### Phase 9 Step 5: Mobile Responsiveness
- [ ] Test all pages on mobile
- [ ] Optimize modal sizing
- [ ] Touch-friendly buttons
- [ ] Mobile-first CSS

---

### **PHASE 10: Testing & Quality Assurance**

**Purpose**: Ensure reliability and correctness

#### Phase 10 Step 1: Unit Tests
- [ ] Test utility functions
- [ ] Test validation logic
- [ ] Test calculations (earnings, ratings, etc.)

#### Phase 10 Step 2: Integration Tests
- [ ] Test API endpoints
- [ ] Test booking flow end-to-end
- [ ] Test payment flow
- [ ] Test messaging

#### Phase 10 Step 3: E2E Tests (Cypress/Playwright)
- [ ] Test complete user journeys
- [ ] Test edge cases
- [ ] Test error states

#### Phase 10 Step 4: Bug Fixes & Polish
- [ ] User testing feedback
- [ ] Performance optimization
- [ ] UI/UX refinements
- [ ] Accessibility audit

---

### **PHASE 11: Deployment & Launch**

**Purpose**: Release to production

#### Phase 11 Step 1: Infrastructure Setup
- [ ] Choose hosting (Vercel, AWS, etc.)
- [ ] Database backup & replication
- [ ] CDN setup
- [ ] SSL certificate

#### Phase 11 Step 2: Environment Configuration
- [ ] Production environment variables
- [ ] Email service setup (SendGrid, etc.)
- [ ] Payment service production keys
- [ ] Monitoring & logging setup

#### Phase 11 Step 3: Pre-Launch Testing
- [ ] Load testing
- [ ] Security audit
- [ ] Penetration testing
- [ ] User acceptance testing (UAT)

#### Phase 11 Step 4: Launch & Monitoring
- [ ] Deploy to production
- [ ] Monitor for errors
- [ ] Set up alerts
- [ ] Beta user feedback collection

---

## 📈 Estimated Timeline

| Phase | Duration | Priority | Difficulty |
|-------|----------|----------|-----------|
| Phase 4 (Messaging) | 5-7 days | HIGH | Medium |
| Phase 5 (Payments) | 7-10 days | HIGH | Hard |
| Phase 6 (Notifications) | 3-5 days | HIGH | Easy-Medium |
| Phase 7 (Reviews) | 3-4 days | MEDIUM | Easy |
| Phase 8 (Admin) | 5-7 days | MEDIUM | Medium |
| Phase 9 (Advanced) | 5-7 days | LOW | Medium-Hard |
| Phase 10 (Testing) | 5-7 days | HIGH | Medium |
| Phase 11 (Launch) | 3-5 days | HIGH | Medium |
| **TOTAL** | **36-52 days** | - | - |

---

## 🎯 Immediate Next Steps (Recommended Order)

1. **Phase 5 (Payments)** ← **START HERE** - UI exists, needs backend + integration (7-10 days)
2. **Phase 4 (Messaging)** - Critical for UX, enable communication (5-7 days)
3. **Phase 6 (Notifications)** - Keep users informed, reduce confusion (3-5 days)
4. **Phase 7 (Reviews)** - Build trust & social proof (3-4 days)
5. **Phase 8 (Admin)** - Manage platform health (5-7 days)
6. **Phase 9 (Advanced)** - Competitive advantages (5-7 days)
7. **Phase 10 (Testing)** - Quality assurance (5-7 days)
8. **Phase 11 (Launch)** - Go live! (3-5 days)

---

## 📁 Current Codebase Status

### Models
- ✅ User.ts - Complete
- ✅ Session.ts - Complete
- 📋 Message.ts - Not started
- 📋 Payment.ts - Not started
- 📋 Notification.ts - Not started
- 📋 Review.ts - Not started

### API Endpoints (14 routes)
- ✅ Auth (register, login, logout, me, delete)
- ✅ Tutors (list, detail, availability)
- ✅ Sessions (CRUD, cancel, complete, review)
- 📋 Messages - Not started
- 📋 Payments - Not started
- 📋 Notifications - Not started

### Pages (14 pages)
- ✅ Auth (login, register)
- ✅ Dashboard (overview, search, sessions, requests, profile, students)
- 📋 Messages - Partial (UI only, no logic)
- 📋 Earnings - Partial (UI only, no logic)
- 📋 Reports - Partial (UI only, no logic)
- 📋 Settings - Basic (delete account only)
- 📋 Admin - Not started
- 📋 Users - Not started

### Components (12+ components)
- ✅ DashboardShell
- ✅ BookingCalendar
- ✅ CancellationModal
- ✅ RatingModal
- ✅ StudentDashboard
- ✅ TutorDashboard
- 📋 MessagingPanel - Not started

---

## 🎨 Design System (Established)
- Color palette: ink, paper, gold, emerald, canvas, border, danger
- Fonts: Playfair Display (display), DM Sans (body)
- Component patterns: CSS variables, Zod validation, React hooks

---

## 💾 Build & Deployment
- **Current Build Status**: ✅ Passing (No errors)
- **Deployment**: Ready for Vercel/hosting
- **Environment**: .env configured
- **Database**: MongoDB connected

---

## 🔒 Security Considerations
- ✅ JWT authentication
- ✅ Password hashing
- ✅ Role-based access control
- 📋 Rate limiting (needed)
- 📋 Input sanitization (needed)
- 📋 CSRF protection (needed)
- 📋 XSS protection (needed)

---

## 📞 Support & Documentation
- [ ] API documentation (Swagger/OpenAPI)
- [ ] User guide
- [ ] Admin guide
- [ ] Developer documentation
- [ ] FAQ

---

**Next Action**: Start Phase 4 (Messaging) or Phase 5 (Payments)?
