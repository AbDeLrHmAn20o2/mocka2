# Mocko Designs - Production Deployment Guide

## 📋 Overview

This guide will help you deploy your Mocko Designs application:

- **Frontend**: Vercel (React/Next.js)
- **Backend**: Back4App (Node.js)
- **Database**: MongoDB Atlas (Cloud Database)

## 🎯 Step-by-Step Deployment Process

### Step 1: Prepare MongoDB Atlas Database

1. **Create MongoDB Atlas Account**

   - Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
   - Sign up for a free account
   - Create a new cluster (free tier M0)

2. **Configure Database Access**

   - In Atlas dashboard, go to "Database Access"
   - Create a database user with read/write permissions
   - Note down the username and password

3. **Configure Network Access**

   - Go to "Network Access"
   - Add IP address: `0.0.0.0/0` (allow access from anywhere)

4. **Get Connection String**
   - Go to "Clusters" → "Connect" → "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password

### Step 2: Deploy Backend to Back4App

1. **Create Back4App Account**

   - Go to [Back4App](https://www.back4app.com/)
   - Sign up for a free account
   - Create a new app

2. **Deploy Backend**

   - In Back4App dashboard, go to "Server Settings" → "Container App"
   - Connect your GitHub repository: `https://github.com/AbDeLrHmAn20o2/mocka2.git`
   - Set the root directory to: `server/consolidated-server`
   - Back4App will automatically detect the Dockerfile and build your container

3. **Configure Environment Variables**

   ```
   NODE_ENV=production
   PORT=1337
   MONGO_URI=your_mongodb_atlas_connection_string
   FRONTEND_URL=https://your-app-name.vercel.app
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   PAYPAL_CLIENT_ID=your_paypal_client_id
   PAYPAL_CLIENT_SECRET=your_paypal_client_secret
   PAYPAL_BASE_URL=https://api-m.paypal.com
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   JWT_SECRET=your_jwt_secret_key
   ```

4. **Deploy**
   - Click "Deploy" and wait for the build to complete
   - Note down your backend URL (e.g., `https://your-app.back4app.io`)

### Step 3: Deploy Frontend to Vercel

1. **Create Vercel Account**

   - Go to [Vercel](https://vercel.com/)
   - Sign up with your GitHub account

2. **Import Project**

   - Click "New Project"
   - Import your GitHub repository: `https://github.com/AbDeLrHmAn20o2/mocka2.git`
   - Set the root directory to: `client`
   - Vercel will auto-detect Next.js settings

3. **Configure Environment Variables**

   - In project settings → Environment Variables, add:

   ```
   NEXTAUTH_SECRET=your_nextauth_secret_key
   NEXTAUTH_URL=https://your-app-name.vercel.app
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   NEXT_PUBLIC_API_URL=https://your-app.back4app.io
   NEXT_PUBLIC_PAYPAL_CLIENT_ID=your_paypal_client_id
   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   ```

4. **Deploy**
   - Click "Deploy" and wait for the build to complete
   - Your app will be available at `https://your-app-name.vercel.app`

### Step 4: Update Backend with Frontend URL

1. **Update Back4App Environment Variables**
   - Go back to Back4App dashboard
   - Update the `FRONTEND_URL` environment variable with your Vercel URL
   - Redeploy the backend

### Step 5: Test Your Application

1. **Test Basic Functionality**

   - Visit your Vercel URL
   - Try user registration/login
   - Test the design editor
   - Test file uploads

2. **Test Payment Integration**
   - Try subscribing to premium features
   - Verify PayPal payments work correctly

### Step 6: Configure Custom Domain (Optional)

1. **Vercel Custom Domain**

   - In Vercel dashboard → Settings → Domains
   - Add your custom domain
   - Follow DNS configuration instructions

2. **Update Environment Variables**
   - Update all URLs to use your custom domain

### Step 7: Monitor and Maintain

1. **Set Up Monitoring**

   - Use Vercel Analytics for frontend monitoring
   - Use Back4App logs for backend monitoring

2. **Regular Updates**
   - Keep dependencies updated
   - Monitor error logs
   - Update environment variables as needed

## 🔧 Required Service Accounts

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add your domains to authorized origins

### PayPal Developer Setup

1. Go to [PayPal Developer](https://developer.paypal.com/)
2. Create a business account
3. Create a new app
4. Get Client ID and Client Secret
5. Configure webhook URLs (optional)

### Cloudinary Setup

1. Go to [Cloudinary](https://cloudinary.com/)
2. Sign up for free account
3. Get Cloud Name, API Key, and API Secret from dashboard

## 🚨 Important Notes

- **Security**: Never commit real environment variables to GitHub
- **CORS**: Ensure your backend CORS settings allow your frontend domain
- **HTTPS**: Always use HTTPS in production
- **Error Handling**: Monitor logs regularly for any issues
- **Backups**: Set up regular database backups in MongoDB Atlas

## 📞 Support

If you encounter any issues during deployment:

1. Check the application logs in both Vercel and Back4App
2. Verify all environment variables are correctly set
3. Ensure all service accounts (Google, PayPal, Cloudinary) are properly configured
4. Test API endpoints directly before testing through the frontend

## 🎉 Success Checklist

- [ ] MongoDB Atlas database is accessible
- [ ] Backend deployed to Back4App and running
- [ ] Frontend deployed to Vercel and loading
- [ ] User authentication works (Google OAuth)
- [ ] Design editor functions correctly
- [ ] File uploads work (Cloudinary)
- [ ] Payment processing works (PayPal)
- [ ] All environment variables configured
- [ ] Custom domain configured (if applicable)
