import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import axios from 'axios';
import './CreateListing.css';

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
  const [isVerified, setIsVerified] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    street: '',
    postalCode: '',
    city: '',
    country: '',
    totalRoommates: '',
    bathrooms: '',
    privateArea: '',
    propertyType: '',
    totalArea: '',
    rooms: '',
    floor: '',
    furnished: false,
    availableDate: '',
    rent: '',
    title: '',
    description: '',
    photos: [],
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
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    acceptTerms: false
  });

    useEffect(() => {
    const checkVerification = async () => {
      if (!user) return;
      
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists() || !userDoc.data().isVerified) {
        navigate('/profile');
      } else {
        setIsVerified(true);
      }
    };

    checkVerification();
  }, [user, navigate]);

  if (!user || !isVerified) {
    return (
      <div className="create-listing-container">
        <h2>Accès non autorisé</h2>
        <p>Votre compte doit être vérifié pour publier une annonce.</p>
        <button onClick={() => navigate('/profile')} className="primary-button">
          Retour au profil
        </button>
      </div>
    );
  }

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

  const uploadPhotosToCloudinary = async (photos) => {
    const uploadedUrls = [];
    const cloudinaryUrl = process.env.REACT_APP_CLOUDINARY_URL;
    const uploadPreset = process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET;
    const cloudinaryApiKey = process.env.REACT_APP_CLOUDINARY_API_KEY;
  
    try {
      for (const photo of photos) {
        const formData = new FormData();
        formData.append('file', photo);
        formData.append('upload_preset', uploadPreset);
        formData.append('api_key', cloudinaryApiKey);
        formData.append('timestamp', Math.floor(Date.now() / 1000));
  
        const response = await axios.post(cloudinaryUrl, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          }
        });
  
        if (response.data && response.data.secure_url) {
          uploadedUrls.push(response.data.secure_url);
        } else {
          throw new Error('Invalid response from Cloudinary');
        }
      }
      return uploadedUrls;
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw new Error('Erreur lors du téléchargement des photos: ' + (error.response?.data?.error?.message || error.message));
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(6)) return;

    try {
      const photoUrls = await uploadPhotosToCloudinary(formData.photos);
      const updatedFormData = { ...formData, photos: photoUrls };

      const response = await axios.post('http://localhost:5000/api/listings', { formData: updatedFormData }, {
        headers: {
          Authorization: `Bearer ${await user.getIdToken()}`
        }
      });

      if (response.data.success) {
        navigate('/my-listings');
      } else {
        setError('Erreur lors de la création de l\'annonce: ' + response.data.error);
      }
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