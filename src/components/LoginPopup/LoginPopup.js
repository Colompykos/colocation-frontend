import React from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginPopup.css';

const LoginPopup = ({ onClose }) => {
  const navigate = useNavigate();

  const handleLogin = () => {
    navigate('/login');
    if (onClose) onClose();
  };

  const handleSignup = () => {
    navigate('/login?signup=true');
    if (onClose) onClose();
  };

  return (
    <div className="login-popup-overlay">
      <div className="login-popup-content">
        <button className="login-popup-close" onClick={onClose}>
          <i className="fas fa-times"></i>
        </button>
        <div className="login-popup-header">
          <img src="/Images/LogoApp.png" alt="Logo" className="login-popup-logo" />
          <h2>Créez un compte pour continuer</h2>
        </div>
        <p className="login-popup-message">
          Pour accéder à cette fonctionnalité et découvrir des colocations étudiantes vérifiées, 
          veuillez vous connecter ou créer un compte.
        </p>
        <div className="login-popup-buttons">
          <button onClick={handleLogin} className="login-popup-button login">
            Se connecter
          </button>
          <button onClick={handleSignup} className="login-popup-button signup">
            S'inscrire
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPopup;