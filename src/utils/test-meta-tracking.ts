// Test utility for Meta tracking implementation
export const testMetaTracking = {
  // Test all tracking functions
  async testAllEvents() {
    console.log('🧪 Testing Meta tracking implementation...');
    
    try {
      // Test basic event tracking
      await this.testBasicEvent();
      
      // Test lead tracking
      await this.testLeadEvent();
      
      // Test checkout tracking
      await this.testCheckoutEvent();
      
      // Test purchase tracking
      await this.testPurchaseEvent();
      
      console.log('✅ All Meta tracking tests completed successfully!');
    } catch (error) {
      console.error('❌ Meta tracking test failed:', error);
    }
  },

  // Test basic event tracking
  async testBasicEvent() {
    console.log('📊 Testing basic event tracking...');
    
    const response = await fetch('/api/meta/track-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventName: 'ViewContent',
        userData: {
          email: 'test@example.com',
          externalId: 'test-user-123',
        },
        customData: {
          content_name: 'Test Page',
          content_category: 'Test',
        },
      }),
    });

    const result = await response.json();
    console.log('Basic event result:', result);
    return result;
  },

  // Test lead event tracking
  async testLeadEvent() {
    console.log('🎯 Testing lead event tracking...');
    
    const response = await fetch('/api/meta/track-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventName: 'Lead',
        userData: {
          email: 'test@example.com',
          externalId: 'test-user-123',
        },
        customData: {
          content_name: 'PUC Membership Test',
          content_category: 'Subscription',
          value: 9.99,
          currency: 'USD',
        },
      }),
    });

    const result = await response.json();
    console.log('Lead event result:', result);
    return result;
  },

  // Test checkout event tracking
  async testCheckoutEvent() {
    console.log('🛒 Testing checkout event tracking...');
    
    const response = await fetch('/api/meta/track-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventName: 'InitiateCheckout',
        userData: {
          email: 'test@example.com',
          externalId: 'test-user-123',
        },
        customData: {
          value: 9.99,
          currency: 'USD',
          content_name: 'PUC Monthly Membership',
          content_category: 'Subscription',
          content_ids: ['monthly'],
          content_type: 'product',
          num_items: 1,
        },
      }),
    });

    const result = await response.json();
    console.log('Checkout event result:', result);
    return result;
  },

  // Test purchase event tracking
  async testPurchaseEvent() {
    console.log('💰 Testing purchase event tracking...');
    
    const response = await fetch('/api/meta/track-purchase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userData: {
          email: 'test@example.com',
          externalId: 'test-user-123',
        },
        value: 9.99,
        currency: 'USD',
        orderId: 'test-order-123',
      }),
    });

    const result = await response.json();
    console.log('Purchase event result:', result);
    return result;
  },

  // Test frontend pixel tracking
  testFrontendPixel() {
    console.log('🎯 Testing frontend pixel tracking...');
    
    if (typeof window !== 'undefined' && window.fbq) {
      // Test PageView
      window.fbq('track', 'PageView');
      
      // Test Lead
      window.fbq('track', 'Lead', {
        content_name: 'Frontend Test Lead',
        value: 9.99,
        currency: 'USD',
      });
      
      // Test InitiateCheckout
      window.fbq('track', 'InitiateCheckout', {
        value: 9.99,
        currency: 'USD',
        content_name: 'Frontend Test Checkout',
      });
      
      console.log('✅ Frontend pixel tracking tests completed');
    } else {
      console.warn('⚠️ Frontend pixel not available (server-side execution)');
    }
  },
};

// Export for use in browser console
if (typeof window !== 'undefined') {
  (window as any).testMetaTracking = testMetaTracking;
} 