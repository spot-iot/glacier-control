# Vercel Deployment Guide

This guide will walk you through deploying Glacier Control to Vercel and connecting your custom domain `glaciercontrol.com`.

## Prerequisites

- ✅ GitHub repository is set up and pushed
- ✅ Vercel Pro account
- ✅ Domain `glaciercontrol.com` registered with Porkbun

## Step 1: Connect GitHub Repository to Vercel

1. **Go to Vercel Dashboard**
   - Visit [vercel.com](https://vercel.com) and log in
   - Click **"Add New..."** → **"Project"**

2. **Import Repository**
   - Select **"Import Git Repository"**
   - Find and select `spot-iot/glacier-control` (or your repo name)
   - Click **"Import"**

3. **Configure Project**
   - **Framework Preset**: Vite (should auto-detect)
   - **Root Directory**: `./` (leave as default)
   - **Build Command**: `npm run build` (should auto-detect)
   - **Output Directory**: `dist` (should auto-detect)
   - **Install Command**: `npm install` (should auto-detect)

4. **Click "Deploy"** (we'll add environment variables next)

## Step 2: Configure Environment Variables

After the initial deployment, you need to add environment variables:

1. **Go to Project Settings**
   - In your Vercel project dashboard, click **"Settings"**
   - Navigate to **"Environment Variables"**

2. **Add Each Variable**
   Add these variables for **Production**, **Preview**, and **Development** environments:

   ```
   VITE_API_BASE_URL=https://x8ki-letl-twmt.n7.xano.io/api:Gw3_pzGF
   VITE_WS_CONNECTION_HASH=04aMV5lTFz_cBcFaEa8SNE7bCyI
   VITE_WS_BASE_URL=wss://x8ki-letl-twmt.n7.xano.io
   VITE_HEATER_DEVICE_UID=345F4537C1B0
   VITE_ENV=production
   ```

   **Note**: For `VITE_WS_BASE_URL`, use `wss://x8ki-letl-twmt.n7.xano.io` (not `.net`)

3. **Redeploy**
   - After adding all variables, go to **"Deployments"** tab
   - Click the **"..."** menu on the latest deployment
   - Select **"Redeploy"** to apply the new environment variables

## Step 3: Add Custom Domain

1. **Add Domain in Vercel**
   - In your project dashboard, go to **"Settings"** → **"Domains"**
   - Enter `glaciercontrol.com` in the domain field
   - Click **"Add"**

2. **Vercel will show DNS configuration**
   - You'll see instructions like:
     - **Type**: `A` or `CNAME`
     - **Name**: `@` or `www`
     - **Value**: Vercel's IP or CNAME target

## Step 4: Configure DNS in Porkbun

1. **Log into Porkbun**
   - Go to [porkbun.com](https://porkbun.com) and log in
   - Navigate to your domain management for `glaciercontrol.com`

2. **Add DNS Records**
   
   **Option A: Using A Record (Root Domain)**
   - Vercel will provide an IP address (e.g., `76.76.21.21`)
   - In Porkbun, add:
     - **Type**: `A`
     - **Host**: `@` (or leave blank for root)
     - **Answer**: `76.76.21.21` (use Vercel's provided IP)
     - **TTL**: `600` (or default)

   **Option B: Using CNAME (Recommended)**
   - Vercel will provide a CNAME target (e.g., `cname.vercel-dns.com`)
   - In Porkbun, add:
     - **Type**: `CNAME`
     - **Host**: `@` (or leave blank for root)
     - **Answer**: `cname.vercel-dns.com` (use Vercel's provided CNAME)
     - **TTL**: `600` (or default)

   **For www subdomain (optional):**
   - **Type**: `CNAME`
   - **Host**: `www`
   - **Answer**: `cname.vercel-dns.com` (same as root)
   - **TTL**: `600`

3. **Save DNS Records**
   - Click **"Save"** or **"Add Record"** in Porkbun
   - DNS propagation can take 5 minutes to 48 hours (usually 5-30 minutes)

## Step 5: Verify Domain in Vercel

1. **Wait for DNS Propagation**
   - Vercel will automatically detect when DNS is configured
   - You can check status in **"Settings"** → **"Domains"**

2. **SSL Certificate**
   - Vercel automatically provisions SSL certificates via Let's Encrypt
   - This happens automatically once DNS is verified
   - Usually takes 1-5 minutes after DNS verification

3. **Verify Domain Status**
   - In Vercel dashboard, the domain should show:
     - ✅ **Valid Configuration**
     - ✅ **SSL Certificate Active**

## Step 6: Test Deployment

1. **Visit Your Domain**
   - Go to `https://glaciercontrol.com`
   - You should see the login page

2. **Test Public View**
   - Visit `https://glaciercontrol.com/public`
   - Should show the read-only dashboard

3. **Test WebSocket Connection**
   - Log in and check the dashboard
   - Look for the green dot indicating WebSocket connection
   - Check browser console for any errors

## Troubleshooting

### Domain Not Resolving
- **Check DNS propagation**: Use [dnschecker.org](https://dnschecker.org) to see if DNS records have propagated globally
- **Verify DNS records**: Double-check the records in Porkbun match Vercel's requirements
- **Wait longer**: DNS can take up to 48 hours (rare, usually 5-30 minutes)

### SSL Certificate Issues
- Vercel automatically provisions SSL, but it requires DNS to be fully propagated
- If SSL fails, wait 10-15 minutes and check again
- Ensure you're using `https://` not `http://`

### Environment Variables Not Working
- Make sure all variables are prefixed with `VITE_`
- Redeploy after adding/changing environment variables
- Check Vercel build logs for any errors

### WebSocket Connection Issues
- Verify `VITE_WS_BASE_URL` uses `.io` not `.net`
- Check that `VITE_WS_CONNECTION_HASH` is correct
- Ensure XANO WebSocket is accessible from the internet (not blocked by firewall)

### Build Failures
- Check Vercel build logs in the **"Deployments"** tab
- Ensure all dependencies are in `package.json`
- Verify Node.js version (Vercel auto-detects, but you can set it in `vercel.json`)

## Additional Vercel Configuration

Your `vercel.json` is already configured correctly for:
- ✅ Vite framework
- ✅ SPA routing (all routes redirect to `index.html`)
- ✅ Build and output directories

## Next Steps After Deployment

1. **Set up monitoring** (optional)
   - Vercel Analytics (if you have Pro)
   - Error tracking (Sentry, etc.)

2. **Configure CORS in XANO** (if needed)
   - Add `https://glaciercontrol.com` to allowed origins
   - Add `https://www.glaciercontrol.com` if using www subdomain

3. **Test all features**
   - Login/logout flow
   - Heater controls
   - WebSocket telemetry
   - Public view

## Support

If you encounter issues:
- Check Vercel deployment logs
- Check browser console for errors
- Verify environment variables are set correctly
- Ensure DNS has propagated (use dnschecker.org)
