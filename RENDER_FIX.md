# Render Deployment Fix - DATABASE_URL Error

## Problem
Render deployment is failing because DATABASE_URL is incomplete:
```
Error: the URL must start with the protocol `postgresql://` or `postgres://`.
```

## Solution

### Your Complete DATABASE_URL (use this exactly):
```
DATABASE_URL="postgresql://postgres.PROJECT_REF:YOUR_PASSWORD@HOST:5432/postgres"
### Steps to Fix Render:

1. **Go to Render Dashboard**
   - Visit: https://dashboard.render.com
   - Find your service: `chess-app-backend-cy4h`

2. **Update Environment Variables**
   - Click on your service
   - Go to **Environment** tab
   - Find `DATABASE_URL` variable
   - Replace the incomplete value with the complete one above
   - Click **Save**

3. **Re-Deploy**
   - Click **Deploy** or push a commit to trigger auto-deploy
   - The deployment should now succeed

## Key Points:
✅ DATABASE_URL must start with `postgresql://`
✅ Must include username:password@ part
✅ Must end with `?sslmode=require`
✅ Local testing confirms this URL works

## If Still Failing:
- Check Render logs to see exact error
- Verify all special characters in password are correct
- Make sure there are no extra spaces in the URL
