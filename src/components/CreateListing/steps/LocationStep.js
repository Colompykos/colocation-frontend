import React from 'react';

const LocationStep = ({ formData, setFormData }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="step-container">
      <h2>Localisation</h2>
      <p className="step-description">Entrez l'adresse du bien</p>

      <div className="form-group">
        <label>Numéro et rue *</label>
        <input
          type="text"
          name="street"
          value={formData.street}
          onChange={handleChange}
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
          onChange={handleChange}
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
          onChange={handleChange}
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
          onChange={handleChange}
          placeholder="France"
          required
          className="form-input"
        />
      </div>
    </div>
  );
};

export default LocationStep;