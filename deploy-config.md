# TRESR Creator App - Deployment Configuration

## Environment Variables for Production

### Required Environment Variables

```bash
# Database
DATABASE_URL="postgresql://username:password@host:5432/database_name"
DATABASE_MIGRATE="true"

# Application
NODE_ENV="production"
PORT="3000"
APP_URL="https://creator-app.tresr.com"

# Authentication
JWT_SECRET="your-secure-jwt-secret-256-bits"
JWT_EXPIRES_IN="7d"
REFRESH_TOKEN_SECRET="your-refresh-token-secret"
REFRESH_TOKEN_EXPIRES_IN="30d"

# Session
SESSION_SECRET="your-session-secret"
COOKIE_SECURE="true"
COOKIE_DOMAIN=".tresr.com"

# Shopify Configuration
SHOPIFY_API_KEY="your-shopify-api-key"
SHOPIFY_API_SECRET="your-shopify-api-secret"
SHOPIFY_WEBHOOK_SECRET="your-webhook-secret"
SHOPIFY_SCOPES="read_products,write_products,read_orders,read_customers"

# External APIs
DYNAMIC_XYZ_API_KEY="your-dynamic-xyz-api-key"
DYNAMIC_XYZ_BASE_URL="https://api.dynamic.xyz"
OPENAI_API_KEY="your-openai-api-key"
SANITY_PROJECT_ID="your-sanity-project-id"
SANITY_TOKEN="your-sanity-token"

# Storage & CDN
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
AWS_REGION="us-east-1"
S3_BUCKET_NAME="tresr-creator-assets"
CLOUDFRONT_DOMAIN="cdn.tresr.com"

# Email
SENDGRID_API_KEY="your-sendgrid-api-key"
FROM_EMAIL="noreply@tresr.com"
ADMIN_EMAIL="admin@tresr.com"

# Redis (for caching and sessions)
REDIS_URL="redis://username:password@host:6379"

# Monitoring
SENTRY_DSN="your-sentry-dsn"
LOG_LEVEL="info"
```

### Optional Environment Variables

```bash
# Development/Debug
DEBUG="false"
VERBOSE_LOGGING="false"

# Rate Limiting
RATE_LIMIT_WINDOW_MS="900000"  # 15 minutes
RATE_LIMIT_MAX="100"

# File Upload
MAX_FILE_SIZE="10485760"  # 10MB
ALLOWED_FILE_TYPES="image/jpeg,image/png,image/gif,image/webp"

# Background Jobs
QUEUE_REDIS_URL="redis://localhost:6379/1"
JOB_ATTEMPTS="3"
JOB_BACKOFF="exponential"
```

## Database Migration Commands

### Pre-deployment Migration Check

```bash
# Check current migration status
npm run db:status

# Generate new migration if needed
npm run db:generate -- --name "migration_name"

# Validate migrations
npm run db:validate
```

### Production Migration Commands

```bash
# 1. Backup current database
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Run migrations
npm run db:migrate

# 3. Verify migration success
npm run db:status

# 4. Run data validation
npm run db:validate-data
```

### Migration Rollback Commands

```bash
# Rollback last migration
npm run db:rollback

# Rollback to specific migration
npm run db:rollback -- --to migration_timestamp

# Restore from backup if needed
psql $DATABASE_URL < backup_YYYYMMDD_HHMMSS.sql
```

## Railway Deployment Steps

### 1. Initial Setup

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Link to existing project or create new
railway link
# OR
railway init
```

### 2. Environment Configuration

```bash
# Set environment variables
railway variables set NODE_ENV=production
railway variables set DATABASE_URL=$DATABASE_URL
railway variables set JWT_SECRET=$JWT_SECRET

# Bulk import from .env file
railway variables set --from-file .env.production
```

### 3. Database Setup

```bash
# Add PostgreSQL service
railway add postgresql

# Get database URL
railway variables get DATABASE_URL

# Run initial migrations
railway run npm run db:migrate
```

### 4. Deployment

```bash
# Deploy current branch
railway up

# Deploy specific branch
railway up --branch production

# Deploy with specific service
railway up --service backend
```

### 5. Domain Configuration

```bash
# Add custom domain
railway domain add creator-app.tresr.com

# Verify domain setup
railway domain list
```

## Testing Checklist

### Pre-deployment Testing

- [ ] **Unit Tests Pass**
  ```bash
  npm run test
  npm run test:coverage
  ```

- [ ] **Integration Tests Pass**
  ```bash
  npm run test:integration
  ```

- [ ] **E2E Tests Pass**
  ```bash
  npm run test:e2e
  ```

- [ ] **Build Success**
  ```bash
  npm run build
  npm run type-check
  npm run lint
  ```

- [ ] **Security Scan**
  ```bash
  npm audit
  npm run security:check
  ```

### Post-deployment Testing

- [ ] **Health Check Endpoints**
  - [ ] `GET /health` returns 200
  - [ ] `GET /api/health` returns detailed status
  - [ ] Database connectivity test

- [ ] **Authentication Flow**
  - [ ] User registration works
  - [ ] Login/logout functionality
  - [ ] JWT token validation
  - [ ] Password reset flow

- [ ] **Core Features**
  - [ ] Product creation and editing
  - [ ] Design upload and processing
  - [ ] Commission calculations
  - [ ] Shopify integration
  - [ ] Dynamic.xyz wallet connection

- [ ] **API Endpoints**
  - [ ] All CRUD operations work
  - [ ] Rate limiting is active
  - [ ] Error handling returns proper codes
  - [ ] API documentation is accessible

- [ ] **Performance**
  - [ ] Response times < 2s for main pages
  - [ ] Image uploads complete successfully
  - [ ] Database queries are optimized
  - [ ] CDN serving static assets

### Monitoring Setup

- [ ] **Application Monitoring**
  - [ ] Sentry error tracking configured
  - [ ] Performance monitoring active
  - [ ] Custom metrics collection

- [ ] **Infrastructure Monitoring**
  - [ ] Railway metrics dashboard
  - [ ] Database performance monitoring
  - [ ] Redis cache monitoring

## Rollback Procedures

### 1. Application Rollback

```bash
# Rollback to previous deployment
railway rollback

# Rollback to specific deployment
railway rollback --deployment DEPLOYMENT_ID

# Get deployment history
railway deployments
```

### 2. Database Rollback

```bash
# Rollback migrations
npm run db:rollback

# Restore from backup
railway run psql $DATABASE_URL < backup_file.sql
```

### 3. Environment Variable Rollback

```bash
# Backup current variables
railway variables > env_backup_$(date +%Y%m%d_%H%M%S).txt

# Restore previous variables
railway variables set --from-file env_backup_previous.txt
```

### 4. Emergency Procedures

#### Complete Service Restart

```bash
# Restart all services
railway restart

# Restart specific service
railway restart --service backend
```

#### Traffic Routing

```bash
# Point domain to maintenance page
railway domain update creator-app.tresr.com --target maintenance-service

# Restore normal routing
railway domain update creator-app.tresr.com --target backend
```

#### Data Recovery

```bash
# Export current data
railway run pg_dump $DATABASE_URL > emergency_backup.sql

# Restore from known good backup
railway run psql $DATABASE_URL < last_known_good_backup.sql
```

## Security Checklist

### Pre-deployment Security

- [ ] **Environment Variables**
  - [ ] No secrets in code
  - [ ] All sensitive data in environment variables
  - [ ] Production secrets different from development

- [ ] **Dependencies**
  - [ ] No known vulnerabilities (`npm audit`)
  - [ ] Dependencies up to date
  - [ ] Security headers configured

- [ ] **Database Security**
  - [ ] Database user has minimal required permissions
  - [ ] SSL connections enforced
  - [ ] Backup encryption enabled

### Post-deployment Security

- [ ] **SSL/TLS**
  - [ ] HTTPS enforced
  - [ ] Valid SSL certificate
  - [ ] Secure headers present

- [ ] **API Security**
  - [ ] Rate limiting active
  - [ ] Input validation working
  - [ ] CORS properly configured
  - [ ] Authentication required for protected routes

## Monitoring and Alerting

### Key Metrics to Monitor

- Response time (target: < 2s)
- Error rate (target: < 1%)
- CPU usage (alert: > 80%)
- Memory usage (alert: > 80%)
- Database connections (alert: > 80% of pool)
- Disk space (alert: > 85%)

### Alert Configuration

```bash
# Set up Railway alerts
railway alerts create --metric cpu --threshold 80 --email admin@tresr.com
railway alerts create --metric memory --threshold 80 --email admin@tresr.com
railway alerts create --metric error_rate --threshold 5 --email admin@tresr.com
```

## Deployment Schedule

### Recommended Deployment Windows

- **Production**: Tuesdays/Thursdays 10 AM - 2 PM PST
- **Staging**: Any time during business hours
- **Hotfixes**: As needed with team notification

### Deployment Communication

1. **Pre-deployment**: Notify team 24 hours in advance
2. **During deployment**: Update status in team chat
3. **Post-deployment**: Confirm success and run post-deployment tests
4. **Issues**: Immediate escalation and rollback if needed

## Support and Troubleshooting

### Common Issues

1. **Database Connection Issues**
   ```bash
   railway logs --service postgresql
   railway restart --service postgresql
   ```

2. **Memory Issues**
   ```bash
   railway logs | grep "out of memory"
   railway scale --service backend --memory 1024
   ```

3. **Environment Variable Issues**
   ```bash
   railway variables list
   railway variables set KEY=value
   ```

### Emergency Contacts

- **Technical Lead**: [Contact Information]
- **DevOps**: [Contact Information]
- **Railway Support**: help@railway.app
- **On-call**: [Contact Information]

### Documentation Links

- Railway Documentation: https://docs.railway.app
- API Documentation: https://creator-app.tresr.com/docs
- Team Wiki: [Internal Link]
- Incident Response: [Internal Link]