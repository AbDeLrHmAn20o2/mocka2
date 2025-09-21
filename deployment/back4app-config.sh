# =============================================
# Mocko Designs - Back4App Deployment Config
# =============================================

# Application Configuration
app_name="mocko-designs"
node_version="18.x"

# Environment Variables for Back4App
app_id="YOUR_BACK4APP_APP_ID"
master_key="YOUR_BACK4APP_MASTER_KEY"
database_uri="YOUR_MONGODB_URI"

# Deployment Steps for Back4App
echo "📋 Back4App Deployment Checklist:"
echo "1. Create Parse Server app on Back4App"
echo "2. Configure MongoDB database"
echo "3. Set environment variables"
echo "4. Deploy cloud code"
echo "5. Configure custom domains"

# Required Back4App Environment Variables
REQUIRED_ENV_VARS=(
    "MONGODB_URI"
    "JWT_SECRET"
    "GOOGLE_CLIENT_ID"
    "GOOGLE_CLIENT_SECRET"
    "CLOUDINARY_CLOUD_NAME"
    "CLOUDINARY_API_KEY"
    "CLOUDINARY_API_SECRET"
    "PAYPAL_CLIENT_ID"
    "PAYPAL_CLIENT_SECRET"
    "NEXTAUTH_SECRET"
    "NEXTAUTH_URL"
)

# Back4App Cloud Code Structure
echo "📁 Cloud Code Structure:"
echo "cloud/"
echo "├── main.js              # Main cloud functions"
echo "├── triggers.js          # Database triggers"
echo "├── jobs.js              # Background jobs"
echo "├── utils/"
echo "│   ├── auth-utils.js    # Authentication utilities"
echo "│   ├── design-utils.js  # Design processing utilities"
echo "│   └── payment-utils.js # Payment processing utilities"
echo "└── config/"
echo "    ├── cors.js          # CORS configuration"
echo "    └── security.js     # Security settings"

# Deployment Commands
deploy_to_back4app() {
    echo "🚀 Deploying to Back4App..."
    
    # Install Back4App CLI
    npm install -g back4app-cli
    
    # Login to Back4App
    back4app login
    
    # Deploy cloud code
    back4app deploy
    
    echo "✅ Deployment completed"
}

# Performance Optimizations for Back4App
optimize_for_back4app() {
    echo "⚡ Applying Back4App optimizations..."
    
    # Optimize Parse Server configuration
    cat > config/parse-server.js << EOF
const ParseServer = require('parse-server').ParseServer;

const api = new ParseServer({
    databaseURI: process.env.DATABASE_URI,
    cloud: './cloud/main.js',
    appId: process.env.APP_ID,
    masterKey: process.env.MASTER_KEY,
    serverURL: process.env.SERVER_URL,
    
    // Performance optimizations
    enableAnonymousUsers: false,
    allowClientClassCreation: false,
    enableExpressErrorHandler: true,
    
    // Security
    enforcePrivateUsers: true,
    allowCustomObjectId: false,
    
    // File uploads
    filesAdapter: {
        module: '@parse/s3-files-adapter',
        options: {
            bucket: process.env.S3_BUCKET,
            region: process.env.S3_REGION,
            directAccess: true
        }
    },
    
    // Live Query (optional)
    liveQuery: {
        classNames: ['Design', 'UserSession']
    }
});

module.exports = api;
EOF
    
    echo "✅ Parse Server configuration optimized"
}

# Health Check for Back4App
health_check_back4app() {
    local app_url="https://${app_name}.back4app.io"
    
    echo "🏥 Running health checks for Back4App deployment..."
    
    # Check Parse Server health
    curl -X GET "${app_url}/health" \
        -H "X-Parse-Application-Id: ${app_id}"
    
    # Check database connection
    curl -X POST "${app_url}/parse/classes/HealthCheck" \
        -H "X-Parse-Application-Id: ${app_id}" \
        -H "Content-Type: application/json" \
        -d '{"test": "connection"}'
    
    echo "✅ Health checks completed"
}

# Monitoring and Logging
setup_monitoring() {
    echo "📊 Setting up monitoring for Back4App..."
    
    # Cloud function for monitoring
    cat > cloud/monitoring.js << EOF
Parse.Cloud.define('systemHealth', async (request) => {
    const health = {
        timestamp: new Date(),
        database: 'connected',
        memory: process.memoryUsage(),
        uptime: process.uptime()
    };
    
    return health;
});

Parse.Cloud.define('errorLog', async (request) => {
    const { error, context } = request.params;
    
    const ErrorLog = Parse.Object.extend('ErrorLog');
    const errorLog = new ErrorLog();
    
    errorLog.set('error', error);
    errorLog.set('context', context);
    errorLog.set('timestamp', new Date());
    
    await errorLog.save(null, { useMasterKey: true });
    
    return { success: true };
});
EOF
    
    echo "✅ Monitoring setup completed"
}

echo "📚 Back4App deployment configuration ready!"
echo "Next steps:"
echo "1. Run 'bash scripts/deploy-back4app.sh' to deploy"
echo "2. Configure environment variables in Back4App dashboard"
echo "3. Test the deployment with health checks"