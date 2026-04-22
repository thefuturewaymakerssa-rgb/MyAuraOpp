# Sentry Error Tracking Setup Guide

## Quick Start

Sentry is already configured in your app. Just add your DSN and it's active!

### Step 1: Get Your Sentry DSN

1. Go to [sentry.io](https://sentry.io) and sign up (free tier available)
2. Create a new Next.js project
3. Copy your DSN (looks like: `https://xxx@xxx.ingest.sentry.io/xxxxx`)

### Step 2: Add to Environment

In `.env.local` (local development):
```
NEXT_PUBLIC_SENTRY_DSN=<YOUR_SENTRY_DSN>
```

In Vercel (production):
1. Go to Vercel Dashboard → Project Settings → Environment Variables
2. Add `NEXT_PUBLIC_SENTRY_DSN` with your DSN
3. Set it for production environment only

### Step 3: Test It

Once DSN is set, errors are automatically tracked:

```typescript
// In any React component
import { captureError } from "@/utils/error-tracking";

try {
  await someAPI();
} catch (err) {
  captureError(err, {
    userId: user.id,
    severity: "error",
    context: { action: "gig-upload" }
  });
}
```

Or use directly:
```typescript
import * as Sentry from "@sentry/nextjs";
Sentry.captureException(new Error("Test error"));
```

### Step 4: Verify in Dashboard

1. Trigger an error in your app
2. Go to Sentry dashboard → Issues
3. Your error should appear within 5 seconds

---

## Features Enabled

### ✅ What We Track

- **Unhandled JavaScript Errors** - Auto-captured
- **API Errors** - 4xx and 5xx responses
- **Performance Monitoring** - Page load, API latency
- **User Sessions** - Session replays (with error context)
- **Custom Events** - Track specific user actions

### ✅ Privacy-Friendly

- No PII captured by default
- User emails not sent to Sentry
- Page view data excluded
- Respects POPIA compliance

---

## Using Error Tracking in Your Code

### Basic Error Capture
```typescript
import { captureError } from "@/utils/error-tracking";

captureError("Upload failed", {
  userId: user.id,
  severity: "error"
});
```

### Track User Actions
```typescript
import { trackUserAction } from "@/utils/error-tracking";

trackUserAction("gig_applied", {
  gigId: gig.id,
  talentId: talent.id
});
```

### Set User Context
```typescript
import { setUserContext } from "@/utils/error-tracking";

setUserContext(user.id, user.email);
```

### Monitor API Calls
```typescript
import { monitorAPICall } from "@/utils/error-tracking";

const result = await monitorAPICall("fetch-gigs", async () => {
  return await fetch("/api/gigs").then(r => r.json());
});
```

---

## Sentry Dashboard Navigation

### 📊 Issues
- All errors grouped by stacktrace
- See frequency, affected users, last occurrence

### 📈 Performance
- Slow page loads
- Slow API endpoints
- Transaction traces

### 🎥 Replays
- Watch user sessions before error
- See clicks, keyboard input, page changes

### 🚨 Alerts
- Set up Slack/email for critical errors
- Get notified of spike in error rate

---

## Production Best Practices

### 1. Rate Limiting
```typescript
// Only send 80% of errors in production
Sentry.init({
  dsn: SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1,
  beforeSend: (event) => {
    // Filter out known errors
    if (event.message?.includes('NetworkError')) return null;
    return event;
  }
});
```

### 2. Environment Tags
```typescript
Sentry.init({
  environment: process.env.NODE_ENV,
  release: process.env.NEXT_PUBLIC_APP_VERSION,
});
```

### 3. Alerts Setup
In Sentry Dashboard → Alerts:
- [ ] Alert on high error rate (>10% increase)
- [ ] Alert on new issue type
- [ ] Alert on critical errors (severity >= error)
- [ ] Slack/email integration

---

## Troubleshooting

### Errors not appearing in Sentry?

1. **Check DSN is set**
   ```bash
   echo $NEXT_PUBLIC_SENTRY_DSN
   ```

2. **Check requests go to Sentry**
   - DevTools → Network tab
   - Look for requests to `ingest.sentry.io`

3. **Check sample rate**
   - `tracesSampleRate: 1` for 100% capture (dev)
   - `tracesSampleRate: 0.1` for 10% (production)

4. **Check browser console**
   - No `__SENTRY_GRPC_*` errors

### Capturing too much?

Reduce in `sentry.*.config.ts`:
```typescript
Sentry.init({
  beforeSend: (event) => {
    // Drop unimportant console warnings
    if (event.level === 'warning') return null;
    return event;
  }
});
```

---

## Sample Events to Test

### Test 1: Unhandled Error
```typescript
// In browser console
throw new Error("Test error");
```

### Test 2: API Error
```typescript
// Trigger a 500 error endpoint
fetch("/api/test-error");
```

### Test 3: Promise Rejection
```typescript
Promise.reject("Test rejection");
```

---

## POPIA Compliance

✅ **Data we DON'T send:**
- User passwords
- Sensitive form data
- Credit card info
- PII (unless you explicitly include it)

✅ **What's OK to track:**
- User ID (anonymous or hashed)
- Action names (e.g., "gig_applied")
- Page URLs (no query strings)
- Error messages
- Performance metrics

---

## Next Steps

1. [ ] Sign up at sentry.io
2. [ ] Create Next.js project
3. [ ] Copy DSN
4. [ ] Add to `.env.local`
5. [ ] Trigger a test error
6. [ ] Verify in Sentry dashboard
7. [ ] Configure alerts
8. [ ] Add DSN to Vercel for production

**Questions?** Check [Sentry Docs](https://docs.sentry.io/platforms/javascript/guides/nextjs/)

