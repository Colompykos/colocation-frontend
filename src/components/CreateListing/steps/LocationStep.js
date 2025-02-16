import React, { useState } from 'react';
import { useLoadScript, Autocomplete } from '@react-google-maps/api';

const libraries = ['places'];

const LocationStep = ({ formData, setFormData }) => {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  const [autocomplete, setAutocomplete] = useState(null);

  const handlePlaceChanged = () => {
    const place = autocomplete.getPlace();
    const addressComponents = place.address_components;
  
    const streetNumber = addressComponents.find(component => component.types.includes('street_number'))?.long_name || '';
    const street = addressComponents.find(component => component.types.includes('route'))?.long_name || '';
    const postalCode = addressComponents.find(component => component.types.includes('postal_code'))?.long_name || '';
    const city = addressComponents.find(component => component.types.includes('locality'))?.long_name || '';
    const country = addressComponents.find(component => component.types.includes('country'))?.long_name || '';
  
    const fullStreet = `${streetNumber} ${street}`.trim();
  
    setFormData(prev => ({
      ...prev,
      street: fullStreet,
      postalCode,
      city,
      country,
    }));
  };

  if (!isLoaded) return <div>Loading...</div>;

  return (
    <div className="step-container">
      <h2>Localisation</h2>
      <p className="step-description">Entrez l'adresse du bien</p>

      <div className="form-group">
        <label>Adresse *</label>
        <Autocomplete
          onLoad={setAutocomplete}
          onPlaceChanged={handlePlaceChanged}
        >
          <input
            type="text"
            placeholder="Entrez l'adresse"
            className="form-input"
          />
        </Autocomplete>
      </div>

      <div className="form-group">
        <label>Numéro et rue *</label>
        <input
          type="text"
          name="street"
          value={formData.street}
          onChange={(e) => setFormData(prev => ({ ...prev, street: e.target.value }))}
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
          value={formData.postalCode}
          onChange={(e) => setFormData(prev => ({ ...prev, postalCode: e.target.value }))}
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
          value={formData.city}
          onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
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
          value={formData.country}
          onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
          placeholder="France"
          required
          className="form-input"
        />
      </div>
    </div>
  );
};

export default LocationStep;