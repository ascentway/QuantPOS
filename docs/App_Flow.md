# QuantPOS — Complete App Flow Document

**Version:** 1.0  
**Date:** January 2024  
**System:** OTP-Based Email Verification (6-digit, 10-minute validity, 1-minute resend cooldown, 5-attempt lockout)  
**Scope:** All 10 Phases, All User Personas, All Features  
**Format:** User Journeys + State Machines + Sequence Diagrams + UI Flows + Error Handling

---

## Table of Contents

1. [Executive Overview](#executive-overview)
2. [OTP System Architecture](#otp-system-architecture)
3. [User Personas & Journeys](#user-personas--journeys)
4. [Phase 1: Authentication & Multi-Tenancy Flows](#phase-1-authentication--multi-tenancy-flows)
5. [Phase 2: Stripe Billing Flows](#phase-2-stripe-billing-flows)
6. [Phase 3: Inventory Management Flows](#phase-3-inventory-management-flows)
7. [Phase 4: POS Terminal Flows](#phase-4-pos-terminal-flows)
8. [Phase 5: Dashboard & Reports Flows](#phase-5-dashboard--reports-flows)
9. [Phase 6: AI Restocking Agent Flows](#phase-6-ai-restocking-agent-flows)
10. [Phase 7: User Management Flows](#phase-7-user-management-flows)
11. [Phases 8-10: Advanced Features](#phases-8-10-advanced-features)
12. [Error Handling & Edge Cases](#error-handling--edge-cases)
13. [API Integration Points](#api-integration-points)

---

## Executive Overview

### OTP-Based Verification System

QuantPOS uses **6-digit OTP (One-Time Password)** sent via email for:
- ✅ **Email verification** during registration
- ✅ **Password reset** flow
- ✅ **Two-factor authentication** (2FA) during login
- ✅ **Team member invitation** acceptance

**Key Parameters:**
| Parameter | Value | Rationale |
|-----------|-------|-----------|
| OTP Length | 6 digits | Industry standard (Google, AWS, banking) |
| Validity | 10 minutes | Enough time for user to check email |
| Resend Cooldown | 1 minute | Prevent spam without frustrating users |
| Max Attempts | 5 | Balance security vs UX |
| Lockout Duration | 15 minutes | Force wait without permanent block |
| Delivery Method | Email (Brevo SMTP) | No SMS provider needed, cost-effective |

### System Architecture Overview

```
User Action
    ↓
QuantPOS App (Frontend)
    ↓
Generate OTP Request → Spring Boot API
    ↓
OTP Service
├─ Generate: Random 6-digit code
├─ Store in Redis: otp:{email} → code (TTL: 10 min)
├─ Send via Brevo: OTP email
└─ Log attempt for rate limiting
    ↓
User receives OTP in email
    ↓
User enters 6 digits in app
    ↓
Validate OTP Request → Spring Boot API
    ↓
OTP Service
├─ Retrieve from Redis
├─ Compare with user input
├─ Delete on success (single-use)
├─ Increment attempt counter on failure
└─ Lock account after 5 attempts
    ↓
Response: Success or Error
```

---

## OTP System Architecture

### OTP Generation & Storage

**Backend OTP Generation:**
```
function generateOTP():
  code = generateRandomSixDigits()  // 000000-999999
  email = getRequestedEmail()
  
  redisStore('otp:' + email, code, TTL=10minutes)
  redisStore('otp:attempts:' + email, 0)
  redisStore('otp:resend_time:' + email, now())
  
  sendOTPEmail(email, code)
  
  return { 
    success: true,
    message: "OTP sent to email",
    expiresIn: 600  // seconds
  }

function validateOTP(email, userInput):
  if isLocked(email):
    return { 
      success: false, 
      error: "Too many attempts. Try again in 15 minutes."
    }
  
  storedOTP = redisGet('otp:' + email)
  if storedOTP is null:
    return { 
      success: false, 
      error: "OTP expired. Request a new one."
    }
  
  if storedOTP != userInput:
    attempts = redisIncrement('otp:attempts:' + email)
    if attempts >= 5:
      redisStore('otp:locked:' + email, true, TTL=15minutes)
      return { 
        success: false, 
        error: "Account locked due to too many attempts."
      }
    return { 
      success: false, 
      error: "Invalid OTP. Attempts remaining: " + (5 - attempts)
    }
  
  // Success
  redisDelete('otp:' + email)
  redisDelete('otp:attempts:' + email)
  return { success: true }
```

**Redis Data Structure:**
```
otp:{email}                    → "123456" (TTL: 10 min)
otp:attempts:{email}           → 2 (TTL: 10 min)
otp:resend_time:{email}        → 1705318200 (epoch)
otp:locked:{email}             → true (TTL: 15 min)
```

**OTP Email Template:**
```
Subject: Your QuantPOS Verification Code

Hi [User Name],

Your QuantPOS verification code is:

    1 2 3 4 5 6

This code will expire in 10 minutes.

If you didn't request this code, please ignore this email.

—
QuantPOS Team
support@quantpos.com
```

---

## User Personas & Journeys

### Persona 1: Sharma (Business Owner - OWNER Role)

**Profile:**
- Age: 45, runs "Sharma General Store" (retail)
- Tech savviness: Medium (WhatsApp, email, basic apps)
- Time availability: Limited (busy with customers)
- Device: Desktop (shop computer) + smartphone

**Journey: Complete Onboarding (Registration → First Sale)**

```
1. DISCOVERY
   ├─ Sees ad on Facebook
   ├─ Clicks "Get Started Free"
   └─ Lands on landing page

2. REGISTRATION
   ├─ Clicks "Sign Up"
   ├─ Fills registration form (5 fields: name, email, password, phone, business details)
   ├─ Clicks "Create Account"
   └─ Shown: "Check your email for verification code"

3. EMAIL CHECK
   ├─ Opens email
   ├─ Reads: "Your QuantPOS verification code is: 123456"
   └─ Copies code (or manually notes it)

4. OTP ENTRY
   ├─ Returns to app
   ├─ Enters OTP in six separate boxes: [1] [2] [3] [4] [5] [6]
   ├─ Auto-focus moves to next box after each digit
   ├─ Click "Verify" or auto-submit on 6th digit
   └─ Shown: "Email verified! Welcome to QuantPOS"

5. BUSINESS SETUP
   ├─ Shown guided tour
   ├─ Adds first 5-10 products (name, price, quantity)
   └─ Skips for now / Completes

6. SUBSCRIPTION SELECTION (Phase 2)
   ├─ Shown pricing page
   ├─ Selects Starter plan ($9/month, 1 terminal)
   ├─ Clicks "Subscribe"
   └─ Redirected to Stripe Checkout

7. PAYMENT
   ├─ Enters card details on Stripe page
   ├─ Payment processed
   └─ Returned to app: "Subscription active!"

8. INVITE TEAM (Phase 7)
   ├─ Clicks "Invite Manager"
   ├─ Enters email: ravi@example.com
   ├─ Sets role: Manager
   └─ Ravi receives invite email

9. FIRST SALE (Phase 4)
   ├─ Clicks "POS Terminal"
   ├─ Searches for product: "Sugar"
   ├─ Clicks product → adds to cart
   ├─ Enters quantity: 2
   ├─ Applies discount: 10%
   ├─ Selects payment method: Cash
   ├─ Clicks "Complete Sale"
   └─ Prints receipt

10. DASHBOARD (Phase 5)
    ├─ Views today's revenue: ₹5,000
    ├─ Sees 15 transactions
    └─ Goes home (11 PM)
```

**Time investment:** 20 minutes (onboarding) + 5 minutes (first product) + 10 minutes (first sale) = 35 minutes

---

### Persona 2: Ravi (Store Manager - MANAGER Role)

**Profile:**
- Age: 28, manages store for Sharma
- Tech savviness: High (comfortable with apps)
- Time availability: Full-time at store
- Device: Smartphone (primary) + desktop

**Journey: Team Member Onboarding (Invitation → First Report View)**

```
1. INVITATION EMAIL
   ├─ Receives email from Sharma
   ├─ Subject: "You're invited to manage Sharma General Store on QuantPOS"
   ├─ Clicks "Accept Invitation"
   └─ Redirected to signup page (pre-filled with email)

2. SIGNUP
   ├─ Form shows: email (pre-filled, can't change)
   ├─ Enters: full name, password
   ├─ Clicks "Create Account"
   └─ Shown: "Check your email for verification code"

3. OTP VERIFICATION
   ├─ Opens email
   ├─ Reads OTP: 654321
   ├─ Enters in app: [6] [5] [4] [3] [2] [1]
   ├─ Clicks "Verify"
   └─ Shown: "Email verified!"

4. LOGIN (First Time)
   ├─ Dashboard shows overview
   ├─ Sharma's store visible
   ├─ Can see products, inventory, sales
   └─ Cannot see: Settings, Billing, Team management

5. DAILY OPERATIONS (Phase 3)
   ├─ Clicks "Inventory"
   ├─ Searches for low-stock items
   ├─ Adjusts quantity for "Coffee Beans": -5 kg (spoiled)
   ├─ Notes adjustment reason: "Quality issue"
   └─ Saves

6. VIEW REPORTS (Phase 5)
   ├─ Clicks "Reports"
   ├─ Filters by date range: Last 7 days
   ├─ Views: Revenue trend, top products, sales by payment method
   └─ Downloads as PDF for Sharma

7. TRIGGER AI AGENT (Phase 6)
   ├─ Clicks "AI Restocking"
   ├─ Clicks "Generate Recommendations"
   ├─ Waits for AI analysis (2-5 seconds)
   ├─ Sees: Purchase order with quantities per product
   ├─ Forwards screenshot to Sharma via WhatsApp
   └─ Done

8. LOGOUT
   ├─ Clicks user menu
   ├─ Clicks "Logout"
   ├─ Returned to login page
```

**Time investment:** 15 minutes (onboarding) + 20 minutes (daily ops) = 35 minutes/day

---

### Persona 3: Priya (Cashier - CASHIER Role)

**Profile:**
- Age: 22, school graduate, first job
- Tech savviness: High (WhatsApp, games, Instagram)
- Time availability: Shift-based (2 PM - 9 PM)
- Device: Smartphone (personal during break) + terminal (store computer)

**Journey: First Day of POS Use**

```
1. TRAINING
   ├─ Sharma shows: "This is the POS terminal"
   ├─ Points to URL: "quantpos.com/pos"
   ├─ Says: "I've already logged in, just use it"
   └─ No login needed (Sharma stayed logged in)

2. FIRST TRANSACTION
   ├─ Customer: "I want sugar and oil"
   ├─ Priya clicks "Search Products"
   ├─ Types: "sugar"
   ├─ Clicks result: "Sugar 5kg - ₹450"
   ├─ Cart shows: 1 × ₹450
   ├─ Types: "oil"
   ├─ Clicks result: "Mustard Oil 500ml - ₹120"
   ├─ Cart shows: 1 × ₹450, 1 × ₹120
   ├─ Total: ₹570
   ├─ Customer says: "I have a loyalty code: SAVE10"
   ├─ Priya applies: Discount 10% = ₹57
   ├─ New total: ₹513
   ├─ Customer pays cash: ₹500
   ├─ Priya enters: ₹500
   ├─ Change: ₹13
   ├─ Clicks "Complete Sale"
   ├─ Receipt prints
   └─ Customer leaves

3. BREAK TIME
   ├─ Sharma not at store (5 PM)
   ├─ Priya notices: "System says 'Login required'"
   ├─ (Access token expired after 30 min inactivity)
   ├─ Shows login screen
   ├─ But Priya doesn't know password
   ├─ Calls Sharma: "I can't access POS"
   ├─ Sharma: "I'll login for you, I'm on my way"

4. SHARMA LOGS IN (with 2FA)
   ├─ Enters email: sharma@example.com
   ├─ Enters password: SharmaSe***
   ├─ Clicks "Login"
   ├─ Shown: "Check your email for OTP"
   ├─ Receives OTP: 999888
   ├─ Enters in app: [9] [9] [9] [8] [8] [8]
   ├─ Shown: "Login successful!"
   ├─ Priya can use POS again

5. END OF SHIFT
   ├─ Priya gives account to Sharma
   ├─ Sharma reviews: "30 transactions, ₹45,000 revenue"
   ├─ Clicks "Logout"
   └─ Priya goes home

**Time investment:** 5 minutes (training) + 2 minutes per transaction × 30 txns = 65 minutes
```

---

## Phase 1: Authentication & Multi-Tenancy Flows

### Flow 1A: User Registration with OTP Verification

**State Machine:**
```
START
  ↓
[REGISTRATION_FORM]
├─ User fills: name, email, password, phone, address
├─ Validates: Format, strength, uniqueness
├─ State: REGISTRATION_PENDING
  ↓
[GENERATE_OTP]
├─ Backend generates 6-digit code
├─ Stores in Redis (10 min TTL)
├─ Sends via Brevo email
├─ State: OTP_SENT
  ↓
[OTP_ENTRY_SCREEN]
├─ User sees: "Enter 6-digit code from email"
├─ Shows: 6 empty boxes with cursor in first
├─ Timer: Counts down from 10:00
├─ State: AWAITING_OTP_INPUT
  ↓
Decision: OTP Input?
├─ Valid OTP → [OTP_VERIFIED]
├─ Invalid OTP → [OTP_INVALID] → back to [OTP_ENTRY_SCREEN]
├─ Expired → [OTP_EXPIRED] → [RESEND_OTP]
├─ 5 attempts → [ACCOUNT_LOCKED] → "Try again in 15 min"
  ↓
[OTP_VERIFIED]
├─ Tenant created (INACTIVE)
├─ User created (OWNER role, email_verified=true)
├─ State: ACCOUNT_ACTIVATED
  ↓
[SUBSCRIPTION_SELECTION]
├─ Shown: Pricing page with 3 plans
├─ State: AWAITING_SUBSCRIPTION
  ↓
Decision: Select Plan?
├─ Yes → [STRIPE_CHECKOUT]
├─ Later → [DASHBOARD_SETUP]
  ↓
[END]
```

**UI Flow - Registration Screen:**
```
┌─────────────────────────────────────┐
│        QuantPOS Sign Up              │
├─────────────────────────────────────┤
│                                     │
│  Business Information               │
│  ┌───────────────────────────────┐ │
│  │ Business Name                 │ │ "Sharma General Store"
│  │ (max 255 characters)          │ │
│  └───────────────────────────────┘ │
│                                     │
│  Business Type *                    │
│  ◉ Retail   ○ Food & Beverage      │
│                                     │
│  Contact Information                │
│  ┌───────────────────────────────┐ │
│  │ Full Name (Owner)             │ │ "Sharma"
│  └───────────────────────────────┘ │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ Email Address                 │ │ "sharma@example.com"
│  │ (You'll verify this)          │ │
│  └───────────────────────────────┘ │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ Phone Number                  │ │ "9876543210"
│  │ (10 digits)                   │ │
│  └───────────────────────────────┘ │
│                                     │
│  Password                           │
│  ┌───────────────────────────────┐ │
│  │ ••••••••• [Show/Hide icon]   │ │
│  │ (Min 8 chars, 1 upper, 1 num)│ │
│  └───────────────────────────────┘ │
│                                     │
│  Address                            │
│  ┌───────────────────────────────┐ │
│  │ Street Address                │ │ "123 Market Street"
│  └───────────────────────────────┘ │
│                                     │
│  ┌──────────────┬──────────────┐  │
│  │ City         │ State        │  │
│  │ "Mumbai"     │ "Maharashtra"│  │
│  └──────────────┴──────────────┘  │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ Pincode                       │ │ "400001"
│  │ (6 digits)                    │ │
│  └───────────────────────────────┘ │
│                                     │
│  ☐ I have a GSTIN (optional)       │
│                                     │
│  [           Create Account         ]│
│                                     │
│  Already have an account? Log in    │
│                                     │
└─────────────────────────────────────┘
```

**UI Flow - OTP Entry Screen:**
```
┌─────────────────────────────────────┐
│    Verify Your Email Address        │
├─────────────────────────────────────┤
│                                     │
│  We sent a 6-digit code to:         │
│  sharma@example.com                 │
│                                     │
│  Enter the code below:              │
│                                     │
│  ┌─────┐ ┌─────┐ ┌─────┐           │
│  │  1  │ │  2  │ │  3  │           │
│  └─────┘ └─────┘ └─────┘           │
│  ┌─────┐ ┌─────┐ ┌─────┐           │
│  │  4  │ │  5  │ │  6  │           │
│  └─────┘ └─────┘ └─────┘           │
│                                     │
│  ⏱ Code expires in: 9:45            │
│                                     │
│  [         Verify Code              ]│
│                                     │
│  Didn't receive code?               │
│  [Resend in 0:45 seconds]           │ ← Disabled for 1 minute
│                                     │
│  [Back to Email]                    │
│                                     │
└─────────────────────────────────────┘

When user enters digits:
- Auto-focus moves to next box
- Backspace goes to previous box
- Shows X if user tries invalid character
- Auto-submits after 6th digit (or user clicks "Verify")
```

**Sequence Diagram - Registration + OTP:**
```
Frontend              Backend              Redis            Brevo
   │                    │                   │                   │
   │─ POST /register ──→│                   │                   │
   │  (email, name, ...)│                   │                   │
   │                    │                   │                   │
   │                    │─ Check email ────→ │                  │
   │                    │  (unique?)         │                  │
   │                    │ ← Exists ─────────  │                 │
   │                    │                   │                   │
   │                    │─ Create tenant ──→ DB                 │
   │                    │ ← Tenant ID ─────────────────────     │
   │                    │                   │                   │
   │                    │─ Generate OTP ────→ │                 │
   │                    │                    (store 10min)      │
   │                    │ ← OTP code ────────  │                │
   │                    │                   │                   │
   │                    │─ Send email ──────────────────────→   │
   │                    │ (OTP in email)      │                 │
   │ ← 200 OK ───────── │                   │         (sent)    │
   │ { success: true }  │                   │                   │
   │                    │                   │                   │
[User checks email - receives OTP]
   │                    │                   │                   │
   │─ POST /verify-otp ─→ │                   │                 │
   │  (email, userOTP)  │                   │                   │
   │                    │─ Get OTP ─────────→ │                 │
   │                    │                    (retrieve)         │
   │                    │ ← OTP code ────────  │                │
   │                    │                   │                   │
   │                    │─ Compare ───────────→ │               │
   │                    │ (match?)            │                 │
   │                    │ ← true ─────────────  │               │
   │                    │                   │                   │
   │                    │─ Delete OTP ──────→ │                 │
   │                    │                    (cleaned up)       │
   │                    │                   │                   │
   │                    │─ Update user ────→ DB                 │
   │                    │ (email_verified=1)  │                 │
   │ ← 200 OK ─────────  │                   │                  │
   │ { success: true }   │                  │                  │
   │                    │                   │                   │
[User sees: "Email verified!"]
```

---

### Flow 1B: Login with OTP-Based 2FA

**State Machine:**
```
START
  ↓
[LOGIN_FORM]
├─ User enters: email, password
├─ State: AWAITING_CREDENTIALS
  ↓
[VALIDATE_CREDENTIALS]
├─ Check email exists
├─ Check email verified
├─ Check password matches (BCrypt)
├─ Check user active
├─ Check tenant active
  ↓
Decision: Credentials Valid?
├─ No → [LOGIN_FAILED] → Show error, back to [LOGIN_FORM]
├─ Yes → [GENERATE_2FA_OTP]
  ↓
[GENERATE_2FA_OTP]
├─ Generate 6-digit OTP
├─ Store in Redis: otp:2fa:{email} (10 min TTL)
├─ Send to email
├─ State: 2FA_OTP_SENT
  ↓
[OTP_ENTRY_SCREEN]
├─ User sees: "Enter 6-digit code to complete login"
├─ State: AWAITING_2FA_OTP
  ↓
Decision: 2FA OTP Valid?
├─ Valid → [GENERATE_TOKENS]
├─ Invalid → [2FA_FAILED] → count attempts
├─ 5 attempts → [2FA_LOCKED] → "Try again in 15 min"
  ↓
[GENERATE_TOKENS]
├─ Create JWT access token (15 min)
├─ Create refresh token (7 days)
├─ Store refresh token in Redis
├─ Update last_login_at
├─ State: LOGIN_SUCCESSFUL
  ↓
[DASHBOARD]
├─ User logged in
├─ Can access all features per role
  ↓
[END]
```

**UI Flow - Login Screen:**
```
┌─────────────────────────────────────┐
│          Log In to QuantPOS         │
├─────────────────────────────────────┤
│                                     │
│  Email Address                      │
│  ┌───────────────────────────────┐ │
│  │ sharma@example.com            │ │
│  └───────────────────────────────┘ │
│                                     │
│  Password                           │
│  ┌───────────────────────────────┐ │
│  │ ••••••••• [Show/Hide icon]   │ │
│  └───────────────────────────────┘ │
│                                     │
│  [           Log In                 ]│
│                                     │
│  [Don't have an account? Sign up]   │
│  [Forgot password?]                 │
│                                     │
└─────────────────────────────────────┘
```

**UI Flow - 2FA OTP Entry (after credentials):**
```
┌─────────────────────────────────────┐
│    Complete Your Login              │
├─────────────────────────────────────┤
│                                     │
│  We sent a 6-digit code to:         │
│  sharma@example.com                 │
│                                     │
│  Enter the code to complete login:  │
│                                     │
│  ┌─────┐ ┌─────┐ ┌─────┐           │
│  │ [ ] │ │ [ ] │ │ [ ] │           │
│  └─────┘ └─────┘ └─────┘           │
│  ┌─────┐ ┌─────┐ ┌─────┐           │
│  │ [ ] │ │ [ ] │ │ [ ] │           │
│  └─────┘ └─────┘ └─────┘           │
│                                     │
│  ⏱ Code expires in: 9:45            │
│                                     │
│  [         Continue                 ]│
│                                     │
│  [Didn't receive code?]             │
│  [Resend in 0:45 seconds]           │
│                                     │
│  [Back to Login]                    │
│                                     │
└─────────────────────────────────────┘
```

---

### Flow 1C: Password Reset with OTP Verification

**State Machine:**
```
START
  ↓
[FORGOT_PASSWORD_PAGE]
├─ User sees: "Enter your email to reset password"
├─ State: AWAITING_EMAIL
  ↓
[EMAIL_ENTRY]
├─ User enters email
├─ Clicks "Send Reset Code"
├─ State: SENDING_RESET_CODE
  ↓
[PASSWORD_RESET_OTP_GENERATION]
├─ Check email exists (but don't reveal)
├─ If exists:
│  ├─ Generate OTP
│  ├─ Store in Redis: otp:password_reset:{email} (10 min TTL)
│  └─ Send via email
├─ Always show: "If email exists, code has been sent"
├─ State: RESET_CODE_SENT
  ↓
[OTP_ENTRY]
├─ User enters OTP from email
├─ State: AWAITING_RESET_OTP
  ↓
Decision: OTP Valid?
├─ Valid → [NEW_PASSWORD_ENTRY]
├─ Invalid → [OTP_INVALID] → back to [OTP_ENTRY]
  ↓
[NEW_PASSWORD_ENTRY]
├─ User enters new password (with strength rules)
├─ Confirms password
├─ State: AWAITING_NEW_PASSWORD
  ↓
[PASSWORD_UPDATE]
├─ Hash new password (BCrypt-12)
├─ Update user in database
├─ Delete OTP from Redis (single-use)
├─ Invalidate all refresh tokens for user (force re-login)
├─ Send confirmation email
├─ State: PASSWORD_RESET_SUCCESSFUL
  ↓
[LOGIN_REDIRECT]
├─ Show: "Password reset successful! Log in with new password"
├─ Redirect to login
  ↓
[END]
```

**UI Flow - Password Reset Screens:**
```
Screen 1: Enter Email
┌─────────────────────────────────────┐
│      Reset Your Password            │
├─────────────────────────────────────┤
│                                     │
│  Enter your email address:          │
│  ┌───────────────────────────────┐ │
│  │ sharma@example.com            │ │
│  └───────────────────────────────┘ │
│                                     │
│  [    Send Reset Code               ]│
│                                     │
│  [Back to Login]                    │
│                                     │
└─────────────────────────────────────┘

Screen 2: Enter OTP
┌─────────────────────────────────────┐
│      Verify Your Email              │
├─────────────────────────────────────┤
│                                     │
│  Enter the 6-digit code sent to:    │
│  sharma@example.com                 │
│                                     │
│  ┌─────┐ ┌─────┐ ┌─────┐           │
│  │ [ ] │ │ [ ] │ │ [ ] │           │
│  └─────┘ └─────┘ └─────┘           │
│  ┌─────┐ ┌─────┐ ┌─────┐           │
│  │ [ ] │ │ [ ] │ │ [ ] │           │
│  └─────┘ └─────┘ └─────┘           │
│                                     │
│  [         Continue                 ]│
│                                     │
│  [Resend Code]                      │
│                                     │
└─────────────────────────────────────┘

Screen 3: Set New Password
┌─────────────────────────────────────┐
│      Set New Password               │
├─────────────────────────────────────┤
│                                     │
│  New Password:                      │
│  ┌───────────────────────────────┐ │
│  │ ••••••••• [Show/Hide]        │ │
│  │ 8+ chars, uppercase, number   │ │
│  └───────────────────────────────┘ │
│                                     │
│  Confirm Password:                  │
│  ┌───────────────────────────────┐ │
│  │ ••••••••• [Show/Hide]        │ │
│  └───────────────────────────────┘ │
│                                     │
│  [       Reset Password             ]│
│                                     │
│  [Back to Login]                    │
│                                     │
└─────────────────────────────────────┘
```

---

## Phase 2: Stripe Billing Flows

### Flow 2A: Subscription Selection & Checkout

**User Journey - Stripe Checkout:**
```
[Dashboard Post-Registration]
  │
  └─ User sees banner:
     "Unlock POS terminal - Subscribe now"
     └─ Clicks "View Plans"

[Pricing Page]
  ├─ Sees 3 plans:
  │  ├─ Starter: 1 terminal, $9/month
  │  ├─ Growth: 3 terminals, $19/month
  │  └─ Enterprise: 10 terminals, $49/month
  │
  └─ Clicks "Select" on Growth plan

[Stripe Checkout Session]
  ├─ Backend creates session
  ├─ Redirects to Stripe-hosted checkout
  │
  └─ Stripe page shows:
     ├─ Plan: Growth ($19.00/month)
     ├─ Billing address form
     ├─ Card details form
     │  (Stripe handles PCI compliance)
     │
     └─ User enters:
        ├─ Name: Sharma
        ├─ Email: sharma@example.com
        ├─ Card: 4242 4242 4242 4242 (test)
        ├─ Expiry: 12/34
        ├─ CVC: 123
        │
        └─ Clicks "Subscribe"

[Payment Processing]
  ├─ Stripe processes payment
  ├─ Webhook: checkout.session.completed
  │  ├─ Backend receives
  │  ├─ Updates tenant.subscription_status = ACTIVE
  │  ├─ Sets terminal_limit = 3
  │  └─ Sends confirmation email
  │
  └─ Redirects to success page

[Success Page]
  ├─ Shows: "Subscription Active!"
  ├─ "You can now use 3 POS terminals"
  ├─ Next steps:
  │  ├─ [Add Products]
  │  ├─ [Invite Manager]
  │  └─ [Go to Dashboard]
  │
  └─ User clicks [Go to Dashboard]

[Dashboard - Now Features Unlocked]
  ├─ POS Terminal button now active
  ├─ Inventory management enabled
  ├─ Reports visible
  ├─ Settings accessible
  │
  └─ User can start operations
```

**Sequence Diagram - Stripe Integration:**
```
Frontend            Backend            Stripe           Redis/DB
   │                   │                  │              │
   │─ Select Plan ────→ │                  │              │
   │                   │                  │              │
   │                   │─ Create Session ─→ │              │
   │                   │                   (with webhook) │
   │ ← Checkout URL ───│ ← Session ID ─────  │              │
   │ (from Stripe)     │                   │              │
   │                   │                   │              │
[Redirect to Stripe Checkout]              │              │
   │ ─────────────────────────────────────→ │              │
   │ (card details, billing address)        │              │
   │                   │                   │              │
   │                   │                   │              │
   │                   │ ← Payment webhook ─│              │
   │                   │ (checkout.session.completed)     │
   │                   │                   │              │
   │                   │─ Update tenant ───────────────────→ DB
   │                   │ (subscription_status = ACTIVE)    │
   │                   │                   │              │
   │                   │─ Store in Redis ────────────────→ │
   │                   │ (subscription:{tenantId})         │
   │                   │                   │              │
   │                   │─ Send email ──────→ │
   │                   │ (confirmation)      │
   │                   │                   │              │
   │ ← Redirect to ────│ ← Return 200 ─────  │              │
   │ success URL       │ (webhook ack)       │              │
   │                   │                   │              │
[Success Page Loads]
   │
```

---

## Phase 3: Inventory Management Flows

### Flow 3A: Add Product to Catalog

**User Journey - Add Product:**
```
[Dashboard]
  └─ Manager clicks "Inventory" → "Add Product"

[Product Form]
  ├─ Fills:
  │  ├─ Product Name: "Sugar (5kg)"
  │  ├─ Category: Select "Groceries"
  │  ├─ SKU: "SUGAR-5KG"
  │  ├─ Barcode: (optional)
  │  ├─ Unit Price: ₹450
  │  ├─ Cost Price: ₹400
  │  ├─ Initial Quantity: 20 units
  │  └─ Low Stock Alert: 5 units
  │
  └─ Clicks "Add Product"

[Backend Processing]
  ├─ Validates all fields
  ├─ Creates product row in DB
  │  └─ tenant_id auto-set from JWT
  │
  ├─ Creates inventory row
  │  ├─ qty_on_hand = 20
  │  ├─ low_stock_threshold = 5
  │  └─ last_updated = now()
  │
  └─ Returns success

[Product List]
  └─ Product appears in list
     └─ "Sugar (5kg)" - ₹450 - Qty: 20
        └─ Owner can now use this in sales
```

### Flow 3B: Inventory Adjustment

**User Journey - Stock Adjustment:**
```
[Inventory List]
  ├─ Sees: "Coffee Beans - Qty: 30"
  ├─ Issues discovered: "2kg spoiled"
  │
  └─ Clicks product → "Adjust Stock"

[Adjustment Form]
  ├─ Shows current qty: 30
  ├─ Adjustment type: Select "Decrement"
  ├─ Quantity to remove: 2
  ├─ Reason: "Spoiled due to humidity"
  ├─ Timestamp: 2024-01-15 3:45 PM
  │
  └─ Clicks "Save Adjustment"

[Backend Processing]
  ├─ Creates inventory_transaction row:
  │  ├─ type = ADJUSTMENT
  │  ├─ qty_change = -2
  │  ├─ reason = "Spoiled due to humidity"
  │  ├─ user_id = Ravi (manager)
  │  └─ created_at = now()
  │
  ├─ Updates inventory row:
  │  ├─ qty_on_hand = 28 (30-2)
  │  └─ last_updated = now()
  │
  └─ Returns success

[Inventory List - Updated]
  └─ Shows: "Coffee Beans - Qty: 28"
     └─ Audit trail accessible
        ├─ Jan 15, 3:45 PM: Adjustment -2 (Ravi)
        ├─ Jan 14, 10:00 AM: Sale -5 (Priya)
        └─ Jan 13, 9:30 AM: Restock +20 (Ravi)
```

---

## Phase 4: POS Terminal Flows

### Flow 4A: Complete Sale Transaction

**State Machine - POS Sale:**
```
START
  ↓
[POS_SCREEN]
├─ Shows:
│  ├─ Product search bar
│  ├─ Product grid (20 items visible, paginated)
│  ├─ Shopping cart (right panel)
│  ├─ Subtotal: ₹0
│  └─ Total: ₹0
├─ State: READY_FOR_INPUT
  ↓
[SEARCH_PRODUCT]
├─ Cashier types: "sugar"
├─ Autocomplete shows: "Sugar 5kg - ₹450"
├─ State: PRODUCT_SEARCHED
  ↓
[SELECT_PRODUCT]
├─ Clicks product
├─ Quantity input appears: 1
├─ Cashier changes: 2 units
├─ State: QUANTITY_SELECTED
  ↓
[ADD_TO_CART]
├─ Clicks "Add to Cart"
├─ Cart updates:
│  ├─ Item 1: Sugar 5kg × 2 = ₹900
│  ├─ Subtotal: ₹900
│  └─ State: ITEM_ADDED
  ↓
[ADD_MORE_ITEMS]
├─ Repeat search for next item
├─ Cashier adds: "Oil 500ml × 1 = ₹120"
├─ Cart now shows 2 items, Subtotal: ₹1,020
├─ State: MORE_ITEMS_ADDED
  ↓
[APPLY_DISCOUNT]
├─ Cashier says customer has promo: "SAVE10"
├─ Clicks "Apply Discount Code"
├─ Enters: "SAVE10"
├─ Discount calculated: 10% = -₹102
├─ New Subtotal: ₹918
├─ State: DISCOUNT_APPLIED
  ↓
[TAX_CALCULATION]
├─ Tax auto-calculated: 5% = ₹45.90
├─ Total: ₹963.90
├─ State: TAX_CALCULATED
  ↓
[PAYMENT_METHOD]
├─ Cashier asks: "How will you pay?"
├─ Customer: "Cash"
├─ Cashier clicks: "Cash" payment method
├─ State: PAYMENT_METHOD_SELECTED
  ↓
[ENTER_PAYMENT_AMOUNT]
├─ Shows: Total = ₹963.90
├─ Cashier enters: ₹1000 (customer gives cash)
├─ Change = ₹36.10
├─ State: AMOUNT_RECEIVED
  ↓
[COMPLETE_SALE]
├─ Clicks "Complete Sale"
├─ State: PROCESSING_SALE
  ↓
[BACKEND_PROCESSING]
├─ Creates sale row:
│  ├─ tenant_id (from JWT)
│  ├─ terminal_id
│  ├─ cashier_id = Priya
│  ├─ subtotal = 1020
│  ├─ discount = -102
│  ├─ tax = 45.90
│  ├─ total = 963.90
│  ├─ payment_method = CASH
│  └─ status = COMPLETED
│
├─ Creates sale_items rows:
│  ├─ Item 1: Sugar × 2 @ ₹450 = ₹900
│  └─ Item 2: Oil × 1 @ ₹120 = ₹120
│
├─ Updates inventory:
│  ├─ Sugar: 20 → 18 (decremented by 2)
│  └─ Oil: 30 → 29 (decremented by 1)
│
├─ Creates inventory_transaction rows:
│  ├─ Sugar: SALE, -2
│  └─ Oil: SALE, -1
│
├─ Generates receipt
│
└─ Returns success
  ↓
[RECEIPT_SCREEN]
├─ Shows:
│  ├─ Receipt ID: SAL-2024-01-15-001
│  ├─ Date/Time: 2024-01-15 4:30 PM
│  ├─ Items:
│  │  ├─ Sugar 5kg × 2 @ ₹450 = ₹900
│  │  └─ Oil 500ml × 1 @ ₹120 = ₹120
│  ├─ Subtotal: ₹1,020
│  ├─ Discount: -₹102
│  ├─ Tax: +₹45.90
│  ├─ Total: ₹963.90
│  ├─ Payment: Cash
│  ├─ Cashier: Priya Sharma
│  ├─ [Print Receipt]
│  └─ [New Sale]
├─ State: RECEIPT_READY
  ↓
[PRINT_RECEIPT]
├─ Browser print dialog
├─ User can print to printer
├─ Or save as PDF
├─ State: RECEIPT_PRINTED
  ↓
[NEW_SALE]
├─ Clicks "New Sale"
├─ Cart cleared
├─ Back to [POS_SCREEN]
├─ State: READY_FOR_INPUT
  ↓
[END]
```

**UI Flow - POS Terminal:**
```
┌──────────────────────────────────────────────────────────────────┐
│ QuantPOS - Cashier Terminal                        [Logout] [Menu]│
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  LEFT PANEL - PRODUCTS                RIGHT PANEL - CART         │
│  ┌──────────────────────────────────┐ ┌─────────────────────┐   │
│  │ Search: [sugar        ]          │ │ Shopping Cart       │   │
│  │                                  │ │                     │   │
│  │ [< Prev] All Categories [Next >] │ │ Item 1:             │   │
│  │                                  │ │ Sugar 5kg × 2       │   │
│  │ ┌──────┐  ┌──────┐  ┌──────┐   │ │ ₹450 × 2 = ₹900    │   │
│  │ │Sugar │  │ Oil  │  │ Rice │   │ │ [Remove] [Change qty]
│  │ │5kg   │  │500ml │  │ 5kg  │   │ │                     │   │
│  │ │₹450  │  │₹120  │  │₹350  │   │ │ Item 2:             │   │
│  │ │20qty │  │30qty │  │15qty │   │ │ Oil 500ml × 1       │   │
│  │ └──────┘  └──────┘  └──────┘   │ │ ₹120 × 1 = ₹120    │   │
│  │                                  │ │ [Remove] [Change qty]
│  │ ┌──────┐  ┌──────┐  ┌──────┐   │ │                     │   │
│  │ │Wheat │  │Coffee│  │Milk  │   │ │ Subtotal: ₹1,020   │   │
│  │ │10kg  │  │1kg   │  │1L    │   │ │ Discount: [code box]│   │
│  │ │₹550  │  │₹650  │  │₹80   │   │ │ [Apply] → -₹102    │   │
│  │ │12qty │  │8qty  │  │50qty │   │ │                     │   │
│  │ └──────┘  └──────┘  └──────┘   │ │ Tax (5%): +₹45.90  │   │
│  │                                  │ │ ────────────────── │   │
│  │ ┌──────┐  ┌──────┐  ┌──────┐   │ │ TOTAL: ₹963.90     │   │
│  │ │ Daal │  │Spice │  │Salt  │   │ │                     │   │
│  │ │ 1kg  │  │ 200g │  │ 1kg  │   │ │ Payment Method:     │   │
│  │ │₹280  │  │₹400  │  │₹50   │   │ │ ◉ Cash             │   │
│  │ │18qty │  │5qty  │  │40qty │   │ │ ○ Card             │   │
│  │ └──────┘  └──────┘  └──────┘   │ │ ○ UPI              │   │
│  │                                  │ │                     │   │
│  │ [< Prev] Page 1 of 3 [Next >]   │ │ [Clear Cart]        │   │
│  │                                  │ │                     │   │
│  └──────────────────────────────────┘ │ ┌─────────────────┐│   │
│                                        │ │ COMPLETE SALE   ││   │
│                                        │ └─────────────────┘│   │
│                                        └─────────────────────┘   │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘

When cashier clicks "Sugar 5kg":
┌─────────────────────────────────┐
│ Add to Cart                     │
├─────────────────────────────────┤
│ Sugar 5kg - ₹450                │
│                                 │
│ Quantity: [_2_] [+ -]          │
│                                 │
│ Total for this item: ₹900       │
│                                 │
│ [Add to Cart]  [Cancel]         │
│                                 │
└─────────────────────────────────┘
```

---

## Phase 5: Dashboard & Reports Flows

### Flow 5A: View Sales Dashboard

**User Journey - Daily Dashboard:**
```
[Login]
  └─ Owner Sharma logs in successfully

[Dashboard Landing]
  ├─ Shows date: Monday, Jan 15, 2024
  │
  └─ TOP ROW - KPI CARDS
     ├─ Card 1: "Today's Revenue"
     │  └─ ₹45,000 ↑ 15% from yesterday
     │
     ├─ Card 2: "Transactions Today"
     │  └─ 52 transactions ↑ 20%
     │
     ├─ Card 3: "Average Order Value"
     │  └─ ₹865
     │
     ├─ Card 4: "Low Stock Items"
     │  └─ 3 items below threshold
     │     [View Inventory]
     │
     └─ Card 5: "Active Terminals"
        └─ 2 out of 3 terminals online

[SALES CHART - LAST 7 DAYS]
  ├─ Line chart: Revenue by day
  │  ├─ Jan 9: ₹38,000
  │  ├─ Jan 10: ₹42,000
  │  ├─ Jan 11: ₹39,000
  │  ├─ Jan 12: ₹41,000
  │  ├─ Jan 13: ₹43,000
  │  ├─ Jan 14: ₹39,000
  │  └─ Jan 15: ₹45,000 ← Today
  │
  └─ Filter: [Last 7 days] [This Month] [Last 30 days] [Custom]

[TOP PRODUCTS - THIS MONTH]
  ├─ Bar chart:
  │  ├─ 1. Sugar 5kg: ₹125,000 (qty: 280)
  │  ├─ 2. Rice 5kg: ₹98,000 (qty: 245)
  │  ├─ 3. Oil 500ml: ₹87,000 (qty: 725)
  │  ├─ 4. Daal 1kg: ₹76,000 (qty: 272)
  │  └─ 5. Wheat 10kg: ₹65,000 (qty: 118)
  │
  └─ Clicking on product shows: Sales by date for that product

[PAYMENT METHOD BREAKDOWN]
  ├─ Pie chart:
  │  ├─ Cash: 60% (₹27,000)
  │  ├─ Card: 25% (₹11,250)
  │  └─ UPI: 15% (₹6,750)
  │
  └─ Total: ₹45,000

[RECENT TRANSACTIONS - TODAY]
  ├─ Table:
  │  ├─ Time  │ Cashier │ Items      │ Total    │ Payment │
  │  ├─ 4:30  │ Priya   │ Sugar×2    │ ₹963.90  │ Cash    │
  │  ├─ 4:15  │ Priya   │ Oil×3      │ ₹420     │ Card    │
  │  ├─ 4:00  │ Ravi    │ Rice×1     │ ₹450     │ UPI     │
  │  └─ 3:45  │ Priya   │ Daal×2     │ ₹680     │ Cash    │
  │
  └─ [Load More] Shows next 20 transactions

[ACTION BUTTONS]
  ├─ [Download Report (PDF)]
  ├─ [Export to Excel]
  └─ [Schedule Email Report]
```

---

## Phase 6: AI Restocking Agent Flows

### Flow 6A: AI Restocking Recommendation

**User Journey - AI Restock Trigger:**
```
[Dashboard or Inventory Page]
  └─ Manager clicks "AI Restocking" menu

[AI Restock Page]
  ├─ Shows last generated report:
  │  ├─ "Last generated: Today 10:00 AM by Ravi"
  │  ├─ "Scheduled automatic: Twice daily (8 AM, 8 PM)"
  │  │
  │  └─ Button: "Generate New Recommendation"
  │
  └─ Clicks button

[PROCESSING]
  ├─ Frontend shows: Loading spinner
  │  └─ "Analyzing 3 months of sales data..."
  │  └─ "Calculating demand forecasts..."
  │
  ├─ Backend:
  │  ├─ Queries last 90 days of sales by product
  │  ├─ Calculates velocity:
  │  │  ├─ Sugar: 280 units/month = 9.33/day
  │  │  ├─ Rice: 245 units/month = 8.17/day
  │  │  └─ Oil: 725 units/month = 24.17/day
  │  │
  │  ├─ Gets current inventory:
  │  │  ├─ Sugar: 18 units (current)
  │  │  ├─ Rice: 25 units
  │  │  └─ Oil: 12 units
  │  │
  │  ├─ Calls Spring AI + OpenAI:
  │  │  ```
  │  │  Prompt: "Analyze sales and recommend purchase order.
  │  │  Product: Sugar
  │  │  Historical daily velocity: 9.33 units/day
  │  │  Current stock: 18 units
  │  │  Days of supply: 1.9 days (critical!)
  │  │  Low stock threshold: 5 units
  │  │  Lead time: 2 days
  │  │  
  │  │  What should be ordered?"
  │  │  
  │  │  Response (JSON):
  │  │  {
  │  │    "productId": "...",
  │  │    "productName": "Sugar 5kg",
  │  │    "currentStock": 18,
  │  │    "predictedMonthlyDemand": 280,
  │  │    "recommendedOrderQty": 200,
  │  │    "urgency": "HIGH",
  │  │    "reasoning": "Current stock will deplete in 1.9 days. 
  │  │                  With 2-day lead time, order immediately 
  │  │                  to avoid stockout. Recommend 200 units 
  │  │                  for 20-day buffer."
  │  │  }
  │  │  ```
  │  │
  │  ├─ Repeats for all products
  │  │
  │  └─ Stores in purchase_order_suggestions table
  │
  └─ Returns: Recommendations JSON

[RECOMMENDATIONS DISPLAYED]
  ├─ Table with columns:
  │  ├─ Product Name
  │  ├─ Current Stock
  │  ├─ Predicted Demand (monthly)
  │  ├─ Recommended Qty
  │  ├─ Urgency Badge
  │  ├─ AI Reasoning
  │  └─ Action: [Order Now] [Snooze] [Dismiss]
  │
  ├─ Products sorted by urgency (HIGH → MEDIUM → LOW)
  │
  ├─ HIGH urgency (RED):
  │  ├─ Sugar: Current 18, Recommended 200, "Stockout in 1.9 days"
  │  ├─ Oil: Current 12, Recommended 150, "Stockout in 0.5 days"
  │  └─ Salt: Current 3, Recommended 100, "CRITICAL - Order now!"
  │
  ├─ MEDIUM urgency (YELLOW):
  │  ├─ Rice: Current 25, Recommended 150, "Stockout in 3 days"
  │  └─ Daal: Current 45, Recommended 120, "Stockout in 5 days"
  │
  └─ LOW urgency (GREEN):
     ├─ Wheat: Current 120, Recommended 50, "Sufficient stock"
     └─ Coffee: Current 30, Recommended 80, "Order in next week"

[USER ACTIONS]
  ├─ Click "Order Now" for Sugar
  │  └─ Creates purchase order draft
  │     ├─ Product: Sugar
  │     ├─ Quantity: 200
  │     ├─ Date: 2024-01-15
  │     └─ [Edit] [Email to Supplier] [Confirm]
  │
  ├─ Click "Export to CSV"
  │  └─ Downloads: quantpos-restock-2024-01-15.csv
  │
  └─ Click "Print"
     └─ Browser print dialog
        └─ User prints for vendor

[REPORT HISTORY]
  └─ Shows past reports:
     ├─ Today, 10:00 AM (auto-generated)
     ├─ Yesterday, 8:00 PM (auto-generated)
     └─ [View Previous Reports]
```

---

## Phase 7: User Management Flows

### Flow 7A: Invite Team Member

**User Journey - Invite Manager:**
```
[Dashboard - Settings]
  └─ Owner clicks "Team" or "Manage Users"

[Team Members Page]
  ├─ Shows current team:
  │  ├─ Sharma (Owner) - Active
  │  └─ Priya (Cashier) - Active
  │
  └─ Button: [+ Invite Team Member]

[Invitation Form]
  ├─ Owner clicks button
  │
  ├─ Modal appears:
  │  ├─ Email: [ravi@example.com]
  │  ├─ Name: [Ravi Sharma] (optional)
  │  ├─ Role: [Dropdown: Owner / Manager / Cashier]
  │  │  └─ Selects: Manager
  │  │
  │  └─ [Send Invitation]
  │
  └─ Owner clicks "Send Invitation"

[BACKEND PROCESSING]
  ├─ Validation:
  │  ├─ Email format valid
  │  ├─ Email not already invited
  │  └─ Email not already a user (for this tenant)
  │
  ├─ Create invitation record:
  │  ├─ tenant_id
  │  ├─ email
  │  ├─ role
  │  ├─ status: PENDING
  │  └─ token (6-digit code for OTP)
  │
  ├─ Generate OTP: 456789
  │
  ├─ Store in Redis: otp:invite:{email} (10 min TTL)
  │
  └─ Send email:
     ```
     Subject: You're invited to Sharma General Store on QuantPOS
     
     Hi Ravi,
     
     Sharma has invited you to be a Manager at:
     Sharma General Store
     
     Your role: Manager
     
     To accept this invitation, enter this code in the app:
     456789
     
     This code expires in 10 minutes.
     
     Accept: [Link to app with pre-fill]
     ```

[CONFIRMATION MESSAGE]
  └─ Owner sees:
     "Invitation sent to ravi@example.com"
     "Role: Manager"
     "Status: Pending (awaiting verification)"

[RAVI'S EMAIL]
  ├─ Receives invite email
  ├─ Clicks "Accept Invitation" link
  │  └─ Opens QuantPOS app with email pre-filled
  │
  └─ Taken to signup form

[RAVI'S SIGNUP (Team Member)]
  ├─ Form shows:
  │  ├─ Email: ravi@example.com (locked, can't change)
  │  ├─ Full Name: [Ravi Sharma]
  │  ├─ Password: [••••••••]
  │  └─ Business: "Sharma General Store" (pre-filled, read-only)
  │
  └─ Ravi fills and clicks "Create Account"

[RAVI'S OTP VERIFICATION]
  ├─ Receives OTP: 456789 (same as invite code)
  ├─ Enters in app
  ├─ Account activated
  │
  └─ Shown: "Welcome to Sharma General Store!"

[RAVI'S LOGIN]
  ├─ Automatically logged in
  ├─ Sees dashboard for Sharma General Store
  ├─ Can access: Inventory, Sales, Reports, POS
  ├─ Cannot access: Settings, Billing, Team Management
  │
  └─ Ready to work

[OWNER'S TEAM PAGE - UPDATED]
  └─ Shows:
     ├─ Sharma (Owner) - Active
     ├─ Priya (Cashier) - Active
     └─ Ravi (Manager) - Active ✓
        └─ Joined: 2024-01-15 5:00 PM
           [Edit Role] [Remove Member]
```

---

## Error Handling & Edge Cases

### Error 1: OTP Expired (Timeout)

**Scenario:** User checks email after 10 minutes

**Flow:**
```
User opens email, sees OTP: 123456
Copies code
(5 minutes later...)
User navigates back to app
Enters OTP: [1] [2] [3] [4] [5] [6]
Clicks "Verify"

Backend:
├─ Looks up: otp:{email} in Redis
├─ Key doesn't exist (expired after 10 min TTL)
└─ Returns: 400 Bad Request
   {
     "success": false,
     "error": {
       "code": "OTP_EXPIRED",
       "details": "OTP has expired. Request a new code."
     }
   }

Frontend:
├─ Shows error message: "Code expired. Request a new one."
├─ Displays resend button: [Resend Code]
└─ Clears input boxes for user to re-enter if they want to retry
```

**UI:**
```
┌─────────────────────────────────────┐
│    Verify Your Email Address        │
├─────────────────────────────────────┤
│                                     │
│  Enter the 6-digit code from email: │
│                                     │
│  ┌─────┐ ┌─────┐ ┌─────┐           │
│  │ [1] │ │ [2] │ │ [3] │           │
│  └─────┘ └─────┘ └─────┘           │
│  ┌─────┐ ┌─────┐ ┌─────┐           │
│  │ [4] │ │ [5] │ │ [6] │           │
│  └─────┘ └─────┘ └─────┘           │
│                                     │
│  ⏱ Code expires in: EXPIRED ❌       │
│                                     │
│  ⚠️ OTP has expired. Request a new   │
│  code if you don't see it above.     │
│                                     │
│  [         Resend Code              ]│
│                                     │
│  [Back to Email Entry]              │
│                                     │
└─────────────────────────────────────┘
```

---

### Error 2: Wrong OTP - Attempt Lockout

**Scenario:** User enters wrong OTP 5 times

**Flow:**
```
Attempt 1: [1] [1] [1] [1] [1] [1]
Backend: Invalid, increment counter to 1
Frontend: "Invalid code. 4 attempts remaining."

Attempt 2: [2] [2] [2] [2] [2] [2]
Backend: Invalid, increment counter to 2
Frontend: "Invalid code. 3 attempts remaining."

Attempt 3: [3] [3] [3] [3] [3] [3]
Backend: Invalid, increment counter to 3
Frontend: "Invalid code. 2 attempts remaining."

Attempt 4: [4] [4] [4] [4] [4] [4]
Backend: Invalid, increment counter to 4
Frontend: "Invalid code. 1 attempt remaining."

Attempt 5: [5] [5] [5] [5] [5] [5]
Backend: Invalid, increment counter to 5
          Create lockout: otp:locked:{email} = true (TTL: 15 min)
          Delete OTP from Redis (can't verify anymore)
Frontend: "Too many failed attempts. 
           Please try again in 15 minutes."
          Disable input boxes
          Disable [Verify] button
          Show [Resend Code] disabled with timer

After 15 minutes:
├─ Lockout expires from Redis
├─ User can request new OTP
└─ Counter reset to 0
```

**UI - During Lockout:**
```
┌─────────────────────────────────────┐
│    Verify Your Email Address        │
├─────────────────────────────────────┤
│                                     │
│  ⛔ Too many failed attempts.       │
│                                     │
│  Please try again in 14:32          │
│                                     │
│  [Resend Code - Available in 14:32] │ (disabled, grayed out)
│                                     │
│  [Back to Email Entry]              │
│                                     │
└─────────────────────────────────────┘
```

---

### Error 3: Resend Cooldown

**Scenario:** User clicks "Resend" twice within 1 minute

**Flow:**
```
First resend: 
├─ User clicks [Resend Code]
├─ Backend generates new OTP
├─ Stores: otp:{email}, otp:resend_time:{email}
├─ Sends email
└─ Frontend shows: "Code resent. Check email."

15 seconds later:
├─ User clicks [Resend Code] again
├─ Backend checks: otp:resend_time:{email}
├─ Elapsed time: 15 seconds < 60 seconds (cooldown)
├─ Returns: 429 Too Many Requests
│  {
│    "success": false,
│    "error": {
│      "code": "RESEND_COOLDOWN",
│      "details": "Please wait 45 seconds before resending."
│    }
│  }
└─ Frontend shows: "Please wait 45 seconds before resending."
   └─ [Resend Code - 0:45] (disabled)

After 60 seconds:
├─ Cooldown expires
└─ [Resend Code] button enabled again
```

---

### Error 4: Network Timeout During OTP Submission

**Scenario:** Internet cuts out while user submits OTP

**Flow:**
```
User enters: [1] [2] [3] [4] [5] [6]
Clicks [Verify]

Axios call to POST /api/verify-otp starts
(Network connection drops)

After 30 seconds - Timeout:
├─ Axios returns: Network Error
├─ Frontend catches error
├─ Shows: "Connection lost. Please check your internet."
│
└─ Options for user:
   ├─ [Retry] - Try submitting OTP again
   ├─ [Use different network]
   └─ [Request new code]

User reconnects internet
Clicks [Retry]

Axios re-submits with same OTP:
├─ Backend validates OTP from Redis
├─ If valid: Process normally
├─ If expired: Return OTP_EXPIRED error
└─ Frontend handles accordingly
```

**UI:**
```
┌─────────────────────────────────────┐
│    Verify Your Email Address        │
├─────────────────────────────────────┤
│                                     │
│  ⚠️ Connection lost.                │
│                                     │
│  Please check your internet         │
│  connection and try again.          │
│                                     │
│  [Retry]                            │
│  [Request New Code]                 │
│  [Back to Email Entry]              │
│                                     │
└─────────────────────────────────────┘
```

---

### Error 5: Email Not Received (False Positive)

**Scenario:** User doesn't receive OTP email (spam folder, delay)

**Flow:**
```
User completes registration
Backend sends OTP via Brevo
(Email takes 30 seconds, lands in spam folder)

User waits 2 minutes, doesn't see email:
├─ Clicks [Resend Code]
├─ Backend generates NEW OTP: 999888
├─ Stores in Redis with 10 min TTL
├─ Sends to email again
├─ Frontend: "Code resent. Check email and spam folder."
│
└─ User checks spam, finds code from first attempt: 123456

User (confused) enters first OTP: [1] [2] [3] [4] [5] [6]
Backend:
├─ Looks up: otp:{email}
├─ Current OTP is 999888 (second one, newer)
├─ First OTP (123456) was already deleted after first attempt
├─ Returns: Invalid OTP
└─ Frontend: "Invalid code. New code sent to your email."

User checks email again:
├─ Finds second OTP: 999888 (newer, from resend)
├─ Finds first OTP from spam folder (expired now)
└─ Enters second OTP: [9] [9] [9] [8] [8] [8]

Backend:
├─ Looks up: otp:{email}
├─ Current OTP is 999888
├─ Matches user input
├─ Deletes OTP from Redis (single-use)
├─ Returns: Success
└─ Account activated
```

**Frontend messaging:**
```
After first OTP attempt fails:
"Invalid code. We've sent you a new code to your email.
Check your spam folder if you don't see it.
Codes are valid for 10 minutes."
```

---

## API Integration Points

### API Call Sequence - Complete Registration + OTP + Login + First Sale

```
Timeline: 2024-01-15, 4:00 PM

Step 1: REGISTRATION (4:00 PM)
Request:
  POST /api/auth/register
  {
    "businessName": "Sharma General Store",
    "businessType": "RETAIL",
    "phoneNumber": "9876543210",
    "gstin": null,
    "addressStreet": "123 Market St",
    "addressCity": "Mumbai",
    "addressState": "Maharashtra",
    "addressPincode": "400001",
    "ownerFullName": "Sharma",
    "email": "sharma@example.com",
    "password": "Secure123!"
  }

Response:
  {
    "success": true,
    "message": "Registration successful. Check your email for verification code.",
    "data": {
      "tenantId": "tenant-uuid-001"
    }
  }

Database:
  ├─ tenants table: New row
  │  ├─ id = tenant-uuid-001
  │  ├─ business_name = "Sharma General Store"
  │  ├─ subscription_status = INACTIVE
  │  └─ ...
  │
  └─ users table: New row
     ├─ id = user-uuid-001
     ├─ tenant_id = tenant-uuid-001
     ├─ email = "sharma@example.com"
     ├─ is_email_verified = false
     └─ ...

Redis:
  ├─ otp:sharma@example.com = "123456" (TTL: 10 min)
  └─ otp:attempts:sharma@example.com = 0

Email: Sent "Your verification code is 123456"

---

Step 2: VERIFY OTP (4:05 PM - User checks email)
Request:
  GET /api/auth/verify-email?token=123456

Response:
  {
    "success": true,
    "message": "Email verified successfully."
  }

Database:
  └─ users: Update user
     └─ is_email_verified = true

Redis:
  ├─ Delete otp:sharma@example.com
  ├─ Delete otp:attempts:sharma@example.com
  └─ otp verified

Email: Sent "Welcome to QuantPOS!"

---

Step 3: STRIPE CHECKOUT (4:10 PM - User subscribes)
Request:
  POST /api/billing/create-checkout-session
  {
    "priceId": "price_growth_xyz"
  }

Response:
  {
    "success": true,
    "data": {
      "sessionId": "cs_test_123",
      "checkoutUrl": "https://checkout.stripe.com/..."
    }
  }

Stripe:
  └─ Session created, payment processed, webhooks triggered

Webhook: checkout.session.completed
Database:
  └─ tenants: Update tenant
     ├─ subscription_status = ACTIVE
     ├─ stripe_subscription_id = "sub_xyz"
     ├─ terminal_limit = 3
     └─ updated_at = 4:15 PM

Redis:
  └─ subscription:tenant-uuid-001 = {active, 3 terminals} (TTL: 1 hour)

---

Step 4: LOGIN (4:30 PM - Next day)
Request:
  POST /api/auth/login
  {
    "email": "sharma@example.com",
    "password": "Secure123!"
  }

Response:
  {
    "success": true,
    "message": "Please verify with code sent to email.",
    "data": {
      "requiresOTP": true
    }
  }

Redis:
  ├─ otp:2fa:sharma@example.com = "654321" (10 min TTL)
  └─ otp:2fa:attempts:sharma@example.com = 0

Email: Sent "Your login code is 654321"

---

Step 4b: 2FA OTP SUBMISSION (4:35 PM)
Request:
  POST /api/auth/verify-2fa
  {
    "email": "sharma@example.com",
    "otp": "654321"
  }

Response:
  {
    "success": true,
    "data": {
      "accessToken": "eyJhbGc...",
      "refreshToken": "f47ac10b-58cc...",
      "user": {
        "id": "user-uuid-001",
        "email": "sharma@example.com",
        "role": "OWNER",
        "tenantId": "tenant-uuid-001"
      }
    }
  }

Redis:
  ├─ refresh_token:f47ac10b-58cc = "user-uuid-001" (TTL: 7 days)
  └─ Delete otp:2fa:sharma@example.com

Database:
  └─ users: Update user
     └─ last_login_at = 4:35 PM

---

Step 5: FIRST SALE (4:40 PM - POS Terminal)
Request:
  POST /api/sales
  Headers: Authorization: Bearer eyJhbGc...
  {
    "items": [
      {
        "productId": "prod-sugar-001",
        "productName": "Sugar 5kg",
        "unitPrice": 450,
        "quantity": 2,
        "lineTotal": 900
      },
      {
        "productId": "prod-oil-001",
        "productName": "Oil 500ml",
        "unitPrice": 120,
        "quantity": 1,
        "lineTotal": 120
      }
    ],
    "subtotal": 1020,
    "discount": -102,
    "tax": 45.90,
    "total": 963.90,
    "paymentMethod": "CASH",
    "terminalId": "term-001"
  }

JwtFilter:
  ├─ Extract token from header
  ├─ Validate signature
  ├─ Extract tenantId = "tenant-uuid-001"
  ├─ Set TenantContext.setTenantId(tenant-uuid-001)
  └─ Load user into SecurityContext

Response:
  {
    "success": true,
    "message": "Sale completed successfully.",
    "data": {
      "saleId": "sal-2024-01-15-001",
      "receipt": "..."
    }
  }

Database:
  ├─ sales: New row
  │  ├─ id = sal-2024-01-15-001
  │  ├─ tenant_id = tenant-uuid-001
  │  ├─ subtotal = 1020
  │  ├─ discount = -102
  │  ├─ tax = 45.90
  │  ├─ total = 963.90
  │  └─ created_at = 4:40 PM
  │
  ├─ sale_items: 2 new rows
  │  ├─ sale_id = sal-2024-01-15-001
  │  ├─ product_id = prod-sugar-001, qty = 2
  │  └─ product_id = prod-oil-001, qty = 1
  │
  ├─ inventory: Update 2 rows
  │  ├─ Sugar: 20 → 18
  │  └─ Oil: 30 → 29
  │
  └─ inventory_transactions: 2 new rows
     ├─ Sugar: SALE, -2
     └─ Oil: SALE, -1

Hibernate Filter:
  └─ All queries auto-include WHERE tenant_id = 'tenant-uuid-001'
     └─ Other tenants' data never visible

Redis:
  └─ (No change - sales not cached)

Audit Logs:
  └─ action: SALE_CREATED
     ├─ user_id = cashier-id
     ├─ resource_type = SALE
     ├─ resource_id = sal-2024-01-15-001
     ├─ amount = 963.90
     └─ timestamp = 4:40 PM
```

---

## Complete Phase Summary

**Phase 1:** ✅ Registration (OTP) → Email Verification → Login (2FA OTP) → Password Reset (OTP)

**Phase 2:** ✅ Stripe subscription → Checkout session → Webhooks → Terminal enforcement

**Phase 3:** Inventory management → Add products → Adjust stock → Audit trail

**Phase 4:** POS terminal → Search → Add to cart → Apply discount → Complete sale

**Phase 5:** Dashboard → KPI cards → Charts → Top products → Reports

**Phase 6:** AI agent → Demand analysis → Purchase order recommendations

**Phase 7:** User management → Invite team → OTP verification → Role assignment

**Phase 8:** Docker deployment → AWS infrastructure

**Phase 9:** Mobile app (future)

**Phase 10:** Multi-location, expansion features

---

**Document Version:** 1.0  
**Last Updated:** June 2026 
**Status:** Complete for all 10 phases