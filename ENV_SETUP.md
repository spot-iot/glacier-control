# Environment Variables Setup

Create a `.env` file in the root directory with the following variables:

```env
# XANO Backend API
VITE_API_BASE_URL=https://your-xano-instance.xano.app/api/v1

# WebSocket URL (if different from API base)
VITE_WS_URL=wss://your-xano-instance.xano.app/ws

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
