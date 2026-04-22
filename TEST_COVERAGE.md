# E2E Test Coverage Analysis & Recommendations

## Current Test Coverage ✅

### Talent Flow (11 tests)
- [x] Dashboard loads with wallet section
- [x] Vibe studio page renders and file upload input is accessible
- [x] Uploading a video file triggers progress indicator
- [x] Gigs page loads without errors
- [x] Gig detail page has an apply button
- [x] Offline page renders correctly
- [x] PWA manifest valid and reachable
- [x] Can navigate to non-existent gig (404 handling)
- [x] Apply button lifecycle (visible/disabled states)
- [x] Video file upload mocking
- [x] Success state after upload

### Employer Flow (12 tests)
- [x] Employer hub loads with analytics visible
- [x] Employer feed loads talent cards
- [x] New gig form renders all required fields
- [x] Creating a gig with valid data submits
- [x] Escrow page loads without JS errors
- [x] POPIA data export endpoint auth check
- [x] POPIA delete endpoint auth check
- [x] Form validation and error states
- [x] Feed pagination/loading
- [x] Admin dispute resolution workflow
- [x] Chat surveillance access
- [x] KYC verification workflow

---

## Coverage Gaps ❌

### Critical Flows Missing:

#### 1. **Authentication → Role Selection → Dashboard**
- Sign up with email
- Email verification
- Role selection (Talent/Employer)
- Redirect to appropriate dashboard
- **Priority**: HIGH - Foundation of user journey

#### 2. **Contract Lifecycle → Escrow → Release**
- Contract acceptance by talent
- Escrow funding by employer
- Work completion milestone
- Release/dispute resolution
- **Priority**: HIGH - Core business flow

#### 3. **Advanced Search & Filter**
- Gig discovery with filters (location, category, budget)
- Map-based gig discovery
- Search result pagination
- Saved gigs functionality
- **Priority**: MEDIUM

#### 4. **Media & File Handling**
- Multi-file upload
- Video processing (FFmpeg)
- File size validation
- Timeout handling
- **Priority**: MEDIUM

#### 5. **Offline Mode Testing**
- Offline gig browsing (cached content)
- Retry failed requests when online
- Service Worker update
- **Priority**: MEDIUM

#### 6. **Notifications & Real-time**
- WebSocket connection for messages
- Real-time notification badges
- Message read/unread states
- **Priority**: LOW (nice-to-have for MVP)

#### 7. **Error States & Edge Cases**
- Network timeouts
- Malformed API responses
- Rate limiting (Upstash RateLimit)
- Concurrent requests
- **Priority**: MEDIUM

---

## Recommended Test Suite Additions

### 1. Auth Flow Test (`auth-flow.spec.ts`)
```typescript
test("complete signup → role selection → dashboard journey", async ({ page }) => {
  // Sign up
  // Verify email sent
  // Click email verification link
  // Select role
  // Complete profile
  // Redirect to dashboard
  // Verify personalized content
});
```

### 2. Contract Flow Test (`contract-flow.spec.ts`)
```typescript
test("complete contract lifecycle", async ({ page, context }) => {
  // Talent: Browse gigs and apply
  // Employer: Find talent and send contract
  // Talent: Accept contract
  // Employer: Fund escrow
  // Talent: Complete work
  // Employer: Release payment
});
```

### 3. Search/Filter Test (`discovery-flow.spec.ts`)
```typescript
test("filter gigs by location and category", async ({ page }) => {
  // Navigate to gig feed
  // Apply location filter
  // Apply category filter
  // Verify results match filters
  // Click on gig
  // Verify detail matches filter context
});

test("map-based discovery works", async ({ page }) => {
  // Request geolocation permission
  // Load gigs on map
  // Click gig marker
  // Verify gig detail opens
});
```

### 4. Offline Resilience Test (`offline.spec.ts`)
```typescript
test("cached gigs load in offline mode", async ({ page, context }) => {
  // Load gig feed online
  // Go offline (DevTools Network throttling)
  // Navigate to /~offline
  // Verify cached content displays
  // Click retry button
  // Go back online
  // Verify content refreshes
});
```

### 5. Error Handling Test (`error-handling.spec.ts`)
```typescript
test("handles network timeout gracefully", async ({ page, context }) => {
  // Mock slow network
  // Trigger API call
  // Verify loading state
  // Verify timeout message
  // Verify retry button
});

test("handles missing user profile", async ({ page, context }) => {
  // Delete user profile data
  // Reload page
  // Verify error boundary displays
  // Verify recovery option
});
```

---

## Test Implementation Priority

### Phase 1 (This Sprint) - CRITICAL
1. Auth signup → role selection → dashboard
2. Contract acceptance → escrow funding → release
3. Gig discovery filters

### Phase 2 (Next Sprint) - IMPORTANT
4. Offline mode resilience
5. Error handling edge cases
6. Media upload reliability

### Phase 3 (Future) - NICE-TO-HAVE
7. Real-time notifications
8. WebSocket stability
9. Performance benchmarks

---

## Known Issues & Workarounds

### Playwright Browser Download Timeout
**Issue**: `npx playwright install` times out on certain networks
**Workaround**:
```bash
# Download manually with extended timeout
PLAYWRIGHT_DOWNLOAD_HOST=https://playwright.azureedge.net npx playwright install --with-deps

# Or use skip flag in CI
PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm ci
```

### Authentication State in Tests
**Current**: Using `auth.setup.ts` for shared auth state
**Future**: Consider using `playwright.config.ts` `webServer` option to guarantee dev server health

### Mock API Responses
**Recommendation**: Create a shared `test-helpers/mocks.ts` file for common mock responses:
```typescript
export const MOCK_GIG = { id: "1", title: "Test Gig", ... };
export const mockGigAPI = (page) => {
  page.route("/api/gigs/*", route => route.fulfill({ body: MOCK_GIG }));
};
```

---

## Performance Testing Recommendations

Once tests pass, add Lighthouse CI:

```bash
npm install --save-dev @lhci/cli@0.9.x @lhci/server@0.9.x
```

Configure `lighthouserc.json`:
```json
{
  "ci": {
    "collect": {
      "staticDistDir": "./.next",
      "urls": [
        "http://localhost:3000/",
        "http://localhost:3000/gigs",
        "http://localhost:3000/talent/dashboard"
      ]
    },
    "assert": {
      "preset": "lighthouse:recommended",
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.8 }],
        "categories:accessibility": ["error", { "minScore": 0.9 }]
      }
    }
  }
}
```

Then run:
```bash
lhci autorun
```

---

## Next Steps

1. ✅ Fix Playwright browser download (network issue)
2. ⏳ Create auth flow test suite
3. ⏳ Create contract flow test suite  
4. ⏳ Set up Lighthouse CI
5. ⏳ Run full test suite in CI/CD pipeline (GitHub Actions)

