import ReactGA from 'react-ga4';

// For simplicity, the Measurement ID is hardcoded here.
// For production applications, it's highly recommended to store this
// in an environment variable (e.g., VITE_APP_GA4_MEASUREMENT_ID in a .env file)
// and access it via `import.meta.env.VITE_APP_GA4_MEASUREMENT_ID`.
const MEASUREMENT_ID = "G-5NV54P8K1L";
let isInitialized = false;

/**
 * Initializes Google Analytics. This should be called once when the app starts.
 */
export const initializeGA = () => {
  if (MEASUREMENT_ID && !isInitialized) {
    ReactGA.initialize(MEASUREMENT_ID);
    isInitialized = true;
    console.log("GA Initialized");
  } else if (!MEASUREMENT_ID) {
    console.warn("Google Analytics Measurement ID is not set. Tracking is disabled.");
  }
};

/**
 * Tracks a page view in Google Analytics. Should be called on route changes.
 */
export const trackPageView = () => {
  if (isInitialized) {
    ReactGA.send({ hitType: 'pageview', page: window.location.pathname + window.location.search });
  }
};

/**
 * Tracks a custom event in Google Analytics.
 */
export const trackEvent = (category: string, action: string, label?: string, value?: number) => {
  if (isInitialized) {
    ReactGA.event({
      category,
      action,
      label,
      value
    });
  }
};

/**
 * Tracks exceptions/errors in Google Analytics.
 */
export const trackException = (description: string, fatal: boolean = false) => {
  if (isInitialized) {
    ReactGA.event({
      action: 'exception',
      category: 'Errors',
      label: description,
      // 'value' could be used to indicate if it was fatal, e.g., 1 for true.
      // However, the standard GA event doesn't have a 'fatal' field.
      // We can send it as a custom dimension if needed, but for now, we'll log it in the label.
      // A common practice is to just send the description.
    });
  }
};

/**
 * Set user properties in Google Analytics.
 */
export const setUserProperties = (properties: { [key: string]: any }) => {
  if (isInitialized) {
    ReactGA.set(properties);
  }
};