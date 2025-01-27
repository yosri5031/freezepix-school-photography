import React,{ memo, useState, useRef, useCallback, useEffect } from 'react';
import { Camera, Package, CheckCircle, Globe, MapPin, Calendar, DollarSign,Loader,CalendarCheck2} from 'lucide-react';
import { useKeyboardFix } from './useKeyboardFix';
import { School as CustomSchoolIcon,X} from 'lucide-react';
import { loadStripe } from "@stripe/stripe-js";
import {
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  Elements,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import {HelcimPayButton } from './HelcimPayButton';
import { initializeHelcimPayCheckout } from './helcimService';
import mongoose from 'mongoose';



const stripePromise = loadStripe('pk_live_51Nefi9KmwKMSxU2Df5F2MRHCcFSbjZRPWRT2KwC6xIZgkmAtVLFbXW2Nu78jbPtI9ta8AaPHPY6WsYsIQEOuOkWK00tLJiKQsQ');

// Translations (kept the same as in the previous version)


const FreezePIXRegistration = () => {
  // State management for multi-step registration
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedSchool, setSelectedSchool] = useState('');
  const [selectedEvent, setSelectedEvent] = useState(null); 
    useEffect(() => {
    if (selectedSchool) {
      setFormData(prev => ({
        ...prev,
        paymentMethod: selectedSchool.country === 'Tunisia' ? 'daycare' : ''
      }));
    }
  }, [selectedSchool]);
  const [language, setLanguage] = useState('en');
  const [selectedPackage, setSelectedPackage] = useState('Standard'); // Default to 'standard'
  const [paymentMethod, setPaymentMethod] = useState('credit'); // Default payment method
  const [showIntro, setShowIntro] = useState(true);
  const [registrationConfirmation, setRegistrationConfirmation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [discountCode, setDiscountCode] = useState('');
    const [discountError, setDiscountError] = useState('');
    const [availableDiscounts, setAvailableDiscounts] = useState([]);
  const [appliedDiscount, setAppliedDiscount] = useState(null);
  const [isFormFilled, setIsFormFilled] = useState(false);
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);
  const [formData, setFormData] = useState({
    parentFirstName: '',
    parentLastName: '',
    parentEmail: '',
    studentFirstName: '',
    studentLastName: '',
    parentPhone: '',
    studentGrade: '',
    street: '',
    city: '',
    province: '',
    zip:'',
    paymentMethod: 'credit',
    schoolId: selectedSchool?._id || '',
    eventId: selectedEvent?._id || '',
    packageSelection: '',
  packagePrice: 0,
  packageName: '',
  packageDescription: ''
  });
 
  const useEvents = (selectedSchool) => {
    const [events, setEvents] = useState([]);
    const [eventsLoading, setEventsLoading] = useState(true);
    const [eventsError, setEventsError] = useState(null);
  
    useEffect(() => {
      const fetchEvents = async () => {
        if (!selectedSchool || !selectedSchool._id) {
          setEventsLoading(false);
          return;
        }
  
        // Simplified ID extraction
        const schoolId = typeof selectedSchool._id === 'string' 
          ? selectedSchool._id 
          : selectedSchool._id.toString();
  
        try {
          setEventsLoading(true);
          const response = await axios.get(
            `https://freezepix-database-server-c95d4dd2046d.herokuapp.com/api/events/${schoolId}`
          );
          
          console.log('Events response:', response.data); // Debug log
          setEvents(response.data);
        } catch (error) {
          console.error('Events fetch error:', error);
          setEventsError(error.message);
        } finally {
          setEventsLoading(false);
        }
      };
  
      fetchEvents();
    }, [selectedSchool]);
  
    return { events, eventsLoading, eventsError };
  };

  //fetch discounts
  useEffect(() => {
    const fetchDiscountCodes = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get('https://freezepix-database-server-c95d4dd2046d.herokuapp.com/api/discount-codes');
        // Filter only active discounts and check dates
        const activeDiscounts = response.data.filter(discount => {
          const now = new Date();
          const startDate = new Date(discount.startDate);
          const endDate = discount.endDate ? new Date(discount.endDate) : null;
          
          return discount.isActive && 
                 (!endDate || endDate > now) && 
                 startDate <= now;
        });
        setAvailableDiscounts(activeDiscounts);
      } catch (error) {
        console.error('Error fetching discount codes:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDiscountCodes();
  }, []);

  // Add discount validation function
  const validateDiscountCode = (code) => {
    if (!code) return false;
  
    const upperCode = code.toUpperCase();
    const validDiscount = availableDiscounts.find(discount => {
      const isMatchingCode = discount.code.toUpperCase() === upperCode;
      const now = new Date();
      const startDate = new Date(discount.startDate);
      const endDate = discount.endDate ? new Date(discount.endDate) : null;
  
      return isMatchingCode && 
             discount.isActive && 
             (!endDate || endDate > now) && 
             startDate <= now;
    });
  
    if (!validDiscount) {
      setDiscountError('Invalid discount code');
      return false;
    }
  
    setAppliedDiscount(validDiscount); // Save the valid discount
    setDiscountError('');
    return true;
  };
  // Add these to your useEffect hooks
useEffect(() => {
  // Check URL for successful payment
  const urlParams = new URLSearchParams(window.location.search);
  const sessionId = urlParams.get('session_id');
  
  if (sessionId) {
    verifyPayment(sessionId);
  }
}, []);

const translations = {
  en: {
    select: {
grade:'Grade',
select_grade:'Select Grade',
student_grade: 'Student Grade',
all_provinces: 'All Provinces'
    },
    steps: {
      country: 'Select Country',
      photo_package: 'Select Your Photo Package',
      school: 'Choose School',
      event: 'Pick Photo Event',
      registration: 'Complete Registration',
      package : 'Select Package',
      register :'Register Another Child'

    },
    buttons: {
      next: 'Next',
      previous: 'Previous',
      register: 'Register My Child',
      submit: 'Complete Registration'
    },
    confirmation : {
      register: 'Registration ID',
      qr: 'Unique QR Code',
      student: 'Student',
      school: 'School',
      event: 'Event',
      error: 'No schools found matching your criteria'
    },
    countries: [
      { value: 'canada', name: 'Canada' },
      { value: 'usa', name: 'United States' },
      { value: 'tunisia', name: 'Tunisia' }
    ],
    schools: {
      canada: [
        { value: 'springfield-elementary', name: 'Springfield Elementary', location: 'Ontario' },
        { value: 'oakwood-middle', name: 'Oakwood Middle School', location: 'Quebec' }
      ],
      usa: [
        { value: 'riverside-high', name: 'Riverside High School', location: 'California' },
        { value: 'lincoln-elementary', name: 'Lincoln Elementary', location: 'New York' }
      ],
      tunisia: [
        { value: 'tunis-daycare', name: 'Tunis International Daycare', location: 'Tunis' },
        { value: 'sousse-kindergarten', name: 'Sousse Early Learning Center', location: 'Sousse' }
      ]
    },
    events: [
      { value: 'fall-2024', name: 'Fall 2024 Photo Day', date: 'September 15, 2024' },
      { value: 'spring-2025', name: 'Spring 2025 Photo Day', date: 'March 20, 2025' }
    ],
    
    form: {
      firstName: 'Parent First Name',
      lastName: 'Parent Last Name',
      studentName: 'Student First Name',
      studentLastName: 'Student Last Name',
      parentEmail: 'Parent Email',
      parentPhone: 'Parent Phone',
      street:'Street',
      city: 'City',
      province: 'Province',
      zip: 'Zip Code'
      
    },
    canada : {
    options: 'Payment Options for Canada',
    select : 'Select Payment Method:',
    interac: 'Interac E-Transfer',
    credit: 'Credit Card Payment',
    send: 'Send payment to:',
    placing: 'After completing the registration, complete the Interac E-Transfer to the provided email.',
    credit_c: 'Credit Card Payment',
    message_c : 'Please complete your payment to place the order'

  },
  
  checkout: {
    cardNumber: 'Card Number',
  expiryDate: 'Expiry Date', 
  cvc: 'CVC',
  zipCode: 'Zip Code',
  postalCode: 'Postal Code',
  postalCodeRequired: 'Postal code is required',
  invalidPostalCode: 'Invalid postal code for the selected country',
  serverError: 'An error occurred on our server. Please try again.',
  networkError: 'Network error. Please check your connection.',
  paymentProcessingError: 'Unable to process payment. Please try again.',
  processing: 'Processing...',
  payNow: 'Pay Now',
  tryAgain: 'Try Again'
  },
  tunisia: {
    paymentNote: 'Prices are in TND at half the USD rate',
    daycarePayment: 'Pay at Daycare',
    confirmationTitle: 'Registration Successful!',
    confirmationMessage: 'Your child is now registered.'
  }
  },
  fr: {
    // French translations remain the same as in the original code
    select: { grade:'Classe', select_grade:'Sélectionner Classe', student_grade: 'Classe d\'élève', all_provinces: 'Tous les provinces' },
    form: {
      firstName: 'Prénom du parent',
      lastName: 'Nom de famille du parent',
      studentName: 'Prénom de d\'élève',
      studentLastName: 'Nom de famille de d\'élève',
      parentEmail: 'Email du parent',
    parentPhone: 'Téléphone des parents',
    street:'Adresse',
      city: 'Ville',
      province: 'Province',
      zip: 'Code postal'
  },
    steps: {
      country: 'Sélectionner le Pays',
      school: 'Choisir l\'école',
      photo_package: 'Sélectionnez votre package',
      event: 'Choisir l\'événement Photo',
      registration: 'Compléter l\'inscription',
      package : 'Sélectionner un offre',
      register :'Enregistrer un autre enfant'
    },
    buttons: {
      next: 'Suivant',
      previous: 'Précédent',
      register: 'Inscrire mon enfant',
      submit: 'Terminer l\'inscription'
    },
    confirmation : {
      register: 'ID d\'inscription',
      qr: 'Code QR ',
      student: 'Étudiant',
      school: 'École',
      event: 'Événement',
      error: 'Aucune école trouvée correspondant à vos critères'
    },
    countries: [
      { value: 'canada', name: 'Canada' },
      { value: 'usa', name: 'États-Unis' },
      { value: 'tunisia', name: 'Tunisie' }

    ],
    schools: {
      // ... [previous schools]
      tunisia: [
        { value: 'tunis-daycare', name: 'Garderie Internationale de Tunis', location: 'Tunis' },
        { value: 'sousse-kindergarten', name: 'Centre d\'Apprentissage Précoce de Sousse', location: 'Sousse' }
      ]
    },
    canada: {
      options: 'Options de paiement pour le Canada',
      select : 'Sélectionnez le mode de paiement :',
      interac: 'Virement Interac',
      credit: 'Paiement par carte de crédit',
      send: 'Envoyer le paiement à :',
      placing: 'Après avoir terminé l\'inscription, veuillez compléter le virement Interac à l\'adresse e-mail fournie.',
      credit_c: 'Paiement par carte de crédit',
      message_c : 'Veuillez effectuer votre paiement pour passer la commande'
  },
  checkout: {
    cardNumber: 'Numéro de carte',
    expiryDate: 'Date d\'expiration',
    cvc: 'CVC',
    zipCode: 'Code postal',
    postalCode: 'Code postal',
    postalCodeRequired: 'Le code postal est requis',
    invalidPostalCode: 'Code postal invalide pour le pays sélectionné',
    serverError: 'Une erreur s\'est produite sur notre serveur. Veuillez réessayer.',
    networkError: 'Erreur réseau. Veuillez vérifier votre connexion.',
    paymentProcessingError: 'Impossible de traiter le paiement. Veuillez réessayer.',
    processing: 'En cours de traitement...',
    payNow: 'Payer maintenant',
    tryAgain: 'Réessayer'
},
tunisia: {
  paymentNote: 'Les prix sont en TND à la moitié du taux USD',
  daycarePayment: 'Payer à la garderie',
  confirmationTitle: 'Inscription Réussie !',
  confirmationMessage: 'Votre enfant est maintenant inscrit.'
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

const AddressForm = ({ type, data, onChange }) => {
  const [localData, setLocalData] = useState({
    parentFirstName: data.parentFirstName || '',
    parentLastName: data.parentLastName || '',
    studentFirstName: data.studentFirstName || '',
    studentLastName: data.studentLastName || '',
    parentEmail: data.parentEmail || '',
    parentPhone: data.parentPhone || '',     // Add this
    studentGrade: data.studentGrade || '',
    street: data.street || '',
    city: data.city || '',
    province: data.province || '',
    zip: data.zip || ''    // Add this
  });

  const requiredFields = [
    'parentFirstName', 
    'parentLastName', 
    'studentFirstName', 
    'studentLastName', 
    'parentEmail',
    'street',
    'city',
    'province',
    'zip'
  ];

  const handleInputChange = (field) => (e) => {
    const newValue = e.target.value;
  
    // Update local state
    setLocalData(prevData => ({
      ...prevData,
      [field]: newValue
    }));
  };
  
  const handleInputComplete = (field) => () => {
    // Check if the input for this field is complete (full word entered)
    const currentValue = localData[field];
    
    // Only update parent form data when the input is complete
    if (currentValue && currentValue.trim() !== '') {
      onChange({
        ...data,
        [field]: currentValue
      });
    }
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Parent First Name */}
      <div className="flex flex-col">
        <label className="mb-1 text-sm font-medium">
        {t('form.firstName')}<span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          inputMode="text"
          value={localData.parentFirstName || ''}
          onChange={handleInputChange('parentFirstName')}
          onBlur={handleInputComplete('parentFirstName')}
          className="w-full p-2 border rounded"
          
        />
      </div>
  
      {/* Parent Last Name */}
      <div className="flex flex-col">
        <label className="mb-1 text-sm font-medium">
        {t('form.lastName')} <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          inputMode="text"
          value={localData.parentLastName || ''}
          onChange={handleInputChange('parentLastName')}
          onBlur={handleInputComplete('parentLastName')}
          className="w-full p-2 border rounded"
          
        />
      </div>
  
      {/* Student First Name */}
      <div className="flex flex-col">
        <label className="mb-1 text-sm font-medium">
        {t('form.studentName')} <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          inputMode="text"
          value={localData.studentFirstName || ''}
          onChange={handleInputChange('studentFirstName')}
          onBlur={handleInputComplete('studentFirstName')}
          className="w-full p-2 border rounded"
          
        />
      </div>
  
      {/* Student Last Name */}
      <div className="flex flex-col">
        <label className="mb-1 text-sm font-medium">
        {t('form.studentLastName')} <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          inputMode="text"
          value={localData.studentLastName || ''}
          onChange={handleInputChange('studentLastName')}
          onBlur={handleInputComplete('studentLastName')}
          className="w-full p-2 border rounded"
          
        />
      </div>
  
      {/* Parent Email */}
      <div className="flex flex-col">
        <label className="mb-1 text-sm font-medium">
        {t('form.parentEmail')} <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          inputMode="text"
          value={localData.parentEmail || ''}
          onChange={handleInputChange('parentEmail')}
          onBlur={handleInputComplete('parentEmail')}
          className="w-full p-2 border rounded"
          
        />
      </div>
  
      {/* Parent Phone (Optional) */}
      <div className="flex flex-col">
        <label className="mb-1 text-sm font-medium">
        {t('form.parentPhone')}
        </label>
        <input
          type="tel"
          inputMode="numeric"
          value={localData.parentPhone || ''}
          onChange={(e) => {
            // Only allow numbers
            const value = e.target.value.replace(/[^\d]/g, '');
            handleInputChange('parentPhone')({ target: { value } });
          }}
          onBlur={handleInputComplete('parentPhone')}
          className="w-full p-2 border rounded"
          pattern="[0-9]*"
        />
      </div>

      {/* address */}
      <div className="flex flex-col">
        <label className="mb-1 text-sm font-medium">
        {t('form.street')} <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          inputMode="text"
          value={localData.street || ''}
          onChange={handleInputChange('street')}
          onBlur={handleInputComplete('street')}
          className="w-full p-2 border rounded"
          
        /> </div>

        <div className="flex flex-col">
        <label className="mb-1 text-sm font-medium">
        {t('form.city')} <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          inputMode="text"
          value={localData.city || ''}
          onChange={handleInputChange('city')}
          onBlur={handleInputComplete('city')}
          className="w-full p-2 border rounded"
          
        /> </div>

        <div className="flex flex-col">
        <label className="mb-1 text-sm font-medium">
        {t('form.province')} <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          inputMode="text"
          value={localData.province || ''}
          onChange={handleInputChange('province')}
          onBlur={handleInputComplete('province')}
          className="w-full p-2 border rounded"
          
        /> </div>

<div className="flex flex-col">
        <label className="mb-1 text-sm font-medium">
        {t('form.zip')} <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          inputMode="text"
          value={localData.zip || ''}
          onChange={handleInputChange('zip')}
          onBlur={handleInputComplete('zip')}
          className="w-full p-2 border rounded"
          
        /> </div>

      {/* Grade Selection (Optional) */}
      <div className="col-span-2">
        <label className="mb-1 text-sm font-medium block">
        {t('select.student_grade')}
        </label>
        <select
          value={localData.studentGrade || ''}
          onChange={handleInputChange('studentGrade')}
          onBlur={handleInputComplete('studentGrade')}
          className="w-full p-2 border rounded"
        >
          <option value="">{t('select.select_grade')}
          </option>
          {[...Array(10)].map((_, index) => (
            <option key={index + 1} value={index + 1}>
              {t('select.grade')} {index + 1}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

const verifyPayment = async (sessionId) => {
  try {
    const response = await axios.get(`https://freezepix-database-server-c95d4dd2046d.herokuapp.com/api/photo-payment-verification?session_id=${sessionId}`);
    if (response.data.success) {
      setCurrentStep(5); // Move to confirmation step
      setRegistrationConfirmation(true);
    }
  } catch (error) {
    console.error('Payment verification failed:', error);
  }
};


const CheckoutForm = ({ amount, selectedSchool, onSuccess }) => {
  const stripe = useStripe();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const calculateTax = (amount, selectedSchool) => {
    if (selectedSchool?.country === 'CA') {
      const taxRates = {
        'BRITISH COLUMBIA': { GST: 5.0, PST: 7.0 },
        'ALBERTA': { GST: 5.0 },
        'NEW BRUNSWICK': { HST: 15.0 },
        'NEWFOUNDLAND AND LABRADOR': { HST: 15.0 },
        'NORTHWEST TERRITORIES': { GST: 5.0 },
        'NOVA SCOTIA': { HST: 15.0 },
        'NUNAVUT': { GST: 5.0 },
        'PRINCE EDWARD ISLAND': { HST: 15.0 },
        'QUEBEC': { GST: 5.0, QST: 9.975 },
        'SASKATCHEWAN': { GST: 5.0, PST: 6.0 },
        'YUKON': { GST: 5.0 },
        'ONTARIO': { HST: 13.0 }
      };

      const provinceCode = (selectedSchool.location || 'ONTARIO').toUpperCase();
      const selectedTaxRates = taxRates[provinceCode] || { HST: 13.0 };
      
      const taxRate = (selectedTaxRates.GST || 0) + (selectedTaxRates.PST || 0) + 
                     (selectedTaxRates.QST || 0) + (selectedTaxRates.HST || 0);
      
      return parseFloat(((amount * taxRate) / 100).toFixed(2));
    }
    return 0;
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    
    if (!stripe) {
      setError('Stripe has not been initialized');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const currency = selectedSchool?.country === 'CA' ? 'cad' : 'usd';
      const amountInCents = Math.round(amount * 100);
      const taxAmount = calculateTax(amount, selectedSchool);
      const taxAmountInCents = Math.round(taxAmount * 100);

      const response = await axios.post(
        'https://freezepix-database-server-c95d4dd2046d.herokuapp.com/api/photo-registration-checkout',
        {
          amount: amountInCents,
          currency,
          taxAmount: taxAmountInCents,
          selectedSchool
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      const { sessionId } = response.data;
      
      const result = await stripe.redirectToCheckout({
        sessionId
      });

      if (result.error) {
        throw new Error(result.error.message);
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setError(err.message || 'An error occurred during checkout');
    } finally {
      setLoading(false);
    }
  };

  // Calculate display amounts
  const taxAmount = calculateTax(amount, selectedSchool);
  const totalAmount = parseFloat((amount + taxAmount).toFixed(2));
  const currencySymbol = selectedSchool?.country === 'CA' ? 'CAD' : 'USD';

  return (
    <div className="max-w-md mx-auto p-4">
      {error && (
        <div className="text-red-500 mb-4 p-2 bg-red-50 rounded">
          {error}
        </div>
      )}
         {isFormFilled && (
      <button
        onClick={handleCheckout}
        disabled={loading || !stripe}
        className={`w-full py-2 px-4 rounded ${
          loading || !stripe 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-blue-600 hover:bg-blue-700'
        } text-white font-semibold`}
      >
        {loading ? 'Processing...' : `Pay ${currencySymbol} $${totalAmount.toFixed(2)}`}
      </button> ) }
    </div>
  );
};

// Add state for packages and schools
const [packages, setPackages] = useState({
  Standard: {
    name: 'Standard',
    price: 50,
    description: 'digital photo, 1 8x10, 2 5x7, 4 wallets (2.5 x 3.5)'
  }
});

const [schools, setSchools] = useState([]);

// Fetch packages and schools on component mount
useEffect(() => {
  const fetchInitialData = async () => {
    try {
      const packagesResponse = await axios.get('https://freezepix-database-server-c95d4dd2046d.herokuapp.com/packages');
      setPackages(packagesResponse.data);

      const schoolsResponse = await axios.get('https://freezepix-database-server-c95d4dd2046d.herokuapp.com/schools');
      setSchools(schoolsResponse.data);
    } catch (error) {
      console.error('Error fetching initial data:', error);
    }
  };

  fetchInitialData();
}, []);
  

  

  

  // Step navigation handlers
  const nextStep = () => setCurrentStep(prev => prev + 1);
  const previousStep = () => setCurrentStep(prev => prev - 1);

 
  
 
  const handlePaymentMethodChange = (event) => {
    const newPaymentMethod = event.target.value;
    setPaymentMethod(newPaymentMethod);
    setFormData(prevData => ({
      ...prevData,
      paymentMethod: newPaymentMethod
    }));
  };

 



    // School Selection Component
   // Modify the SchoolSelection component props to include setCurrentStep
   const SchoolSelection = ({ setSelectedSchool, setSelectedCountry, setCurrentStep }) => {
    const [schools, setSchools] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedProvince, setSelectedProvince] = useState('all');
    const [schoolsWithEvents, setSchoolsWithEvents] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
  
    useEffect(() => {
      const fetchSchoolsAndEvents = async () => {
        console.log('Starting to fetch schools...');
        setLoading(true);
        setError(null);
        
        try {
          const schoolsResponse = await axios.get(
            'https://freezepix-database-server-c95d4dd2046d.herokuapp.com/schools',
            {
              headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
              }
            }
          );
  
          if (schoolsResponse.data && Array.isArray(schoolsResponse.data)) {
            const schoolsWithEventsData = await Promise.all(
              schoolsResponse.data.map(async (school) => {
                try {
                  const eventsResponse = await axios.get(
                    `https://freezepix-database-server-c95d4dd2046d.herokuapp.com/api/events/${school._id}`
                  );
                  
                  if (eventsResponse.data && eventsResponse.data.length > 0) {
                    return school;
                  }
                  return null;
                } catch (error) {
                  console.error(`Error fetching events for school ${school._id}:`, error);
                  return null;
                }
              })
            );
  
            const validSchools = schoolsWithEventsData.filter(school => school !== null);
            setSchoolsWithEvents(validSchools);
            
            // Initial filtering will be done in the filterSchools function
            setSchools(validSchools);
          } else {
            throw new Error('Invalid data format received from server');
          }
        } catch (err) {
          console.error('Detailed error:', err);
          setError(err.message || 'Failed to load schools');
        } finally {
          setLoading(false);
        }
      };
  
      fetchSchoolsAndEvents();
    }, []);

    // New function to filter schools based on both province and search query
    const filterSchools = () => {
      let filteredSchools = schoolsWithEvents;

      // Filter by province if not 'all'
      if (selectedProvince !== 'all') {
        filteredSchools = filteredSchools.filter(school => 
          school.location === selectedProvince
        );
      }

      // Filter by search query if it exists
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        filteredSchools = filteredSchools.filter(school =>
          school.name.toLowerCase().includes(query)
        );
      }

      return filteredSchools;
    };
  
    const handleProvinceSelect = (province) => {
      setSelectedProvince(province);
    };

    const handleSearchChange = (event) => {
      setSearchQuery(event.target.value);
    };
  
    const handleSchoolSelect = (school) => {
      if (!school) return;
    
      const processedSchool = {
        ...school,
        _id: typeof school._id === 'string' ? school._id : school._id.toString()
      };
    
      console.log('Selected school:', processedSchool);
      setSelectedSchool(processedSchool);
      setFormData(prev => ({
        ...prev,
        schoolId: processedSchool._id
      }));
    
      if (school.country) {
        setSelectedCountry(school.country);
      }
      setCurrentStep(prevStep => prevStep + 1);
    };

    // Get filtered schools based on both province and search
    const filteredSchools = filterSchools();
  
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-800 text-center"></h2>
        
        <div className="space-y-2">
          <div className="text-center">
            <select
              value={selectedProvince}
              onChange={(e) => handleProvinceSelect(e.target.value)}
              className="px-4 py-2 border rounded"
            >
              <option value="all">{t('select.all_provinces')}</option>
              {[...new Set(schoolsWithEvents.map(school => school.location))].map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>
          </div>

          <div className="text-center">
            <input
              type="text"
              placeholder="Search / Recherche "
              value={searchQuery}
              onChange={handleSearchChange}
              className="px-4 py-2 border rounded w-64"
            />
          </div>
        </div>
  
        <div className="space-y-4">
          {loading ? (
            <div className="text-center">Loading schools... Please wait.</div>
          ) : error ? (
            <div className="text-center">
              <div className="text-red-500">Error loading schools: {error}</div>
              <button 
                onClick={() => window.location.reload()} 
                className="mt-2 px-4 py-2 bg-blue-500 text-white rounded"
              >
                Retry
              </button>
            </div>
          ) : filteredSchools.length > 0 ? (
            filteredSchools.map((school) => (
              <div
                key={school._id}
                className={`border rounded-lg p-4 cursor-pointer hover:bg-yellow-50`}
                onClick={() => handleSchoolSelect(school)}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-lg">{school.name}</h3>
                    <p className="text-sm text-gray-600">{school.city} - {school.location}</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-500">{t('confirmation.error')}</div>
          )}
        </div>
      </div>
    );
  };

  const EventSelection = ({ selectedSchool, setSelectedEvent, nextStep, previousStep, language, t, setFormData }) => {
    const { events, eventsLoading, eventsError } = useEvents(selectedSchool);
  
    console.log('Selected school in EventSelection:', selectedSchool);
    console.log('Events:', events);
  
    // Function to format date to English alphabetic format
    const formatDate = (dateString) => {
      const date = new Date(dateString);
      const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      
      const day = date.getDate();
      const month = months[date.getMonth()];
      const year = date.getFullYear();
      
      return `${day} ${month} ${year}`;
    };
  
    const handleEventSelect = (event) => {
      if (!event) return;
  
      const eventId = typeof event._id === 'string' ? event._id : event._id.toString();
      
      setSelectedEvent(event);
      setFormData(prev => ({
        ...prev,
        eventId: eventId
      }));
      nextStep();
    };
  
    if (eventsLoading) {
      return (
        <div className="text-center">
          <Loader className="animate-spin inline-block" />
          <p>Loading events...</p>
        </div>
      );
    }
  
    if (eventsError) {
      return (
        <div className="text-center text-red-500">
          <p>Error loading events: {eventsError}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded"
          >
            Retry
          </button>
        </div>
      );
    }
  
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-800 text-center">
          {t('steps.event')}
        </h2>
        
        <div className="space-y-4">
          {events && events.length > 0 ? (
            events.map((event) => (
              <div
                key={event._id}
                className="border rounded-lg p-4 cursor-pointer hover:bg-blue-50"
                onClick={() => handleEventSelect(event)}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-lg">{event.name}</h3>
                    <p className="text-sm text-gray-600">
                      <Calendar className="inline-block w-4 h-4 mr-2" />
                      {formatDate(event.date)}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-500">
              No events available for this school
            </div>
          )}
        </div>
  
        <div className="flex justify-between mt-6">
          <button
            onClick={previousStep}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            {t('buttons.previous')}
          </button>
        </div>
      </div>
    );
  };
    
  

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

  const tunisianCities = [
    // Major cities and variations
    'tunis', 'tunes', 'tuins',
    'sfax', 'safaqis', 'sfaqis',
    'sousse', 'soussa', 'susah',
    'kairouan', 'kairawan', 'qayrawan',
    'bizerte', 'bizerta',
    'ariana', 'arina',
    'ben arous', 'benarous',
    'gafsa', 'gafsah',
    'monastir', 'monastyr',
    'mahdia', 'mahdiya',
    'kasserine', 'kasserain',
    'gabès', 'gabes', 'qabis',
    'kebili', 'kabili',
    'jendouba', 'jenduba',
    'siliana', 'silianah',
    'béja', 'beja', 'bajah',
    'zaghouan', 'zaghwan',
    'nabeul', 'nabul',
    'médenine', 'medinin',
    'tozeur', 'touzeur',
    'kef', 'elkef',
    'sidi bouzid', 'sidibouzid'
  ];
  
  const calculatePackagePrice = (basePrice) => {
    const school = schools.find(s => s._id === selectedSchool);
    
    if (!school) return basePrice;

    // Check if the school is in Tunisia
    if (selectedSchool.country.toLowerCase() === 'tunisia') {
      const tunisianPrice = (basePrice * 0.5);
      return parseFloat(tunisianPrice.toFixed(2));
    }

    return parseFloat(basePrice.toFixed(2));
  };

  const [loading, setLoading] = useState(false);

  const QRCodeGenerator = ({ registrationData}) => {
    const [qrCodeUrl, setQRCodeUrl] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
  
    const generateQRCode = async () => {
      setLoading(true);
      setError(null);
  
      try {
        const response = await axios.post('https://freezepix-database-server-c95d4dd2046d.herokuapp.com/api/generate-qr-code', {
          registrationId: registrationData.registrationId,
          studentName: `${registrationData.studentFirstName} ${registrationData.studentLastName}`,
          schoolName: selectedSchool.name,
          eventName: selectedEvent.name
        });
  
        setQRCodeUrl(response.data.qrCodeUrl);
      } catch (err) {
        setError('Failed to generate QR Code');
        console.error('QR Code generation error:', err);
      } finally {
        setLoading(false);
      }
    };
  
    useEffect(() => {
      generateQRCode();
    }, []); // Runs only once when the component mounts
  
    return (
      <div>
        {!qrCodeUrl ? (
          <p>Generating QR Code...</p>
        ) : (
          <div>
            <h3>Registration QR Code</h3>
            <img src={qrCodeUrl} alt="QR Code" />
          </div>
        )}
        {error && <p>{error}</p>}
      </div>
    );
  };
  // Confirmation Page Component
  const ConfirmationPage = () => {
    // Get package details based on the selected package
    const selectedPkg = formData.packageSelection ? {
      name: formData.packageName,
      price: formData.packagePrice,
      description: formData.packageDescription
    } : null;    const handleRegisterNewChild = () => {
      // Reset all state to initial values
      setCurrentStep(1);
      setSelectedCountry('');
      setSelectedSchool('');
      setSelectedEvent('');
      setSelectedPackage('');
      setPaymentMethod('credit');
      setRegistrationConfirmation(null);
    };

    const styles = {
      bigBoldText: {
        fontSize: '1.5em',
        fontWeight: 'bold',
      }
    };
  
    return (
      <div className="text-center space-y-6 p-6">
        <CheckCircle className="mx-auto text-green-500 w-16 h-16" />
        <h2 className="text-2xl font-bold text-gray-800">
          {t('tunisia.confirmationTitle')}
        </h2>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <p className="text-green-700 font-semibold">
            {t('tunisia.confirmationMessage')}
          </p>
          
          <div className="mt-4 space-y-2">
            <div>
              <span className="font-bold"> {t('confirmation.register')}:</span>
              <span className="ml-2 bg-green-100 px-2 py-1 rounded text-green-800 font-mono text-center">
                {registrationConfirmation?.registrationId || 'N/A'}
              </span>
            </div>
           {/* <div>
               
              <span className="font-bold">{t('confirmation.qr')}:</span>
              <span className="ml-2 bg-blue-100 px-2 py-1 rounded text-blue-800 font-mono inline-block center-text text-center">
                {registrationConfirmation?.uniqueQRCode || 'N/A'}
              </span>
            </div>
          </div>
  
          {/* QR Code Generation Section 
          <QRCodeGenerator registrationData={registrationConfirmation} />*/}
  
          {/* Existing registration details */}
          <div className="mt-4 text-sm text-gray-600">
  <p className="big-bold-text" style={styles.bigBoldText}>{t('confirmation.student')}: {registrationConfirmation?.studentFirstName} {registrationConfirmation?.studentLastName}</p>
  <p className="big-bold-text" style={styles.bigBoldText}>{t('confirmation.school')}: {selectedSchool?.name}</p>
  <p className="big-bold-text" style={styles.bigBoldText}>{t('confirmation.event')}: {selectedEvent?.name}</p>
</div>
  
        {selectedSchool.country === 'Tunisia' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-700">
            <p className="font-semibold mt-2">{t('tunisia.daycarePayment')}</p>
          </div>
        )}
  
        <div className="flex justify-center space-x-4 mt-6">
          <button
            onClick={handleRegisterNewChild}
            className="px-6 py-3 bg-yellow-500 text-black font-semibold rounded-lg shadow-md hover:bg-yellow-600"
          >
          {t('steps.register')}
          </button>
        </div>
      </div>
      </div>
      </div>
    );
  };

//product details popup
const PackageDetailsPopup = ({ isOpen, onClose, packageDetails, country }) => {
  const [zoomedImage, setZoomedImage] = useState(null);

  if (!isOpen) return null;

  const basicPackageImages = {
    digital: "https://static.vecteezy.com/system/resources/previews/006/697/974/non_2x/mail-email-icon-template-black-color-editable-mail-email-icon-symbol-flat-illustration-for-graphic-and-web-design-free-vector.jpg"
  };

  const standardPackageImages = {
    digital: "https://static.vecteezy.com/system/resources/previews/006/697/974/non_2x/mail-email-icon-template-black-color-editable-mail-email-icon-symbol-flat-illustration-for-graphic-and-web-design-free-vector.jpg",
    print8x10: "https://static.wixstatic.com/media/933430_04efaaf0246146da9b78c68fa64255df~mv2_d_2717_2717_s_4_2.jpg/v1/fill/w_980,h_980,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/933430_04efaaf0246146da9b78c68fa64255df~mv2_d_2717_2717_s_4_2.jpg",
    print5x7: "https://www.nationsphotolab.com/cdn/shop/files/1040w_Metaobject_Photo-Prints_7x10_b383d64f-72af-4152-9e07-d2db46c3eff3.jpg?height=477&v=1712857313",
    wallets: "https://prd-static.sf-cdn.com/resources/images/store/2024/1140x1140/WF-894706_SNAP_US_Prints_Photo_Paper_Update_Wallet_1_1140x1140.jpg"
  };

  const premiumPackageImages = {
    ...standardPackageImages,
    crystal: "https://abcrystalcollection.ca/cdn/shop/files/WhatsAppImage2024-01-25a14.16.21_f9fdd818.jpg?v=1715856911"
  };

  const getPackageImages = () => {
    switch (packageDetails.name) {
      case 'Basic':
        return basicPackageImages;
      case 'Standard':
        return standardPackageImages;
      case 'Premium':
        return premiumPackageImages;
      default:
        return basicPackageImages;
    }
  };

  return (
    <>
      {zoomedImage && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="relative bg-white rounded-lg w-full max-w-xl">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-bold">Image Preview</h2>
              <button
                onClick={() => setZoomedImage(null)}
                className="p-2 hover:bg-gray-200 rounded-full"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-4">
              <img
                src={zoomedImage}
                alt="Preview"
                className="w-full h-auto rounded-lg"
              />
            </div>
          </div>
        </div>
      )}

      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
        <div className="relative bg-white rounded-lg w-full max-w-xl h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white p-4 border-b">
            <h2 className="text-lg font-bold">{packageDetails.name} Package Details</h2>
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 hover:bg-gray-200 rounded-full"
            >
              <X size={24} />
            </button>
          </div>

          <div className="p-4 grid grid-cols-1 gap-4">
            {Object.entries(getPackageImages()).map(([key, src]) => (
              <div key={key} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                <div className="grid grid-cols-2 p-4 items-center">
                  <div>
                    <h3 className="font-semibold capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</h3>
                    <p className="text-sm text-gray-600">
                      {key === 'digital' ? 'High resolution digital photo sent by email' :
                       key === 'crystal' ? '3D engraved crystal with LED base' :
                       `Professional print ${key.includes('print') ? key.replace('print', '') : ''}`}
                    </p>
                  </div>
                  <div className="justify-self-center">
                    <img
                      src={src}
                      alt={key}
                      className="h-32 w-32 object-cover cursor-pointer rounded-lg"
                      onClick={() => setZoomedImage(src)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

// Package Selection Component
const PackageSelection = () => {
  const [showDetails, setShowDetails] = useState(false);
  const [selectedPackageDetails, setSelectedPackageDetails] = useState(null);

  const calculatedPackages = {
    Basic: {
      name: 'Basic',
      price: calculatePackagePrice(20),
      description: 'digital photo'
    },
    Standard: {
      name: 'Standard',
      price: calculatePackagePrice(50),
      description: 'digital photo, 1 8x10, 2 5x7, 4 wallets (2.5 x 3.5)'
    },
    Premium: {
      name: 'Premium',
      price: calculatePackagePrice(100),
      description: 'digital photo, 1 8x10, 2 5x7, 4 wallets (2.5 x 3.5), 1 3D engraved crystal with light 3x2x2'
    }   
  };

  const handlePackageSelect = (packageKey, packageData) => {
    setSelectedPackage(packageKey);
    setFormData(prev => ({
      ...prev,
      packageSelection: packageKey,
      packagePrice: packageData.price,
      packageName: packageData.name,
      packageDescription: packageData.description
    }));
    nextStep();
  };

  const handleDetailsClick = (e, packageData) => {
    e.stopPropagation();
    setSelectedPackageDetails(packageData);
    setShowDetails(true);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold text-gray-800 text-center">
        {t('steps.photo_package')}
      </h2>
      <div className="space-y-4">
        {Object.entries(calculatedPackages).map(([key, pkg]) => (
          <div 
            key={key}
            className={`border rounded-lg p-4 cursor-pointer ${
              selectedPackage === key ? 'border rounded-lg p-4 cursor-pointer hover:bg-blue-50' : 'bg-white'
            }`}
            onClick={() => handlePackageSelect(key, pkg)}
          >
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-lg">{pkg.name}</h3>
                <button
                  onClick={(e) => handleDetailsClick(e, pkg)}
                  className="text-blue-600 hover:text-blue-800 text-sm underline mt-1"
                >
                  Package Details
                </button>
              </div>
              <div className="font-bold text-xl">
                {selectedSchool.country === 'Tunisia' ? 
                  `${(pkg.price / 2).toFixed(2)} TND` : 
                  `$${pkg.price.toFixed(2)}`}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <PackageDetailsPopup
        isOpen={showDetails}
        onClose={() => setShowDetails(false)}
        packageDetails={selectedPackageDetails}
        country={selectedSchool.country}
      />

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

const handleRegistrationSubmit = async (e) => {
  setIsLoading(true);
  const selectedPkg = formData.packageSelection ? {
    name: formData.packageName,
    price: formData.packagePrice,
    description: formData.packageDescription
  } : null;
    console.log('Selected Package:', selectedPkg);
  try {
    // Explicitly override the payment method based on radio selection
    const registrationData = {
      parentFirstName: formData.parentFirstName,
      parentLastName: formData.parentLastName,
      parentEmail: formData.parentEmail,
      studentFirstName: formData.studentFirstName,
      studentLastName: formData.studentLastName,
      parentPhone: formData.parentPhone,
      street: formData.street,
      city: formData.city,
      province: formData.province,
      zip: formData.zip,
      studentGrade: formData.studentGrade,
      schoolId: selectedSchool._id 
        ? (typeof selectedSchool._id === 'string' 
            ? selectedSchool._id 
            : selectedSchool._id.toString())
        : '',
      eventId: selectedEvent._id
        ? (typeof selectedEvent._id === 'string' 
            ? selectedEvent._id 
            : selectedEvent._id.toString())
        : '',
      // Force payment method based on radio selection
      paymentMethod: selectedSchool.country === 'Tunisia' 
        ? 'daycare' 
        : paymentMethod === 'interac' 
          ? 'interac' 
          : 'credit',
      paymentStatus: paymentMethod === 'interac' 
        ? 'payment_pending' 
        : 'open'
    };

    // Log the data being sent to verify
    console.log('Sending registration data:', registrationData);

    const response = await axios.post(
      'https://freezepix-database-server-c95d4dd2046d.herokuapp.com/api/register',
      registrationData,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    setRegistrationConfirmation({
      ...response.data,
      registrationId: response.data.registrationId
    });
    setCurrentStep(currentStep + 1);
    window.removeHelcimPayIframe(); // Assuming this function exists
  } catch (error) {
    console.error('Registration error details:', {
      message: error.message,
      response: error.response?.data,
      fullError: error
    });
    
  } finally {
    setIsLoading(false);
  }
};


  // Registration Form Component
  const RegistrationForm = () => {
    

   
    const selectedPkg = formData.packageSelection ? {
      name: formData.packageName,
      price: formData.packagePrice,
      description: formData.packageDescription
    } : null;    // Define selectedPkg based on selectedPackage

      // Add tax calculation function
      const TAX_RATES = {
        'TUNISIA': { TND: 0.19 },
        'CA': {
          'BRITISH COLUMBIA': { GST: 5.0, PST: 7.0 },
          'ALBERTA': { GST: 5.0 },
          'NEW BRUNSWICK': { HST: 15.0 },
          'NEWFOUNDLAND AND LABRADOR': { HST: 15.0 },
          'NORTHWEST TERRITORIES': { GST: 5.0 },
          'NOVA SCOTIA': { HST: 15.0 },
          'NUNAVUT': { GST: 5.0 },
          'PRINCE EDWARD ISLAND': { HST: 15.0 },
          'QUEBEC': { GST: 5.0, QST: 9.975 },
          'SASKATCHEWAN': { GST: 5.0, PST: 6.0 },
          'YUKON': { GST: 5.0 },
          'ONTARIO': { HST: 13.0 }
        }
      };
      
    const calculateTotal = () => {
  if (!selectedSchool?.country || !selectedPkg) return { subtotal: 0, total: 0 };

  const country = selectedSchool.country.toUpperCase();
  const taxRates = TAX_RATES[country];

  // Calculate subtotal based on the selected package price
  let subtotal = selectedPkg.price;

  // Apply discount if available
  let discountAmount = 0;
  if (appliedDiscount && appliedDiscount.valueType === 'percentage') {
    discountAmount = (subtotal * appliedDiscount.value) / 100;
    subtotal -= discountAmount;
  }

  let taxes = { totalAmount: 0, taxDetails: {} }; // Initialize taxes

  if (country === 'CA' && selectedSchool.location && taxRates) {
    const province = selectedSchool.location.toUpperCase();
    const provinceTaxRates = taxRates[province];

    if (provinceTaxRates) {
      taxes = calculateTaxes(subtotal, provinceTaxRates); // Calculate taxes
    }
  } else if (country === 'TUNISIA' && taxRates) {
    const tunisiaTaxRate = taxRates.TND;
    const discountedSubtotal = subtotal; // Use the subtotal after discount

    return {
      originalSubtotal: selectedPkg.price,
      discountAmount,
      subtotal: discountedSubtotal,
      total: discountedSubtotal * (1 + tunisiaTaxRate) // Apply tax on the discounted subtotal
    };
  }

  return {
  originalSubtotal: selectedPkg.price,
  discountAmount,
  subtotal,
  tax: taxes.totalAmount,
  taxDetails: taxes.taxDetails,  // Add this line
  total: subtotal + taxes.totalAmount
};
};
      
      const calculateTaxes = (basePrice, taxRates) => {
        let totalTax = 0;
        const taxDetails = {};
      
        if (taxRates.HST) {
          const hst = (basePrice * taxRates.HST) / 100;
          totalTax += hst;
          taxDetails.HST = { rate: taxRates.HST, amount: hst };
        } else {
          if (taxRates.GST) {
            const gst = (basePrice * taxRates.GST) / 100;
            totalTax += gst;
            taxDetails.GST = { rate: taxRates.GST, amount: gst };
          }
          if (taxRates.PST) {
            const pst = (basePrice * taxRates.PST) / 100;
            totalTax += pst;
            taxDetails.PST = { rate: taxRates.PST, amount: pst };
          }
          if (taxRates.QST) {
            const gstAmount = basePrice * taxRates.GST / 100;
            const qst = ((basePrice + gstAmount) * taxRates.QST) / 100;
            totalTax += qst;
            taxDetails.QST = { rate: taxRates.QST, amount: qst };
          }
        }
      
        return { totalAmount: totalTax, taxDetails };
      };

    const priceDetails = calculateTotal();
// Check if the form is filled whenever formData changes
useEffect(() => {
  // Check if the address form is filled
  if (formData.parentFirstName && formData.parentLastName && formData.studentFirstName && formData.studentLastName && formData.parentEmail && formData.street && formData.city && formData.province && formData.zip) {
    setIsFormFilled(true);
  } else {
    setIsFormFilled(false);
  }
}, [formData]);
    return (
      <div className="space-y-4">
    {/* Package Summary */}
    {/* Package Summary */}
    {selectedPkg && (
        <div className="bg-gray-100 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-semibold">{selectedPkg.name}</h3>
              <p className="text-sm text-gray-600">{selectedPkg.description}</p>
            </div>
            <div className="font-bold text-xl text-green-600">
              {selectedSchool.country === 'Tunisia' ? 
                `${(selectedPkg.price / 2).toFixed(2)} TND` : 
                `$${selectedPkg.price.toFixed(2)}`}
            </div>
          </div>
        </div>
      )}

        <form onSubmit={handleRegistrationSubmit} className="space-y-4">
        <AddressForm
  type="registration"
  data={formData}
  onChange={(newData) => setFormData(prevData => ({
    ...prevData,
    ...newData
  }))}
/>
          

          {/* Payment Method Selection */}
          <div className="space-y-4">
        <div className="p-4 bg-gray-50 rounded-lg">
          {selectedSchool.country !== 'Tunisia' && (
            <div className="mb-4">
              <h4 className="font-medium">{t('canada.select')}</h4>
              
              <label className="block">
                <input
                  type="radio"
                  value="credit"
                  checked={paymentMethod === 'credit'}
                  onChange={handlePaymentMethodChange}
                  defaultChecked // Add this line to set the radio button as checked by default
                  className="mr-2"
                />
                {t('canada.credit')}
              </label>
            </div>
          )}

           {/* Order Summary  */}
           <div className="bg-white rounded-lg p-4 shadow-sm border">
    <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
    {/* Discount Code Input */}
  <div className="mb-4">
    <div className="flex space-x-2">
     <input
  type="text"
  placeholder="Enter discount code"
  value={discountCode}
  onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
  className="flex-1 p-2 border rounded"
/>
      <button
        onClick={() => validateDiscountCode(discountCode)}
        className="px-4 py-2 bg-yellow-500 text-black rounded hover:bg-yellow-600"
      >
        Apply
      </button>
    </div>
    {discountError && (
      <p className="text-red-500 text-sm mt-1">{discountError}</p>
    )}
  </div>

  <div className="space-y-2">
    
    {priceDetails.discountAmount > 0 && (
      <div className="flex justify-between text-green-600">
        <span>Discount:</span>
        <span>
        -{priceDetails.discountAmount.toFixed(2)} {selectedSchool.country === 'Tunisia' ? 'TND' : selectedSchool.country === 'CA' ? 'CAD' : 'USD'}
         </span>
      </div>
    )}
    </div>
    <div className="space-y-2">
        <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>
                {priceDetails.subtotal.toFixed(2)} {selectedSchool.country === 'Tunisia' ? 'TND' : selectedSchool.country === 'CA' ? 'CAD' : 'USD'}
            </span>
        </div>

        {selectedSchool.country === 'Tunisia' && (
            <div className="flex justify-between text-gray-600">
                <span>TVA (19%):</span>
                <span>{(priceDetails.subtotal * 0.19).toFixed(2)} TND</span>
            </div>
        )}

{priceDetails.taxDetails &&
  Object.entries(priceDetails.taxDetails).map(([key, value]) => (
    <div key={key} className="flex justify-between text-gray-600">
      <span>{key} ({value.rate}%):</span>
      <span>
        {selectedSchool.country !== 'Tunisia' ? `$${value.amount.toFixed(2)}` : ''}
      </span>
    </div>
  ))
}

        <div className="border-t pt-2 mt-2">
            <div className="flex justify-between font-bold">
                <span>Total:</span>
                <span>
                    {priceDetails.total.toFixed(2)} {selectedSchool.country === 'Tunisia' ? 'TND' : selectedSchool.country === 'CA' ? 'CAD' : 'USD'}
                </span>
            </div>
        </div>
    </div>
</div>

{/* Option de paiement Tunisia */}
{selectedSchool.country === 'Tunisia' && (
  <div className="p-4 bg-yellow-50 rounded-lg">
            <h4 className="font-medium text-yellow-700">
              {t('tunisia.daycarePayment')}
            </h4>
            <p className="text-sm text-yellow-600">
            </p>
          </div>
)
  }
 {selectedSchool.country !== 'Tunisia' && (
            <>
                  {/* Option de paiement Interac */}
                  
      
                  {/* Option de paiement par carte de crédit */}
                  {paymentMethod === 'credit' && isFormFilled && (
  <HelcimPayButton 
    onPaymentSuccess={handleRegistrationSubmit}
    isProcessing={isProcessingOrder}
    selectedCountry={selectedCountry}
    total={priceDetails.total}
    setError={setError}
    setIsProcessingOrder={setIsProcessingOrder}
  />
)}
 </>
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

        {selectedSchool.country === 'Tunisia' && (
           <button 
           type="submit"
           onClick={handleRegistrationSubmit}
           disabled={isLoading}
           className={`w-1/2 px-6 py-3 bg-yellow-500 text-black font-semibold rounded-lg shadow-md hover:bg-yellow-600 ${
             isLoading ? 'opacity-50 cursor-not-allowed' : ''
           }`}
         >
           {isLoading ? (
             <div className="flex items-center justify-center">
               <Loader className="animate-spin h-5 w-5 mr-2" />
               Loading...
             </div>
           ) : (
             `${t('buttons.submit')} (${priceDetails.total.toFixed(2)} TND)`
           )}
         </button>
        )}

{selectedSchool.country !== 'Tunisia' && paymentMethod === 'interac' && (
  <button 
    type="button" // Changed from 'submit' to 'button'
    onClick={(e) => {
      e.preventDefault();
      handleRegistrationSubmit(e);
    }}
    disabled={isLoading}
    className={`w-1/2 px-6 py-3 bg-yellow-500 text-black font-semibold rounded-lg shadow-md hover:bg-yellow-600 ${
      isLoading ? 'opacity-50 cursor-not-allowed' : ''
    }`}
  >
    {isLoading ? (
      <div className="flex items-center justify-center">
        <Loader className="animate-spin h-5 w-5 mr-2" />
        Loading...
      </div>
    ) : (
      `${t('buttons.submit')} ($${priceDetails.total.toFixed(2)})`
    )}
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
            //{ icon: MapPin, text: t('steps.country') },
            { icon: CustomSchoolIcon, text: t('steps.school') },
            { icon: Calendar, text: t('steps.event') },
            { icon: Package, text: t('steps.package') },
            { icon: CheckCircle, text: t('steps.registration') },
            { icon: CalendarCheck2, text: 'Confirmation' }
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
          {currentStep === 1 &&  <SchoolSelection
    t={t}
    setSelectedSchool={setSelectedSchool}
    setSelectedCountry={setSelectedCountry}
    setCurrentStep={setCurrentStep}
    setFormData={setFormData}
  />}
          {currentStep === 2 && <EventSelection
  selectedSchool={selectedSchool}
  setSelectedEvent={setSelectedEvent}
  nextStep={nextStep}
  previousStep={previousStep}
  language={language}
  t={t}
  setFormData={setFormData}
/>}
          {currentStep === 3 && <PackageSelection />}
          {currentStep === 4 && <RegistrationForm 
          selectedSchool={selectedSchool}
          selectedEvent={selectedEvent}
          formData={formData}
          setFormData={setFormData}
          handleRegistrationSubmit={handleRegistrationSubmit}
          />}
          {currentStep === 5 && <ConfirmationPage />}
        </div>
      </div>
    </div>
  );
};

export default memo(FreezePIXRegistration);
