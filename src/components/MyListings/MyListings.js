import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "../../config/firebase";
import "./MyListings.css";

const MyListings = () => {
  const [listings, setListings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchMyListings = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const q = query(
        collection(db, "listings"),
        where("metadata.userId", "==", user.uid)
      );
      const querySnapshot = await getDocs(q);
      const listingsData = [];
      querySnapshot.forEach((doc) => {
        listingsData.push({
          id: doc.id,
          ...doc.data(),
        });
      });
      setListings(listingsData);
    } catch (error) {
      console.error("Error fetching my listings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchMyListings();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const handleDeleteListing = async (id, event) => {
    event.stopPropagation();

    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette annonce ?")) {
      try {
        const token = await user.getIdToken();

        const response = await fetch(
          `http://localhost:5000/api/listings/${id}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Server error response:", errorText);
          throw new Error(`HTTP error ${response.status}: ${errorText}`);
        }

        const data = await response.json();

        if (data.success) {
          fetchMyListings();
          alert("Annonce supprimée avec succès!");
        } else {
          throw new Error(data.error || "Erreur lors de la suppression");
        }
      } catch (error) {
        console.error("Error deleting listing:", error);
        alert(`Erreur lors de la suppression de l'annonce: ${error.message}`);
      }
    }
  };

  const handleEditListing = (id, event) => {
    event.stopPropagation();
    navigate(`/create-listing?edit=${id}`);
  };

  if (!user) {
    return (
      <div className="my-listings-container">
        <h2>Veuillez vous connecter pour voir vos annonces</h2>
        <button onClick={() => navigate("/login")} className="login-button">
          Se connecter
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="my-listings-container">
        <div className="loading-spinner"></div>
        <p className="loading-text">Chargement en cours...</p>
      </div>
    );
  }

  return (
    <div className="my-listings-container">
      <div className="my-listings-header">
        <h1>Mes Annonces</h1>
        <button
          onClick={() => navigate("/create-listing")}
          className="create-button"
        >
          <i className="fas fa-plus"></i> Créer une annonce
        </button>
      </div>

      {listings.length === 0 ? (
        <div className="no-listings">
          <p>Vous n'avez pas encore créé d'annonces.</p>
          <button
            onClick={() => navigate("/create-listing")}
            className="create-button"
          >
            Créer ma première annonce
          </button>
        </div>
      ) : (
        <div className="listings-grid">
          {listings.map((listing) => (
            <div key={listing.id} className="listing-card-wrapper">
              <div className="listing-status-badge">
                <span
                  className={`status-indicator ${listing.status || "pending"}`}
                >
                  {listing.status === "active"
                    ? "Active"
                    : listing.status === "blocked"
                    ? "Bloquée"
                    : "En attente"}
                </span>
              </div>

              <div
                className="listing-card"
                onClick={() => navigate(`/listing/${listing.id}`)}
              >
                <div className="listing-image">
                  <img
                    src={listing.photos?.[0] || "/Images/default-property.jpg"}
                    alt={listing.details?.title || "Property"}
                    className="listing-photo"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "/Images/default-property.jpg";
                    }}
                  />
                  <div className="listing-price">
                    €{listing.details?.rent || 0}/mois
                  </div>
                </div>
                <div className="listing-info">
                  <h3>{listing.details?.title || "Sans titre"}</h3>
                  <div className="listing-location">
                    <i className="fas fa-map-marker-alt"></i>
                    {listing.location?.city || "Ville inconnue"},{" "}
                    {listing.location?.country || "Pays inconnu"}
                  </div>
                  <div className="listing-details">
                    <span>
                      <i className="fas fa-user-friends"></i>
                      {listing.housing?.totalRoommates || 0} colocataires
                    </span>
                    <span>
                      <i className="fas fa-bath"></i>
                      {listing.housing?.bathrooms || 0} sdb
                    </span>
                    <span>
                      <i className="fas fa-ruler-combined"></i>
                      {listing.housing?.privateArea || 0}m²
                    </span>
                  </div>
                  <div className="listing-available">
                    Disponible à partir du:{" "}
                    {listing.details?.availableDate
                      ? new Date(
                          listing.details.availableDate
                        ).toLocaleDateString()
                      : "Date inconnue"}
                  </div>
                </div>
              </div>

              <div className="listing-actions">
                <button
                  className="edit-button"
                  onClick={(event) => handleEditListing(listing.id, event)}
                  disabled={listing.status === "blocked"}
                >
                  <i className="fas fa-edit"></i> Modifier
                </button>
                <button
                  className="delete-button"
                  onClick={(event) => handleDeleteListing(listing.id, event)}
                >
                  <i className="fas fa-trash"></i> Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyListings;
