import React from 'react';

const HousingStep = ({ formData, setFormData }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="step-container">
      <h2>Détails du Logement</h2>
      
      <div className="form-group">
        <label>Nombre total de colocataires *</label>
        <input
          type="number"
          name="totalRoommates"
          value={formData.totalRoommates}
          onChange={handleChange}
          min="1"
          required
          className="form-input"
        />
      </div>

      <div className="form-group">
        <label>Nombre de salles de bain *</label>
        <input
          type="number"
          name="bathrooms"
          value={formData.bathrooms}
          onChange={handleChange}
          min="1"
          required
          className="form-input"
        />
      </div>

      <div className="form-group">
        <label>Surface privée (m²) *</label>
        <input
          type="number"
          name="privateArea"
          value={formData.privateArea}
          onChange={handleChange}
          min="1"
          required
          className="form-input"
        />
      </div>
    </div>
  );
};

export default HousingStep;