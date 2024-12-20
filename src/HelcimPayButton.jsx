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
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const secretTokenRef = useRef(null);
  const scriptRef = useRef(null);

  // Load Helcim Pay.js script
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
      };

      document.head.appendChild(scriptRef.current);
    };

    // Check if script is already loaded
    if (!document.querySelector('script[src="https://secure.helcim.app/helcim-pay/services/start.js"]')) {
      loadScript();
    } else {
      setScriptLoaded(true);
    }

    return () => {
      if (scriptRef.current) {
        document.head.removeChild(scriptRef.current);
      }
    };
  }, [setError]);

  useEffect(() => {
    const handleHelcimResponse = async (event) => {
      console.log('Received Helcim response:', event.data);

      if (event.data.eventStatus === 'ABORTED') {
        setPaymentStatus({
          success: false,
          message: 'Payment Aborted',
          details: event.data.eventMessage
        });
        setError('Payment was aborted: ' + event.data.eventMessage);
        setIsProcessingOrder(false);
        return;
      }

      if (event.data.eventStatus === 'SUCCESS') {
        try {
          let parsedEventMessage;
          try {
            parsedEventMessage = typeof event.data.eventMessage === 'string' 
              ? JSON.parse(event.data.eventMessage) 
              : event.data.eventMessage;
      
            if (typeof parsedEventMessage.data === 'string') {
              parsedEventMessage.data = JSON.parse(parsedEventMessage.data);
            }
          } catch (parseError) {
            console.error('Error parsing event message:', parseError);
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
      
            // Assuming onPaymentSuccess is an asynchronous function
            await onPaymentSuccess(paymentDetails);
      
            setPaymentStatus({
              success: true,
              message: 'Payment Successful',
              details: paymentDetails
            });
          } else {
            throw new Error('Transaction not approved');
          }
        } catch (error) {
          console.error('Error processing payment success:', error);
          setError(error.message || 'Failed to process payment');
          setIsProcessingOrder(false);
        }
      }
    };

    window.addEventListener('message', handleHelcimResponse);
    return () => window.removeEventListener('message', handleHelcimResponse);
  }, [onPaymentSuccess, setError, setIsProcessingOrder]);

  const handlePayment = async () => {
    setLoading(true);
    setIsProcessingOrder(true);
    
    try {
      if (!scriptLoaded) {
        throw new Error('Payment system is still loading. Please try again in a moment.');
      }

      if (!window.appendHelcimPayIframe) {
        throw new Error('Payment system not properly initialized. Please refresh the page and try again.');
      }

      const response = await initializeHelcimPayCheckout({
        selectedCountry,
        total
      });
      
      console.log('Helcim initialization response:', response);
      
      if (!response.checkoutToken) {
        throw new Error('Failed to get valid checkout token');
      }

      setCheckoutToken(response.checkoutToken);
      secretTokenRef.current = response.secretToken;
      console.log('Stored secret token:', response.secretToken);

      // Add a small delay to ensure the script is fully initialized
      setTimeout(() => {
        if (window.appendHelcimPayIframe) {
          window.appendHelcimPayIframe(response.checkoutToken, true);
        } else {
          throw new Error('Payment system not ready. Please try again.');
        }
      }, 500);

    } catch (error) {
      console.error('Payment Initialization Error:', error);
      setPaymentStatus({
        success: false,
        message: 'Payment Initialization Failed',
        details: error.message
      });
      setError(error.message);
      setIsProcessingOrder(false);
    } finally {
      setTimeout(() => {
        setLoading(false);
      }, 5000);
    }
  };

  return (
    <div className="helcim-pay-container">
      <button 
        onClick={handlePayment}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        disabled={disabled || isProcessing || loading || !scriptLoaded}
      >
        {loading 
          ? 'Loading...' 
          : isProcessing 
            ? 'Processing...' 
            : !scriptLoaded
              ? 'Loading Payment System...'
              : 'Pay Order'
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