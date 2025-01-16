import React from 'react';
import { useAuth } from '../../../contexts/AuthContext';

const ContactStep = ({ formData, setFormData }) => {
  const { user } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  React.useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        contactName: user.displayName || prev.contactName,
        contactEmail: user.email || prev.contactEmail
      }));
    }
  }, [user, setFormData]);

  return (
    <div className="step-container">
      <h2>Informations de Contact</h2>
      <p className="step-description">Comment les intéressés peuvent vous contacter</p>

      <div className="form-group">
        <label>Nom complet *</label>
        <input
          type="text"
          name="contactName"
          value={formData.contactName}
          onChange={handleChange}
          placeholder="Votre nom et prénom"
          required
          className="form-input"
        />
      </div>

      <div className="form-group">
        <label>Téléphone *</label>
        <input
          type="tel"
          name="contactPhone"
          value={formData.contactPhone}
          onChange={handleChange}
          placeholder="Votre numéro de téléphone"
          required
          className="form-input"
        />
      </div>

      <div className="form-group">
        <label>Email *</label>
        <input
          type="email"
          name="contactEmail"
          value={formData.contactEmail}
          onChange={handleChange}
          placeholder="Votre adresse email"
          required
          className="form-input"
        />
      </div>

      <div className="form-group">
        <label className="checkbox-label">
          <input
            type="checkbox"
            name="acceptTerms"
            checked={formData.acceptTerms}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              acceptTerms: e.target.checked
            }))}
            required
          />
          J'accepte que mes informations de contact soient partagées avec les utilisateurs intéressés
        </label>
      </div>
    </div>
  );
};

export default ContactStep;