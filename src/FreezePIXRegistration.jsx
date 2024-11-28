import { memo, useState, useRef, useCallback, useEffect } from 'react';
import { Camera, Package, CheckCircle, Globe, MapPin, Calendar, DollarSign,Loader,CalendarCheck2} from 'lucide-react';
import { School as CustomSchoolIcon } from 'lucide-react';
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
import mongoose from 'mongoose';



const stripePromise = loadStripe('pk_live_51Nefi9KmwKMSxU2Df5F2MRHCcFSbjZRPWRT2KwC6xIZgkmAtVLFbXW2Nu78jbPtI9ta8AaPHPY6WsYsIQEOuOkWK00tLJiKQsQ');


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
        paymentMethod: selectedSchool.country === 'Tunisia' ? 'daycare' : 'interac'
      }));
    }
  }, [selectedSchool]);
  const [language, setLanguage] = useState('en');
  const [selectedPackage, setSelectedPackage] = useState('basic'); // Default to 'basic'
  const [paymentMethod, setPaymentMethod] = useState('credit'); // Default payment method
  const [showIntro, setShowIntro] = useState(true);
  const [registrationConfirmation, setRegistrationConfirmation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    parentFirstName: '',
    parentLastName: '',
    parentEmail: '',
    studentFirstName: '',
    studentLastName: '',
    paymentMethod: 'credit',
    schoolId: selectedSchool?._id || '',
    eventId: selectedEvent?._id || '',
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
// Add state for packages and schools
const [packages, setPackages] = useState({
  basic: {
    name: 'Basic Package',
    price: 19.99,
    description: '1 Digital Photo'
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
      steps: {
        country: 'Sélectionner le Pays',
        school: 'Choisir l\'École',
        event: 'Choisir l\'Événement Photo',
        registration: 'Compléter l\'Inscription'
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

  // Step navigation handlers
  const nextStep = () => setCurrentStep(prev => prev + 1);
  const previousStep = () => setCurrentStep(prev => prev - 1);

 
  
 
  const handlePaymentMethodChange = (event) => {
    setPaymentMethod(event.target.value);
  };

    // School Selection Component
   // Modify the SchoolSelection component props to include setCurrentStep
const SchoolSelection = ({ t = (key) => key, setSelectedSchool, setSelectedCountry, setCurrentStep }) => {
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSchools = async () => {
      console.log('Starting to fetch schools...');
      setLoading(true);
      setError(null);
      
      try {
        const response = await axios.get(
          'https://freezepix-database-server-c95d4dd2046d.herokuapp.com/schools',
          {
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            }
          }
        );
        
        if (response.data && Array.isArray(response.data)) {
          setSchools(response.data);
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

    fetchSchools();
  }, []);

  const handleSchoolSelect = (school) => {
    if (!school) return;
  
    // Simplified school object
    const processedSchool = {
      ...school,
      _id: typeof school._id === 'string' ? school._id : school._id.toString()
    };
  
    console.log('Selected school:', processedSchool); // Debug log
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

  if (loading) {
    return <div className="text-center">Loading schools... Please wait.</div>;
  }

  if (error) {
    return (
      <div className="text-center">
        <div className="text-red-500">Error loading schools: {error}</div>
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
      🏫</h2>
      <div className="space-y-4">
        {Array.isArray(schools) && schools.length > 0 ? (
          schools.map((school) => (
            <div
              key={school._id}
              className={`border rounded-lg p-4 cursor-pointer hover:bg-yellow-50 ${
                selectedSchool === school._id ? 'bg-yellow-100 border-yellow-500' : 'bg-white'
              }`}
              onClick={() => handleSchoolSelect(school)}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-lg">{school.name}</h3>
                  <p className="text-sm text-gray-600">{school.location}</p>
                </div>
              </div>
            </div>
            
          ))
        ) : (
          <div className="text-center text-gray-500">No schools available</div>
        )}
      </div>
    </div>
  );
};
    

const EventSelection = ({ selectedSchool, setSelectedEvent, nextStep, previousStep, language, t, setFormData }) => {
  const { events, eventsLoading, eventsError } = useEvents(selectedSchool);

  console.log('Selected school in EventSelection:', selectedSchool); // Debug log
  console.log('Events:', events); // Debug log

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
                    {new Date(event.date).toLocaleDateString()}
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



  // Confirmation Page Component
  // Confirmation Page Component
  const ConfirmationPage = () => {
    const handleRegisterNewChild = () => {
      // Reset all state to initial values
      setCurrentStep(1);
      setSelectedCountry('');
      setSelectedSchool('');
      setSelectedEvent('');
      setSelectedPackage('');
      setPaymentMethod('credit');
      setRegistrationConfirmation(null);
    };
  
    return (
      <div className="text-center space-y-6 p-6">
        <CheckCircle className="mx-auto text-green-500 w-16 h-16" />
        <h2 className="text-2xl font-bold text-gray-800">
          {t('tunisia.confirmationTitle')}
        </h2>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-700 font-semibold">
            {t('tunisia.confirmationMessage')}
          </p>
          <div className="mt-4 space-y-2">
            <div>
              <span className="font-bold">Registration ID:</span>
              <span className="ml-2 bg-green-100 px-2 py-1 rounded text-green-800 font-mono">
                {registrationConfirmation?.registrationId || 'N/A'}
              </span>
            </div>
            <div>
              <span className="font-bold">Unique QR Code:</span>
              <span className="ml-2 bg-blue-100 px-2 py-1 rounded text-blue-800 font-mono">
                {registrationConfirmation?.uniqueQRCode || 'N/A'}
              </span>
            </div>
          </div>
          
          {/* Additional Registration Details */}
          <div className="mt-4 text-sm text-gray-600">
            <p>Student: {registrationConfirmation?.studentFirstName} {registrationConfirmation?.studentLastName}</p>
            <p>School: {selectedSchool?.name}</p>
            <p>Event: {selectedEvent?.name}</p>
          </div>
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
            Register Another Child
          </button>
        </div>
      </div>
    );
  };


// Package Selection Component
const PackageSelection = () => {
  const calculatedPackages = {
    basic: {
      name: 'basic',
      price: calculatePackagePrice(19.99),
      description: '1 Digital Photo'
    }
  };

  // Determine if the selected school is in a Tunisian city
  const isTunisianLocation = tunisianCities.some(city => 
    translations[language].schools.tunisia.find(
      school => school.value === selectedSchool
    )?.location.toLowerCase().includes(city)
  );

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold text-gray-800 text-center">
        Select Your Photo Package
      </h2>
      <div className="space-y-4">
        {Object.entries(calculatedPackages).map(([key, pkg]) => (
          <div 
            key={key}
            className={`border rounded-lg p-4 cursor-pointer ${
              selectedPackage === key ? 'bg-yellow-100 border-yellow-500' : 'bg-white'
            }`}
            onClick={() => {
              setSelectedPackage(key);
              nextStep();
            }}
          >
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-lg">{pkg.name}</h3>
                <p className="text-sm text-gray-600">{pkg.description}</p>
              </div>
              <div className="font-bold text-xl">
  {selectedSchool.country === 'Tunisia' ? 
     `${(calculatePackagePrice(pkg.price) / 2).toFixed(2)} TND` : 
    `$${pkg.price.toFixed(2)}`}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Previous Button */}
      <div className="flex justify-between space-x-4">
        <button 
          onClick={previousStep} 
          className="w-full px-6 py-3 bg-gray-200 text-black font-semibold rounded-lg"
        >
          {t('buttons.previous')}
        </button>
      </div>

      {/* Optional Price Explanation for Tunisian Locations */}
      {isTunisianLocation && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
          <p className="text-yellow-700 text-sm">
          </p>
        </div>
      )}
    </div>
  );
};

const handleRegistrationSubmit = async (e) => {
  e.preventDefault();
  setIsLoading(true);

  try {
    // Ensure IDs are properly converted to strings
    const registrationData = {
      parentFirstName: formData.parentFirstName,
      parentLastName: formData.parentLastName,
      parentEmail: formData.parentEmail,
      studentFirstName: formData.studentFirstName,
      studentLastName: formData.studentLastName,
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
      paymentMethod: formData.paymentMethod,
      paymentStatus: formData.paymentMethod === 'daycare'
        ? 'awaiting_daycare_payment'
        : formData.paymentMethod === 'interac'
        ? 'awaiting_interac'
        : 'pending'
    };

    // Additional validation before submission
    if (!registrationData.schoolId || !registrationData.eventId) {
      throw new Error('School or Event ID is missing');
    }

    // Log the data being sent with more detailed information
    console.log('Sending registration data:', {
      ...registrationData,
      schoolIdType: typeof registrationData.schoolId,
      eventIdType: typeof registrationData.eventId
    });

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
  } catch (error) {
    console.error('Registration error details:', {
      message: error.message,
      response: error.response?.data,
      fullError: error
    });
    
    // Optional: Show user-friendly error message
    alert('Registration failed. Please check your information and try again.');
  } finally {
    setIsLoading(false);
  }
};


  // Registration Form Component
// Separate component outside the main component
const MemoizedRegistrationInput = React.memo(({ 
  name, 
  value, 
  onChange, 
  placeholder, 
  type = 'text' 
}) => {
  const inputRef = useRef(null);

  useEffect(() => {
    // Ensure input maintains focus
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [value]);

  return (
    <input
      ref={inputRef}
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full p-2 border rounded"
      required
      
      // Mobile optimization attributes
      autoComplete="off"
      autoCorrect="off"
      autoCapitalize={type === 'text' ? 'words' : 'none'}
      spellCheck="false"
      
      // Prevent auto-zoom
      style={{
        fontSize: '16px',
        '@media screen and (max-width: 768px)': {
          fontSize: '16px'
        }
      }}
      
      // Additional focus management
      onFocus={(e) => {
        e.target.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }}
    />
  );
});

const RegistrationForm = () => {
  // Memoized input change handler to prevent unnecessary re-renders
  const handleInputChange = useCallback((field) => (e) => {
    const newValue = e.target.value;
    
    setFormData(prevData => {
      // Only update if value has actually changed
      if (prevData[field] !== newValue) {
        return {
          ...prevData,
          [field]: newValue
        };
      }
      return prevData;
    });
  }, []);

  // Memoize form data to prevent unnecessary re-renders
  const memoizedFormData = useMemo(() => formData, [formData]);

  return (
    <div className="space-y-4">
      <form 
        onSubmit={handleSubmit} 
        className="space-y-4"
        // Prevent form default behavior
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
          }
        }}
      >
        {[
          {
            name: 'parentFirstName',
            placeholder: 'Parent First Name',
            type: 'text'
          },
          {
            name: 'parentLastName',
            placeholder: 'Parent Last Name',
            type: 'text'
          },
          {
            name: 'studentFirstName',
            placeholder: 'Student First Name',
            type: 'text'
          },
          {
            name: 'studentLastName',
            placeholder: 'Student Last Name',
            type: 'text'
          },
          {
            name: 'parentEmail',
            placeholder: 'Parent Email',
            type: 'email'
          }
        ].map((field) => (
          <MemoizedRegistrationInput
            key={field.name}
            name={field.name}
            type={field.type}
            placeholder={field.placeholder}
            value={memoizedFormData[field.name]}
            onChange={handleInputChange(field.name)}
          />
        ))}
      </form>
    </div>
  );
};

// Form Data Initialization with useReducer for more controlled updates
const formReducer = (state, action) => {
  switch (action.type) {
    case 'UPDATE_FIELD':
      return {
        ...state,
        [action.field]: action.value
      };
    case 'RESET':
      return initialFormState;
    default:
      return state;
  }
};

const initialFormState = {
  parentFirstName: '',
  parentLastName: '',
  studentFirstName: '',
  studentLastName: '',
  parentEmail: '',
  paymentMethod: 'credit',
  schoolId: selectedSchool?._id || '',
  eventId: selectedEvent?._id || '',
};

const RegistrationWrapper = () => {
  const [formData, dispatch] = useReducer(formReducer, initialFormState);

  // Optimized dispatch method
  const updateField = useCallback((field) => (value) => {
    dispatch({
      type: 'UPDATE_FIELD',
      field,
      value
    });
  }, []);

  return (
    <RegistrationForm 
      formData={formData}
      updateField={updateField}
    />
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
            { icon: Package, text: 'Select Package' },
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
