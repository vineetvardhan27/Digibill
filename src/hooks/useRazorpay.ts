import { useState, useEffect } from 'react';

export function useRazorpay() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')) {
      setIsLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => setIsLoaded(true);
    script.onerror = () => {
      console.error('Failed to load Razorpay SDK');
    };

    document.body.appendChild(script);

    return () => {
      // We don't remove the script on unmount because Razorpay relies on a global window object.
      // Loading it once per session is sufficient.
    };
  }, []);

  return isLoaded;
}
