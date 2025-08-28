# Dynamic Mockups Embedded Editor - Domain Validation Issue

## Issue Summary
We are experiencing persistent 403 errors when attempting to initialize the Dynamic Mockups embedded editor SDK on our production domain `creators.tresr.com`. The domain validation endpoint (`validate-integration-domain`) fails with 403 Forbidden despite having the domain whitelisted in our Dynamic Mockups account.

## Environment Details

### Application Configuration
- **Production URL**: https://creators.tresr.com
- **Embedded Editor URL**: https://creators.tresr.com/experimental/embedded
- **Website Key**: `Qtw1zfUN7ZVJ`
- **SDK Version**: `@dynamic-mockups/mockup-editor-sdk@latest`
- **Implementation Date**: January 28, 2025

### Authentication Context
**Important**: Our entire application (`creators.tresr.com`) is protected behind Dynamic.xyz authentication (OAuth/social login). This means:
- Users must authenticate via Dynamic.xyz before accessing any page
- The embedded editor page is only accessible to authenticated users
- All requests from our domain include authentication headers/cookies from Dynamic.xyz
- The domain operates as a single-page application (SPA) with React Router

## Error Details

### Console Errors
```
POST https://embed-proxy.dynamicmockups.com/api/mockup-editor-iframe-integrations/validate-integration-domain 403 (Forbidden)

Error validating client (Attempt 1/30)
Error: Failed to validate client
...
Max retry attempts reached. Unable to validate client.
Error: Client configuration is not available. Aborting API calls.
```

### Request/Response Details
- **Endpoint**: `https://embed-proxy.dynamicmockups.com/api/mockup-editor-iframe-integrations/validate-integration-domain`
- **Method**: POST
- **Status**: 403 Forbidden
- **Attempts**: 30 retry attempts before failure
- **Origin**: `https://creators.tresr.com`

## Implementation Code

### SDK Initialization
```javascript
import { initDynamicMockupsIframe } from "@dynamic-mockups/mockup-editor-sdk";

// Initialization attempt
initDynamicMockupsIframe({
  iframeId: "dm-iframe",
  data: { 
    "x-website-key": "Qtw1zfUN7ZVJ"
  },
  mode: "download"
});
```

### Iframe Setup
```html
<iframe
  id="dm-iframe"
  src="https://embed.dynamicmockups.com"
  style="width: 100%; height: 90vh;"
  title="Dynamic Mockups Editor"
  allow="camera; microphone; clipboard-write"
  sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads"
/>
```

## What We've Tried

1. **Domain Whitelisting**
   - Added `creators.tresr.com` to whitelisted domains in Dynamic Mockups dashboard
   - Verified domain is entered without protocol (no https://) or trailing slash
   - Confirmed website key matches the one associated with whitelisted domain

2. **Implementation Approaches**
   - Used official SDK with `initDynamicMockupsIframe()`
   - Tried direct postMessage communication to iframe
   - Added various iframe attributes (allow, sandbox)
   - Implemented onLoad handlers for proper timing

3. **Debugging Steps**
   - Logged all initialization parameters
   - Verified current origin matches whitelisted domain
   - Tested with different initialization modes
   - Added error handling and retry logic

## Potential Issues

### 1. Authentication Layer Interference
Our application uses Dynamic.xyz for authentication, which means:
- All requests include Dynamic.xyz auth headers/cookies
- The page is behind an authentication wall
- Cross-origin requests might include unexpected headers
- The domain validation might be affected by auth redirects or headers

### 2. CORS/Security Headers
Our application may be sending security headers that interfere with domain validation:
- Content Security Policy (CSP) headers
- X-Frame-Options
- Custom authentication headers from Dynamic.xyz

### 3. Domain Validation Method
Questions about how domain validation works:
- Does it validate based on HTTP Referer header?
- Does it check Origin header?
- Are there specific headers we should/shouldn't send?
- Is there a way to debug what the validation endpoint is receiving?

## Questions for Dynamic Mockups Team

1. **Authentication Compatibility**: Is the embedded editor compatible with applications that are behind authentication layers? Are there special considerations for authenticated SPAs?

2. **Domain Validation Process**: Can you provide details on exactly what the `validate-integration-domain` endpoint checks? What headers/parameters does it expect?

3. **Debugging Tools**: Is there a debug mode or verbose logging we can enable to see why the domain validation is failing?

4. **Alternative Authentication**: Is there an alternative authentication method (API key in header, signed tokens, etc.) that might work better with our authenticated environment?

5. **Proxy/Iframe Issues**: Could our authentication layer be interfering with the iframe communication? Are there specific CSP or CORS headers we should configure?

6. **Website Key Validation**: Can you confirm that website key `Qtw1zfUN7ZVJ` is correctly configured for domain `creators.tresr.com` in your system?

## Additional Context

### Our Tech Stack
- **Frontend**: React 18 + Vite
- **Authentication**: Dynamic.xyz OAuth (social login)
- **Deployment**: Railway.app
- **HTTPS**: Yes, with valid SSL certificate

### Business Context
We're implementing Dynamic Mockups to replace our previous mockup solution (IMG.ly) and have a $250/month flat rate agreement with Dynamic Mockups. We're excited to integrate the embedded editor but need to resolve this domain validation issue to proceed.

## Contact Information
- **Account Email**: [Your email associated with Dynamic Mockups account]
- **Website Key**: `Qtw1zfUN7ZVJ`
- **Domain**: `creators.tresr.com`

## Reproduction Steps
1. Visit https://creators.tresr.com/experimental/embedded
2. Authenticate via Dynamic.xyz (if not already logged in)
3. Open browser console
4. Observe 403 errors on domain validation endpoint
5. Editor fails to initialize after 30 retry attempts

## Expected Behavior
The embedded editor should initialize successfully and allow users to upload designs and create mockups.

## Actual Behavior
Domain validation fails with 403 error, preventing editor initialization.

---

Please let us know if you need any additional information or if there are specific debugging steps we should try. We're eager to get this integration working and appreciate your assistance.