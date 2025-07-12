# Dynamic SDK Implementation Guide

## Current Issue
The creator app currently uses a redirect-based OAuth flow that sends users to Dynamic's dashboard login page. This is different from how TRESR.com works, which uses an embedded SDK approach.

## How TRESR.com Does It
TRESR.com uses the `@dynamic-labs/sdk-react-core` React SDK to embed the authentication directly in the app:

1. **SDK Integration**: The login button opens a Dynamic modal within the app
2. **No Redirects**: Users never leave the TRESR.com site
3. **Token Exchange**: After auth, the SDK returns a JWT that's exchanged with the backend

## Implementation Steps

### 1. Install Dynamic SDK
```bash
cd client
npm install @dynamic-labs/sdk-react-core @dynamic-labs/ethereum
```

### 2. Create Dynamic Provider
```javascript
// client/src/providers/DynamicProvider.jsx
import { DynamicContextProvider } from '@dynamic-labs/sdk-react-core';
import { EthereumWalletConnectors } from '@dynamic-labs/ethereum';

export const DynamicProvider = ({ children }) => {
  return (
    <DynamicContextProvider
      settings={{
        environmentId: 'b17e8631-c1b7-45d5-95cf-151eb5246423',
        walletConnectors: [EthereumWalletConnectors],
        authProviders: ['googlesocial', 'discord', 'telegram', 'emailverification'],
      }}
    >
      {children}
    </DynamicContextProvider>
  );
};
```

### 3. Update App.jsx
```javascript
// Wrap the app with DynamicProvider
import { DynamicProvider } from './providers/DynamicProvider';

function App() {
  return (
    <DynamicProvider>
      <Router>
        {/* existing routes */}
      </Router>
    </DynamicProvider>
  );
}
```

### 4. Update Login Component
```javascript
// client/src/pages/Login.jsx
import { DynamicConnectButton } from '@dynamic-labs/sdk-react-core';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';

function Login() {
  const { user, isAuthenticated, handleLogOut } = useDynamicContext();
  
  useEffect(() => {
    if (isAuthenticated && user) {
      // Exchange Dynamic JWT for app session
      exchangeToken(user.sessionToken);
    }
  }, [isAuthenticated, user]);

  return (
    <div className="login-page">
      <DynamicConnectButton>
        <button className="btn-primary">
          Login or Create Account
        </button>
      </DynamicConnectButton>
    </div>
  );
}
```

### 5. Token Exchange Flow
```javascript
// client/src/services/auth.js
const exchangeToken = async (dynamicToken) => {
  const response = await fetch('/api/auth/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: dynamicToken })
  });
  
  if (response.ok) {
    const data = await response.json();
    // Store app token, redirect to dashboard
    localStorage.setItem('creator_token', data.token);
    window.location.href = '/dashboard';
  }
};
```

## Benefits of SDK Approach
1. **Better UX**: No redirects, stays in-app
2. **Consistent with TRESR.com**: Same auth experience
3. **More Control**: Can customize the modal appearance
4. **Faster**: No page loads or redirects

## Environment Variables Needed
```env
REACT_APP_DYNAMIC_ENV_ID=b17e8631-c1b7-45d5-95cf-151eb5246423
```

## Testing
1. The SDK will show a modal when clicking the login button
2. Users can choose Google, Discord, Telegram, or Email
3. After auth, the SDK returns a JWT token
4. The app exchanges this for a session with the backend
5. User is redirected to the dashboard

## Note
This matches exactly how TRESR.com handles authentication, providing a seamless experience for users who are already familiar with the platform.