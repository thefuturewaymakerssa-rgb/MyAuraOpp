# User Acceptance Testing (UAT) Checklist

## Objective
Validate that the MVP meets business requirements and is ready for user testing with real test accounts.

---

## Test Scenarios

### 1. NEW USER ONBOARDING 🆕

#### 1.1 Sign Up - Email Registration
- [ ] Navigate to /login
- [ ] Click "Sign Up"
- [ ] Enter valid email address
- [ ] Enter password (min 8 chars recommended)
- [ ] Accept terms & privacy
- [ ] Click "Create Account"
- ✓ **Expected**: Email verification sent, see confirmation message

#### 1.2 Email Verification
- [ ] Check email inbox for verification link
- [ ] Click verification link
- [ ] Should redirect to `/role-select`
- ✓ **Expected**: Email verified, can proceed to role selection

#### 1.3 Role Selection
- [ ] Choose "Talent" role
  - [ ] Fill profile: Name, Bio, Photo
  - [ ] Select primary skill (Trade)
  - [ ] Click "Next"
- [ ] **OR** Choose "Employer" role
  - [ ] Fill business name
  - [ ] Select industry
  - [ ] Click "Next"
- ✓ **Expected**: Redirect to appropriate dashboard

#### 1.4 First Login
- [ ] Log out
- [ ] Navigate to /login
- [ ] Enter email & password
- [ ] Click "Sign In"
- ✓ **Expected**: Redirect to dashboard, wallet/jobs visible

---

### 2. TALENT FEATURE TESTING 👨‍💼

#### 2.1 Portfolio - Vibe Studio Upload
- [ ] Navigate to `/talent/studio`
- [ ] Click "Record New Vibe CV"
- [ ] Grant camera/microphone permissions
- [ ] Record 10-30 second video
- [ ] Click "Stop Recording"
- [ ] Preview video
- [ ] Add title: "My Plumbing Skills Showcase"
- [ ] Add description: "5 years experience..."
- [ ] Click "Upload"
- ✓ **Expected**: Upload progress shown, then success state with video preview in portfolio
- ✓ *Optional*: Enable offline and try uploading - should queue for later

#### 2.2 Browse & Search Gigs
- [ ] Navigate to `/talent/gigs`
- [ ] See gig feed (or empty state if none available)
- [ ] Click filter button
- [ ] Filter by:
  - [ ] Category (e.g., "Plumbing")
  - [ ] Location (e.g., "Johannesburg")
  - [ ] Budget range (e.g., "R500-R2000")
- [ ] Verify results update
- ✓ **Expected**: Only matching gigs displayed

#### 2.3 View Gig Detail
- [ ] Click on a gig card
- [ ] Verify gig details display:
  - [ ] Title
  - [ ] Description
  - [ ] Budget
  - [ ] Location map
  - [ ] Employer profile
  - [ ] Required skills
- [ ] Click "Apply Now"
- ✓ **Expected**: Application submitted, success toast shown

#### 2.4 Applications & Contracts
- [ ] Navigate to `/talent/contracts`
- [ ] See list of contracts (accepted/pending/completed)
- [ ] Click on pending contract
- [ ] Review contract terms
- [ ] Click "Accept Contract"
- ✓ **Expected**: Contract status updates to "Accepted"
- [ ] See escrow amount held

#### 2.5 Dashboard & Wallet
- [ ] Navigate to `/talent/dashboard`
- [ ] Verify wallet balance displays
- [ ] Verify total earnings shown
- [ ] Verify pending jobs count
- [ ] Verify completed contracts count
- ✓ **Expected**: Dashboard loads without errors, data is current

#### 2.6 Messages & Notifications
- [ ] Navigate to `/messages`
- [ ] See conversation list (or empty message)
- [ ] *[If employer sent message]*: See new message badge
- [ ] Click conversation → read message
- [ ] Type reply and send
- ✓ **Expected**: Message sent immediately, appears in conversation

---

### 3. EMPLOYER FEATURE TESTING 🏢

#### 3.1 Browse Talent
- [ ] Navigate to `/employer/feed`
- [ ] See talent cards (or empty state)
- [ ] Click on talent profile
- [ ] Verify profile shows:
  - [ ] Portfolio videos (VibeCV)
  - [ ] Skills/trades
  - [ ] Experience level
  - [ ] Hourly rate/price
- [ ] Click "Hire" or "Send Offer"
- ✓ **Expected**: Can initiate contract with talent

#### 3.2 Create Gig
- [ ] Navigate to `/employer/gigs/new`
- [ ] Fill form:
  - [ ] Gig Title: "Need Plumber for Pipe Installation"
  - [ ] Category: "Plumbing"
  - [ ] Description: Detailed requirements
  - [ ] Budget: "R1500"
  - [ ] Location: Set on map
  - [ ] Deadline: 7 days
  - [ ] Required Skills: Plumbing, Water systems
- [ ] Click "Post Gig"
- ✓ **Expected**: Gig posted, redirect to gig detail page

#### 3.3 Manage Gigs
- [ ] Navigate to `/employer/gigs`
- [ ] See list of your posted gigs
- [ ] Click on gig to see:
  - [ ] Applicants list
  - [ ] View button to edit
  - [ ] Mark complete button
- [ ] Click "View Applicants"
- [ ] See talent cards with ratings
- ✓ **Expected**: Can select and hire talent from applicants

#### 3.4 Contracts & Escrow
- [ ] Navigate to `/employer/contracts`
- [ ] See active contracts
- [ ] Click contract → see details
- [ ] Verify escrow amount required
- [ ] Click "Fund Escrow"
- [ ] Select payment method (PayFast/Paystack)
- ✓ **Expected**: Redirected to payment gateway, can complete payment

#### 3.5 Escrow Release
- [ ] Once talent completes work, see "Release Payment" button
- [ ] Review proof of work (videos/documents)
- [ ] Approve or request changes
- [ ] Click "Release Payment"
- ✓ **Expected**: Funds transferred to talent wallet

#### 3.6 Dashboard Analytics
- [ ] Navigate to `/employer/hub`
- [ ] See stats:
  - [ ] Total gigs posted
  - [ ] Total spent on platform
  - [ ] Active contracts
  - [ ] Average response time
- ✓ **Expected**: Dashboard loads, metrics are accurate

---

### 4. ADMIN FEATURES (ADMIN ONLY) 🔐

#### 4.1 Admin Dashboard
- [ ] Log in as admin
- [ ] Navigate to `/admin/dashboard`
- [ ] Verify stats display:
  - [ ] Total users
  - [ ] Total gigs
  - [ ] Active disputes
  - [ ] Revenue
- [ ] See load-shedding mode toggle
- [ ] Can enable/disable platform features
- ✓ **Expected**: Admin controls working correctly

#### 4.2 Dispute Resolution
- [ ] Navigate to `/admin/disputes`
- [ ] See list of disputed contracts
- [ ] Click dispute → see:
  - [ ] Talent & employer profiles
  - [ ] Chat history
  - [ ] Payment details
- [ ] Options to:
  - [ ] Refund to employer
  - [ ] Pay to talent
  - [ ] Split funds
- [ ] Resolve dispute
- ✓ **Expected**: Dispute closed, funds transferred

#### 4.3 KYC Verification
- [ ] Navigate to `/admin/kyc`
- [ ] See pending KYC users
- [ ] Click user → see:
  - [ ] ID selfie
  - [ ] ID document
  - [ ] Verification status
- [ ] Approve or reject
- ✓ **Expected**: User tier updated on approval

#### 4.4 Moderation
- [ ] Navigate to `/admin/moderation`
- [ ] See reported content
- [ ] Review reported video/profile
- [ ] Options:
  - [ ] Delete content
  - [ ] Warn user
  - [ ] Suspend account
- ✓ **Expected**: Actions apply immediately

---

### 5. SPECIAL FEATURES ✨

#### 5.1 Offline Mode
- [ ] Use DevTools to go offline (simulate)
- [ ] Navigate to `/talent/gigs`
- [ ] Try to load new gigs
- [ ] Should redirect to `/~offline`
- [ ] See offline message & retry button
- [ ] Go back online
- [ ] Click retry
- ✓ **Expected**: Gigs load after going online

#### 5.2 PWA Installation
- [ ] Open app in desktop Chrome/Edge
- [ ] See "Install" button in address bar
- [ ] Click install
- [ ] App opens in window mode
- [ ] See app icon in taskbar
- ✓ **Expected**: App launches as standalone app

#### 5.3 Video Upload on Mobile
- [ ] Access `/talent/studio` on phone
- [ ] Grant camera permissions
- [ ] Record video
- [ ] Upload
- [ ] Should show progress
- ✓ **Expected**: Video uploads successfully

#### 5.4 Push Notifications (if enabled)
- [ ] After app installed, enable notifications
- [ ] Employer sends job offer
- [ ] Talent receives push notification
- [ ] Click notification → opens app
- ✓ **Expected**: User receives job offer alerts in background

#### 5.5 Geolocation - Map Feature
- [ ] Navigate to gig page or create gig
- [ ] Click "Use My Location"
- [ ] Grant location permission
- [ ] Should show current location on map
- ✓ **Expected**: Location marker appears, accurate within ~100m

---

### 6. PAYMENT TESTING 💳

#### 6.1 PayFast (Employer Escrow Funding)
- [ ] Click "Fund Escrow" from contract
- [ ] Select PayFast
- [ ] Redirect to PayFast sandbox
- [ ] Use test card: `4111 1111 1111 1111`
- [ ] Expiry: Any future date (e.g., 12/25)
- [ ] CVV: Any 3 digits
- [ ] Click complete
- ✓ **Expected**: Return to app, escrow shows "Funded"

#### 6.2 Paystack (Alternative)
- [ ] Repeat above with Paystack option
- [ ] Use same test card details
- ✓ **Expected**: Similar flow, same result

#### 6.3 Failed Payment
- [ ] Try payment with invalid card
- [ ] Should see error message
- [ ] Try again option
- ✓ **Expected**: Clear error, retry possible

#### 6.4 Payment Webhook (Backend Testing)
- [ ] Payment succeeds
- [ ] Within 5 seconds, escrow updates in UI
- [ ] Employer receives confirmation email
- ✓ **Expected**: Real-time webhook processing

---

### 7. ERROR RECOVERY 🔧

#### 7.1 Network Timeout
- [ ] Throttle network (DevTools → Slow 3G)
- [ ] Try to load page
- [ ] Wait for timeout (should show error)
- [ ] Fix network
- [ ] Retry button works
- ✓ **Expected**: Graceful retry works

#### 7.2 Session Expiry
- [ ] Log in
- [ ] Wait 24+ hours (or clear auth token)
- [ ] Try to access protected page
- [ ] Should redirect to login
- ✓ **Expected**: Session properly managed

#### 7.3 Missing Data
- [ ] Delete a profile picture (as admin)
- [ ] User refreshes page
- [ ] Should show placeholder/error gracefully
- ✓ **Expected**: No 500 errors, graceful fallback

---

### 8. POPIA COMPLIANCE 📋

#### 8.1 Data Download Export
- [ ] Navigate to `/settings`
- [ ] Click "Download My Data"
- [ ] See confirmation modal
- [ ] Click confirm
- [ ] Should receive email with data download link
- ✓ **Expected**: Data export includes all personal info in JSON/CSV

#### 8.2 Account Deletion
- [ ] Navigate to `/settings`
- [ ] Click "Delete Account"
- [ ] See warning modal with 30-day grace period
- [ ] Type "DELETE" to confirm
- [ ] Click delete
- ✓ **Expected**: Account marked for deletion, data retention policy applied

#### 8.3 Privacy Policy
- [ ] Click privacy link in footer
- [ ] Review privacy policy
- [ ] Verify mentions:
  - [ ] Data collection methods
  - [ ] Data retention
  - [ ] User rights (POPIA)
  - [ ] Contact info
- ✓ **Expected**: Policy visible & comprehensive

---

### 9. PERFORMANCE TARGETS 🚀

#### 9.1 Page Load Times
- [ ] Dashboard: < 2 seconds
- [ ] Gig Feed: < 1.5 seconds
- [ ] Video Upload: Shows progress
- [ ] Search Results: < 1 second

#### 9.2 Video Streaming
- [ ] Portfolio videos load smoothly
- [ ] Can seek/scrub video
- [ ] No buffering pause on good network

#### 9.3 Memory Usage
- [ ] App doesn't consume > 300MB RAM on desktop
- [ ] Mobile: < 150MB
- [ ] No memory leaks after 10 mins of usage

---

### 10. ACCESSIBILITY CHECKS ♿

#### 10.1 Keyboard Navigation
- [ ] Tab through all interactive elements
- [ ] Can submit forms with Enter key
- [ ] Tab order is logical
- ✓ **Expected**: All features keyboard accessible

#### 10.2 Screen Reader (NVDA/JAWS)
- [ ] Buttons have descriptive labels
- [ ] Form fields labeled
- [ ] Images have alt text
- ✓ **Expected**: Can navigate using screen reader

#### 10.3 Color Contrast
- [ ] Text on buttons readable (WCAG AA)
- [ ] Form errors clearly highlighted
- [ ] Links underlined or obvious
- ✓ **Expected**: Passes axe DevTools audit

---

## Sign-Off

| Role | Name | Status | Date |
|------|------|--------|------|
| QA Lead | | ⬜ PENDING | |
| Product Manager | | ⬜ PENDING | |
| Tech Lead | | ⬜ PENDING | |
| Client/Stakeholder | | ⬜ PENDING | |

---

## Known Issues (Document Here)

| Issue | Severity | Workaround | Fixed By |
|-------|----------|-----------|----------|
| Playwright browser download timeout | MEDIUM | Use mirror host | Next sprint |
| [Add issues as found] | | | |

---

## Next Steps Post-UAT

- [ ] All critical issues resolved
- [ ] All sign-offs obtained
- [ ] Deployment to production approved
- [ ] Team trained on Production support
- [ ] Monitoring/alerting configured
- [ ] Go-live plan ready

