import React from 'react';

const DetailsStep = ({ formData, setFormData }) => {
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  return (
    <div className="step-container">
      <h2>Détails du bien</h2>

      <div className="form-group">
        <label>Type de bien *</label>
        <select
          name="propertyType"
          value={formData.propertyType}
          onChange={handleChange}
          required
          className="form-input"
        >
          <option value="">Sélectionnez le type</option>
          <option value="apartment">Appartement</option>
          <option value="house">Maison</option>
          <option value="studio">Studio</option>
        </select>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Surface totale (m²) *</label>
          <input
            type="number"
            name="totalArea"
            value={formData.totalArea}
            onChange={handleChange}
            required
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label>Nombre de pièces *</label>
          <input
            type="number"
            name="rooms"
            value={formData.rooms}
            onChange={handleChange}
            required
            className="form-input"
          />
        </div>
      </div>

      <div className="form-group">
        <label>Étage</label>
        <input
          type="number"
          name="floor"
          value={formData.floor}
          onChange={handleChange}
          className="form-input"
        />
      </div>

      <div className="form-group">
        <label className="checkbox-label">
          <input
            type="checkbox"
            name="furnished"
            checked={formData.furnished}
            onChange={handleChange}
          />
          Meublé
        </label>
      </div>

      <div className="form-group">
        <label>Disponible à partir de *</label>
        <input
          type="date"
          name="availableDate"
          value={formData.availableDate}
          onChange={handleChange}
          required
          className="form-input"
        />
      </div>

      <div className="form-group">
        <label>Loyer mensuel (€) *</label>
        <input
          type="number"
          name="rent"
          value={formData.rent}
          onChange={handleChange}
          required
          className="form-input"
        />
      </div>

      <div className="form-group">
        <label>Titre *</label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          required
          className="form-input"
        />
      </div>

      <div className="form-group">
        <label>Description *</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          required
          className="form-input"
          rows="4"
        />
      </div>
    </div>
  );
};

export default DetailsStep;