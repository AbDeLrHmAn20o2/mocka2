# Mocko Designs - Production Deployment Guide

## 🎯 Overview

This guide covers the complete deployment process for Mocko Designs, from local testing to production deployment on Back4App and AWS.

## 📋 Pre-Deployment Checklist

### ✅ Prerequisites

- [ ] Node.js 18+ installed
- [ ] MongoDB installed and running
- [ ] Git repository set up
- [ ] Environment variables configured
- [ ] All dependencies installed
- [ ] Tests passing locally

### ✅ Security Checklist

- [ ] JWT secrets updated (not using defaults)
- [ ] Database credentials secured
- [ ] API keys rotated and secured
- [ ] CORS origins properly configured
- [ ] Rate limiting enabled
- [ ] HTTPS enforced in production
- [ ] Security headers configured

### ✅ Performance Checklist

- [ ] Frontend build optimized
- [ ] Images compressed and optimized
- [ ] CDN configured for static assets
- [ ] Database indexes created
- [ ] Caching strategies implemented
- [ ] Monitoring tools configured

## 🏠 Local Development Setup

### 1. Environment Setup

```bash
# Clone repository
git clone <your-repo-url>
cd final_V3\ -\ Copy

# Run environment setup
chmod +x scripts/setup-environment.sh
./scripts/setup-environment.sh development

# Update environment variables
nano server/consolidated-server/.env
nano client/.env.local
```

### 2. Start Local Services

```bash
# Option A: Use setup script (Recommended)
chmod +x scripts/start-local.sh
./scripts/start-local.sh

# Option B: Manual start
# Terminal 1 - Backend
cd server/consolidated-server
npm run dev

# Terminal 2 - Frontend
cd client
npm run dev
```

### 3. Run Tests

```bash
# Install Python dependencies for testing
pip install requests

# Run production test suite
python scripts/test-production.py

# Run with custom URLs
python scripts/test-production.py --backend http://localhost:5000 --frontend http://localhost:3000
```

## ☁️ Back4App Deployment

### 1. Preparation

```bash
# Install Back4App CLI
npm install -g back4app-cli

# Setup Back4App configuration
source deployment/back4app-config.sh
```

### 2. Create Back4App Application

1. Go to [Back4App Dashboard](https://dashboard.back4app.com)
2. Create new Parse App
3. Note down App ID and Master Key
4. Configure database settings

### 3. Environment Variables

Set these in Back4App Dashboard > App Settings > Environment Variables:

```env
# Required Variables
MONGODB_URI=your-mongodb-uri
JWT_SECRET=your-jwt-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_CLIENT_SECRET=your-paypal-client-secret
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=https://your-app.back4app.io
```

### 4. Deploy to Back4App

```bash
# Login to Back4App
back4app login

# Deploy application
back4app deploy

# Alternative: Use deployment script
./scripts/deploy.sh back4app production
```

### 5. Frontend Deployment

```bash
# Build frontend for production
cd client
npm run build
npm run export

# Deploy to Vercel (recommended for Next.js)
npx vercel --prod

# Or deploy to Netlify
npm install -g netlify-cli
netlify deploy --prod --dir=out
```

## 🌐 AWS Deployment

### 1. AWS Prerequisites

```bash
# Install AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Configure AWS credentials
aws configure

# Install Docker (for ECS deployment)
sudo apt-get update
sudo apt-get install docker.io
```

### 2. Infrastructure Setup

```bash
# Setup AWS configuration
source deployment/aws-config.sh

# Deploy infrastructure
deploy_infrastructure

# Setup database
setup_documentdb
```

### 3. Backend Deployment (ECS)

```bash
# Deploy backend to ECS
deploy_backend_aws

# Monitor deployment
aws ecs describe-services --cluster mocko-designs-cluster --services mocko-designs-backend-production
```

### 4. Frontend Deployment (S3 + CloudFront)

```bash
# Deploy frontend to S3/CloudFront
deploy_frontend_aws

# Get CloudFront URL
aws cloudfront list-distributions --query 'DistributionList.Items[0].DomainName'
```

### 5. Complete AWS Deployment

```bash
# Deploy everything at once
deploy_full_aws

# Or use deployment script
./scripts/deploy.sh aws production
```

## 🔧 Configuration Management

### Environment-Specific Configurations

#### Development

```bash
# Setup development environment
./scripts/setup-environment.sh development
```

#### Staging

```bash
# Setup staging environment
./scripts/setup-environment.sh staging
```

#### Production

```bash
# Setup production environment
./scripts/setup-environment.sh production
```

### Database Configuration

#### MongoDB Atlas (Recommended)

1. Create MongoDB Atlas cluster
2. Whitelist deployment IPs
3. Create database user
4. Update MONGODB_URI in environment

#### Self-Hosted MongoDB

```bash
# Install MongoDB
sudo apt-get install mongodb

# Configure for production
sudo nano /etc/mongod.conf

# Start service
sudo systemctl start mongod
sudo systemctl enable mongod
```

## 📊 Monitoring and Maintenance

### Health Checks

```bash
# Backend health check
curl https://your-api-domain.com/health

# Frontend health check
curl https://your-frontend-domain.com

# Run full test suite
python scripts/test-production.py --backend https://your-api-domain.com --frontend https://your-frontend-domain.com
```

### Performance Monitoring

```bash
# Monitor server performance
htop
iostat
netstat -tuln

# Check application logs
tail -f logs/backend.log
tail -f logs/frontend.log

# PM2 monitoring (if using PM2)
pm2 monit
pm2 logs
```

### Backup Strategies

```bash
# Database backup (MongoDB)
mongodump --uri="your-mongodb-uri" --out=backup/$(date +%Y%m%d)

# Files backup (Cloudinary)
# Use Cloudinary's backup features or API

# Code backup
git push origin main
git tag -a v1.0.0 -m "Production release"
git push origin v1.0.0
```

## 🔄 CI/CD Pipeline

### GitHub Actions (Recommended)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: "18"
      - run: npm install
      - run: npm test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to AWS
        run: ./scripts/deploy.sh aws production
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
```

## 🚨 Troubleshooting

### Common Issues

#### Backend Not Starting

```bash
# Check logs
tail -f logs/backend.log

# Check port conflicts
lsof -i :5000

# Verify environment variables
env | grep -E "(NODE_ENV|MONGODB_URI|PORT)"
```

#### Frontend Build Failures

```bash
# Clear Next.js cache
rm -rf client/.next

# Check Node.js version
node --version

# Reinstall dependencies
rm -rf client/node_modules client/package-lock.json
npm install
```

#### Database Connection Issues

```bash
# Test MongoDB connection
mongo "your-mongodb-uri"

# Check network connectivity
ping your-mongodb-host

# Verify credentials
echo "Testing auth..." | mongo "your-mongodb-uri"
```

#### CORS Issues

```bash
# Check CORS headers
curl -H "Origin: https://your-frontend-domain.com" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: X-Requested-With" \
     -X OPTIONS \
     https://your-api-domain.com/api/v1/designs
```

### Performance Issues

```bash
# Check server resources
free -h
df -h
ps aux --sort=-%cpu | head

# Monitor database performance
db.runCommand({serverStatus: 1})

# Check network latency
ping your-api-domain.com
traceroute your-api-domain.com
```

## 📚 Additional Resources

### Documentation

- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Node.js Production Guide](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)
- [MongoDB Production Notes](https://docs.mongodb.com/manual/administration/production-notes/)
- [AWS ECS Guide](https://docs.aws.amazon.com/ecs/)
- [Back4App Documentation](https://docs.back4app.com/)

### Monitoring Tools

- **Application**: PM2, Forever
- **Server**: htop, iostat, netstat
- **Database**: MongoDB Compass, Studio 3T
- **External**: Pingdom, UptimeRobot
- **Logging**: CloudWatch, Loggly

### Support

- Check logs first: `logs/` directory
- Run health checks: `python scripts/test-production.py`
- Review environment variables
- Test locally before deployment
- Monitor performance metrics

---

## 🎉 Success Checklist

✅ **Local Environment**

- [ ] All services start successfully
- [ ] Tests pass locally
- [ ] Environment variables configured
- [ ] No console errors

✅ **Production Deployment**

- [ ] Backend deployed and responsive
- [ ] Frontend built and deployed
- [ ] Database connected
- [ ] SSL certificates installed
- [ ] Custom domain configured

✅ **Post-Deployment**

- [ ] Health checks passing
- [ ] Performance metrics acceptable
- [ ] Monitoring configured
- [ ] Backup strategy implemented
- [ ] Documentation updated

**🚀 Your Mocko Designs application is now ready for production!**
