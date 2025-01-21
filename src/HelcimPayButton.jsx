import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { initializeHelcimPayCheckout } from './helcimService';
import CryptoJS from 'crypto-js';

const HelcimPayButton = ({ 
  onPaymentSuccess,
  isProcessing,
  disabled,
  selectedCountry, 
  calculateTotals,
  total, 
  setError,
  setIsProcessingOrder
}) => {
  const [checkoutToken, setCheckoutToken] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);  // New state for initial loading
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [localProcessing, setLocalProcessing] = useState(false);
  const secretTokenRef = useRef(null);
  const scriptRef = useRef(null);
  const processingTimeoutRef = useRef(null);
  const loadingTimeoutRef = useRef(null);  // New ref for loading timeout

  // Clear all states and timeouts on unmount
  useEffect(() => {
    return () => {
      setLocalProcessing(false);
      setIsProcessingOrder(false);
      setLoading(false);
      setInitialLoading(false);
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
      }
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [setIsProcessingOrder]);

  useEffect(() => {
    const loadScript = () => {
      scriptRef.current = document.createElement('script');
      scriptRef.current.src = 'https://secure.helcim.app/helcim-pay/services/start.js';
      scriptRef.current.async = true;
      
      scriptRef.current.onload = () => {
        console.log('Helcim Pay.js script loaded successfully');
        setScriptLoaded(true);
      };
      
      scriptRef.current.onerror = () => {
        console.error('Failed to load Helcim Pay.js script');
        setError('Failed to load payment system');
        resetStates();
      };

      document.head.appendChild(scriptRef.current);
    };

    // Handle Helcim window closure
    const handleHelcimClose = () => {
      console.log('Helcim window closed');
      resetStates();
    };

    // Handle browser back button
    const handlePopState = () => {
      console.log('Browser back button pressed');
      resetStates();
    };

    // Handle page visibility change
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('Page hidden');
        processingTimeoutRef.current = setTimeout(resetStates, 10000);
      }
    };

    if (!document.querySelector('script[src="https://secure.helcim.app/helcim-pay/services/start.js"]')) {
      loadScript();
    } else {
      setScriptLoaded(true);
    }

    window.addEventListener('removeHelcimPayIframe', handleHelcimClose);
    window.addEventListener('popstate', handlePopState);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (scriptRef.current) {
        document.head.removeChild(scriptRef.current);
      }
      window.removeEventListener('removeHelcimPayIframe', handleHelcimClose);
      window.removeEventListener('popstate', handlePopState);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      resetStates();
    };
  }, [setError, setIsProcessingOrder]);

  const resetStates = () => {
    setScriptLoaded(true);
    setIsProcessingOrder(false);
    setLocalProcessing(false);
    setLoading(false);
    setInitialLoading(false);
    if (processingTimeoutRef.current) {
      clearTimeout(processingTimeoutRef.current);
    }
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }
  };

  useEffect(() => {
    const handleHelcimResponse = async (event) => {
      // Handle mobile-specific data structure
  const eventData = event.data.eventStatus ? event.data : JSON.parse(event.data);
      console.log('Received Helcim response:', event.data);

      if (event.data.eventStatus === 'ABORTED') {
        resetStates();
        setPaymentStatus({
          success: false,
          message: 'Payment Aborted',
          details: event.data.eventMessage
        });
        setError('Payment was aborted: ' + event.data.eventMessage);
        return;
      }

      if (eventData.eventStatus === 'SUCCESS') {
        try {
          let parsedEventMessage;
          try {
            parsedEventMessage = typeof eventData.eventMessage === 'string' 
              ? JSON.parse(eventData.eventMessage) 
              : eventData.eventMessage;
            
            // Additional mobile browser compatibility check
            if (typeof parsedEventMessage === 'string') {
              parsedEventMessage = JSON.parse(parsedEventMessage);
            }
          } catch (parseError) {
            console.error('Parse error:', parseError);
            resetStates();
            throw new Error('Invalid payment response format');
          }
      
          const paymentData = parsedEventMessage.data.data;
          console.log('Parsed payment data:', paymentData);
      
          if (paymentData && paymentData.status === 'APPROVED') {
            const paymentDetails = {
              transactionId: paymentData.transactionId || paymentData.cardToken,
              amount: paymentData.amount,
              currency: paymentData.currency,
              status: paymentData.status,
              cardNumber: paymentData.cardNumber,
              cardHolderName: paymentData.cardHolderName,
              approvalCode: paymentData.approvalCode,
              invoiceNumber: paymentData.invoiceNumber,
              dateCreated: paymentData.dateCreated
            };
      
            console.log('Payment approved, proceeding with success handler:', paymentDetails);
            await onPaymentSuccess(paymentDetails);
            setPaymentStatus({
              success: true,
              message: 'Payment Successful',
              details: paymentDetails
            });
          } else {
            resetStates();
            throw new Error('Transaction not approved');
          }
        } catch (error) {
          console.error('Error processing payment success:', error);
          setError(error.message || 'Failed to process payment');
          resetStates();
        }
      }
    };

    window.addEventListener('message', handleHelcimResponse);
    return () => window.removeEventListener('message', handleHelcimResponse);
  }, [onPaymentSuccess, setError, setIsProcessingOrder]);

  const handlePayment = async () => {
    setLocalProcessing(true);
    setLoading(true);
    setIsProcessingOrder(true);
    setError(null);
  
    try {
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  
      if (!scriptLoaded) {
        throw new Error(isMobile ?
          'Please wait for the payment system to load on your mobile device.' :
          'Payment system is still loading. Please try again in a moment.');
      }
  
      const response = await initializeHelcimPayCheckout({
        selectedCountry,
        total
      });
  
      console.log('Helcim initialization response:', response);
  
      if (!response.checkoutToken) {
        throw new Error('Failed to get a valid checkout token');
      }
  
      setCheckoutToken(response.checkoutToken);
      secretTokenRef.current = response.secretToken;
  
      const timeoutDuration = 5000; // Set the timeout duration to 5 seconds for both PC and mobile
  
      processingTimeoutRef.current = setTimeout(() => {
        if (!document.querySelector('.helcim-pay-iframe')) {
          resetStates();
          setError(isMobile ?
            'Payment window failed to open on mobile. Please try again or use a desktop browser.' :
            'Payment window failed to open. Please try again.');
        }
      }, timeoutDuration);
  
      const appendDelay = isMobile ? 1500 : 500;
  
      setTimeout(() => {
        if (window.appendHelcimPayIframe) {
          window.appendHelcimPayIframe(response.checkoutToken, true);
          
          // Add a delay before resetting the loading status
          setTimeout(() => {
            setLoading(false);
          }, 5000); // Adjust the duration to 5000 milliseconds (5 seconds)
        } else {
          throw new Error('Payment system not ready. Please refresh and try again.');
        }
      }, appendDelay);
  
    } catch (error) {
      console.error('Payment Initialization Error:', error);
      setPaymentStatus({
        success: false,
        message: 'Payment Initialization Failed',
        details: error.message
      });
      setError(error.message);
      resetStates();
    }
  };

  return (
    <div className="helcim-pay-container">
      <button 
        onClick={handlePayment}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        disabled={disabled || localProcessing || loading || !scriptLoaded || isProcessing}
      >
        {loading 
          ? initialLoading
            ? 'Loading...'
            : 'Processing...'
          : !scriptLoaded
            ? 'Loading Payment System...'
            : 'Pay Registration'
        }
      </button>

      {paymentStatus && (
        <div 
          className={`
            mt-4 p-3 rounded 
            ${paymentStatus.success 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
            }
          `}
        >
          <p>{paymentStatus.message}</p>
          {paymentStatus.details && (
            <p className="text-sm mt-1">
              {typeof paymentStatus.details === 'object'
                ? JSON.stringify(paymentStatus.details)
                : paymentStatus.details}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export { HelcimPayButton };