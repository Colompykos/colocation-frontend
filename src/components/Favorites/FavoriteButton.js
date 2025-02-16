import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import './FavoriteButton.css';

const FavoriteButton = ({ listingId }) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (!user) return;
      try {
        const favoriteRef = doc(db, 'favorites', `${user.uid}_${listingId}`);
        const favoriteDoc = await getDoc(favoriteRef);
        setIsFavorite(favoriteDoc.exists());
      } catch (error) {
        console.error('Error checking favorite status:', error);
      }
    };

    checkFavoriteStatus();
  }, [user, listingId]);

  const handleToggleFavorite = async (e) => {
    e.stopPropagation();
    if (!user) {
      navigate('/login');
      return;
    }
  
    setIsLoading(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch('http://localhost:5000/api/favorites/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ listingId })
      });
  
      const data = await response.json();
      if (data.success) {
        setIsFavorite(data.isFavorite);
      } else {
        console.error('Error toggling favorite:', data.error);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      className={`favorite-button ${isFavorite ? 'active' : ''}`}
      onClick={handleToggleFavorite}
      disabled={isLoading}
    >
      <i className={`fas fa-heart ${isFavorite ? 'filled' : ''}`}></i>
    </button>
  );
};

export default FavoriteButton;