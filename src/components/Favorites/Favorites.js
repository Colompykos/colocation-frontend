import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
} from "firebase/firestore";
import { db } from "../../config/firebase";
import ListingCard from "../ListingCard/ListingCard";
import "./Favorites.css";

const Favorites = () => {
  const [favorites, setFavorites] = useState([]);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const q = query(
          collection(db, "favorites"),
          where("userId", "==", user.uid)
        );
        const querySnapshot = await getDocs(q);
        const favoriteIds = querySnapshot.docs.map(
          (doc) => doc.data().listingId
        );

        const favoritesData = [];
        for (const listingId of favoriteIds) {
          const listingRef = doc(db, "listings", listingId);
          const listingSnap = await getDoc(listingRef);
          if (listingSnap.exists()) {
            favoritesData.push({
              id: listingSnap.id,
              ...listingSnap.data(),
            });
          }
        }
        setFavorites(favoritesData);
      } catch (error) {
        console.error("Error fetching favorites:", error);
      }
    };

    if (user) {
      fetchFavorites();
    }
  }, [user]);

  return (
    <div className="favorites-container">
      <div className="favorites-header">
        <h1>Mes Favoris</h1>
      </div>

      {favorites.length === 0 ? (
        <div className="no-favorites">
          <p>Vous n'avez pas encore de favoris</p>
          <button onClick={() => navigate("/search")} className="search-button">
            Parcourir les annonces
          </button>
        </div>
      ) : (
        <div className="listings-grid">
          {favorites.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              showStatus={false}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Favorites;
