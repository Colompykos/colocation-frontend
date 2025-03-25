import React, { useState, useEffect } from 'react';
import { useLoadScript, Autocomplete } from '@react-google-maps/api';

const libraries = ['places'];

const LocationStep = ({ formData, setFormData }) => {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  const [autocomplete, setAutocomplete] = useState(null);
  const [addressInput, setAddressInput] = useState('');
  
  // Initialiser le champ d'adresse pour l'édition avec un seul useEffect
  useEffect(() => {
    // Si les champs d'adresse sont déjà remplis (mode édition)
    if (formData.street && formData.city) {
      const fullAddress = `${formData.street}, ${formData.postalCode} ${formData.city}, ${formData.country}`;
      setAddressInput(fullAddress);
      
      // S'assurer que les coordonnées existent toujours
      if (!formData.coordinates) {
        setFormData(prev => ({
          ...prev,
          coordinates: { lat: 0, lng: 0 } // Coordonnées par défaut
        }));
      }
    }
  }, [formData.street, formData.city, formData.postalCode, formData.country]);

  const handlePlaceChanged = () => {
    if (autocomplete) {
      try {
        const place = autocomplete.getPlace();
        
        if (!place.geometry) {
          console.log('Place sélectionné sans données géométriques');
          return;
        }
        
        const addressComponents = place.address_components;
        
        if (!addressComponents) {
          console.log('Composants d\'adresse manquants');
          return;
        }
    
        const streetNumber = addressComponents.find(component => 
          component.types.includes('street_number'))?.long_name || '';
          
        const street = addressComponents.find(component => 
          component.types.includes('route'))?.long_name || '';
          
        const postalCode = addressComponents.find(component => 
          component.types.includes('postal_code'))?.long_name || '';
          
        const city = addressComponents.find(component => 
          component.types.includes('locality') || 
          component.types.includes('administrative_area_level_2'))?.long_name || '';
          
        const country = addressComponents.find(component => 
          component.types.includes('country'))?.long_name || '';
        
        const fullStreet = streetNumber ? `${streetNumber} ${street}`.trim() : street;
        
        // Ajouter les coordonnées pour faciliter la recherche
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        
        // Mettre à jour tous les champs d'adresse
        setFormData(prev => ({
          ...prev,
          street: fullStreet,
          postalCode,
          city,
          country,
          coordinates: { lat, lng }
        }));
        
        // Mettre à jour l'input d'adresse
        setAddressInput(place.formatted_address);
      } catch (error) {
        console.log("Erreur lors de la sélection d'adresse:", error);
      }
    }
  };

  const handleManualAddressChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  function renderManualAddressFields() {
    return (
      <>
        <div className="form-group">
          <label>Numéro et rue *</label>
          <input
            type="text"
            name="street"
            value={formData.street || ''}
            onChange={handleManualAddressChange}
            placeholder="123 rue Example"
            required
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label>Code postal *</label>
          <input
            type="text"
            name="postalCode"
            value={formData.postalCode || ''}
            onChange={handleManualAddressChange}
            placeholder="75000"
            required
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label>Ville *</label>
          <input
            type="text"
            name="city"
            value={formData.city || ''}
            onChange={handleManualAddressChange}
            placeholder="Nice"
            required
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label>Pays *</label>
          <input
            type="text"
            name="country"
            value={formData.country || ''}
            onChange={handleManualAddressChange}
            placeholder="France"
            required
            className="form-input"
          />
        </div>
      </>
    );
  }

  return (
    <div className="step-container">
      <h2>Localisation</h2>
      <p className="step-description">Entrez l'adresse du bien</p>

      {isLoaded && (
        <div className="form-group">
          <label>Recherche d'adresse</label>
          <Autocomplete
            onLoad={setAutocomplete}
            onPlaceChanged={handlePlaceChanged}
          >
            <input
              type="text"
              placeholder="Recherchez une adresse"
              className="form-input"
              value={addressInput}
              onChange={(e) => setAddressInput(e.target.value)}
            />
          </Autocomplete>
        </div>
      )}

      {renderManualAddressFields()}
    </div>
  );
};

export default LocationStep;