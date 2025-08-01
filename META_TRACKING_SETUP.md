# Meta Pixel & Conversions API (CAPI) Setup Guide

## 🎯 Complete Tracking Implementation

Your Pull-Up Club application now has a comprehensive Meta tracking system that tracks the complete user journey from landing to purchase.

## ✅ What's Implemented

### 1. **Meta Pixel (Frontend)**
- ✅ Pixel ID: `1512318086417813` installed in `index.html`
- ✅ Advanced Matching enabled for better Event Match Quality
- ✅ Debug mode enabled for testing
- ✅ Global `fbq` and helper functions available

### 2. **Conversions API (Backend)**
- ✅ `/api/meta/track-event` - General event tracking
- ✅ `/api/meta/track-purchase` - Purchase-specific tracking
- ✅ Enhanced user data hashing (email, phone, name, etc.)
- ✅ Facebook-specific parameters (fbp, fbc, fb_login_id)
- ✅ IP address and user agent capture

### 3. **Event Tracking Flow**
```
Landing Page → Lead Event → InitiateCheckout → Stripe → Purchase Event
```

## 🔧 Environment Variables Required

Add these to your Vercel environment variables:

```bash
META_PIXEL_ID=1512318086417813
META_ACCESS_TOKEN=your_facebook_access_token
META_API_VERSION=v21.0
```

## 📊 Events Being Tracked

### **Page Views**
- `PageView` - Automatic on all pages
- `ViewContent` - Enhanced content tracking

### **Lead Generation**
- `Lead` - When users click "Sign Up Now" buttons
- Sources: Hero CTA, CTA Section

### **Checkout Flow**
- `InitiateCheckout` - Before redirecting to Stripe
- `Purchase` - After successful payment completion

### **User Actions**
- `CompleteRegistration` - Account creation
- `SubmitApplication` - Video submissions
- `ViewContent` - Leaderboard views

## 🎯 Event Match Quality Improvements

### **User Data Sent**
- ✅ Email (hashed)
- ✅ Phone (hashed)
- ✅ First/Last Name (hashed)
- ✅ External ID (user ID)
- ✅ Facebook Browser ID (fbp)
- ✅ Facebook Click ID (fbc)
- ✅ IP Address
- ✅ User Agent
- ✅ Referrer URL
- ✅ Page URL

### **Custom Data**
- ✅ Value and currency
- ✅ Content names and categories
- ✅ Product IDs
- ✅ Order IDs
- ✅ Page context

## 🧪 Testing Your Implementation

### 1. **Test Events in Meta Events Manager**
1. Go to Meta Events Manager
2. Navigate to your pixel
3. Click "Test Events" tab
4. Use test event code: `TEST12345`

### 2. **Browser Testing**
```javascript
// Test Lead event
fbq('track', 'Lead', {
  content_name: 'PUC Membership Test',
  value: 9.99,
  currency: 'USD'
});

// Test InitiateCheckout
fbq('track', 'InitiateCheckout', {
  value: 9.99,
  currency: 'USD',
  content_name: 'PUC Monthly Membership'
});
```

### 3. **Server-Side Testing**
```bash
curl -X POST https://yourdomain.com/api/meta/track-event \
  -H "Content-Type: application/json" \
  -d '{
    "eventName": "Lead",
    "userData": {
      "email": "test@example.com",
      "externalId": "test-user-123"
    },
    "customData": {
      "content_name": "Test Lead",
      "value": 9.99,
      "currency": "USD"
    }
  }'
```

## 📈 Expected Results

### **Event Match Quality**
- **Before**: Low (limited user data)
- **After**: High (email, phone, name, external_id, fbp, fbc)

### **Conversion Tracking**
- **Before**: Only basic page views
- **After**: Complete funnel tracking (Lead → InitiateCheckout → Purchase)

### **User Journey Visibility**
- **Before**: Fragmented tracking
- **After**: End-to-end user journey tracking

## 🔍 Monitoring & Debugging

### **Meta Events Manager**
1. Check "Test Events" for real-time event testing
2. Monitor "Events" tab for production events
3. Review "Diagnostics" for pixel health

### **Browser Console**
- Look for `🔍 Meta tracking` logs in development
- Check for `✅ Meta tracking success` messages
- Monitor for any tracking errors

### **Server Logs**
- Check Vercel function logs for CAPI calls
- Monitor for API errors or rate limiting
- Verify user data hashing is working

## 🚀 Production Checklist

### **Before Going Live**
- [ ] Remove debug mode from Meta Pixel
- [ ] Verify all environment variables are set
- [ ] Test complete user journey
- [ ] Confirm events appear in Meta Events Manager
- [ ] Set up conversion tracking in Meta Ads Manager

### **Post-Launch Monitoring**
- [ ] Monitor Event Match Quality scores
- [ ] Track conversion rates
- [ ] Review user journey analytics
- [ ] Optimize based on performance data

## 🛠️ Troubleshooting

### **Common Issues**

1. **Events not appearing in Meta Events Manager**
   - Check pixel ID is correct
   - Verify access token has proper permissions
   - Ensure CORS is properly configured

2. **Low Event Match Quality**
   - Verify email/phone hashing is working
   - Check that Facebook parameters (fbp, fbc) are being captured
   - Ensure external_id is being sent

3. **CAPI errors**
   - Check access token validity
   - Verify API version compatibility
   - Monitor rate limiting

### **Debug Commands**
```javascript
// Check if pixel is loaded
console.log('Pixel loaded:', typeof fbq !== 'undefined');

// Check Facebook parameters
console.log('FB Params:', window.getFacebookParams());

// Test event tracking
fbq('track', 'PageView');
```

## 📞 Support

If you encounter issues:
1. Check Meta Events Manager diagnostics
2. Review browser console for errors
3. Monitor Vercel function logs
4. Test with Meta's Event Testing tool

---

**Your Meta tracking system is now fully configured for optimal conversion tracking and Event Match Quality! 🎉** 