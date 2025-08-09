// Test utility for Meta tracking
export const testMetaTracking = {
  // Test environment variables
  checkConfig: () => {
    const config = {
        pixelId: process.env.NEXT_PUBLIC_META_PIXEL_ID,
  hasToken: !!process.env.NEXT_PUBLIC_META_ACCESS_TOKEN,
  apiVersion: process.env.NEXT_PUBLIC_META_API_VERSION || 'v21.0'
    };
    
    console.log('🔍 Meta Tracking Config:', config);
    
    if (!config.pixelId) {
      console.error('❌ Missing META_PIXEL_ID environment variable');
      return false;
    }
    
    if (!config.hasToken) {
      console.error('❌ Missing META_ACCESS_TOKEN environment variable');
      return false;
    }
    
    console.log('✅ Meta tracking configuration looks good');
    return true;
  },

  // Test API endpoint
  testAPI: async () => {
    try {
      const response = await fetch('/api/meta/track-event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventName: 'TestEvent',
          userData: {
            email: 'test@example.com',
            externalId: 'test-user-123'
          },
          customData: {
            content_name: 'Test Page',
            test: true
          }
        }),
      });

      const result = await response.json();
      console.log('🔍 API Test Result:', result);
      
      if (result.success) {
        console.log('✅ API endpoint working correctly');
        return true;
      } else {
        console.error('❌ API endpoint failed:', result.error);
        return false;
      }
    } catch (error) {
      console.error('❌ API test failed:', error);
      return false;
    }
  },

  // Test purchase tracking
  testPurchaseTracking: async () => {
    try {
      const response = await fetch('/api/meta/track-purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: 'test-user-123',
          userEmail: 'test@example.com',
          customerId: 'cus_test123',
          amount: 9.99,
          currency: 'USD',
          subscriptionId: 'sub_test123',
          sessionId: 'cs_test123',
          plan: 'monthly',
          source: 'test'
        }),
      });

      const result = await response.json();
      console.log('🔍 Purchase Tracking Test Result:', result);
      
      if (result.success) {
        console.log('✅ Purchase tracking working correctly');
        return true;
      } else {
        console.error('❌ Purchase tracking failed:', result.error);
        return false;
      }
    } catch (error) {
      console.error('❌ Purchase tracking test failed:', error);
      return false;
    }
  },

  // Test Facebook parameters
  checkFacebookParams: () => {
    if (typeof window === 'undefined') {
      console.log('⚠️ Not in browser environment');
      return false;
    }

      const fbp = typeof document !== 'undefined' ? document.cookie.match(/_fbp=([^;]+)/)?.[1] : undefined;
  const fbc = typeof document !== 'undefined' ? document.cookie.match(/_fbc=([^;]+)/)?.[1] : undefined;
    const fb_login_id = typeof window !== 'undefined' ? localStorage.getItem('fb_login_id') : null;

    const params = { fbp, fbc, fb_login_id };
    console.log('🔍 Facebook Parameters:', params);
    
    if (fbp || fbc || fb_login_id) {
      console.log('✅ Facebook parameters detected');
      return true;
    } else {
      console.warn('⚠️ No Facebook parameters detected');
      return false;
    }
  },

  // Run all tests
  runAllTests: async () => {
    console.log('🧪 Running Meta Tracking Tests...');
    
    const results = {
      config: testMetaTracking.checkConfig(),
      api: await testMetaTracking.testAPI(),
      purchase: await testMetaTracking.testPurchaseTracking(),
      facebookParams: testMetaTracking.checkFacebookParams()
    };
    
    console.log('📊 Test Results:', results);
    
    const allPassed = Object.values(results).every(result => result === true);
    
    if (allPassed) {
      console.log('🎉 All Meta tracking tests passed!');
    } else {
      console.error('❌ Some tests failed. Check the logs above.');
    }
    
    return results;
  }
};

// Auto-run tests in development
if (process.env.NODE_ENV === 'development') {
  // Wait for page to load
  setTimeout(() => {
    console.log('🔍 Auto-running Meta tracking tests...');
    testMetaTracking.runAllTests();
  }, 2000);
} 