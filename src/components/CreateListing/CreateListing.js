import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../config/firebase';
import { doc, collection, setDoc, serverTimestamp } from 'firebase/firestore';
import './CreateListing.css';

// Composants pour chaque étape
import LocationStep from './steps/LocationStep';
import HousingStep from './steps/HousingStep';
import DetailsStep from './steps/DetailsStep';
import PhotosStep from './steps/PhotosStep';
import ServicesStep from './steps/ServicesStep';
import ContactStep from './steps/ContactStep';

const stepLabels = {
  1: 'Localisation',
  2: 'Logement',
  3: 'Détails',
  4: 'Photos',
  5: 'Services',
  6: 'Contact'
};

const CreateListing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    // Location
    street: '',
    postalCode: '',
    city: '',
    country: '',

    // Housing
    totalRoommates: '',
    bathrooms: '',
    privateArea: '',

    // Details
    propertyType: '',
    totalArea: '',
    rooms: '',
    floor: '',
    furnished: false,
    availableDate: '',
    rent: '',
    title: '',
    description: '',

    // Photos
    photos: [],

    // Services
    services: {
      wifi: false,
      handicapAccess: false,
      kitchenware: false,
      microwave: false,
      laundry: false,
      bikeParking: false,
      linens: false,
      washingMachine: false,
      tv: false,
      doubleBed: false,
      elevator: false,
      parking: false
    },

    // Contact
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    acceptTerms: false
  });

  const validateStep = (step) => {
    setError('');
    switch (step) {
      case 1:
        if (!formData.street || !formData.postalCode || !formData.city || !formData.country) {
          setError('Veuillez remplir tous les champs de localisation');
          return false;
        }
        break;
      case 2:
        if (!formData.totalRoommates || !formData.bathrooms || !formData.privateArea) {
          setError('Veuillez remplir tous les champs concernant le logement');
          return false;
        }
        break;
      case 3:
        if (!formData.propertyType || !formData.totalArea || !formData.rooms || 
            !formData.availableDate || !formData.rent || !formData.title || !formData.description) {
          setError('Veuillez remplir tous les champs obligatoires des détails');
          return false;
        }
        break;
      case 4:
        if (formData.photos.length === 0) {
          setError('Veuillez ajouter au moins une photo');
          return false;
        }
        break;
      case 6:
        if (!formData.contactName || !formData.contactPhone || !formData.contactEmail || !formData.acceptTerms) {
          setError('Veuillez remplir tous les champs de contact et accepter les conditions');
          return false;
        }
        break;
      default:
        return true;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(6)) return;

    try {
      const listingRef = doc(collection(db, 'listings'));
      await setDoc(listingRef, {
        ...formData,
        userId: user.uid,
        createdAt: serverTimestamp(),
        status: 'active'
      });
      navigate('/');
    } catch (error) {
      setError('Erreur lors de la création de l\'annonce: ' + error.message);
    }
  };

  if (!user) {
    return (
      <div className="create-listing-container">
        <h2>Veuillez vous connecter pour déposer une annonce</h2>
        <button onClick={() => navigate('/login')} className="primary-button">
          Se connecter
        </button>
      </div>
    );
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <LocationStep formData={formData} setFormData={setFormData} />;
      case 2:
        return <HousingStep formData={formData} setFormData={setFormData} />;
      case 3:
        return <DetailsStep formData={formData} setFormData={setFormData} />;
      case 4:
        return <PhotosStep formData={formData} setFormData={setFormData} />;
      case 5:
        return <ServicesStep formData={formData} setFormData={setFormData} />;
      case 6:
        return <ContactStep formData={formData} setFormData={setFormData} />;
      default:
        return null;
    }
  };

  return (
    <div className="create-listing-container">
      <div className="steps-indicator">
        {[1, 2, 3, 4, 5, 6].map(step => (
          <div
            key={step}
            className={`step ${currentStep === step ? 'active' : ''} 
                       ${currentStep > step ? 'completed' : ''}`}
          >
            <div className="step-circle">
              {step}
            </div>
            <span className="step-label">{stepLabels[step]}</span>
          </div>
        ))}
      </div>

      {error && <div className="error-message">{error}</div>}

      {renderStep()}

      <div className="navigation-buttons">
        {currentStep > 1 && (
          <button onClick={handlePrevious} className="secondary-button">
            Précédent
          </button>
        )}
        {currentStep < 6 ? (
          <button onClick={handleNext} className="primary-button">
            Suivant
          </button>
        ) : (
          <button onClick={handleSubmit} className="primary-button">
            Publier l'annonce
          </button>
        )}
      </div>
    </div>
  );
};

export default CreateListing;