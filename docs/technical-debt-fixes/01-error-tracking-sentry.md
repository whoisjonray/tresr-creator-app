# Error Tracking Implementation Plan - Sentry

## Overview
Implement Sentry for real-time error tracking across both frontend and backend of the creator app.

## Priority: CRITICAL
- **Implementation Time**: 1 day
- **Impact**: Immediate visibility into production errors
- **Cost**: Free tier supports up to 5k errors/month

## Implementation Steps

### 1. Backend Integration (Express.js)

```bash
cd server
npm install @sentry/node @sentry/integrations
```

```javascript
// server/index.js - Add at the very top
const Sentry = require('@sentry/node');
const { CaptureConsole } = require('@sentry/integrations');

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',
  integrations: [
    new CaptureConsole({ levels: ['error'] })
  ],
  tracesSampleRate: 0.1, // 10% performance monitoring
  beforeSend(event, hint) {
    // Don't send sensitive data
    if (event.request?.cookies) {
      delete event.request.cookies;
    }
    if (event.extra?.password) {
      delete event.extra.password;
    }
    return event;
  }
});

// Add after all other app.use() statements
app.use(Sentry.Handlers.requestHandler());

// Add before error handlers
app.use(Sentry.Handlers.errorHandler());
```

### 2. Frontend Integration (React)

```bash
cd client
npm install @sentry/react
```

```javascript
// client/src/index.jsx
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay({
      maskAllText: true,
      maskAllInputs: true
    })
  ],
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});

// Wrap App component
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Sentry.ErrorBoundary fallback={<ErrorFallback />}>
      <App />
    </Sentry.ErrorBoundary>
  </React.StrictMode>
);
```

### 3. Environment Variables

```env
# .env
SENTRY_DSN=your_sentry_dsn_here
VITE_SENTRY_DSN=your_sentry_dsn_here
```

### 4. Error Boundary Component

```javascript
// client/src/components/ErrorFallback.jsx
import { useEffect } from 'react';
import * as Sentry from '@sentry/react';

export default function ErrorFallback({ error, resetError }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="error-fallback">
      <h2>Oops! Something went wrong</h2>
      <p>We've been notified and are working on a fix.</p>
      <button onClick={resetError}>Try again</button>
    </div>
  );
}
```

### 5. Custom Error Tracking

```javascript
// server/utils/errorTracking.js
const Sentry = require('@sentry/node');

function trackError(error, context = {}) {
  Sentry.captureException(error, {
    tags: {
      section: context.section || 'unknown',
    },
    extra: {
      ...context,
      timestamp: new Date().toISOString()
    },
    user: context.userId ? { id: context.userId } : undefined
  });
}

module.exports = { trackError };
```

### 6. Integration with Existing Error Handlers

```javascript
// server/routes/designs.js
const { trackError } = require('../utils/errorTracking');

router.post('/designs', async (req, res) => {
  try {
    // ... existing code
  } catch (error) {
    trackError(error, {
      section: 'design_creation',
      userId: req.session?.creator?.id,
      designData: { name: req.body.name }
    });
    
    res.status(500).json({ 
      error: 'Failed to create design' 
    });
  }
});
```

## Testing Plan

1. **Development Testing**:
   - Trigger test errors in development
   - Verify errors appear in Sentry dashboard
   - Test error boundaries in React

2. **Production Verification**:
   - Deploy to Railway
   - Trigger controlled error
   - Verify production errors are captured
   - Check performance impact

## Monitoring Setup

1. **Alerts**:
   - New error types
   - Error rate spikes (>10 errors/minute)
   - Specific errors (database connection, auth failures)

2. **Dashboard**:
   - Error trends by route
   - User impact metrics
   - Browser/device breakdown

## Security Considerations

1. **PII Filtering**:
   - Never log passwords, tokens, or credit cards
   - Mask user emails in error context
   - Redact sensitive form data

2. **Rate Limiting**:
   - Implement client-side rate limiting
   - Don't exceed free tier limits

## Rollout Plan

1. **Phase 1**: Deploy to staging (if available)
2. **Phase 2**: Deploy to 10% of production traffic
3. **Phase 3**: Full production rollout
4. **Phase 4**: Add custom instrumentation

## Success Metrics

- **Error Detection Rate**: >95% of errors captured
- **Alert Response Time**: <5 minutes
- **False Positive Rate**: <5%
- **Performance Impact**: <50ms added latency

## Next Steps

After Sentry implementation:
1. Add custom breadcrumbs for user actions
2. Implement performance monitoring
3. Create error categorization rules
4. Build team alerting workflows