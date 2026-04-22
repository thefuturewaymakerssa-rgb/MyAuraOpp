# Production Deployment Checklist

## ✅ Environment Setup (COMPLETED)

### Supabase
- [x] Database initialized and migrations applied
- [x] Auth configured with OAuth (Google, GitHub)
- [x] RLS policies active
- [x] Real-time subscriptions enabled

### Payment Processing
- [x] PayFast Merchant account (Sandbox mode)
- [x] Paystack account configured (Test keys)
- [x] Webhook endpoints secured with CRON_SECRET

### External Services
- [x] Upstash Redis configured (Rate limiting & sessions)
- [x] OpenAI API integration ready (Embeddings & AI features)
- [x] Sentry error tracking configured (needs DSN in production)

---

## 🚀 Pre-Production Deployment

### 1. Environment Variables for Production

Create `.env.production` or configure via Vercel dashboard:

```bash
# Supabase (use production database)
NEXT_PUBLIC_SUPABASE_URL=<PRODUCTION_URL>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<PRODUCTION_ANON_KEY>
SUPABASE_SERVICE_ROLE_KEY=<PRODUCTION_SERVICE_ROLE>

# Error Tracking
NEXT_PUBLIC_SENTRY_DSN=<YOUR_SENTRY_DSN>

# Payment Processing
PAYFAST_SANDBOX=false # Disable sandbox for real transactions
PAYFAST_MERCHANT_ID=<LIVE_MERCHANT_ID>
PAYFAST_MERCHANT_KEY=<LIVE_MERCHANT_KEY>
PAYFAST_PASSPHRASE=<LIVE_PASSPHRASE>

NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=<LIVE_KEY>
PAYSTACK_SECRET_KEY=<LIVE_SECRET>

# OpenAI (ensure sufficient credits)
OPENAI_API_KEY=<LIVE_KEY>

# Upstash (production tier for higher limits)
UPSTASH_REDIS_REST_URL=<PRODUCTION_URL>
UPSTASH_REDIS_REST_TOKEN=<PRODUCTION_TOKEN>

# Security
CRON_SECRET=<STRONG_RANDOM_SECRET>
```

### 2. Build & Performance

```bash
# Verify production build succeeds
npm run build

# Check bundle size
npm run build -- --analyze  # if next-bundle-analyzer is installed

# Type check
npm run type-check

# Lint
npm run lint
```

### 3. Security Headers

Your `next.config.js` already includes:
- ✅ Standalone output mode for secure Docker deployment
- ✅ PWA offline fallback protection
- ✅ Auth routes excluded from precache
- ✅ Webpack fallback for sensitive modules

### 4. Database Migrations

Before deploying:

```bash
# Verify all migrations are applied in production
supabase migration list --project-id <YOUR_PROJECT_ID>

# If needed, apply pending migrations
supabase migration up --project-id <YOUR_PROJECT_ID>
```

### 5. Vercel Deployment

Deploy with:

```bash
# Option A: Using Vercel CLI
vercel --prod

# Option B: Auto-deploy from git
git push origin main
# (Vercel will auto-deploy if webhook is configured)
```

### 6. Post-Deployment Verification

- [ ] Health check endpoint: `GET /api/health`
- [ ] PWA installable: `npm run test:e2e` (once browsers download completes)
- [ ] Sentry receiving errors: Check Sentry dashboard
- [ ] Database queries fast: Monitor Supabase dashboard
- [ ] Payment processing: Test with PayFast/Paystack sandbox → live

---

## 🔒 Security Checklist

- [ ] API keys rotated and stored in Vercel secrets (not .env files)
- [ ] CRON_SECRET enforced for scheduled jobs
- [ ] RLS policies verified in Supabase
- [ ] Rate limiting active (Upstash)
- [ ] CORS configured correctly
- [ ] Auth callbacks validated
- [ ] File uploads scanned for malware
- [ ] Admin routes require authentication

---

## 📊 Monitoring in Production

### Sentry
- Set up alerts for critical errors
- Monitor Session Replay for user issues
- Track performance metrics (Web Vitals)

### Vercel Analytics
- Monitor Web Vitals
- Check function duration
- Review edge function performance

### Supabase
- Monitor database query performance
- Check real-time subscription count
- Review storage usage

### PWA Metrics
- Test offline functionality
- Verify cache strategies
- Monitor app install rate

---

## 🐛 Debugging Production Issues

### Tail Production Logs
```bash
vercel logs --prod
```

### SSH into Production Container (if using Docker)
```bash
docker exec -it <container_id> /bin/sh
```

### Database Debugging
```bash
# Connect to Supabase production
supabase db execute --file debug.sql --project-id <YOUR_PROJECT_ID>
```

---

## 🎯 Performance Targets

After deployment, aim for:
- **Lighthouse Score**: 90+
- **First Contentful Paint (FCP)**: < 1.5s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **Cumulative Layout Shift (CLS)**: < 0.1
- **Time to Interactive**: < 3.5s

Run audits with:
```bash
npm run test:e2e -- --headed  # Run in UI mode
# Then use Chrome DevTools → Lighthouse
```

---

## 🔄 Continuous Deployment

To enable auto-deployment on push to main:

1. In Vercel dashboard: **Settings → Git**
2. Enable "Deploy on push"
3. Set production branch to `main`
4. Configure deployment regions (select closest to SA)

---

## 📱 Mobile App (Future)

When ready for app stores:

1. **Android**: Use Capacitor or Expo to wrap PWA
2. **iOS**: Use PWA2App or native wrapper
3. Both will use the same deployment + manifest.json

---

## 💡 Quick Reference

| Service | Status | Next Step |
|---------|--------|-----------|
| Build & Lint | ✅ Passing | Deploy to staging |
| Database | ✅ Ready | Run migrations |
| Auth | ✅ Configured | Test OAuth flow |
| Payments | ✅ Sandbox Ready | Enable production keys |
| Error Tracking | ✅ Implemented | Add Sentry DSN |
| PWA | ✅ Configured | Test installability |
| Admin Panel | ✅ Complete | Run UAT |

