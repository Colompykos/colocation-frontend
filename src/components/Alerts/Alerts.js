import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../../config/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  Timestamp,
  doc,
  getDoc,
} from "firebase/firestore";
import { useAuth } from "../../contexts/AuthContext";
import "./Alerts.css";

const Alerts = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userPreferences, setUserPreferences] = useState(null);

  useEffect(() => {
    const fetchUserPreferences = async () => {
      if (!user) return;

      try {
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          setUserPreferences({
            alertsEnabled: userData.alertsEnabled || false,
            alertsMinBudget: parseInt(userData.alertsMinBudget) || 0,
            alertsMaxBudget: parseInt(userData.alertsMaxBudget) || 10000,
            alertsLocation: userData.alertsLocation || userData.location || "",
          });
        }
      } catch (error) {
        console.error("Error fetching user preferences:", error);
      }
    };

    fetchUserPreferences();
  }, [user]);

  useEffect(() => {
    const fetchAlerts = async () => {
      if (!user || !userPreferences) {
        setAlerts([]);
        setLoading(false);
        return;
      }

      if (userPreferences.alertsEnabled !== true) {
        console.log("Alerts are disabled, clearing alerts list");
        setAlerts([]); 
        setLoading(false);
        return;
      }

      setLoading(true);
      console.log("Fetching alerts with preferences:", userPreferences);

      try {
        const listingsRef = collection(db, "listings");
        const q = query(listingsRef);

        const querySnapshot = await getDocs(q);
        console.log(`Retrieved ${querySnapshot.size} total listings`);

        let matchingListings = [];

        querySnapshot.forEach((document) => {
          const listing = { id: document.id, ...document.data() };
          console.log(
            `Processing listing: ${listing.id}, title: ${
              listing?.details?.title || "Unknown"
            }`
          );

          if (listing.status !== "active") {
            console.log(`Listing ${listing.id} excluded: not active`);
            return;
          }

          const rent = parseFloat(listing.details?.rent) || 0;
          const minBudget = parseFloat(userPreferences.alertsMinBudget) || 0;
          const maxBudget =
            parseFloat(userPreferences.alertsMaxBudget) || 100000;

          console.log(
            `Listing rent: ${rent}, Min: ${minBudget}, Max: ${maxBudget}`
          );

          if (minBudget > 0 && rent < minBudget) {
            console.log(`Listing ${listing.id} excluded: rent too low`);
            return;
          }

          if (maxBudget > 0 && rent > maxBudget) {
            console.log(`Listing ${listing.id} excluded: rent too high`);
            return;
          }

          if (
            userPreferences.alertsLocation &&
            userPreferences.alertsLocation.trim() !== ""
          ) {
            const listingCity = (listing.location?.city || "").toLowerCase();
            const preferredLocation =
              userPreferences.alertsLocation.toLowerCase();

            if (!listingCity.includes(preferredLocation)) {
              console.log(`Listing ${listing.id} excluded: location mismatch`);
              return;
            }
          }

          console.log(`Adding listing ${listing.id} to matches`);
          matchingListings.push(listing);
        });

        console.log(`Found ${matchingListings.length} matching listings`);

        matchingListings.sort((a, b) => {
          const dateA = getDate(a);
          const dateB = getDate(b);

          return dateB - dateA;
        });

        setAlerts(matchingListings);
      } catch (error) {
        console.error("Error fetching alerts:", error);
      } finally {
        setLoading(false);
      }
    };

    const getDate = (listing) => {
      if (!listing.metadata?.createdAt) return new Date();

      if (
        listing.metadata.createdAt.toDate &&
        typeof listing.metadata.createdAt.toDate === "function"
      ) {
        return listing.metadata.createdAt.toDate();
      }

      if (listing.metadata.createdAt.seconds) {
        return new Date(listing.metadata.createdAt.seconds * 1000);
      }

      if (typeof listing.metadata.createdAt === "string") {
        return new Date(listing.metadata.createdAt);
      }

      return new Date();
    };

    fetchAlerts();
  }, [user, userPreferences]);

  const handleListingClick = (id) => {
    navigate(`/listing/${id}`);
  };

  if (!user) {
    return (
      <div className="alerts-container">
        <h2>Connectez-vous pour voir vos alertes</h2>
        <button onClick={() => navigate("/login")} className="primary-button">
          Se connecter
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="alerts-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!userPreferences || userPreferences.alertsEnabled !== true) {
    return (
      <div className="alerts-container">
        <h2>Alertes désactivées</h2>
        <p>
          Activez les alertes pour recevoir des notifications sur les nouvelles
          annonces qui correspondent à vos critères.
        </p>
        <button onClick={() => navigate("/search")} className="primary-button">
          Configurer les alertes
        </button>
      </div>
    );
  }

  return (
    <div className="alerts-container">
      <h2>Nouvelles annonces correspondant à vos critères</h2>
      <div className="alerts-criteria">
        <div className="criteria-item">
          <span className="criteria-label">Budget:</span>
          <span className="criteria-value">
            {userPreferences.alertsMinBudget}€ -{" "}
            {userPreferences.alertsMaxBudget}€
          </span>
        </div>

        {userPreferences.alertsLocation && (
          <div className="criteria-item">
            <span className="criteria-label">Ville:</span>
            <span className="criteria-value">
              {userPreferences.alertsLocation}
            </span>
          </div>
        )}

        <button
          onClick={() => navigate("/search")}
          className="edit-criteria-button"
          title="Modifier les critères d'alerte"
        >
          <i className="fas fa-edit"></i>
        </button>
      </div>

      {alerts.length === 0 ? (
        <div className="no-alerts">
          <p>
            Aucune nouvelle annonce ne correspond à vos critères pour le moment.
          </p>
        </div>
      ) : (
        <div className="alerts-list">
          {alerts.map((listing) => (
            <div
              key={listing.id}
              className="alert-card"
              onClick={() => handleListingClick(listing.id)}
            >
              <div className="alert-image">
                <img
                  src={listing.photos[0] || "/Images/default-property.jpg"}
                  alt={listing.details.title}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "/Images/default-property.jpg";
                  }}
                />
              </div>
              <div className="alert-content">
                <h3>{listing.details.title}</h3>
                <p className="alert-location">
                  <i className="fas fa-map-marker-alt"></i>
                  {listing.location.city}
                </p>
                <p className="alert-price">{listing.details.rent}€/mois</p>
                <p className="alert-date">
                  <i className="fas fa-clock"></i>
                  {listing.metadata.createdAt instanceof Timestamp
                    ? new Date(
                        listing.metadata.createdAt.toDate()
                      ).toLocaleDateString()
                    : new Date().toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Alerts;