import { memo, useState, useRef, useCallback, useEffect } from 'react';
import { Camera, Package, CheckCircle, Globe, MapPin, Calendar, DollarSign,Loader } from 'lucide-react';
import { loadStripe } from "@stripe/stripe-js";
import {
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  Elements,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { useTranslation } from 'react-i18next';


const stripePromise = loadStripe('pk_live_51Nefi9KmwKMSxU2Df5F2MRHCcFSbjZRPWRT2KwC6xIZgkmAtVLFbXW2Nu78jbPtI9ta8AaPHPY6WsYsIQEOuOkWK00tLJiKQsQ');


const FreezePIXRegistration = () => {
  // State management for multi-step registration
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedSchool, setSelectedSchool] = useState('');
  const [selectedEvent, setSelectedEvent] = useState('');
  const [language, setLanguage] = useState('en');
  const [selectedPackage, setSelectedPackage] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('credit'); // Default payment method
  const [showIntro, setShowIntro] = useState(true);
    const [selectedPhotos, setSelectedPhotos] = useState([]); // Correct
    const [activeStep, setActiveStep] = useState(0);

    const [orderSuccess, setOrderSuccess] = useState(false);
    const [isBillingAddressSameAsShipping, setIsBillingAddressSameAsShipping] = useState(true);
    const [isProcessingOrder, setIsProcessingOrder] = useState(false);
    const [showBookingPopup, setShowBookingPopup] = useState(false);
    const fileInputRef = useRef(null);
    const [error, setError] = useState(null);
    const [discountCode, setDiscountCode] = useState('');
    const [discountError, setDiscountError] = useState('');
    const [orderNote, setOrderNote] = useState('');
    const [showPolicyPopup, setShowPolicyPopup] = useState(false);
    const [currentOrderNumber, setCurrentOrderNumber] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isInteracProcessing, setIsInteracProcessing] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);


  // Translations (kept the same as in the previous version)
  const translations = {
    en: {
      steps: {
        country: 'Select Country',
        school: 'Choose School',
        event: 'Pick Photo Event',
        registration: 'Complete Registration'
      },
      countries: [
        { value: 'canada', name: 'Canada' },
        { value: 'usa', name: 'United States' }
      ],
      schools: {
        canada: [
          { value: 'springfield-elementary', name: 'Springfield Elementary', location: 'Ontario' },
          { value: 'oakwood-middle', name: 'Oakwood Middle School', location: 'Quebec' }
        ],
        usa: [
          { value: 'riverside-high', name: 'Riverside High School', location: 'California' },
          { value: 'lincoln-elementary', name: 'Lincoln Elementary', location: 'New York' }
        ]
      },
      events: [
        { value: 'fall-2024', name: 'Fall 2024 Photo Day', date: 'September 15, 2024' },
        { value: 'spring-2025', name: 'Spring 2025 Photo Day', date: 'March 20, 2025' }
      ],
      buttons: {
        next: 'Next',
        previous: 'Previous',
        register: 'Register My Child',
        submit: 'Complete Registration'
      },
      form: {
        firstName: 'Parent First Name',
        lastName: 'Parent Last Name',
        studentName: 'Student First Name',
        studentLastName: 'Student Last Name',
        parentEmail: 'Parent Email',
        
      },
      packages: {
        basic: 'Basic Package',
        premium: 'Premium Package',
        halloween: 'Halloween Special'
      },
      canada : {
      options: 'Payment Options for Canada',
      select : 'Select Payment Method:',
      interac: 'Interac E-Transfer',
      credit: 'Credit Card Payment',
      send: 'Send payment to:',
      placing: 'After placing the order, complete the Interac E-Transfer to the provided email.',
      credit_c: 'Credit Card Payment',
      message_c : 'Please complete your payment to place the order',
      register : "Register my child"

    }
    },
    fr: {
      // French translations remain the same as in the original code
      steps: {
        country: 'Sélectionner le Pays',
        school: 'Choisir l\'École',
        event: 'Choisir l\'Événement Photo',
        registration: 'Compléter l\'Inscription'
      },
      countries: [
        { value: 'canada', name: 'Canada' },
        { value: 'usa', name: 'États-Unis' }
      ],
      packages: {
        basic: 'Forfait de Base',
        premium: 'Forfait Premium',
        halloween: 'Offre Spéciale Halloween'
      },
      canada: {
        options: 'Options de paiement pour le Canada',
        select : 'Sélectionnez le mode de paiement :',
        interac: 'Virement Interac',
        credit: 'Paiement par carte de crédit',
        send: 'Envoyer le paiement à :',
        placing: 'Après avoir passé la commande, veuillez effectuer le virement Interac à l\'adresse e-mail fournie.',
        credit_c: 'Paiement par carte de crédit',
        message_c : 'Veuillez effectuer votre paiement pour passer la commande',
        register : "Inscrire mon enfant"

    }
    }
  };

  // Existing translation function
  const t = (key) => {
    try {
      const keys = key.split('.');
      return keys.reduce((obj, k) => obj[k], translations[language] || translations['en']);
    } catch (error) {
      console.warn(`Translation key not found: ${key}`);
      return key;
    }
  };

  // Step navigation handlers
  const nextStep = () => setCurrentStep(prev => prev + 1);
  const previousStep = () => setCurrentStep(prev => prev - 1);

  // Country Selection Component
  const CountrySelection = () => {
    const [selectedCountry, setSelectedCountry] = useState(null);
    const [buttonColor, setButtonColor] = useState('black');
  
    // Define countries directly or ensure proper translation access
    const countries = translations[language]?.countries || translations['en'].countries;
  
    const handleCountrySelect = (country) => {
      setSelectedCountry(country.value);
      setButtonColor('white');
      nextStep();
    };
  
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-800 text-center">
          {t('steps.country')}
        </h2>
        <div className="space-y-4">
          {countries.map((country) => (
            <div 
              key={country.value}
              className={`border rounded-lg p-4 cursor-pointer ${
                selectedCountry === country.value ? 'bg-yellow-100 border-yellow-500' : 'bg-white'
              }`}
              onClick={() => handleCountrySelect(country)}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-lg">{country.name}</h3>
                </div>
              </div>
            </div>
          ))}
        </div>
        {selectedCountry && (
          <button 
            className={`bg-${buttonColor} text-black py-2 px-4 rounded-lg`}
          >
            {t('canada.register')}
          </button>
        )}
      </div>
    );
  };

  const CheckoutForm = ({ onSubmit, selectedCountry, isProcessing }) => {
    const stripe = useStripe();
    const elements = useElements();
    const { t } = useTranslation();
    
    const [cardError, setCardError] = useState('');
    const [postalCode, setPostalCode] = useState('');
    const [postalCodeError, setPostalCodeError] = useState('');
    const [processing, setProcessing] = useState(false);
    const [serverError, setServerError] = useState('');
  
    const cardElementOptions = {
      style: {
        base: {
          fontSize: '16px',
          color: '#424770',
          '::placeholder': {
            color: '#aab7c4',
          },
          ':-webkit-autofill': {
            color: '#424770',
          },
        },
        invalid: {
          color: '#9e2146',
          iconColor: '#9e2146',
        },
      },
      hidePostalCode: true,
    };
  
    const validatePostalCode = (code, country) => {
      if (!code) return false;
      
      if (country === 'USA') {
        return /^\d{5}(-\d{4})?$/.test(code.trim());
      } else if (country === 'CAN') {
        return /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/.test(code.trim());
      }
      return true;
    };
  
    const handlePostalCodeChange = (e) => {
      const value = e.target.value;
      setPostalCode(value);
      setPostalCodeError('');
      
      if (value && !validatePostalCode(value, selectedCountry)) {
        setPostalCodeError(t('checkout.invalidPostalCode'));
      }
    };
  
    const handleSubmit = async (e) => {
      e.preventDefault();
      
      if (isProcessing || processing || !stripe || !elements) {
        return;
      }
  
      // Reset all errors
      setCardError('');
      setPostalCodeError('');
      setServerError('');
      setProcessing(true);
  
      // Validate postal code
      if (!postalCode) {
        setPostalCodeError(t('checkout.postalCodeRequired'));
        setProcessing(false);
        return;
      }
  
      if (!validatePostalCode(postalCode, selectedCountry)) {
        setPostalCodeError(t('checkout.invalidPostalCode'));
        setProcessing(false);
        return;
      }
  
      try {
        // First validate the card details with Stripe
        const { error: cardValidationError, paymentMethod } = await stripe.createPaymentMethod({
          type: 'card',
          card: elements.getElement(CardNumberElement),
          billing_details: {
            address: {
              postal_code: postalCode,
            },
          },
        });
  
        if (cardValidationError) {
          setCardError(cardValidationError.message);
          setProcessing(false);
          return;
        }
  
        // Proceed with payment submission
        try {
          await onSubmit(paymentMethod.id, postalCode);
        } catch (error) {
          // Handle specific error types
          if (error.response?.status === 500) {
            setServerError(t('checkout.serverError'));
          } else if (error.name === 'AxiosError') {
            setServerError(t('checkout.networkError'));
          } else {
            setCardError(error.message || t('checkout.paymentProcessingError'));
          }
          
          // Clear the form fields on server error
          if (error.response?.status === 500) {
            elements.getElement(CardNumberElement).clear();
            elements.getElement(CardExpiryElement).clear();
            elements.getElement(CardCvcElement).clear();
          }
        }
      } catch (err) {
        setCardError(t('checkout.paymentProcessingError'));
      } finally {
        setProcessing(false);
      }
    };
  
    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-4 border rounded-lg bg-white shadow-sm">
          {/* Card Number */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('checkout.cardNumber')}
            </label>
            <div className="p-3 border rounded-md bg-white focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
              <CardNumberElement options={cardElementOptions} />
            </div>
          </div>
  
          {/* Expiry and CVC */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('checkout.expiryDate')}
              </label>
              <div className="p-3 border rounded-md bg-white focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
                <CardExpiryElement options={cardElementOptions} />
              </div>
            </div>
  
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('checkout.cvc')}
              </label>
              <div className="p-3 border rounded-md bg-white focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
                <CardCvcElement options={cardElementOptions} />
              </div>
            </div>
          </div>
  
          {/* Postal Code */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {selectedCountry === 'USA' ? t('checkout.zipCode') : t('checkout.postalCode')}
            </label>
            <input
              type="text"
              value={postalCode}
              onChange={handlePostalCodeChange}
              className={`w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                postalCodeError ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder={selectedCountry === 'USA' ? '12345' : 'A1A 1A1'}
            />
            {postalCodeError && (
              <p className="mt-1 text-sm text-red-600">{postalCodeError}</p>
            )}
          </div>
  
          {/* Error Messages */}
          {(cardError || serverError) && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              {cardError && <p className="text-sm text-red-600">{cardError}</p>}
              {serverError && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-red-600">{serverError}</p>
                  <button 
                    type="button"
                    onClick={() => window.location.reload()}
                    className="ml-2 text-blue-600 hover:text-blue-800 underline text-sm"
                  >
                    {t('checkout.tryAgain')}
                  </button>
                </div>
              )}
            </div>
          )}
  
          {/* Submit Button */}
          <button
            type="submit"
            disabled={!stripe || processing || isProcessing}
            className={`w-full py-3 px-4 rounded-md text-white font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors
              ${(processing || isProcessing) 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {processing || isProcessing ? (
              <div className="flex items-center justify-center">
                <Loader className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                {t('checkout.processing')}
              </div>
            ) : (
              t('checkout.payNow')
            )}
          </button>
        </div>
      </form>
    );
  };
  const handlePaymentMethodChange = (event) => {
    setPaymentMethod(event.target.value);
  };

  // School Selection Component
  const SchoolSelection = () => {
    const availableSchools = t(`schools.${selectedCountry}`);

    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-800 text-center">
          {t('steps.school')}
        </h2>
        <div className="space-y-4">
          {availableSchools.map((school) => (
            <div 
              key={school.value}
              className={`border rounded-lg p-4 cursor-pointer ${
                selectedSchool === school.value ? 'bg-yellow-100 border-yellow-500' : 'bg-white'
              }`}
              onClick={() => {
                setSelectedSchool(school.value);
                nextStep();
              }}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-lg">{school.name}</h3>
                  <p className="text-sm text-gray-600">{school.location}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-between space-x-4">
          <button 
            onClick={previousStep} 
            className="w-full px-6 py-3 bg-gray-200 text-black font-semibold rounded-lg"
          >
            {t('buttons.previous')}
          </button>
        </div>
      </div>
    );
  };

  // Event Selection Component
  const EventSelection = () => {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-800 text-center">
          {t('steps.event')}
        </h2>
        <div className="space-y-4">
          {t('events').map((event) => (
            <div 
              key={event.value}
              className={`border rounded-lg p-4 cursor-pointer ${
                selectedEvent === event.value ? 'bg-yellow-100 border-yellow-500' : 'bg-white'
              }`}
              onClick={() => {
                setSelectedEvent(event.value);
                nextStep();
              }}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-lg">{event.name}</h3>
                  <p className="text-sm text-gray-600">{event.date}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-between space-x-4">
          <button 
            onClick={previousStep} 
            className="w-full px-6 py-3 bg-gray-200 text-black font-semibold rounded-lg"
          >
            {t('buttons.previous')}
          </button>
        </div>
      </div>
    );
  };

  // Packages, LanguageSelector, PackageSelection, and RegistrationForm components remain the same as in the previous code
  const LanguageSelector = () => (
    <div className="flex justify-center items-center space-x-2 mb-4">
      <Globe className="text-gray-600" size={20} />
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
        className="text-sm bg-white border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-yellow-500"
      >
        <option value="en">English</option>
        <option value="fr">Français</option>
      </select>
    </div>
  );

  // Packages object
  const packages = {
    basic: {
      name: t('packages.basic'),
      price: 29.99,
      description: '1 Digital Photo, 1 Printed 8x10'
    },
    premium: {
      name: t('packages.premium'),
      price: 49.99,
      description: '3 Digital Photos, 2 Printed 8x10, Yearbook Inclusion'
    },
    halloween: {
      name: t('packages.halloween'),
      price: 59.99,
      description: 'Themed Photoshoot, 4 Digital Photos, 3 Printed 8x10, Costume Prop'
    }
  };

// Package Selection Component
  const PackageSelection = () => {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-800 text-center">
          Select Your Photo Package
        </h2>
        <div className="space-y-4">
          {Object.entries(packages).map(([key, pkg]) => (
            <div 
              key={key}
              className={`border rounded-lg p-4 cursor-pointer ${
                selectedPackage === key ? 'bg-yellow-100 border-yellow-500' : 'bg-white'
              }`}
              onClick={() => setSelectedPackage(key)}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-lg">{pkg.name}</h3>
                  <p className="text-sm text-gray-600">{pkg.description}</p>
                </div>
                <div className="font-bold text-xl">${pkg.price.toFixed(2)}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-between space-x-4">
          <button 
            onClick={previousStep} 
            className="w-1/2 px-6 py-3 bg-gray-200 text-black font-semibold rounded-lg"
          >
            {t('buttons.previous')}
          </button>
          <button 
            onClick={nextStep} 
            disabled={!selectedPackage}
            className="w-1/2 px-6 py-3 bg-yellow-500 text-black font-semibold rounded-lg shadow-md hover:bg-yellow-600 disabled:opacity-50"
          >
            Proceed to Payment
          </button>
        </div>
      </div>
    );
  };

  // Registration Form Component
  const RegistrationForm = () => {
    const [formData, setFormData] = useState({
      firstName: '',
      lastName: '',
      parentEmail: '',
      studentName: '',
      studentLastName: '',
      paymentMethod: 'interac'
    });

    const handleInputChange = (e) => {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
      e.preventDefault();
      
      const totalCost = packages[selectedPackage].price;
      const registrationDetails = {
        ...formData,
        package: packages[selectedPackage],
        totalCost: totalCost,
        country: selectedCountry,
        school: selectedSchool,
        event: selectedEvent
      };

      // Placeholder for payment integration
      console.log('Complete Registration Details:', registrationDetails);
      
      // Simulated payment processing
      alert(`Processing payment of $${totalCost.toFixed(2)} via ${formData.paymentMethod}`);
    };

    const packageSelected = packages[selectedPackage];

    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-800 text-center">
          {t('steps.registration')}
        </h2>
        
        {/* Package Summary */}
        <div className="bg-gray-100 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-semibold">{packageSelected.name}</h3>
              <p className="text-sm text-gray-600">{packageSelected.description}</p>
            </div>
            <div className="font-bold text-xl text-green-600">
              ${packageSelected.price.toFixed(2)}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="firstName"
            placeholder={t('form.firstName')}
            value={formData.firstName}
            onChange={handleInputChange}
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
            required
          />
          <input
            type="text"
            name="lastName"
            placeholder={t('form.lastName')}
            value={formData.lastName}
            onChange={handleInputChange}
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
            required
          />
          <input
            type="text"
            name="studentName"
            placeholder={t('form.studentName')}
            value={formData.studentName}
            onChange={handleInputChange}
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
            required
          />
          <input
            type="text"
            name="studentLastName"
            placeholder={t('form.studentLastName')}
            value={formData.studentLastName}
            onChange={handleInputChange}
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
            required
          />
          <input
            type="email"
            name="parentEmail"
            placeholder={t('form.parentEmail')}
            value={formData.parentEmail}
            onChange={handleInputChange}
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
            required
          />
          

          {/* Payment Method Selection */}
          <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                 {/* <h3 className="text-lg font-semibold mb-4">{t('canada.options')}</h3> */}
                  
                  {/* Sélection du mode de paiement */}
                  <div className="mb-4">
                    <h4 className="font-medium">{t('canada.select')}</h4>
                    <label className="block">
                      <input
                        type="radio"
                        value="interac"
                        checked={paymentMethod === 'interac'}
                        onChange={handlePaymentMethodChange}
                        className="mr-2"
                      />
                      {t('canada.interac')}
                    </label>
                    <label className="block">
                      <input
                        type="radio"
                        value="credit"
                        checked={paymentMethod === 'credit'}
                        onChange={handlePaymentMethodChange}
                        className="mr-2"
                      />
                      {t('canada.credit')}
                    </label>
                  </div>
      
                  {/* Option de paiement Interac */}
                  {paymentMethod === 'interac' && (
                    <div className="border rounded-lg p-4 mb-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{t('canada.interac')}</h4>
                          <p className="text-sm text-gray-600">{t('canada.send')}</p>
                          <p className="font-bold">Info@freezepix.com</p>
                        </div>
                        <img 
                          src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTp9FibB-R9ac8XXEootfuHyEdTuaeJ9bZiQQ&s" 
                          alt="Interac E-Transfer" 
                          className="h-12 w-auto"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        {t('canada.placing')}
                      </p>
                      {/* Bouton de commande pour Interac */}
                      
                    </div>
                  )}
      
                  {/* Option de paiement par carte de crédit */}
                  {paymentMethod === 'credit' && (
  <Elements stripe={stripePromise}>
    <CheckoutForm
      
    />
  </Elements>
)}
                </div>
              </div>

          <div className="flex justify-between space-x-4">
            <button 
              type="button"
              onClick={previousStep} 
              className="w-1/2 px-6 py-3 bg-gray-200 text-black font-semibold rounded-lg"
            >
              {t('buttons.previous')}
            </button>

            {paymentMethod === 'interac' && (
            <button 
              type="submit"
              className="w-1/2 px-6 py-3 bg-yellow-500 text-black font-semibold rounded-lg shadow-md hover:bg-yellow-600"
            >
              {t('buttons.submit')} (${packageSelected.price.toFixed(2)})
            </button>
            )}

          </div>
        </form>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full mx-4 bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Logo Section */}
        <div className="text-center p-4">
          <div className="text-4xl font-bold tracking-tight">
            <span className="text-black">Freeze</span>
            <span className="text-yellow-500">PIX</span>
          </div>
        </div>

        {/* Language Selector */}
        <LanguageSelector />

        {/* Registration Steps Indicator */}
        <div className="flex justify-center space-x-4 pb-4">
          {[
            { icon: MapPin, text: t('steps.country') },
            { icon: Camera, text: t('steps.school') },
            { icon: Calendar, text: t('steps.event') },
            { icon: Package, text: 'Select Package' },
            { icon: CheckCircle, text: t('steps.registration') }
          ].map((step, index) => (
            <div 
              key={index} 
              className={`text-center ${currentStep === index + 1 ? 'text-yellow-500' : 'text-gray-400'}`}
            >
              <step.icon className="w-8 h-8 mx-auto mb-1" />
              <div className="text-xs">{step.text}</div>
            </div>
          ))}
        </div>

        {/* Registration Content */}
        <div className="p-6">
          {currentStep === 1 && <CountrySelection />}
          {currentStep === 2 && <SchoolSelection />}
          {currentStep === 3 && <EventSelection />}
          {currentStep === 4 && <PackageSelection />}
          {currentStep === 5 && <RegistrationForm />}
        </div>
      </div>
    </div>
  );
};

// I've added the missing code for CountrySelection, SchoolSelection, and EventSelection components
export default FreezePIXRegistration;
