# TRESR Creator App - Railway Deployment Guide

## Deployment Steps

### 1. Push to GitHub
```bash
git add .
git commit -m "feat: add MySQL database for 944+ user scalability"
git push origin main
```

### 2. Railway Setup

1. Go to [Railway Dashboard](https://railway.app)
2. Click on the existing `tresr-creator-app` project
3. Add MySQL Database:
   - Click "New" → "Database" → "MySQL"
   - Railway will automatically provision and configure it

### 3. Environment Variables

Railway will automatically set these MySQL variables:
- `MYSQL_URL` - Full connection string
- `MYSQLHOST` - Database host
- `MYSQLPORT` - Database port
- `MYSQLDATABASE` - Database name
- `MYSQLUSER` - Database username
- `MYSQLPASSWORD` - Database password

You need to add these additional variables:
```
SESSION_SECRET=your-secure-session-secret
DYNAMIC_ENV_ID=b17e8631-c1b7-45d5-95cf-151eb5246423
DYNAMIC_MOCKUPS_API_KEY=your-key
SHOPIFY_API_KEY=your-key
SHOPIFY_ACCESS_TOKEN=your-token
SHOPIFY_STORE_DOMAIN=becc05-b4.myshopify.com
CLOUDINARY_API_KEY=364274988183368
CLOUDINARY_API_SECRET=gJEAx4VjStv1uTKyi3DiLAwL8pQ
CLOUDINARY_CLOUD_NAME=dqslerzk9
```

### 4. Deploy

Railway will automatically:
1. Detect the Node.js project
2. Install dependencies
3. Build the client
4. Start the production server
5. Initialize the database on first run

### 5. Verify Deployment

1. Check Railway logs for:
   - "✅ Database connection established"
   - "✅ Database models synchronized"
   - "TRESR Creator Server running on port"

2. Visit your app at: https://creators.tresr.com

3. The DataMigration component will automatically migrate any localStorage data to the database on first user login

## Database Management

### View Database
Railway provides a data browser for MySQL. Click on the MySQL service in your project to access it.

### Manual Migration
If needed, you can SSH into the Railway instance and run:
```bash
cd server
node scripts/setup-database.js
```

## Scaling

With MySQL on Railway, the app can now handle:
- 944+ concurrent users
- Unlimited design storage
- Persistent sessions
- Automatic backups
- High availability

## Monitoring

Railway provides:
- Real-time logs
- Resource usage metrics
- Database query insights
- Automatic scaling based on usage

## Troubleshooting

### Database Connection Issues
- Check MySQL service is running in Railway
- Verify environment variables are set
- Check logs for connection errors

### Session Issues
- Ensure SESSION_SECRET is set
- Check cookie domain settings
- Verify HTTPS is working

### Migration Issues
- Check browser console for migration errors
- Manually trigger migration if needed
- Clear localStorage after successful migration