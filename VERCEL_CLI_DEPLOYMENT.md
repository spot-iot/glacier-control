# Deploying to Vercel via CLI

If you can't connect the GitHub repository directly to Vercel (due to different GitHub accounts), you can deploy using the Vercel CLI.

## Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

Or use without installing globally:
```bash
npx vercel
```

## Step 2: Login to Vercel

```bash
vercel login
```

This will open a browser window to authenticate with your Vercel account.

## Step 3: Deploy from Project Directory

Make sure you're in the project root:

```bash
cd /Users/mike/GlacierNode
vercel
```

The CLI will ask you:
1. **Set up and deploy?** → Yes
2. **Which scope?** → Select your Vercel account/team
3. **Link to existing project?** → No (first time) or Yes (if you've deployed before)
4. **Project name?** → `glacier-control` (or your preferred name)
5. **Directory?** → `./` (current directory)
6. **Override settings?** → No (it will use `vercel.json`)

## Step 4: Add Environment Variables

After the first deployment, add environment variables:

```bash
vercel env add VITE_API_BASE_URL production
# Enter: https://x8ki-letl-twmt.n7.xano.io/api:Gw3_pzGF

vercel env add VITE_WS_CONNECTION_HASH production
# Enter: 04aMV5lTFz_cBcFaEa8SNE7bCyI

vercel env add VITE_WS_BASE_URL production
# Enter: wss://x8ki-letl-twmt.n7.xano.io

vercel env add VITE_HEATER_DEVICE_UID production
# Enter: 345F4537C1B0

vercel env add VITE_ENV production
# Enter: production
```

Or add them all at once via the Vercel dashboard:
- Go to your project in Vercel
- Settings → Environment Variables
- Add each variable

## Step 5: Redeploy with Environment Variables

```bash
vercel --prod
```

## Step 6: Add Custom Domain

1. In Vercel dashboard, go to your project
2. Settings → Domains
3. Add `glaciercontrol.com`
4. Follow DNS instructions (same as in VERCEL_DEPLOYMENT.md)

## Step 7: Set Up Automatic Deployments (Optional)

Even though the repo isn't connected, you can still deploy manually:

```bash
# Deploy to production
vercel --prod

# Deploy preview
vercel
```

Or set up a GitHub Action to auto-deploy on push (see below).

## Alternative: GitHub Actions for Auto-Deploy

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install Vercel CLI
        run: npm install -g vercel
      
      - name: Deploy to Vercel
        run: vercel --prod --token ${{ secrets.VERCEL_TOKEN }}
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
```

Then add these secrets to your GitHub repository:
- `VERCEL_TOKEN`: Get from Vercel → Settings → Tokens
- `VERCEL_ORG_ID`: Get from Vercel project settings
- `VERCEL_PROJECT_ID`: Get from Vercel project settings

## Benefits of CLI Deployment

✅ Works with any GitHub account
✅ No need to connect GitHub to Vercel
✅ Can still use Vercel dashboard for domain management
✅ Can set up CI/CD via GitHub Actions if needed

## Troubleshooting

**"Project not found"**
- Make sure you're logged in: `vercel login`
- Check you're in the correct directory

**"Environment variables not working"**
- Make sure they're set for the correct environment (production/preview)
- Redeploy after adding variables: `vercel --prod`

**"Build fails"**
- Check build logs in Vercel dashboard
- Test build locally first: `npm run build`
