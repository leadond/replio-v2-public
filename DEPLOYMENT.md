# Replio v2 - Deployment Guide

## Quick Deploy to Production

### Frontend: Vercel (5 minutes)

```powershell
cd C:\AI\Clients\DweezyAiTEAM\v_assistant\replio-v2\replio-frontend

# Install Vercel CLI
npm install -g vercel

# Deploy
vercel
```

**Result:** Your frontend will be live at `https://replio.vercel.app` (or your custom domain)

---

### Backend: Railway (10 minutes - Easiest)

**Step 1: Create Railway Account**
- Go to https://railway.app
- Sign up (free tier available)
- Verify email

**Step 2: Create New Project**
1. Click "New Project"
2. Select "GitHub" (connect your repo) OR "Deploy from repo"
3. Select the `replio-v2` repository

**Step 3: Configure Environment Variables**
In Railway dashboard, add these variables:
```
DATABASE_URL=postgresql://replio:replio@your-db-host:5432/replio
SECRET_KEY=your-secret-key-here
MOCK_SIGNALWIRE=False
SIGNALWIRE_PROJECT_ID=your-project-id
SIGNALWIRE_API_TOKEN=your-api-token
SIGNALWIRE_SPACE=your-space.signalwire.com
SIGNALWIRE_PHONE_NUMBER=+1234567890
APP_URL=https://your-backend-url.railway.app
FRONTEND_URL=https://your-frontend.vercel.app
```

**Step 4: Add PostgreSQL Database**
1. Click "Add" in Railway
2. Select "PostgreSQL"
3. Railway will auto-populate `DATABASE_URL`

**Result:** Backend will be live at `https://your-backend.railway.app` (auto-generated URL)

---

### Alternative: Render.com

1. Go to https://render.com
2. Click "New +"
3. Select "Web Service"
4. Connect your GitHub repo
5. Set runtime to Python 3.11
6. Add environment variables (same as above)
7. Add PostgreSQL database from Render

---

## Update SignalWire Webhook

Once backend is deployed:

1. Go to **SignalWire Dashboard**
2. Select your phone number
3. Set **Voice Webhook URL** to:
   ```
   https://your-backend.railway.app/webhooks/signalwire/voice
   ```

4. Test an incoming call - it should now reach your app!

---

## Update Frontend API URL

After backend is deployed, update the frontend to use the production backend:

**Edit:** `replio-frontend/src/api/client.ts`

Change:
```typescript
const BASE_URL = process.env.VITE_API_URL || 'http://localhost:8000'
```

To:
```typescript
const BASE_URL = process.env.VITE_API_URL || 'https://your-backend.railway.app'
```

Then redeploy frontend:
```powershell
cd C:\AI\Clients\DweezyAiTEAM\v_assistant\replio-v2\replio-frontend
vercel
```

---

## Live URLs After Deployment

- **Frontend:** `https://your-name.vercel.app`
- **Backend API:** `https://your-backend.railway.app`
- **SignalWire Webhook:** `https://your-backend.railway.app/webhooks/signalwire/voice`

---

## Monitoring

### Vercel Logs
```powershell
vercel logs --tail
```

### Railway Logs
1. Go to Railway dashboard
2. Click your project
3. Click "Logs" tab

### Check API Health
```powershell
curl https://your-backend.railway.app/api/
```

---

## Costs

- **Vercel:** Free tier (great for production)
- **Railway:** Free tier with $5/month credit
- **PostgreSQL on Railway:** ~$15/month (included in free tier for small DBs)

Total estimated cost: **$15-20/month** (very affordable)

---

## Troubleshooting

**Frontend won't build on Vercel:**
- Check Node version in `package.json`
- Ensure all dependencies are in `package.json`
- Check build logs in Vercel dashboard

**Backend won't start on Railway:**
- Check environment variables are set
- Verify PostgreSQL connection string
- Check logs in Railway dashboard

**SignalWire calls not reaching app:**
- Verify webhook URL is correct in SignalWire dashboard
- Check backend logs for incoming webhook requests
- Ensure `CORS` is enabled (it is by default)

---

## Security Checklist

- ✅ Use strong `SECRET_KEY` (generate: `python -c "import secrets; print(secrets.token_hex(32))"`)
- ✅ Use HTTPS URLs only (both provide this)
- ✅ Don't commit `.env` files
- ✅ Rotate credentials regularly
- ✅ Use environment variables for all secrets
- ✅ Enable CORS only for your domain (update `allow_origins` in `app/main.py`)

---

## Next Steps

1. Deploy frontend to Vercel
2. Deploy backend to Railway
3. Add PostgreSQL to Railway
4. Set environment variables in Railway
5. Update SignalWire webhook URL
6. Update frontend API URL
7. Test incoming call

Ready to deploy? Start with Vercel for frontend!
