import React from 'react';

const ServicesStep = ({ formData, setFormData }) => {
  const handleServiceChange = (serviceName) => {
    setFormData(prev => ({
      ...prev,
      services: {
        ...prev.services,
        [serviceName]: !prev.services[serviceName]
      }
    }));
  };

  const services = [
    { id: 'wifi', label: 'Wifi inclus' },
    { id: 'handicapAccess', label: 'Accès handicapés' },
    { id: 'kitchenware', label: 'Kit vaisselle' },
    { id: 'microwave', label: 'Fours à micro-ondes' },
    { id: 'laundry', label: 'Laverie' },
    { id: 'bikeParking', label: 'Parking à vélo' },
    { id: 'linens', label: 'Linge fourni' },
    { id: 'washingMachine', label: 'Machine à laver' },
    { id: 'tv', label: 'TV' },
    { id: 'doubleBed', label: 'Lit 2 places' },
    { id: 'elevator', label: 'Ascenseur' },
    { id: 'parking', label: 'Parking' }
  ];

  return (
    <div className="step-container">
      <h2>Services et Équipements</h2>
      <p className="step-description">Sélectionnez les services disponibles</p>

      <div className="services-grid">
        {services.map(service => (
          <div key={service.id} className="service-item">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.services[service.id]}
                onChange={() => handleServiceChange(service.id)}
              />
              {service.label}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ServicesStep;