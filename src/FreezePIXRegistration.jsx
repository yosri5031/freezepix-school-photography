import React,{ memo, useState, useRef, useCallback, useEffect } from 'react';
import { Camera, Package, CheckCircle, Globe, MapPin, Calendar, DollarSign,Loader,CalendarCheck2,PlusCircle,Info,Crown,
   Sparkles,Image,Frame,Wallet,Box ,Download, Key,AlertCircle,Book} from 'lucide-react';
import { useKeyboardFix } from './useKeyboardFix';
import { School as CustomSchoolIcon,X} from 'lucide-react';
import { Dialog } from '@headlessui/react';
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
        paymentMethod: selectedSchool.country === 'Tunisia' ? 'school' : ''
      }));
    }
  }, [selectedSchool]);
  const [language, setLanguage] = useState('en');
  const [registrations, setRegistrations] = useState([]);
  const [filteredRegistrations, setFilteredRegistrations] = useState([]);
  const [isSending, setIsSending] = useState(false);
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
    studentid:'',
    paymentMethod: 'credit',
    schoolId: selectedSchool?._id || '',
    eventId: selectedEvent?._id || '',
    packageSelection: '',
  packagePrice: 0,
  packageName: '',
  packageDescription: ''
  });
  const handleError = (error) => {
    console.error('Operation failed:', error);
    alert(error.response?.data?.error || error.message || 'Operation failed');
  };

  const usePreviousStepHandler = (currentStep, setCurrentStep) => {
    useEffect(() => {
      const handleBackButton = (event) => {
        event.preventDefault();
        previousStep();
      };
  
      const previousStep = () => setCurrentStep(prev => prev - 1);
  
      // Push state when mounting
      window.history.pushState(null, '', window.location.pathname);
  
      // Listen for back button
      window.addEventListener('popstate', handleBackButton);
  
      return () => {
        window.removeEventListener('popstate', handleBackButton);
      };
    }, [setCurrentStep]);
  };

  usePreviousStepHandler(currentStep, setCurrentStep);


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
      noevent: 'No events available for this school',
      registration: 'Complete Registration',
      package : 'Select Package',
      register :'Register Another Child',
      package_details: 'View Package Details',
      confirmation: 'Confirmation'
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
      firstName: 'First Name',
      lastName: 'Last Name',
      studentName: 'Student First Name',
      studentLastName: 'Student Last Name',
      parentEmail: 'Parent Email',
      parentPhone: 'Parent Phone',
      street:'Street',
      city: 'City',
      province: 'Province',
      zip: ' Postal Code',
      studentid: ' Student ID'
      
    },
    canada : {
    options: 'Payment Options for Canada',
    select : 'Payment Method:',
    interac: 'Interac E-Transfer',
    credit: 'Credit Card Payment',
    send: 'Send payment to:',
    placing: 'After completing the registration, complete the Interac E-Transfer to the provided email.',
    credit_c: 'Credit Card Payment',
    message_c : 'Please complete your payment to place the order',
    summary: 'Order Summary',
    subtotal: 'Subtotal',
    shipping: 'Shipping & Handling',
    total: 'Total',
    discount: 'Discount'

  },
  
  checkout: {
    cardNumber: 'Card Number',
  expiryDate: 'Expiry Date', 
  cvc: 'CVC',
  zipCode: ' Postal Code',
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
    paymentNote: 'Prices are in TND ',
    daycarePayment: 'Pay at School',
    confirmationTitle: 'Registration Successful!',
    confirmationMessage: 'Your child is now registered.'
  },
  packages: {
    title: 'Select Your Package',
    package_details: 'Package Details',
    image_preview: 'Image Preview',
    quantity: 'Quantity',
    tooltips: {
      digital: "High-resolution digital copy of your photo delivered via email",
      prints: "Professional quality printed photos",
      wallet: "Wallet-sized printed photos (2.5 x 3.5 inches)",
      keychain: "Durable acrylic keychain with your photo",
      magnet: "High-quality photo magnet for your fridge or any magnetic surface",
      print8x10: "Professional 8x10 inch printed photo",
      print5x7: "Professional 5x7 inch printed photo",
      crystal: "Elegant crystal photo with LED base",
      image_preview: "Image Preview"
    },

    basic: {
      name: 'Green',
      price: 'Starting at $',
      features: {
        digital: 'Digital Photos'
      }
    },
    standard: {
      name: 'Popular',
      price: 'Starting at $',
      features: {
        digital: 'Digital Photos',
        print8x10: '3 8x10 Print',
        print5x7: '3 5x7 Prints',
        wallet: '3 4x6 Prints',
        wallets: '4 Photo wallets',
        prints: '3 Photos 15x22 cm',
        prints10: '3 Photos 10x15 cm'
      }
    },
    premium: {
      name: 'Best Value',
      price: 'Starting at $',
      features: {
        digital: 'Digital Photos',
        print8x10: '3 8x10 Print',
        print5x7: '3 5x7 Prints',
        wallet: '3 4x6 Prints',
        wallets: '4 Photo wallets',
        crystal: '1 3D Crystal',
        keychain: 'Keychain',
        magnet: 'Magnet',
        prints: '3 Photos 15x22 cm',
        prints10: '3 Photos 10x15 cm'

      }
    },
    details: 'View Package Details',
    tooltips: {
      digital: 'High resolution digital photos',
      print8x10: 'Professional quality prints',
      print5x7: 'Professional quality prints',
      wallet: 'Professional quality prints',
      crystal: '3D engraved crystal with LED base (3x2x2)'
    },
    viewDetails: 'View Details',
    previous: 'Previous'
  }
  },
  fr: {
    // French translations remain the same as in the original code
    select: { grade:'Classe', select_grade:'Sélectionner Classe', student_grade: 'Classe d\'élève', all_provinces: 'Tous les provinces' },
    form: {
      firstName: 'Prénom ',
      lastName: 'Nom',
      studentName: 'Prénom de d\'élève',
      studentLastName: 'Nom de famille de d\'élève',
      parentEmail: 'Email du parent',
    parentPhone: 'Téléphone des parents',
    street:'Adresse',
      city: 'Ville',
      province: 'Province',
      zip: 'Code postal',
      studentid: ' ID étudiant'

  },
    steps: {
      country: 'Sélectionner le Pays',
      school: 'Choisir l\'école',
      photo_package: 'Sélectionnez votre package',
      event: 'Choisir l\'événement Photo',
      noevent: 'Aucun événement disponible pour cette école.',
      registration: 'Compléter l\'inscription',
      package : 'Sélectionner un offre',
      register :'Enregistrer un autre enfant',
      package_details: 'Afficher les détails du package',
      confirmation: 'Confirmation'
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
      options: 'Options de paiement ',
      select : 'Mode de paiement :',
      interac: 'Virement Interac',
      credit: 'Paiement par carte de crédit',
      send: 'Envoyer le paiement à :',
      placing: 'Après avoir terminé l\'inscription, veuillez compléter le virement Interac à l\'adresse e-mail fournie.',
      credit_c: 'Paiement par carte de crédit',
      message_c : 'Veuillez effectuer votre paiement pour passer la commande',
      summary: 'Récapitulatif de la commande',
    subtotal: 'Sous-total',
    shipping: 'Expédition et manutention',
    total: 'Total',
        discount: 'Remise'

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
  paymentNote: 'Les prix sont en TND ',
  daycarePayment: 'Payer à l\'école',
  confirmationTitle: 'Inscription Réussie !',
  confirmationMessage: 'Votre enfant est maintenant inscrit.'
},
packages: {
  title: 'Sélectionnez Votre Forfait',
  package_details: 'Détails du package',
    image_preview: 'Aperçu de l\'image',
    quantity: 'Quantité',
    tooltips: {
      digital: "Copie numérique haute résolution de votre photo envoyée par email",
      prints: "Photos imprimées de qualité professionnelle",
      wallet: "Photos imprimées de qualité professionnelle",
      keychain: "Porte-clés en acrylique durable avec votre photo",
      magnet: "Aimant photo de haute qualité pour votre réfrigérateur ou toute surface magnétique",
      print8x10: "Photo imprimée professionnelle 20,32 x 25,4 cm",
      print5x7: "Photo imprimée professionnelle 12,7 x 17,78 cm",
      crystal: "Photo en cristal élégante avec base LED",
      image_preview: "Aperçu de l'image"
    },
  basic: {
    name: 'Verte',
    price: 'À partir de $',
    features: {
      digital: 'Photos Numériques '
    }
  },
  standard: {
    name: 'Populaire',
    price: 'À partir de $',
    features: {
      digital: 'Photos Numériques ',
      print8x10: '3 Photos 8x10',
      print5x7: '3 Photos 5x7',
      wallet: '3 Photos 4x6',
      prints: "3 Photos 15x22 cm",
      prints10: "3 Photos 10x15 cm",
      wallets:  '4 Photo wallets',
    }
  },
  premium: {
    name: 'Meilleure',
    price: 'À partir de $',
    features: {
      digital: 'Photos Numériques illimitées',
      print8x10: '3 Photos 8x10',
      print5x7: '3 Photos 5x7',
      prints: "3 Photos 15x22 cm",
      prints10: "3 Photos 10x15 cm",
      wallet: '3 Photos 4x6',
      crystal: '1 Cristal 3D',
      keychain: 'Porte-clés',
        magnet: 'Aimant',
        wallets:  '4 Photo wallets',

    }
  },
  details: 'Voir les détails du forfait',
  tooltips: {
    digital: 'Photos numériques haute résolution',
    print8x10: 'Tirage professionnel',
    print5x7: 'Tirages professionnels',
    wallet: 'Tirages professionnels',
    crystal: 'Cristal gravé en 3D avec base LED (3x2x2)'
  },
  viewDetails: 'Voir Détails',
  previous: 'Précédent'
}
},
ar: {
  select: {
    grade: 'الصف',
    select_grade: 'اختر الصف',
    student_grade: 'صف الطالب',
    all_provinces: 'كل المناطق'
  },
  buttons: {
    next: 'التالي',
    previous: 'السابق',
    register: 'تسجيل طفلي',
    submit: 'إكمال التسجيل'
  },
    confirmation: {
      register: 'رقم التسجيل',
      qr: 'رمز QR الفريد',
      student: 'الطالب',
      school: 'المدرسة',
      event: 'الحدث',
      error: 'لم يتم العثور على مدارس تطابق معاييرك'
    },
  canada: {
    options: 'خيارات الدفع لكندا',
    select: 'طريقة الدفع:',
    interac: 'التحويل الإلكتروني Interac',
    credit: 'الدفع بالبطاقة الائتمانية',
    send: 'أرسل الدفعة إلى:',
    placing: 'بعد إكمال التسجيل، قم بإتمام التحويل الإلكتروني Interac إلى البريد الإلكتروني المقدم.',
    credit_c: 'الدفع بالبطاقة الائتمانية',
    message_c: 'يرجى إكمال عملية الدفع لتأكيد الطلب',
    summary: 'ملخص الطلب',
    subtotal: 'المجموع الفرعي',
    shipping: 'الشحن والتوصيل',
    total: 'المجموع الكلي',
    discount: 'الخصم'
  },
  steps: {
    country: 'اختر البلد',
    school: 'اختر المدرسة',
    photo_package: 'اختر باقة الصور',
    event: 'اختر موعد التصوير',
    noevent: 'لا توجد مواعيد متاحة لهذه المدرسة',
    registration: 'أكمل التسجيل',
    package: 'اختر الباقة',
    register: 'تسجيل طفل آخر',
    package_details: 'تفاصيل الباقة',
    confirmation: 'تأكيد'
  },
  form: {
    firstName: 'الاسم',
    lastName: 'اللقب',
    studentName: 'اسم الطالب الأول',
    studentLastName: 'اسم عائلة الطالب',
    parentEmail: 'البريد الإلكتروني للوالد',
    parentPhone: 'هاتف الوالد',
    street: 'الشارع',
    city: 'المدينة',
    province: 'المنطقة',
    zip: 'الرمز البريدي',
    studentid: ' معرف الطالب'
  },
  packages: {
    title: 'اختر باقتك',
    package_details: 'تفاصيل الباقة',
    image_preview: 'معاينة الصورة',
    quantity: 'الكمية',
    tooltips: {
      digital: 'نسخة رقمية عالية الدقة من صورتك تُرسل عبر البريد الإلكتروني',
      prints: 'صور مطبوعة بجودة احترافية',
      wallet: 'صور مطبوعة بجودة احترافية',
      keychain: 'مفتاح سلسلة من الأكريليك المتين مع صورتك',
      magnet: 'مغناطيس صورة عالي الجودة لثلاجتك أو لأي سطح مغناطيسي',
      print8x10: 'صور مطبوعة احترافية 20.32 × 25.4 سم',
      print5x7: 'صور مطبوعة احترافية 12.7 × 17.78 سم',
      crystal: 'صورة كريستالية أنيقة مع قاعدة LED',
      image_preview: 'معاينة الصورة'
    },
    basic: {
      name: 'الباقة الأساسية',
      price: 'السعر: 10 دينار',
      features: {
        digital: 'صور رقمية'
      }
    },
    standard: {
      name: 'الباقة القياسية',
      price: 'السعر: 20 دينار',
      features: {
        digital: 'صور رقمية',
        print8x10: '3 Photos 8x10',
        print5x7: '3 Photos 5x7',
        wallet: '3 Photos 4x6',
        prints: "3 صور 15x22 سم",
        prints10: "3 صور 10x15 سم",
        wallets: '4 صور بحجم المحفظة',
      }
    },
    premium: {
      name: 'الباقة المميزة',
      price: 'السعر: 30 دينار',
      features: {
        digital: 'صور رقمية',
        wallet: '3 Photos 4x6',
        prints: "3 صور 15x22 سم",
        prints10: "3 صور 10x15 سم",
        keychain: 'حاملة مفاتيح',
        magnet: 'مغناطيس',
        print8x10: '3 Photos 8x10',
        print5x7: '3 Photos 5x7',
        crystal: '1 Cristal 3D',
        wallets: '4 صور بحجم المحفظة',


      }
    }
  },
  tunisia: {
    paymentNote: 'الدفع عتد الاستلام',
    daycarePayment: 'الدفع عتد الاستلام',
    confirmationTitle: 'تم التسجيل بنجاح!',
    confirmationMessage: 'تم تسجيل طفلك بنجاح.'
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

const AddressForm = ({ type, data, onChange, selectedSchool }) => {
  const isUniversity = selectedSchool?.name?.toLowerCase().includes('university');
  const isBasicPackage = 
    data.packageName.toLowerCase() === 'basic' || 
    data.packageName.toLowerCase() === 'green' ||
    data.packageName.toLowerCase() === 'vert' || 
    data.packageName.toLowerCase() === 'baique' ||  
    data.packageName.toLowerCase() === 'school picture' || 
    data.packageName.toLowerCase() === 'digital package';

  // For university students, set parent fields to empty strings by default
  useEffect(() => {
    if (isUniversity) {
      onChange({
        ...data,
        parentFirstName: '',
        parentLastName: '',
        parentPhone: '',
        parentEmail: data.parentEmail || '' // Keep email if exists
      });
    }
  }, [isUniversity]);

  const [localData, setLocalData] = useState({
    parentFirstName: isUniversity ? '' : (data.parentFirstName || ''),
    parentLastName: isUniversity ? '' : (data.parentLastName || ''),
    parentEmail: data.parentEmail || '',
    parentPhone: isUniversity ? '' : (data.parentPhone || ''),
    studentFirstName: data.studentFirstName || '',
    studentLastName: data.studentLastName || '',
    studentGrade: data.studentGrade || '',
    street: data.street || '',
    city: data.city || '',
    province: data.province || '',
    zip: data.zip || '',
    studentid: data.studentid || ''
  });

  const handleInputChange = (field) => (e) => {
    const newValue = e.target.value;
    setLocalData(prevData => ({
      ...prevData,
      [field]: newValue
    }));
  };
  
  const handleInputComplete = (field) => () => {
    if (localData[field] && localData[field].trim() !== '') {
      onChange({
        ...data,
        [field]: localData[field]
      });
    }
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Student Information - Always show */}
      <div className="flex flex-col">
        <label className="mb-1 text-sm font-medium">
        {t('form.firstName')} <span className="text-red-500">*</span>
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

      <div className="flex flex-col">
        <label className="mb-1 text-sm font-medium">
        {t('form.lastName')} <span className="text-red-500">*</span>
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

      {/* Email - Always show */}
      <div className="flex flex-col col-span-2">
        <label className="mb-1 text-sm font-medium">
          Email <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          inputMode="email"
          value={localData.parentEmail || ''}
          onChange={handleInputChange('parentEmail')}
          onBlur={handleInputComplete('parentEmail')}
          className="w-full p-2 border rounded"
        />
      </div>

      <div className="flex flex-col col-span-2">
            <label className="mb-1 text-sm font-medium">
              {t('form.studentid')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              inputMode="text"
              value={localData.studentid || ''}
              onChange={handleInputChange('studentid')}
              onBlur={handleInputComplete('studentid')}
              className="w-full p-2 border rounded"
            />
          </div>

      {/* Address Fields - Only show if not Basic package */}
      {!isBasicPackage && (
        <>
          <div className="flex flex-col col-span-2">
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
            />
          </div>

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
            />
          </div>

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
            />
          </div>

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
            />
          </div>

         
        </>
      )}

      {/* Grade Selection (Optional) */}
      <div className="col-span-2 hidden">
        <label className="mb-1 text-sm font-medium block">
          {t('select.student_grade')}
        </label>
        <select
          value={localData.studentGrade || ''}
          onChange={handleInputChange('studentGrade')}
          onBlur={handleInputComplete('studentGrade')}
          className="w-full p-2 border rounded"
        >
          <option value="">{t('select.select_grade')}</option>
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
   const SchoolSelection = ({ setSelectedSchool, setSelectedCountry, setCurrentStep, setFormData, t }) => {
    const [schools, setSchools] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedProvince, setSelectedProvince] = useState('all');
    const [schoolsWithEvents, setSchoolsWithEvents] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newSchool, setNewSchool] = useState({
      name: '',
      location: '',
      city: '',
      phone: '',
      email: '',
      responsable: '',
      country: ''
    });
  
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
  
    const filterSchools = () => {
      let filteredSchools = schoolsWithEvents;
  
      if (selectedProvince !== 'all') {
        filteredSchools = filteredSchools.filter(school => 
          school.location === selectedProvince
        );
      }
  
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        filteredSchools = filteredSchools.filter(school =>
          school.name.toLowerCase().includes(query) ||
          school.country?.toLowerCase().includes(query) ||
          school.location?.toLowerCase().includes(query)
        );
      }
  
      return filteredSchools;
    };
  
    const groupSchoolsByCountry = (schools) => {
      return schools.reduce((acc, school) => {
        const country = school.country || 'Other';
        if (!acc[country]) {
          acc[country] = [];
        }
        acc[country].push(school);
        return acc;
      }, {});
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
  
    const handleAddSchool = async (e) => {
      e.preventDefault();
      try {
        const response = await axios.post(
          'https://freezepix-database-server-c95d4dd2046d.herokuapp.com/api/schools',
          newSchool,
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
        
        if (response.data.success) {
          setSchoolsWithEvents(prevSchools => [...prevSchools, response.data.data]);
          setIsModalOpen(false);
          setNewSchool({ name: '', location: '', city: '', country: '', email: '', phone: '', responsable: ''});
          alert('School added successfully!');
        }
      } catch (error) {
        console.error('Error adding school:', error);
        alert('Failed to add school. Please try again.');
      }
    };
  
    const filteredSchools = filterSchools();
    const groupedSchools = groupSchoolsByCountry(filteredSchools);
    const countries = Object.keys(groupedSchools).sort();
  
    return (
      <div className="container mx-auto px-4">
        {/* Search Input */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search / Rechercher"
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full max-w-md mx-auto block px-4 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
  
        {/* Main Content */}
        <div className="space-y-6">
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-600">Loading schools... Please wait.</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-500 mb-4">Error loading schools: {error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                Retry
              </button>
            </div>
          ) : filteredSchools.length > 0 ? (
            <div className="space-y-8">
              {countries.map(country => (
                <div 
                  key={country} 
                  className="border-t border-gray-200 pt-6 first:border-t-0 first:pt-0"
                >
                  
                  <div className="grid gap-4">
  {groupedSchools[country]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(school => (
      <div
        key={school._id}
        onClick={() => handleSchoolSelect(school)}
        className="border rounded-lg p-4 cursor-pointer hover:bg-yellow-50 transition-colors"
      >
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-semibold text-lg">
              {school.name} - {school.country === 'Tunisia' ? 'TN' : school.country}
            </h3>
            <p className="text-sm text-gray-600">
              {school.location} 
            </p>
          </div>
        </div>
      </div>
    ))}
</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">{t('confirmation.error')}</p>
            </div>
          )}
        </div>
  
        {/* Dialog component remains unchanged */}
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
                        {t('steps.noevent')}

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
        
          <option value="ar">العربية</option>
       
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
const PackageDetailsPopup = ({ isOpen, onClose, packageDetails, selectedSchool, t }) => {
  const [zoomedImage, setZoomedImage] = useState(null);

  if (!isOpen) return null;

    // Add check for daycare/garderie
    const isDaycare = selectedSchool?.name?.toLowerCase().match(/(daycare|garderie)/);
    const isElementary = selectedSchool?.name?.toLowerCase().includes('elementary');


  // Use package keys instead of translated names
  const PACKAGE_KEYS = {
    BASIC: 'Basic',
    STANDARD: 'Standard',
    PREMIUM: 'Premium',
    SCHOOL_PICTURE: 'School Picture',
    DIGITAL_PACKAGE: 'Digital Package',
    YEARBOOK_PACKAGE: 'Yearbook Package'
  };

  // Helper function to get package key from translated name
  const getPackageKey = (translatedName) => {
    const normalizedName = translatedName.toLowerCase().replace(/\s+/g, '');
    
    // Elementary school specific packages
    if (isElementary) {
      if (normalizedName.includes('schoolpicture')) return PACKAGE_KEYS.SCHOOL_PICTURE;
      if (normalizedName.includes('digitalpackage')) return PACKAGE_KEYS.DIGITAL_PACKAGE;
      if (normalizedName.includes('yearbook')) return PACKAGE_KEYS.YEARBOOK_PACKAGE;
    }
    
    // Regular packages
    if (normalizedName === t('packages.basic.name').toLowerCase().replace(/\s+/g, '')) {
      return PACKAGE_KEYS.BASIC;
    }
    if (normalizedName === t('packages.standard.name').toLowerCase().replace(/\s+/g, '')) {
      return PACKAGE_KEYS.STANDARD;
    }
    if (normalizedName === t('packages.premium.name').toLowerCase().replace(/\s+/g, '')) {
      return PACKAGE_KEYS.PREMIUM;
    }
    return null;
  };

  // Elementary school package images (using the same daycare images temporarily)
  const elementaryPackageImages = {
    [PACKAGE_KEYS.SCHOOL_PICTURE]: {
      digital: {
        src: 'https://www.waldenu.edu/media/4978/seo-1497-bs-at-school-6043408-1200x675',
                quantity: '1 School Photo',
        description: 'Official school photo for administrative use'
      }
    },
    [PACKAGE_KEYS.DIGITAL_PACKAGE]: {
      digital: {
        src: "https://static.vecteezy.com/system/resources/previews/006/697/974/non_2x/mail-email-icon-template-black-color-editable-mail-email-icon-symbol-flat-illustration-for-graphic-and-web-design-free-vector.jpg",
        quantity: '3 Digital Photos',
        description: 'High-resolution digital photos'
      },
      print8x10: {
        src: "https://resources.finalsite.net/images/f_auto,q_auto,t_image_size_6/v1687979780/kleinisdnet/fknsq8xq86u3idmhjk0q/School_ClubsOrganizations_Ehrhardt.png",
        quantity: '3 8x10 Prints',
        description: 'Professional quality prints'
      }
    },
    [PACKAGE_KEYS.YEARBOOK_PACKAGE]: {
      digital: {
        src: "https://static.vecteezy.com/system/resources/previews/006/697/974/non_2x/mail-email-icon-template-black-color-editable-mail-email-icon-symbol-flat-illustration-for-graphic-and-web-design-free-vector.jpg",
        quantity: '3 Digital Photos',
        description: 'High-resolution digital photos'
      },
      yearbook: {
        src: "https://schoolannual.com/wp-content/uploads/2017/12/elementary-school-yearbook-example.jpg",
        quantity: '1 Yearbook',
        description: 'School yearbook inclusion'
      },
      prints: {
        src: "https://resources.finalsite.net/images/f_auto,q_auto,t_image_size_6/v1687979780/kleinisdnet/fknsq8xq86u3idmhjk0q/School_ClubsOrganizations_Ehrhardt.png",
        quantity: '4 Professional Prints',
        description: 'Professional quality prints'
      }
    }
  };

  const daycarePackageImages = {
    [PACKAGE_KEYS.BASIC]: {
      digital: {
        src: "https://static.vecteezy.com/system/resources/previews/006/697/974/non_2x/mail-email-icon-template-black-color-editable-mail-email-icon-symbol-flat-illustration-for-graphic-and-web-design-free-vector.jpg",
        quantity: '3 '+ t('packages.basic.features.digital'),
        description: t('packages.tooltips.digital')
      }
    },
    [PACKAGE_KEYS.STANDARD]: {
      digital: {
        src: "https://static.vecteezy.com/system/resources/previews/006/697/974/non_2x/mail-email-icon-template-black-color-editable-mail-email-icon-symbol-flat-illustration-for-graphic-and-web-design-free-vector.jpg",
        quantity: '3 '+ t('packages.standard.features.digital'),
        description: t('packages.tooltips.digital')
      },
      print8x10: {
        src: "https://media.istockphoto.com/id/505936347/photo/student-painting-in-class.jpg?s=612x612&w=0&k=20&c=kddByhzuPiUKEh0gOqEMMvwgL7CPHsGGcQcPe0lUl7g=",
        quantity: t('packages.standard.features.print8x10'),
        description: t('packages.tooltips.print8x10')
      },
      print5x7: {
        src: "https://freedphoto.com/wp-content/uploads/FRE_Blog_PreK-1536x1024.jpg",
        quantity: t('packages.standard.features.print5x7'),
        description: t('packages.tooltips.print5x7')
      },
      print4x6: {
        src: "https://static.showit.co/1600/NpqN0cvWRuam2CGD1HYh8Q/137591/minneapoliskidspersonalityportraits-february_08_2023001.jpg",
        quantity: t('packages.standard.features.wallet'),
        description: t('packages.tooltips.wallet')
      }
    },
    [PACKAGE_KEYS.PREMIUM]: {
      digital: {
        src: "https://static.vecteezy.com/system/resources/previews/006/697/974/non_2x/mail-email-icon-template-black-color-editable-mail-email-icon-symbol-flat-illustration-for-graphic-and-web-design-free-vector.jpg",
        quantity: '3 '+ t('packages.premium.features.digital'),
        description: t('packages.tooltips.digital')
      },
      print8x10: {
        src: "https://media.istockphoto.com/id/505936347/photo/student-painting-in-class.jpg?s=612x612&w=0&k=20&c=kddByhzuPiUKEh0gOqEMMvwgL7CPHsGGcQcPe0lUl7g=",
        quantity: t('packages.premium.features.print8x10'),
        description: t('packages.tooltips.print8x10')
      },
      print5x7: {
        src: "https://freedphoto.com/wp-content/uploads/FRE_Blog_PreK-1536x1024.jpg",
        quantity: t('packages.premium.features.print5x7'),
        description: t('packages.tooltips.print5x7')
      },
      print4x6: {
        src: "https://static.showit.co/1600/NpqN0cvWRuam2CGD1HYh8Q/137591/minneapoliskidspersonalityportraits-february_08_2023001.jpg",
        quantity: t('packages.premium.features.wallet'),
        description: t('packages.tooltips.wallet')
      },
      crystal: {
        src: "https://abcrystalcollection.ca/cdn/shop/files/WhatsAppImage2024-01-25a14.16.21_f9fdd818.jpg?v=1715856911",
        quantity: t('packages.premium.features.crystal'),
        description: t('packages.tooltips.crystal')
      }
    }
  };
  
  const tunisiaPackageImages = {
    [PACKAGE_KEYS.BASIC]: {
      digital: {
        src: "https://static.vecteezy.com/system/resources/previews/006/697/974/non_2x/mail-email-icon-template-black-color-editable-mail-email-icon-symbol-flat-illustration-for-graphic-and-web-design-free-vector.jpg",
        quantity: '3 '+ t('packages.basic.features.digital'),
        description: t('packages.tooltips.digital')
      }
    },
    [PACKAGE_KEYS.STANDARD]: {
      digital: {
        src: "https://static.vecteezy.com/system/resources/previews/006/697/974/non_2x/mail-email-icon-template-black-color-editable-mail-email-icon-symbol-flat-illustration-for-graphic-and-web-design-free-vector.jpg",
        quantity: '3 '+ t('packages.standard.features.digital'),
        description: t('packages.tooltips.digital')
      },
      prints15x22: {
        src: "https://cdn.shopify.com/s/files/1/0671/1387/7804/files/kwJfOLkNTJagCpe9FRgOdA.jpg?v=1741338692",
        quantity: t('packages.standard.features.prints'),
        description: t('packages.tooltips.prints')
      },
      prints10x15: {
        src: "https://cdn.shopify.com/s/files/1/0671/1387/7804/files/5w4wQpzxSEmf7q2FJJbdjQ.jpg?v=1741338693",
        quantity: t('packages.standard.features.prints10'),
        description: t('packages.tooltips.prints')
      }
    },
    [PACKAGE_KEYS.PREMIUM]: {
      digital: {
        src: "https://static.vecteezy.com/system/resources/previews/006/697/974/non_2x/mail-email-icon-template-black-color-editable-mail-email-icon-symbol-flat-illustration-for-graphic-and-web-design-free-vector.jpg",
        quantity: '3 '+ t('packages.premium.features.digital'),
        description: t('packages.tooltips.digital')
      },
      prints15x22: {
        src: "https://cdn.shopify.com/s/files/1/0671/1387/7804/files/kwJfOLkNTJagCpe9FRgOdA.jpg?v=1741338692",
        quantity: t('packages.standard.features.prints'),
        description: t('packages.tooltips.prints')
      },
      prints10x15: {
        src: "https://cdn.shopify.com/s/files/1/0671/1387/7804/files/5w4wQpzxSEmf7q2FJJbdjQ.jpg?v=1741338693",
        quantity: t('packages.standard.features.prints10'),
        description: t('packages.tooltips.prints')
      },
      keychain: {
        src: "https://cdn.shopify.com/s/files/1/0671/1387/7804/files/keychain_graduation.png?v=1741429487",
        quantity: '1 ' + t('packages.premium.features.keychain'),
        description: t('packages.tooltips.keychain')
      },
      magnet: {
        src: "https://cdn.shopify.com/s/files/1/0671/1387/7804/files/magnet_graduation.png?v=1741429488",
        quantity: '1 ' + t('packages.premium.features.magnet'),
        description: t('packages.tooltips.magnet')
      }
    }
  };

  const basicPackageImages = {
    digital: {
      src: "https://static.vecteezy.com/system/resources/previews/006/697/974/non_2x/mail-email-icon-template-black-color-editable-mail-email-icon-symbol-flat-illustration-for-graphic-and-web-design-free-vector.jpg",
      quantity: '3 '+ t('packages.basic.features.digital'),
      description: t('packages.tooltips.digital')
    }
  };

  const standardPackageImages = {
    digital: {
      src: "https://static.vecteezy.com/system/resources/previews/006/697/974/non_2x/mail-email-icon-template-black-color-editable-mail-email-icon-symbol-flat-illustration-for-graphic-and-web-design-free-vector.jpg",
      quantity: '3 '+ t('packages.standard.features.digital'),
      description: t('packages.tooltips.digital')
    },
    print8x10: {
      src: "https://cdn.shopify.com/s/files/1/0671/1387/7804/files/kwJfOLkNTJagCpe9FRgOdA.jpg?v=1741338692",
      quantity: t('packages.standard.features.print8x10'),
      description: t('packages.tooltips.print8x10')
    },
    print5x7: {
      src: "https://cdn.shopify.com/s/files/1/0671/1387/7804/files/5w4wQpzxSEmf7q2FJJbdjQ.jpg?v=1741338693",
      quantity: t('packages.standard.features.print5x7'),
      description: t('packages.tooltips.print5x7')
    },
    print4x6: {
      src: "https://i.imgur.com/TrUlm5M.jpeg",
      quantity: t('packages.standard.features.wallet'),
      description: t('packages.tooltips.wallet')
    }
  };

  const premiumPackageImages = {
    digital: {
      src: "https://static.vecteezy.com/system/resources/previews/006/697/974/non_2x/mail-email-icon-template-black-color-editable-mail-email-icon-symbol-flat-illustration-for-graphic-and-web-design-free-vector.jpg",
      quantity: '3 '+ t('packages.premium.features.digital'),
      description: t('packages.tooltips.digital')
    },
    print8x10: {
      src: "https://cdn.shopify.com/s/files/1/0671/1387/7804/files/kwJfOLkNTJagCpe9FRgOdA.jpg?v=1741338692",
      quantity: t('packages.premium.features.print8x10'),
      description: t('packages.tooltips.print8x10')
    },
    print5x7: {
      src: "https://cdn.shopify.com/s/files/1/0671/1387/7804/files/5w4wQpzxSEmf7q2FJJbdjQ.jpg?v=1741338693",
      quantity: t('packages.premium.features.print5x7'),
      description: t('packages.tooltips.print5x7')
    },
    print4x6: {
      src: "https://i.imgur.com/TrUlm5M.jpeg",
      quantity: t('packages.premium.features.wallet'),
      description: t('packages.tooltips.wallet')
    },
    crystal: {
      src: "https://abcrystalcollection.ca/cdn/shop/files/WhatsAppImage2024-01-25a14.16.21_f9fdd818.jpg?v=1715856911",
      quantity: t('packages.premium.features.crystal'),
      description: t('packages.tooltips.crystal')
    }
  };

  const getPackageImages = () => {
    if (!packageDetails?.name) {
      return {};
    }

    const packageKey = getPackageKey(packageDetails.name);
    
    if (!packageKey) {
      return {};
    }

    if (isElementary) {
      return elementaryPackageImages[packageKey] || {};
    }

    if (isDaycare) {
      return daycarePackageImages[packageKey] || {};
    }

    if (selectedSchool?.country === 'Tunisia') {
      return tunisiaPackageImages[packageKey] || {};
    }

    switch (packageKey) {
      case PACKAGE_KEYS.BASIC:
        return basicPackageImages;
      case PACKAGE_KEYS.STANDARD:
        return standardPackageImages;
      case PACKAGE_KEYS.PREMIUM:
        return premiumPackageImages;
      default:
        return {};
    }
  };

  const packageImages = getPackageImages();

  return (
    <>
      {zoomedImage && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="relative bg-white rounded-lg w-full max-w-xl">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-bold">{t('packages.image_preview')}</h2>
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
            <h2 className="text-lg font-bold">
              {packageDetails.name} - {t('packages.package_details')}
            </h2>
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 hover:bg-gray-200 rounded-full"
            >
              <X size={24} />
            </button>
          </div>

          <div className="p-4 grid grid-cols-1 gap-4">
            {Object.entries(packageImages).map(([key, item]) => (
              <div key={key} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                <div className="grid grid-cols-2 p-4 items-center">
                  <div>
                    <h3 className="font-semibold capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </h3>
                    <p className="text-sm text-gray-600">{item.description}</p>
                    <p className="text-sm font-medium text-blue-600 mt-1">
                      {t('packages.quantity')}: {item.quantity}
                    </p>
                  </div>
                  <div className="justify-self-center">
                    <img
                      src={item.src}
                      alt={key}
                      className="h-32 w-32 object-cover cursor-pointer rounded-lg"
                      onClick={() => setZoomedImage(item.src)}
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
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [showDetailsPopup, setShowDetailsPopup] = useState(false);
  const [selectedPackageDetails, setSelectedPackageDetails] = useState(null);
  const [yearBookConsent, setYearBookConsent] = useState(false);
  const [showYearBookConsent, setShowYearBookConsent] = useState(false);

  const isElementarySchool = () => {
    return selectedSchool?.type === 'Elementary' || 
           selectedSchool?.name?.toLowerCase().includes('elementary');
  };

  const elementaryPackages = {
    Basic: {
      name: 'School Picture',
      price: 0,
      icon: Camera,
      description: 'Basic school photo package for administrative use',
      features: [
        { 
          icon: Camera, 
          text: 'School picture for school use only',
          tooltip: 'This photo will only be used by the school for administrative purposes'
        }
      ]
    },
    Standard: {
      name: 'Digital Package',
      price: 20,
      icon: Download,
      description: 'Digital photos package with high-resolution images',
      features: [
        { 
          icon: Download, 
          text: 'Digital Photos Package',
          tooltip: 'High-resolution digital photos delivered electronically'
        }
      ]
    },
    Premium: {
      name: 'Yearbook Package',
      price: 50,
      icon: Book,
      description: 'Complete package including digital photos and yearbook',
      features: [
        { 
          icon: Download, 
          text: 'Digital Photos Package',
          tooltip: 'High-resolution digital photos delivered electronically'
        },
        { 
          icon: Book, 
          text: 'School Yearbook',
          tooltip: 'Your child will be included in the school yearbook'
        }
      ]
    }
  };

  const tunisiaPackages = {
    Basic: {
      name: t('packages.basic.name'),
      price: 40,
      icon: Camera,
      description: t('packages.basic.description'),
      features: [
        { icon: Download, text: t('packages.basic.features.digital') }
      ]
    },
    Standard: {
      name: t('packages.standard.name'),
      price: 80,
      icon: Crown,
      description: t('packages.standard.description'),
      features: [
        { icon: Download, text: t('packages.standard.features.digital') },
        { icon: Image, text: t('packages.standard.features.prints') },
        { icon: Image, text: t('packages.standard.features.prints10') }

      ]
    },
    Premium: {
      name: t('packages.premium.name'),
      price: 100,
      icon: Sparkles,
      description: t('packages.premium.description'),
      features: [
        { icon: Download, text: t('packages.premium.features.digital') },
        { icon: Image, text: t('packages.premium.features.prints') },
        { icon: Image, text: t('packages.standard.features.prints10') },
        { icon: Key, text: t('packages.premium.features.keychain') },
        { icon: Image, text: t('packages.premium.features.magnet') }
      ]
    }
  };

  const regularPackages = {
    Basic: {
      name: t('packages.basic.name'),
      price: calculatePackagePrice(40),
      icon: Camera,
      description: t('packages.basic.description'),
      features: [
        { 
          icon: Download, 
          text: t('packages.basic.features.digital'), 
          tooltip: t('packages.tooltips.digital') 
        }
      ]
    },
    Standard: {
      name: t('packages.standard.name'),
      price: calculatePackagePrice(80),
      icon: Crown,
      description: t('packages.standard.description'),
      features: [
        { 
          icon: Download, 
          text: t('packages.standard.features.digital'), 
          tooltip: t('packages.tooltips.digital') 
        },
        { 
          icon: Image, 
          text: t('packages.standard.features.print8x10'), 
          tooltip: t('packages.tooltips.print8x10') 
        },
        { 
          icon: Image, 
          text: t('packages.standard.features.print5x7'), 
          tooltip: t('packages.tooltips.print5x7') 
        },
        { 
          icon: Image, 
          text: t('packages.standard.features.wallet'), 
          tooltip: t('packages.tooltips.wallet') 
        }
      ]
    },
    Premium: {
      name: t('packages.premium.name'),
      price: calculatePackagePrice(120),
      icon: Sparkles,
      description: t('packages.premium.description'),
      features: [
        { 
          icon: Download, 
          text: t('packages.premium.features.digital'), 
          tooltip: t('packages.tooltips.digital') 
        },
        { 
          icon: Image, 
          text: t('packages.premium.features.print8x10'), 
          tooltip: t('packages.tooltips.print8x10') 
        },
        { 
          icon: Image, 
          text: t('packages.premium.features.print5x7'), 
          tooltip: t('packages.tooltips.print5x7') 
        },
        { 
          icon: Image, 
          text: t('packages.standard.features.wallet'), 
          tooltip: t('packages.tooltips.wallet') 
        },
        { 
          icon: Box, 
          text: t('packages.premium.features.crystal'), 
          tooltip: t('packages.tooltips.crystal') 
        }
      ]
    }
  };

  const getPackages = () => {
    if (isElementarySchool()) {
      return elementaryPackages;
    }
    if (selectedSchool?.country === 'Tunisia') {
      return tunisiaPackages;
    }
    return regularPackages;
  };

  const packages = getPackages();

  const handleDetailsClick = (e, packageData) => {
    e.stopPropagation();
    setSelectedPackageDetails(packageData);
    setShowDetailsPopup(true);
  };

  const handlePackageSelect = (packageKey, packageData) => {
    if (isElementarySchool() && packageKey === 'Premium' && !yearBookConsent) {
      setShowYearBookConsent(true);
      return;
    }

    setSelectedPackage(packageKey);
    setFormData(prev => ({
      ...prev,
      packageSelection: packageKey,
      packagePrice: packageData.price,
      packageName: packageData.name,
      packageDescription: packageData.features.map(f => f.text).join(', '),
      yearBookConsent: packageKey === 'Premium' && isElementarySchool() ? yearBookConsent : null
    }));
    nextStep();
  };

  const handleYearBookConsent = (consent) => {
    setYearBookConsent(consent);
    setShowYearBookConsent(false);
    if (consent) {
      handlePackageSelect('Premium', packages.Premium);
    }
  };

  const handleClosePopup = () => {
    setShowDetailsPopup(false);
    setSelectedPackageDetails(null);
  };

  const formatPrice = (price) => {
    if (selectedSchool?.country === 'Tunisia') {
      return `${price} TND`;
    }
    return `$${price.toFixed(2)}`;
  };

  return (
    <>
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-800 text-center">
          {t('steps.package')}
        </h2>
        <div className="space-y-4">
          {Object.entries(packages).map(([key, pkg]) => (
            <div 
              key={key}
              className={`border rounded-lg p-6 cursor-pointer transition-all duration-200 ${
                selectedPackage === key 
                  ? 'border-blue-500 bg-blue-50 shadow-md' 
                  : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50 hover:shadow-md'
              }`}
              onClick={() => handlePackageSelect(key, pkg)}
            >
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${
                      selectedPackage === key 
                        ? 'bg-blue-100' 
                        : 'bg-gray-100'
                    }`}>
                      {React.createElement(pkg.icon, {
                        size: 24,
                        className: selectedPackage === key ? 'text-blue-600' : 'text-gray-600'
                      })}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{pkg.name}</h3>
                      <div className="font-bold text-xl text-yellow-500">
                        {formatPrice(pkg.price)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="grid grid-cols-1 gap-3">
                    {pkg.features.map((feature, index) => (
                      <div 
                        key={index}
                        className="flex items-center space-x-2 group"
                        title={feature.tooltip}
                      >
                        {React.createElement(feature.icon, {
                          size: 16,
                          className: "text-gray-600 group-hover:text-blue-600"
                        })}
                        <span className="text-sm text-gray-600 group-hover:text-blue-600">
                          {feature.text}
                        </span>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={(e) => handleDetailsClick(e, pkg)}
                    className="text-blue-600 hover:text-blue-800 text-sm underline mt-4"
                  >
                    {t('steps.package_details')}
                  </button>
                  {isElementarySchool() && key === 'Premium' && (
                    <div className="mt-3 flex items-start space-x-2 text-amber-600">
                      <AlertCircle size={16} />
                      <span className="text-sm">
                        Requires parent consent for yearbook inclusion
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showDetailsPopup && selectedPackageDetails && (
        <PackageDetailsPopup
          isOpen={showDetailsPopup}
          onClose={handleClosePopup}
          packageDetails={selectedPackageDetails}
          t={t}
          selectedSchool={selectedSchool}
        />
      )}

      {showYearBookConsent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold mb-4">Yearbook Consent Required</h3>
            <p className="text-gray-600 mb-6">
              By selecting this package, you agree to have your child's photo included in the school yearbook, 
              which will be available to other families. Do you consent to this?
            </p>
            <div className="flex space-x-4">
              <button
                onClick={() => handleYearBookConsent(true)}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                I Consent
              </button>
              <button
                onClick={() => handleYearBookConsent(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between space-x-4 mt-6">
        <button 
          onClick={previousStep} 
          className="w-full px-6 py-3 bg-gray-200 text-black font-semibold rounded-lg hover:bg-gray-300 transition-colors duration-200"
        >
          {t('buttons.previous')}
        </button>
      </div>
    </>
  );
};

const fetchRegistrations = async () => {
  try {
    const response = await axios.get('https://freezepix-database-server-c95d4dd2046d.herokuapp.com/api/registrations');
    // Sort registrations by registrationDate in descending order (most recent first)
    const sortedRegistrations = response.data.sort((a, b) => 
      new Date(b.registrationDate) - new Date(a.registrationDate)
    );
    setRegistrations(sortedRegistrations);
    setFilteredRegistrations(sortedRegistrations);
  } catch (error) {
    handleError(error);
  }
};

const sendImagesToParent = async (registration) => {
  setIsSending(true);
  
  try {
    
    const registrationData = {
      registration: {
        _id: registration._id,
        parentEmail: registration.parentEmail,
        parentFirstName: registration.parentFirstName,
        studentFirstName: registration.studentFirstName,
        studentLastName: registration.studentLastName,
        schoolId: registration.schoolId,
        eventId: registration.eventId,
      },
      
    };

    const response = await axios.post(
      `https://freezepix-database-server-c95d4dd2046d.herokuapp.com/api/send-parent/${registration._id}`,
      registrationData,
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    if (response.data.success) {
      await fetchRegistrations();
    } else {
      throw new Error(response.data.message || 'Failed to process images');
    }

  } catch (error) {
    console.error('Error sending photos:', error);
    const errorMessage = error.response?.data?.message || 
                        error.response?.data?.error ||
                        error.message ||
                        'Failed to send photos to parent';
  } finally {
    setIsSending(false);
  }
};

// Add these styles to your CSS
const styles = `
.tooltip-trigger {
  position: relative;
}

.tooltip {
  visibility: hidden;
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background-color: black;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
  z-index: 1000;
}

.tooltip-trigger:hover .tooltip {
  visibility: visible;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-container {
  background-color: white;
  padding: 2rem;
  border-radius: 0.5rem;
  max-width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.modal-close-button {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
}

.modal-close-button:hover {
  color: #000;
}
`;

const handleRegistrationSubmit = async (e) => {
  e.preventDefault();
  
  // Check required fields
  const requiredFields = {
    'First Name': formData.studentFirstName?.trim(),
    'Last Name': formData.studentLastName?.trim(),
    'Email': formData.parentEmail?.trim(),
    'Student ID': formData.studentid?.trim()
  };

  const missingFields = Object.entries(requiredFields)
    .filter(([_, value]) => !value)
    .map(([field]) => field);

  if (missingFields.length > 0) {
    alert(`Please fill in the following required fields:\n${missingFields.join('\n')}`);
    return;
  }

  setIsLoading(true);
  
  try {
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
      studentid: formData.studentid || '',
      studentGrade: formData.studentGrade,
      pkg: formData.packageName,
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
      paymentMethod: selectedSchool.country === 'Tunisia' 
        ? 'school' 
        : paymentMethod === 'interac' 
          ? 'interac' 
          : 'credit',
      paymentStatus: paymentMethod === 'interac' 
        ? 'payment_pending' 
        : 'open'
    };

    const response = await axios.post(
      'https://freezepix-database-server-c95d4dd2046d.herokuapp.com/api/register',
      registrationData,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    // Send confirmation via sendImagesToParent
    await sendImagesToParent({
      _id: response.data.registrationId,
      ...registrationData
    });

    setRegistrationConfirmation({
      ...response.data,
      registrationId: response.data.registrationId
    });

    setCurrentStep(currentStep + 1);
    window.removeHelcimPayIframe();
  } catch (error) {
    console.error('Registration error:', error);
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

  // Add shipping for Standard and Premium packages
  const SHIPPING_COST = 9.99;
  const needsShipping = ['Standard', 'Premium'].includes(selectedPkg.name);
  const shippingCost = needsShipping ? SHIPPING_COST : 0;

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
      // Calculate taxes on subtotal plus shipping
      taxes = calculateTaxes(subtotal + shippingCost, provinceTaxRates);
    }
  } else if (country === 'TUNISIA' && taxRates) {
    const tunisiaTaxRate = taxRates.TND;
    const discountedSubtotal = subtotal;
    const SHIPPING_COST = 8;
    const shippingCost = needsShipping ? SHIPPING_COST : 0;
    return {
      originalSubtotal: selectedPkg.price,
      discountAmount,
      subtotal: discountedSubtotal,
      shippingCost: shippingCost,
      total: (discountedSubtotal + shippingCost) * (1 + tunisiaTaxRate)
    };
  }

  return {
    originalSubtotal: selectedPkg.price,
    discountAmount,
    subtotal,
    shippingCost: shippingCost,
    tax: taxes.totalAmount,
    taxDetails: taxes.taxDetails,
    total: subtotal + shippingCost + taxes.totalAmount
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
// Check if the form is filled whenever formData changes
useEffect(() => {
  const isUniversity = selectedSchool?.name?.toLowerCase().includes('university');
  const isGreenPackage = 
    formData.packageName?.toLowerCase() === 'green' || 
    formData.packageName?.toLowerCase() === 'vert' ||
    formData.packageName?.toLowerCase() === 'basic' ||
    formData.packageName?.toLowerCase() === 'school picture' ||
    formData.packageName?.toLowerCase() === 'digital package';
  
  if (isGreenPackage) {
    // For Green package, only check basic info
    const hasBasicInfo = 
      formData.studentFirstName?.trim() &&
      formData.studentLastName?.trim() &&
      formData.parentEmail?.trim() &&
      formData.studentid?.trim();

    setIsFormFilled(hasBasicInfo);
  } else {
    // For other packages, check all required fields
    const hasRequiredFields = 
      formData.studentFirstName?.trim() &&
      formData.studentLastName?.trim() &&
      formData.parentEmail?.trim();



    // Additional address fields check for non-basic packages
    const hasAddressFields = 
      formData.street?.trim() &&
      formData.city?.trim() &&
      formData.province?.trim() &&
      formData.zip?.trim();

    setIsFormFilled(hasRequiredFields && hasAddressFields);
  }
}, [formData, selectedSchool]);// Include selectedPackage in the dependency array
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
                `${(selectedPkg.price).toFixed(2)} TND` : 
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

              <label className="block mb-4">
      <input
        type="radio"
        value="interac"
        checked={paymentMethod === 'interac'}
        onChange={handlePaymentMethodChange}
        className="mr-2"
      />
      <img
        src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ2Baacu5xmieM5gOoqDhyXilZ4mIsc8tV_Tw&s"
        alt="Interac Logo"
        className="inline-block w-6 h-6 mr-2"
      />
      {t('canada.interac')}
    </label>

            </div>
          )}

           {/* Order Summary  */}
           <div className="bg-white rounded-lg p-4 shadow-sm border">
    <h3 className="text-lg font-semibold mb-4">{t('canada.summary')}</h3>
    {/* Discount Code Input */}
  <div className="mb-4">
    <div className="flex space-x-2">
     {/*<input
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
      </button>*/}
    </div>
    {discountError && (
      <p className="text-red-500 text-sm mt-1">{discountError}</p>
    )}
  </div>

  <div className="space-y-2">
    
    {priceDetails.discountAmount > 0 && (
      <div className="flex justify-between text-green-600">
        <span>{t('canada.discount')}:</span>
        <span>
        -{priceDetails.discountAmount.toFixed(2)} {selectedSchool.country === 'Tunisia' ? 'TND' : selectedSchool.country === 'CA' ? 'CAD' : 'USD'}
         </span>
      </div>
    )}
    </div>
    <div className="space-y-2">
        <div className="flex justify-between">
            <span>{t('canada.subtotal')}:</span>
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
 {/* Add Shipping & Handling line */}
    {priceDetails.shippingCost > 0 && (
      <div className="flex justify-between text-gray-600">
        <span>{t('canada.shipping')}:</span>
        <span>
          {priceDetails.shippingCost.toFixed(2)} {selectedSchool.country === 'Tunisia' ? 'TND' : selectedSchool.country === 'CA' ? 'CAD' : 'USD'}
        </span>
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


 {selectedSchool.country !== 'Tunisia' && (
            <>
                  {/* Option de paiement Interac */}
                   {paymentMethod === 'interac' && (
    <div className="p-4 bg-yellow-50 rounded-lg">
      <h4 className="font-semibold text-yellow-700">{t('canada.send')}</h4>
      <p className="text-sm text-gray-700">
        {t('canada.placing')} <br />
        <b>Email:</b> info@freezepix.com
      </p>
    </div>
  )}
      
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
          className="w-1/2 mt-4 px-6 py-3 bg-gray-200 text-black font-semibold rounded-lg"
        >
          {t('buttons.previous')}
        </button>

{/* Option de paiement Tunisia */}

{selectedSchool?.country === 'Tunisia' && (
  <div className="p-4 bg-yellow-50 rounded-lg">
    <button 
      type="submit"
      onClick={handleRegistrationSubmit}
      disabled={isLoading}
      className={`w-full mt-4 px-6 py-3 bg-yellow-500 text-black font-semibold rounded-lg
        hover:bg-yellow-600 transition-colors duration-200
        ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {isLoading ? (
        <div className="flex items-center justify-center space-x-2">
          <Loader className="animate-spin h-5 w-5" />
          <span>Processing...</span>
        </div>
      ) : (
        t('buttons.submit')
      )}
    </button>
  </div>
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
      `${t('buttons.submit')} `
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
            { icon: CalendarCheck2, text: t('steps.confirmation') }
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
