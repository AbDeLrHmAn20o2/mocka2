# =============================================
# Mocko Designs - AWS Deployment Configuration
# =============================================

# AWS Configuration
AWS_REGION="us-east-1"
AWS_PROFILE="default"
APP_NAME="mocko-designs"
ENVIRONMENT="production"

# AWS Services Configuration
FRONTEND_BUCKET="${APP_NAME}-frontend-${ENVIRONMENT}"
BACKEND_SERVICE="${APP_NAME}-backend-${ENVIRONMENT}"
DATABASE_CLUSTER="${APP_NAME}-db-${ENVIRONMENT}"

echo "🏗️ AWS Deployment Architecture:"
echo "Frontend: S3 + CloudFront (Static hosting)"
echo "Backend: ECS Fargate (Containerized API)"
echo "Database: DocumentDB (MongoDB compatible)"
echo "Files: S3 + CloudFront (Media storage)"
echo "CDN: CloudFront (Global distribution)"
echo "SSL: Certificate Manager"
echo "DNS: Route 53"

# Frontend Deployment (S3 + CloudFront)
deploy_frontend_aws() {
    echo "🚀 Deploying frontend to AWS S3..."
    
    # Build production frontend
    cd client
    npm run build
    
    # Create S3 bucket if it doesn't exist
    aws s3 mb "s3://${FRONTEND_BUCKET}" --region "${AWS_REGION}" || true
    
    # Configure bucket for static website hosting
    aws s3 website "s3://${FRONTEND_BUCKET}" \
        --index-document index.html \
        --error-document error.html
    
    # Upload build files
    aws s3 sync out/ "s3://${FRONTEND_BUCKET}" \
        --delete \
        --cache-control "public, max-age=31536000, immutable" \
        --exclude "*.html" \
        --exclude "service-worker.js"
    
    # Upload HTML files with shorter cache
    aws s3 sync out/ "s3://${FRONTEND_BUCKET}" \
        --delete \
        --cache-control "public, max-age=0, must-revalidate" \
        --include "*.html" \
        --include "service-worker.js"
    
    # Set up CloudFront distribution
    create_cloudfront_distribution
    
    cd ..
    echo "✅ Frontend deployed to AWS"
}

# Backend Deployment (ECS Fargate)
deploy_backend_aws() {
    echo "🚀 Deploying backend to AWS ECS..."
    
    # Build Docker image
    cd server/consolidated-server
    
    # Create Dockerfile if it doesn't exist
    cat > Dockerfile << EOF
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY src/ ./src/

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Change ownership
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5000/health || exit 1

# Start application
CMD ["npm", "start"]
EOF
    
    # Build and push to ECR
    local ecr_repo="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${BACKEND_SERVICE}"
    
    # Login to ECR
    aws ecr get-login-password --region "${AWS_REGION}" | \
        docker login --username AWS --password-stdin "${ecr_repo}"
    
    # Build image
    docker build -t "${BACKEND_SERVICE}" .
    docker tag "${BACKEND_SERVICE}:latest" "${ecr_repo}:latest"
    
    # Push to ECR
    docker push "${ecr_repo}:latest"
    
    # Deploy to ECS
    deploy_ecs_service
    
    cd ../..
    echo "✅ Backend deployed to AWS ECS"
}

# Create CloudFront Distribution
create_cloudfront_distribution() {
    echo "🌐 Creating CloudFront distribution..."
    
    cat > cloudfront-config.json << EOF
{
    "CallerReference": "${APP_NAME}-$(date +%s)",
    "Comment": "Mocko Designs Frontend Distribution",
    "DefaultCacheBehavior": {
        "TargetOriginId": "S3-${FRONTEND_BUCKET}",
        "ViewerProtocolPolicy": "redirect-to-https",
        "MinTTL": 0,
        "ForwardedValues": {
            "QueryString": false,
            "Cookies": {"Forward": "none"}
        },
        "Compress": true
    },
    "Origins": {
        "Quantity": 1,
        "Items": [
            {
                "Id": "S3-${FRONTEND_BUCKET}",
                "DomainName": "${FRONTEND_BUCKET}.s3.amazonaws.com",
                "S3OriginConfig": {
                    "OriginAccessIdentity": ""
                }
            }
        ]
    },
    "Enabled": true,
    "PriceClass": "PriceClass_All",
    "HttpVersion": "http2"
}
EOF
    
    aws cloudfront create-distribution --distribution-config file://cloudfront-config.json
    rm cloudfront-config.json
}

# Deploy ECS Service
deploy_ecs_service() {
    echo "🐳 Deploying ECS service..."
    
    # Create task definition
    cat > task-definition.json << EOF
{
    "family": "${BACKEND_SERVICE}",
    "networkMode": "awsvpc",
    "requiresCompatibilities": ["FARGATE"],
    "cpu": "256",
    "memory": "512",
    "executionRoleArn": "arn:aws:iam::${AWS_ACCOUNT_ID}:role/ecsTaskExecutionRole",
    "taskRoleArn": "arn:aws:iam::${AWS_ACCOUNT_ID}:role/ecsTaskRole",
    "containerDefinitions": [
        {
            "name": "${BACKEND_SERVICE}",
            "image": "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${BACKEND_SERVICE}:latest",
            "portMappings": [
                {
                    "containerPort": 5000,
                    "protocol": "tcp"
                }
            ],
            "environment": [
                {"name": "NODE_ENV", "value": "production"},
                {"name": "PORT", "value": "5000"}
            ],
            "secrets": [
                {"name": "MONGODB_URI", "valueFrom": "arn:aws:secretsmanager:${AWS_REGION}:${AWS_ACCOUNT_ID}:secret:${APP_NAME}/mongodb-uri"},
                {"name": "JWT_SECRET", "valueFrom": "arn:aws:secretsmanager:${AWS_REGION}:${AWS_ACCOUNT_ID}:secret:${APP_NAME}/jwt-secret"}
            ],
            "logConfiguration": {
                "logDriver": "awslogs",
                "options": {
                    "awslogs-group": "/ecs/${BACKEND_SERVICE}",
                    "awslogs-region": "${AWS_REGION}",
                    "awslogs-stream-prefix": "ecs"
                }
            },
            "healthCheck": {
                "command": ["CMD-SHELL", "curl -f http://localhost:5000/health || exit 1"],
                "interval": 30,
                "timeout": 5,
                "retries": 3,
                "startPeriod": 60
            }
        }
    ]
}
EOF
    
    # Register task definition
    aws ecs register-task-definition --cli-input-json file://task-definition.json
    
    # Create or update service
    aws ecs create-service \
        --cluster "${APP_NAME}-cluster" \
        --service-name "${BACKEND_SERVICE}" \
        --task-definition "${BACKEND_SERVICE}" \
        --desired-count 2 \
        --launch-type FARGATE \
        --network-configuration "awsvpcConfiguration={subnets=[subnet-12345678,subnet-87654321],securityGroups=[sg-12345678],assignPublicIp=ENABLED}" \
        --load-balancers "targetGroupArn=arn:aws:elasticloadbalancing:${AWS_REGION}:${AWS_ACCOUNT_ID}:targetgroup/${BACKEND_SERVICE}/1234567890123456,containerName=${BACKEND_SERVICE},containerPort=5000"
    
    rm task-definition.json
}

# Database Setup (DocumentDB)
setup_documentdb() {
    echo "🗄️ Setting up DocumentDB cluster..."
    
    aws docdb create-db-cluster \
        --db-cluster-identifier "${DATABASE_CLUSTER}" \
        --engine docdb \
        --master-username admin \
        --master-user-password "${DB_PASSWORD}" \
        --vpc-security-group-ids sg-12345678 \
        --db-subnet-group-name "${APP_NAME}-subnet-group"
    
    aws docdb create-db-instance \
        --db-instance-identifier "${DATABASE_CLUSTER}-instance-1" \
        --db-instance-class db.t3.medium \
        --engine docdb \
        --db-cluster-identifier "${DATABASE_CLUSTER}"
    
    echo "✅ DocumentDB cluster created"
}

# Infrastructure as Code (CloudFormation)
deploy_infrastructure() {
    echo "🏗️ Deploying AWS infrastructure..."
    
    cat > infrastructure.yaml << EOF
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Mocko Designs Production Infrastructure'

Parameters:
  AppName:
    Type: String
    Default: mocko-designs
  Environment:
    Type: String
    Default: production

Resources:
  # VPC and Networking
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsHostnames: true
      EnableDnsSupport: true

  # ECS Cluster
  ECSCluster:
    Type: AWS::ECS::Cluster
    Properties:
      ClusterName: !Sub \${AppName}-cluster

  # Application Load Balancer
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub \${AppName}-alb
      Scheme: internet-facing
      Type: application
      IpAddressType: ipv4

  # S3 Bucket for Frontend
  FrontendBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub \${AppName}-frontend-\${Environment}
      WebsiteConfiguration:
        IndexDocument: index.html
        ErrorDocument: error.html

  # CloudFront Distribution
  CloudFrontDistribution:
    Type: AWS::CloudFront::Distribution
    Properties:
      DistributionConfig:
        Enabled: true
        Comment: !Sub \${AppName} Frontend Distribution
        DefaultCacheBehavior:
          TargetOriginId: S3Origin
          ViewerProtocolPolicy: redirect-to-https
          Compress: true

Outputs:
  FrontendURL:
    Description: Frontend CloudFront URL
    Value: !GetAtt CloudFrontDistribution.DomainName
  
  BackendURL:
    Description: Backend Load Balancer URL
    Value: !GetAtt ApplicationLoadBalancer.DNSName
EOF
    
    aws cloudformation deploy \
        --template-file infrastructure.yaml \
        --stack-name "${APP_NAME}-infrastructure" \
        --capabilities CAPABILITY_IAM \
        --parameter-overrides \
            AppName="${APP_NAME}" \
            Environment="${ENVIRONMENT}"
    
    rm infrastructure.yaml
    echo "✅ Infrastructure deployed"
}

# Health Checks and Monitoring
setup_monitoring_aws() {
    echo "📊 Setting up AWS monitoring..."
    
    # CloudWatch alarms
    aws cloudwatch put-metric-alarm \
        --alarm-name "${BACKEND_SERVICE}-high-cpu" \
        --alarm-description "High CPU usage" \
        --metric-name CPUUtilization \
        --namespace AWS/ECS \
        --statistic Average \
        --period 300 \
        --threshold 80 \
        --comparison-operator GreaterThanThreshold \
        --evaluation-periods 2
    
    # Health check dashboard
    cat > dashboard.json << EOF
{
    "widgets": [
        {
            "type": "metric",
            "properties": {
                "metrics": [
                    ["AWS/ECS", "CPUUtilization", "ServiceName", "${BACKEND_SERVICE}"],
                    [".", "MemoryUtilization", ".", "."]
                ],
                "period": 300,
                "stat": "Average",
                "region": "${AWS_REGION}",
                "title": "ECS Service Metrics"
            }
        }
    ]
}
EOF
    
    aws cloudwatch put-dashboard \
        --dashboard-name "${APP_NAME}-monitoring" \
        --dashboard-body file://dashboard.json
    
    rm dashboard.json
    echo "✅ Monitoring setup completed"
}

# Complete deployment function
deploy_full_aws() {
    echo "🚀 Starting full AWS deployment..."
    
    deploy_infrastructure
    setup_documentdb
    deploy_backend_aws
    deploy_frontend_aws
    setup_monitoring_aws
    
    echo "✅ Full AWS deployment completed!"
    echo "🌐 Frontend: https://$(aws cloudfront list-distributions --query 'DistributionList.Items[0].DomainName' --output text)"
    echo "🔗 Backend: https://$(aws elbv2 describe-load-balancers --names "${APP_NAME}-alb" --query 'LoadBalancers[0].DNSName' --output text)"
}

echo "📚 AWS deployment configuration ready!"
echo "Available commands:"
echo "- deploy_infrastructure: Deploy AWS infrastructure"
echo "- deploy_frontend_aws: Deploy frontend to S3/CloudFront"
echo "- deploy_backend_aws: Deploy backend to ECS"
echo "- deploy_full_aws: Complete deployment"