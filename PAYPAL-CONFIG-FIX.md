# PayPal Configuration Fix Guide

## 🚨 **Current Issue:**

```
PayPal access token error: {
  error: 'invalid_client',
  error_description: 'Client Authentication failed'
}
```

## 🔧 **Solution Steps:**

### Step 1: Get PayPal Developer Credentials

#### For Testing (Sandbox):

1. Go to: https://developer.paypal.com/
2. Login with your PayPal account
3. Navigate to **"My Apps & Credentials"**
4. Click **"Create App"** under **Sandbox** section
5. Fill out:
   ```
   App Name: Mocko Designs
   Merchant: [Select your sandbox business account]
   Features: ✓ Accept Payments
   ```
6. Click **"Create App"**
7. **Copy these values:**
   - Client ID (starts with `AX...` or `A...`)
   - Client Secret (long string)

#### For Production (Live):

1. Same steps but under **"Live"** section
2. **Requirements:**
   - Verified PayPal Business account
   - App review by PayPal (may take 1-3 days)

### Step 2: Configure Back4App Environment Variables

1. **Go to Back4App Dashboard**
2. **Select your app** → **Container App**
3. **Navigate to "Environment Variables"**
4. **Add these variables:**

```
PAYPAL_CLIENT_ID=YOUR_ACTUAL_CLIENT_ID_HERE
PAYPAL_CLIENT_SECRET=YOUR_ACTUAL_CLIENT_SECRET_HERE
PAYPAL_BASE_URL=https://api-m.sandbox.paypal.com
```

**For Production, change to:**

```
PAYPAL_BASE_URL=https://api-m.paypal.com
```

### Step 3: Redeploy Back4App Container

1. After adding environment variables
2. Click **"Deploy"** or **"Redeploy"**
3. Wait for deployment to complete

### Step 4: Test PayPal Integration

You can test if credentials are working by visiting:

```
https://your-app.back4app.io/v1/health
```

Should show:

```json
{
  "status": "healthy",
  "services": {
    "paypal": "configured"
  }
}
```

## 🔍 **Common Issues:**

### Issue 1: Wrong Credentials

- **Symptoms**: `invalid_client` error
- **Solution**: Double-check Client ID and Secret from PayPal developer dashboard

### Issue 2: Sandbox vs Production Mismatch

- **Symptoms**: Authentication works but payments fail
- **Solution**: Ensure PAYPAL_BASE_URL matches your credential type:
  - Sandbox: `https://api-m.sandbox.paypal.com`
  - Live: `https://api-m.paypal.com`

### Issue 3: Missing Environment Variables

- **Symptoms**: "PayPal credentials not configured" error
- **Solution**: Verify all required env vars are set in Back4App

### Issue 4: App Not Approved (Production)

- **Symptoms**: Credentials work in sandbox but fail in production
- **Solution**: Wait for PayPal app review approval (1-3 business days)

## ✅ **Verification Steps:**

1. **Check Environment Variables** are set in Back4App
2. **Redeploy** the container after adding variables
3. **Test health endpoint** to verify configuration
4. **Try payment flow** to confirm functionality

## 🎯 **Current Status Check:**

Visit your health endpoint to see current configuration:

```
GET https://your-app.back4app.io/v1/health
```

Expected response:

```json
{
  "status": "healthy",
  "environment": "production",
  "services": {
    "database": "connected",
    "paypal": "configured",
    "cloudinary": "configured"
  }
}
```

Once PayPal shows "configured", the authentication error should be resolved! 🎉
