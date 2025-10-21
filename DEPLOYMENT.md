# Deploying to Render

This guide will help you deploy your Viseme Avatar Studio to Render for free.

## Prerequisites

1. GitHub account (you already have your code pushed)
2. Render account (free) - Sign up at https://render.com
3. Your Cloudinary credentials (already in Replit Secrets)
4. Your Neon PostgreSQL DATABASE_URL (already in Replit Secrets)

## Step-by-Step Deployment

### 1. Get Your Environment Variables from Replit

Before deploying, collect these values from your Replit Secrets panel:

- `DATABASE_URL` - Your Neon PostgreSQL connection string
- `CLOUDINARY_CLOUD_NAME` - Your Cloudinary cloud name
- `CLOUDINARY_API_KEY` - Your Cloudinary API key
- `CLOUDINARY_API_SECRET` - Your Cloudinary API secret

**How to find them in Replit:**
1. Click the 🔒 "Secrets" tab in the left sidebar
2. Copy each value (you'll paste them into Render)

---

### 2. Create a New Web Service on Render

1. Go to https://render.com and sign in
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub account if you haven't already
4. Select your repository: **Jakkiinofglobal/Visime-Avamedia**
5. Click **"Connect"**

---

### 3. Configure Your Service

On the configuration page, enter these settings:

**Basic Settings:**
- **Name**: `viseme-avatar-studio` (or any name you like)
- **Region**: Choose closest to you (e.g., Oregon, Ohio, Frankfurt)
- **Branch**: `main`
- **Runtime**: `Node`

**Build & Deploy Settings:**
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`

**Plan:**
- Select **"Free"** (0 dollars/month)

---

### 4. Add Environment Variables

Scroll down to **"Environment Variables"** section and add these:

Click **"Add Environment Variable"** for each:

| Key | Value | Where to Get It |
|-----|-------|-----------------|
| `NODE_ENV` | `production` | Just type "production" |
| `DATABASE_URL` | (your value) | Copy from Replit Secrets |
| `CLOUDINARY_CLOUD_NAME` | (your value) | Copy from Replit Secrets |
| `CLOUDINARY_API_KEY` | (your value) | Copy from Replit Secrets |
| `CLOUDINARY_API_SECRET` | (your value) | Copy from Replit Secrets |

**Important:** Make sure you copy the exact values from Replit Secrets!

---

### 5. Deploy!

1. Click **"Create Web Service"** at the bottom
2. Render will start building your app (takes 3-5 minutes)
3. Watch the logs - you should see:
   - `npm install` running
   - `vite build` running
   - `serving on port 10000` (or similar)
4. When you see **"Your service is live 🎉"** - you're done!

---

### 6. Access Your App

Your app will be available at:
```
https://viseme-avatar-studio.onrender.com
```

(The exact URL will be shown in your Render dashboard)

**Note:** The first time you visit, it might take 30-60 seconds to wake up (free tier spins down after 15 min of inactivity). After that, it works normally!

---

## Troubleshooting

### If Build Fails:

**Error: `vite: command not found`**
- This shouldn't happen, but if it does, the build command should use `npx`:
  - Build Command: `npm install && npx vite build && npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist`

**Error: Database connection failed**
- Check your `DATABASE_URL` is correct
- Make sure your Neon database is active (free tier pauses after inactivity)
- Test connection from Replit first

**Error: Cloudinary upload fails**
- Verify all three Cloudinary env vars are set correctly
- Check for typos in the variable names

### If App Won't Start (502 Bad Gateway):

1. Click "Logs" in Render dashboard
2. Scroll to the bottom
3. Look for error messages
4. Common issues:
   - Missing environment variables
   - Database connection timeout
   - Port binding (should auto-bind to PORT env var)

---

## After Deployment

### Testing Your Deployed App:

1. Visit your Render URL
2. Create a new project
3. Try uploading a video clip
4. Check that files are stored in Cloudinary (they should appear in your Cloudinary dashboard)

### Updating Your App:

Every time you push to GitHub (`main` branch), Render will automatically rebuild and redeploy!

```bash
git add .
git commit -m "Your changes"
git push origin main
```

Render will detect the push and deploy automatically (takes 3-5 min).

---

## Cost & Limitations

**Render Free Tier:**
- ✅ 512MB RAM
- ✅ 750 hours/month (more than enough)
- ✅ Automatic HTTPS
- ⚠️ Spins down after 15 min inactivity (30-60 sec cold start)
- ⚠️ Shared IP (not dedicated)

**This is perfect for:**
- Personal projects
- Testing and development
- Streaming apps (load once, use for hours)

**Upgrade if you need:**
- No cold starts (always-on)
- More RAM/CPU
- Custom domain

---

## Need Help?

If you run into issues:
1. Check the Render logs (most detailed info)
2. Verify all environment variables are set
3. Make sure your GitHub repo is up to date
4. Test locally first (`npm run build && npm start`)

Your app should work perfectly on Render's free tier! 🚀
