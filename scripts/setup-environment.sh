#!/bin/bash

# =============================================
# Mocko Designs - Environment Setup Script
# =============================================

echo "🔧 Setting up Mocko Designs environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default environment
ENVIRONMENT=${1:-"development"}

echo -e "${BLUE}Setting up environment: ${ENVIRONMENT}${NC}"

# Create directories
create_directories() {
    echo -e "${BLUE}📁 Creating directory structure...${NC}"
    
    directories=(
        "logs"
        "scripts"
        "deployment"
        "server/consolidated-server/src/utils"
        "server/consolidated-server/src/middleware"
        "server/consolidated-server/src/models"
        "server/consolidated-server/src/controllers"
        "server/consolidated-server/src/routes"
        "client/public/temp"
        "client/src/temp"
    )
    
    for dir in "${directories[@]}"; do
        mkdir -p "$dir"
        echo -e "${GREEN}✅ Created: $dir${NC}"
    done
}

# Setup backend environment
setup_backend_env() {
    echo -e "${BLUE}⚙️ Setting up backend environment...${NC}"
    
    backend_env_file="server/consolidated-server/.env"
    
    if [ "$ENVIRONMENT" = "production" ]; then
        cat > "$backend_env_file" << EOF
# Production Environment
NODE_ENV=production
PORT=5000

# Database
MONGODB_URI=mongodb://localhost:27017/mocko_designs_prod

# JWT Configuration
JWT_SECRET=your-super-secure-jwt-secret-change-this-in-production
JWT_EXPIRES_IN=7d

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret

# PayPal
PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_CLIENT_SECRET=your-paypal-client-secret
PAYPAL_MODE=live

# Security
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS
ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com

# Email (optional)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# File Upload
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,image/webp

# Redis (optional for sessions)
REDIS_URL=redis://localhost:6379

# Monitoring
ENABLE_LOGGING=true
LOG_LEVEL=info

# Feature Flags
ENABLE_AI_FEATURES=true
ENABLE_PREMIUM_FEATURES=true
ENABLE_ANALYTICS=true
EOF
    else
        cat > "$backend_env_file" << EOF
# Development Environment
NODE_ENV=development
PORT=5000

# Database
MONGODB_URI=mongodb://localhost:27017/mocko_designs_dev

# JWT Configuration
JWT_SECRET=dev-jwt-secret-not-for-production
JWT_EXPIRES_IN=24h

# Google OAuth (Development)
GOOGLE_CLIENT_ID=your-dev-google-client-id
GOOGLE_CLIENT_SECRET=your-dev-google-client-secret

# Cloudinary (Development)
CLOUDINARY_CLOUD_NAME=your-dev-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-dev-cloudinary-api-key
CLOUDINARY_API_SECRET=your-dev-cloudinary-api-secret

# PayPal (Sandbox)
PAYPAL_CLIENT_ID=your-paypal-sandbox-client-id
PAYPAL_CLIENT_SECRET=your-paypal-sandbox-client-secret
PAYPAL_MODE=sandbox

# Security (Relaxed for dev)
BCRYPT_ROUNDS=8
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=1000

# CORS (Allow localhost)
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001

# Development Tools
ENABLE_CORS_ALL=true
ENABLE_DEBUG_LOGS=true
DISABLE_RATE_LIMIT=false

# File Upload
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,image/webp,image/svg+xml

# Feature Flags
ENABLE_AI_FEATURES=true
ENABLE_PREMIUM_FEATURES=true
ENABLE_ANALYTICS=false
EOF
    fi
    
    echo -e "${GREEN}✅ Backend .env created for ${ENVIRONMENT}${NC}"
}

# Setup frontend environment
setup_frontend_env() {
    echo -e "${BLUE}⚙️ Setting up frontend environment...${NC}"
    
    frontend_env_file="client/.env.local"
    
    if [ "$ENVIRONMENT" = "production" ]; then
        cat > "$frontend_env_file" << EOF
# Production Environment
NEXT_PUBLIC_APP_ENV=production
NEXT_PUBLIC_APP_NAME=Mocko Designs
NEXT_PUBLIC_APP_VERSION=1.0.0

# API Configuration
NEXT_PUBLIC_API_URL=https://your-api-domain.com
NEXT_PUBLIC_API_VERSION=v1

# Authentication
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-nextauth-secret-change-this-in-production

# Google OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# PayPal
NEXT_PUBLIC_PAYPAL_CLIENT_ID=your-paypal-client-id

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your-upload-preset

# Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
NEXT_PUBLIC_ENABLE_ANALYTICS=true

# Feature Flags
NEXT_PUBLIC_ENABLE_AI_FEATURES=true
NEXT_PUBLIC_ENABLE_PREMIUM=true
NEXT_PUBLIC_ENABLE_BETA_FEATURES=false

# Performance
NEXT_PUBLIC_CDN_URL=https://cdn.your-domain.com
NEXT_PUBLIC_ENABLE_SW=true

# Internationalization
NEXT_PUBLIC_DEFAULT_LOCALE=en
NEXT_PUBLIC_SUPPORTED_LOCALES=en,es,fr,de,ja,zh

# Security
NEXT_PUBLIC_CSP_ENABLED=true
NEXT_PUBLIC_SECURE_COOKIES=true

# Monitoring
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
NEXT_PUBLIC_ENABLE_ERROR_REPORTING=true
EOF
    else
        cat > "$frontend_env_file" << EOF
# Development Environment
NEXT_PUBLIC_APP_ENV=development
NEXT_PUBLIC_APP_NAME=Mocko Designs (Dev)
NEXT_PUBLIC_APP_VERSION=1.0.0-dev

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_API_VERSION=v1

# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=dev-nextauth-secret-not-for-production

# Google OAuth (Development)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-dev-google-client-id
GOOGLE_CLIENT_SECRET=your-dev-google-client-secret

# PayPal (Sandbox)
NEXT_PUBLIC_PAYPAL_CLIENT_ID=your-paypal-sandbox-client-id

# Cloudinary (Development)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-dev-cloudinary-cloud-name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your-dev-upload-preset

# Development Tools
NEXT_PUBLIC_ENABLE_DEBUG=true
NEXT_PUBLIC_ENABLE_REDUX_DEVTOOLS=true
NEXT_PUBLIC_ENABLE_HOT_RELOAD=true

# Feature Flags
NEXT_PUBLIC_ENABLE_AI_FEATURES=true
NEXT_PUBLIC_ENABLE_PREMIUM=true
NEXT_PUBLIC_ENABLE_BETA_FEATURES=true

# Analytics (Disabled in dev)
NEXT_PUBLIC_ENABLE_ANALYTICS=false

# Security (Relaxed for dev)
NEXT_PUBLIC_CSP_ENABLED=false
NEXT_PUBLIC_SECURE_COOKIES=false

# Internationalization
NEXT_PUBLIC_DEFAULT_LOCALE=en
NEXT_PUBLIC_SUPPORTED_LOCALES=en,es,fr

# Performance
NEXT_PUBLIC_ENABLE_SW=false
EOF
    fi
    
    echo -e "${GREEN}✅ Frontend .env.local created for ${ENVIRONMENT}${NC}"
}

# Setup package.json scripts
setup_package_scripts() {
    echo -e "${BLUE}📦 Setting up package.json scripts...${NC}"
    
    # Backend package.json scripts
    backend_package="server/consolidated-server/package.json"
    
    if [ -f "$backend_package" ]; then
        # Add development and production scripts
        npm --prefix server/consolidated-server pkg set scripts.start="node src/server.js"
        npm --prefix server/consolidated-server pkg set scripts.dev="nodemon src/server.js"
        npm --prefix server/consolidated-server pkg set scripts.test="jest"
        npm --prefix server/consolidated-server pkg set scripts.test:watch="jest --watch"
        npm --prefix server/consolidated-server pkg set scripts.test:coverage="jest --coverage"
        npm --prefix server/consolidated-server pkg set scripts.lint="eslint src/ --ext .js"
        npm --prefix server/consolidated-server pkg set scripts.lint:fix="eslint src/ --ext .js --fix"
        npm --prefix server/consolidated-server pkg set scripts.build="echo 'No build step needed for Node.js'"
        
        echo -e "${GREEN}✅ Backend scripts configured${NC}"
    fi
    
    # Frontend package.json scripts
    frontend_package="client/package.json"
    
    if [ -f "$frontend_package" ]; then
        # Ensure all necessary scripts are present
        npm --prefix client pkg set scripts.dev="next dev"
        npm --prefix client pkg set scripts.build="next build"
        npm --prefix client pkg set scripts.start="next start"
        npm --prefix client pkg set scripts.export="next export"
        npm --prefix client pkg set scripts.lint="next lint"
        npm --prefix client pkg set scripts.test="jest"
        npm --prefix client pkg set scripts.test:watch="jest --watch"
        npm --prefix client pkg set scripts.analyze="ANALYZE=true npm run build"
        
        echo -e "${GREEN}✅ Frontend scripts configured${NC}"
    fi
}

# Create ecosystem file for PM2
create_ecosystem_file() {
    echo -e "${BLUE}🔄 Creating PM2 ecosystem file...${NC}"
    
    cat > ecosystem.config.js << EOF
module.exports = {
  apps: [
    {
      name: 'mocko-designs-backend',
      script: 'server/consolidated-server/src/server.js',
      instances: process.env.NODE_ENV === 'production' ? 'max' : 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development',
        PORT: 5000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_file: './logs/backend-combined.log',
      time: true,
      max_memory_restart: '1G',
      node_args: '--max-old-space-size=1024',
      watch: process.env.NODE_ENV !== 'production',
      ignore_watch: ['node_modules', 'logs', '*.log'],
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s'
    }
  ]
};
EOF
    
    echo -e "${GREEN}✅ PM2 ecosystem file created${NC}"
}

# Setup Git hooks
setup_git_hooks() {
    echo -e "${BLUE}🔗 Setting up Git hooks...${NC}"
    
    if [ -d ".git" ]; then
        # Pre-commit hook
        cat > .git/hooks/pre-commit << EOF
#!/bin/bash
echo "Running pre-commit checks..."

# Check backend
cd server/consolidated-server
npm run lint
if [ \$? -ne 0 ]; then
    echo "Backend linting failed"
    exit 1
fi

# Check frontend
cd ../../client
npm run lint
if [ \$? -ne 0 ]; then
    echo "Frontend linting failed"
    exit 1
fi

echo "Pre-commit checks passed!"
EOF
        
        chmod +x .git/hooks/pre-commit
        echo -e "${GREEN}✅ Git hooks configured${NC}"
    else
        echo -e "${YELLOW}⚠️ Not a Git repository, skipping Git hooks${NC}"
    fi
}

# Create deployment scripts
create_deployment_scripts() {
    echo -e "${BLUE}🚀 Creating deployment scripts...${NC}"
    
    # Make scripts executable
    chmod +x scripts/start-local.sh
    chmod +x deployment/back4app-config.sh
    chmod +x deployment/aws-config.sh
    
    # Create deployment wrapper script
    cat > scripts/deploy.sh << EOF
#!/bin/bash

PLATFORM=\${1:-"local"}
ENVIRONMENT=\${2:-"production"}

case \$PLATFORM in
    "local")
        echo "🏠 Deploying locally..."
        ./scripts/start-local.sh
        ;;
    "back4app")
        echo "☁️ Deploying to Back4App..."
        source ./deployment/back4app-config.sh
        deploy_to_back4app
        ;;
    "aws")
        echo "🌐 Deploying to AWS..."
        source ./deployment/aws-config.sh
        deploy_full_aws
        ;;
    *)
        echo "❌ Unknown platform: \$PLATFORM"
        echo "Usage: ./scripts/deploy.sh [local|back4app|aws] [environment]"
        exit 1
        ;;
esac
EOF
    
    chmod +x scripts/deploy.sh
    echo -e "${GREEN}✅ Deployment scripts created${NC}"
}

# Install dependencies
install_dependencies() {
    echo -e "${BLUE}📦 Installing dependencies...${NC}"
    
    # Backend dependencies
    echo -e "${YELLOW}Installing backend dependencies...${NC}"
    cd server/consolidated-server
    npm install
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Backend dependencies installed${NC}"
    else
        echo -e "${RED}❌ Backend dependency installation failed${NC}"
        exit 1
    fi
    
    # Frontend dependencies
    echo -e "${YELLOW}Installing frontend dependencies...${NC}"
    cd ../../client
    npm install
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Frontend dependencies installed${NC}"
    else
        echo -e "${RED}❌ Frontend dependency installation failed${NC}"
        exit 1
    fi
    
    cd ..
}

# Main setup function
main() {
    echo -e "${GREEN}🎯 Starting Mocko Designs environment setup...${NC}"
    echo
    
    create_directories
    setup_backend_env
    setup_frontend_env
    setup_package_scripts
    create_ecosystem_file
    setup_git_hooks
    create_deployment_scripts
    install_dependencies
    
    echo
    echo -e "${GREEN}🎉 Environment setup completed successfully!${NC}"
    echo
    echo -e "${BLUE}📋 Next steps:${NC}"
    echo -e "1. Update .env files with your actual credentials"
    echo -e "2. Start MongoDB service"
    echo -e "3. Run: ./scripts/start-local.sh"
    echo -e "4. Test with: python scripts/test-production.py"
    echo
    echo -e "${YELLOW}📁 Important files created:${NC}"
    echo -e "   ├── server/consolidated-server/.env"
    echo -e "   ├── client/.env.local"
    echo -e "   ├── ecosystem.config.js"
    echo -e "   ├── scripts/start-local.sh"
    echo -e "   ├── scripts/deploy.sh"
    echo -e "   └── deployment/ configs"
    echo
}

# Run main function
main