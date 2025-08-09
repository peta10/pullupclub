# Chatbase Integration Guide

This document explains the Chatbase chatbot integration for Pull-Up Club.

## Features

- **AI-powered Q&A chatbot** - Provides instant answers to user questions
- **User identity verification** - Logged-in users are identified securely to Chatbase
- **Automatic authentication** - Seamlessly handles user login/logout state
- **Secure HMAC verification** - Uses server-side secret key for user identification

## Setup Instructions

### 1. Environment Variable

Add the Chatbase secret key to your environment variables:

```bash
# In your .env.local or production environment
CHATBASE_SECRET_KEY=8vy0pjboklpy9qt00656v86grjgq1gtq
```

### 2. Files Added/Modified

- `app/layout.tsx` - Added Chatbase widget script and ChatbaseIdentity component
- `components/Chatbase/ChatbaseIdentity.tsx` - Handles user identity verification
- `pages/api/chatbase/verify-user.ts` - API endpoint for HMAC generation
- `lib/env-validation.ts` - Added CHATBASE_SECRET_KEY to optional server vars

### 3. How It Works

1. **Widget Loading**: The Chatbase widget script loads on every page
2. **User Detection**: The ChatbaseIdentity component monitors authentication state
3. **Identity Verification**: When a user logs in, it calls `/api/chatbase/verify-user`
4. **HMAC Generation**: The API generates a secure hash using the user ID and secret key
5. **User Identification**: The hash is sent to Chatbase to securely identify the user

### 4. Testing

To test the integration:

1. **Environment Setup**: Ensure `CHATBASE_SECRET_KEY` is set in your environment
2. **Deploy/Start**: Deploy to production or start your development server
3. **Visit Website**: Go to any page on your website
4. **Check Widget**: The Chatbase chat widget should appear (usually in bottom-right corner)
5. **Test Anonymous**: Try asking questions while logged out
6. **Test Authenticated**: Log in and ask questions - Chatbase should identify you as a logged-in user

### 5. Verification

You can verify the integration is working by:

1. **Network Tab**: Check browser DevTools Network tab for calls to `/api/chatbase/verify-user`
2. **Console Logs**: Look for any error messages in the browser console
3. **Chatbase Dashboard**: Check your Chatbase dashboard for user interactions
4. **User Identity**: In Chatbase analytics, you should see identified users vs anonymous

### 6. Security Notes

- The secret key is only used server-side for HMAC generation
- User identification is secure and uses industry-standard HMAC-SHA256
- No sensitive user data is sent to Chatbase, only the secure hash
- The widget only loads after user interaction to minimize performance impact

### 7. Troubleshooting

**Widget Not Appearing:**
- Check browser console for JavaScript errors
- Verify the Chatbase script ID matches your account
- Ensure no ad blockers are interfering

**User Identity Not Working:**
- Verify `CHATBASE_SECRET_KEY` environment variable is set
- Check `/api/chatbase/verify-user` endpoint returns 200 status
- Ensure user is actually logged in (check `useAuth` hook)
- Look for "Chatbase user identity set successfully" in browser console

**"Unknown action" Errors:**
- If you see "Unknown action: clearUser" or similar, this is fixed in the latest version
- The component now handles user logout gracefully without calling unsupported methods
- Check browser console for any remaining Chatbase-related errors

**Performance Issues:**
- The widget loads with `strategy="afterInteractive"` to avoid blocking page load
- HMAC generation is lightweight and cached by the browser

## Next Steps

- Monitor user interactions in your Chatbase dashboard
- Train the AI with specific Pull-Up Club content if needed
- Consider customizing the widget appearance to match your brand
- Set up any specific conversation flows or automated responses
