# Environment Variables Setup

Create a `.env` file in the root directory with the following variables:

```env
# XANO Backend API
VITE_API_BASE_URL=https://x8ki-letl-twmt.n7.xano.io/api:Gw3_pzGF

# XANO WebSocket Connection
VITE_WS_CONNECTION_HASH=04aMV5lTFz_cBcFaEa8SNE7bCyI
VITE_WS_BASE_URL=wss://x8ki-letl-twmt.n7.xano.net

# Heater Device UID
VITE_HEATER_DEVICE_UID=345F4537C1B0

# Environment
VITE_ENV=development
```

## For Vercel Deployment

Add these same environment variables in your Vercel project settings:
1. Go to your project in Vercel dashboard
2. Navigate to Settings → Environment Variables
3. Add each variable for Production, Preview, and Development environments

## Notes

- All environment variables must be prefixed with `VITE_` to be accessible in the frontend code
- Never commit `.env` file to git (it's already in `.gitignore`)
- Use different values for development and production if needed
