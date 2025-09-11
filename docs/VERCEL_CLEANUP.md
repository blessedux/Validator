# Vercel Project Cleanup and Redeployment Guide

## Step 1: Clean Local Environment

```bash
# Remove all Vercel-related files and caches
rm -rf frontend/.vercel
rm -rf frontend/.next
rm -rf frontend/node_modules
rm -rf node_modules
rm -rf .vercel

# Clean pnpm cache for good measure
pnpm store prune
```

## Step 2: Clean Vercel Project

1. Go to Vercel Dashboard
2. Select the current project (dobvalidator-frontend)
3. Go to Project Settings
4. Scroll to bottom and click "Delete Project"
5. Type project name to confirm deletion
6. Wait for complete deletion

## Step 3: Create Fresh Project

1. Go to Vercel Dashboard
2. Click "Add New..."
3. Select "Project"
4. Import from "blessedux/Validator"
5. Configure project:
   - Framework Preset: Next.js
   - Root Directory: frontend
   - Build Command: `cd ../.. && pnpm install && cd frontend && pnpm build`
   - Output Directory: .next
   - Install Command: `cd ../.. && pnpm install`

## Step 4: Environment Variables

Ensure these environment variables are set in Vercel:

```env
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://api.dobprotocol.com
# Add other necessary environment variables
```

## Step 5: Domain Configuration

1. Go to Project Settings > Domains
2. If domain exists:
   - Note down all DNS records
   - Remove existing domain
3. Add domain again:
   - Enter: validator.dobprotocol.com
   - Follow new DNS configuration

## Step 6: Deploy

1. Ensure you're on the `prod` branch
2. Push latest changes:

```bash
git checkout prod
git push origin prod
```

## Step 7: Verify Deployment

1. Check build logs for any errors
2. Verify domain is working
3. Test key functionality:
   - Homepage loads
   - API endpoints respond
   - Authentication works
   - Forms submit correctly

## Troubleshooting

If build fails:

1. Check build logs
2. Verify monorepo configuration
3. Ensure all dependencies are installed
4. Check for environment variables
5. Verify build output path

## Current Configuration

### vercel.json

```json
{
  "git": {
    "deploymentEnabled": {
      "main": false,
      "prod": true,
      "develop": false,
      "staging": false,
      "preview": false
    }
  },
  "buildCommand": "cd ../.. && pnpm install && cd frontend && pnpm build",
  "outputDirectory": ".next",
  "ignoreCommand": "if [ \"$VERCEL_GIT_COMMIT_REF\" != \"prod\" ]; then echo '🚫 Skipping deployment for non-production branch: $VERCEL_GIT_COMMIT_REF'; exit 1; fi",
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  }
}
```

## Important Notes

1. **Monorepo Structure**: Vercel needs to understand this is a monorepo with the Next.js app in the frontend directory
2. **Dependencies**: All workspace dependencies must be installed
3. **Build Context**: Build command must run from correct directory
4. **Environment**: All required environment variables must be set
5. **DNS**: May need 24-48 hours for DNS changes to propagate fully

## Recovery Steps

If deployment fails after cleanup:

1. Check build logs for specific errors
2. Verify all environment variables are set
3. Try a manual deployment using Vercel CLI:

```bash
cd frontend
vercel build
vercel deploy --prebuilt
```
