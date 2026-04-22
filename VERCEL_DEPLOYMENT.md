# 🚀 Vercel Deployment Guide - Option 2

## Quick Deploy (3 minutes)

### Prerequisites
- [ ] Vercel account (free at vercel.com)
- [ ] Production-ready code
- [ ] Environment variables ready

### Step 1: Install Vercel CLI
```bash
npm i -g vercel
```

### Step 2: Deploy to Preview
```bash
# From your project root
cd c:\Users\Njongo\my-mvp1
vercel
# Follow prompts:
# - Link to existing project? → No (first time)
# - Set project name → "future-waymakers"
# - Choose framework → Next.js
# - Build command → npm run build ✓
# - Output directory → .next ✓
# - Environment variables → Set below
```

### Step 3: Set Environment Variables

When prompted for environment variables, enter:

```
NEXT_PUBLIC_SUPABASE_URL=https://ckprygvkyvdufhnfeyci.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
UPSTASH_REDIS_REST_URL=https://full-sheepdog-98231.upstash.io
UPSTASH_REDIS_REST_TOKEN=gQAAAAAAAX-3AAInc...
CRON_SECRET=G4KUJ8VJH5074Z05JM3AO6JF91CF7T
PAYSTACK_SECRET_KEY=sk_test_33face9cde...
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_220e6884...
PAYFAST_MERCHANT_ID=10000100
PAYFAST_MERCHANT_KEY=46f0cd694581a
PAYFAST_PASSPHRASE=payfast
PAYFAST_SANDBOX=true
OPENAI_API_KEY=sk-placeholder
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
```

### Step 4: Get Preview URL
Vercel will output:
```
✓ Production: https://future-waymakers.vercel.app
✓ Preview: https://future-waymakers-abc123.vercel.app
```

**Done! 🎉** Deploy is live. Share preview URL with team.

---

## Production Deployment

### Option A: Deploy via Vercel CLI
```bash
vercel --prod
# Uses production environment variables
# Deploys to main domain: https://future-waymakers.vercel.app
```

### Option B: Deploy via Git Push (Auto-deploy)
1. Push code to GitHub: `git push origin main`
2. Vercel auto-detects and deploys
3. Check Vercel Dashboard for status

---

## Environment Variables Setup (Detailed)

### In Vercel Dashboard:

1. **Project Settings** → **Environment Variables**

2. **Add variables** for each environment:

```
# Development
NEXT_PUBLIC_SUPABASE_URL      | Available | ✓ Preview ✓ Development
NEXT_PUBLIC_SUPABASE_ANON_KEY | Available | ✓ Preview ✓ Development
...

# Production Only
NEXT_PUBLIC_SENTRY_DSN        | https://xxx | ✓ Production
PAYFAST_SANDBOX               | false      | ✓ Production
PAYFAST_MERCHANT_ID           | [prod]     | ✓ Production
...
```

### Critical for Production:
- [ ] `NEXT_PUBLIC_SENTRY_DSN` → Your Sentry project DSN
- [ ] `PAYFAST_SANDBOX=false` → Real PayFast merchant ID
- [ ] `PAYFAST_MERCHANT_ID` → Production merchant ID
- [ ] `OPENAI_API_KEY` → Valid key with enough credits

---

## Post-Deployment Verification

### Checklist

- [ ] **Visit the URL**: https://future-waymakers-xxx.vercel.app
- [ ] **Check health**: `/api/health` → 200 OK
- [ ] **PWA metadata**: Open DevTools → Application → check manifest.json
- [ ] **API working**: Click "Browse Gigs" → should load data
- [ ] **Authentication**: Try sign-up flow
- [ ] **Database**: Create a test account → should save to Supabase

### Performance Check

```bash
# Use Vercel's built-in Lighthouse audit
# Or run locally:
npm install -g @lhci/cli
lhci autorun
# Then check report
```

---

## Testing Features on Staging

Open your preview URL and test:

### Talent Flow
1. [ ] Sign up with new email
2. [ ] Verify email
3. [ ] Select "Talent" role
4. [ ] Navigate to `/talent/studio`
5. [ ] Try recording/uploading (should work)

### Employer Flow
1. [ ] Sign up with different email
2. [ ] Select "Employer" role
3. [ ] Go to `/employer/gigs/new`
4. [ ] Create a test gig
5. [ ] Go to `/employer/hub` → see gig in list

### Payment Testing (Sandbox)
1. [ ] Create a contract as employer
2. [ ] Click "Fund Escrow"
3. [ ] Use PayFast sandbox test card: `4111 1111 1111 1111`
4. [ ] Verify payment completes

---

## Monitoring Production

### Vercel Dashboard
- **Analytics**: Visit vercel.com → Select project → Analytics
- **Edge Logs**: See all requests in real-time
- **Functions**: Monitor serverless API performance
- **Deployments**: View history and roll back if needed

### Sentry Integration
1. Errors auto-report to Sentry dashboard
2. Set up Slack alerts: Sentry → Settings → Integrations → Add Slack
3. Monitor error rate and user impact

### Supabase Monitoring
1. Open supabase.co → Select project → Logs
2. Watch database queries in real-time
3. Check for slow queries

---

## Common Issues & Solutions

### Issue: Build fails with "Module not found"
**Solution**: Add missing dependency to `package.json` and redeploy

### Issue: 404 on API route
**Solution**: Verify route exists in `app/api/...` folder structure

### Issue: Supabase connection fails
**Solution**: Check `NEXT_PUBLIC_SUPABASE_URL` and anon key in environment

### Issue: Payment redirect fails
**Solution**: Verify PayFast/Paystack test keys in environment variables

### Issue: Emails not sending
**Solution**: Supabase SMTP configured? Check Supabase → Email templates

---

## Rollback (If Issues)

```bash
# View recent deployments
vercel ls

# Roll back to previous version
vercel rollback
# Or select from list and hit Enter
```

---

## Custom Domain Setup

Once confident in production:

1. **Register domain** (namecheap, godaddy, etc.)
2. **In Vercel Dashboard**: Project Settings → Domains
3. **Add domain**: future-waymakers.co.za
4. **Update DNS**: Point to Vercel nameservers
5. **Wait 24-48h** for DNS propagation

---

## Security Checklist Before Going Live

- [ ] All API keys are production keys (not test/sandbox)
- [ ] `PAYFAST_SANDBOX=false` for real payments
- [ ] `NEXT_PUBLIC_SENTRY_DSN` is set
- [ ] CORS restricted to your domain only
- [ ] Rate limiting enabled (Upstash)
- [ ] Database backups configured
- [ ] SSL certificate active (auto with Vercel)

---

## Support & Troubleshooting

### Get Deployment Logs
```bash
vercel logs
# or
vercel logs --prod
```

### Check Real-time Requests
Vercel Dashboard → Project → Deployments → Select deployment → Logs

### Contact Vercel Support
- Free tier: Community support
- Pro: Priority support

---

## Next Steps

1. [ ] Deploy to preview: `vercel`
2. [ ] Test all flows on preview URL
3. [ ] Get team feedback
4. [ ] Fix any issues
5. [ ] Set production environment variables
6. [ ] Deploy to production: `vercel --prod`
7. [ ] Monitor Sentry for errors
8. [ ] Check Lighthouse scores

**Deployment Status**: 🟢 READY

