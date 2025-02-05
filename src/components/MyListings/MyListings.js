import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../config/firebase";
import "./MyListings.css";

const MyListings = () => {
  const [listings, setListings] = useState([]);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMyListings = async () => {
      try {
        const q = query(
          collection(db, "listings"),
          where("metadata.userId", "==", user.uid)
        );
        const querySnapshot = await getDocs(q);
        const myListings = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setListings(myListings);
      } catch (error) {
        console.error("Error fetching my listings:", error);
      }
    };

    if (user) {
      fetchMyListings();
    }
  }, [user]);

  if (!user) {
    return (
      <div className="my-listings-container">
        <h2>Please log in to view your listings</h2>
        <button onClick={() => navigate("/login")} className="login-button">
          Login
        </button>
      </div>
    );
  }

  return (
    <div className="my-listings-container">
      <div className="my-listings-header">
        <h1>My Listings</h1>
        <button
          onClick={() => navigate("/create-listing")}
          className="create-button"
        >
          Create New Listing
        </button>
      </div>

      {listings.length === 0 ? (
        <div className="no-listings">
          <p>You haven't created any listings yet.</p>
          <button
            onClick={() => navigate("/create-listing")}
            className="create-button"
          >
            Create Your First Listing
          </button>
        </div>
      ) : (
        <div className="listings-grid">
          {listings.map((listing) => (
            <div
              key={listing.id}
              className="listing-card"
              onClick={() => navigate(`/listing/${listing.id}`)}
            >
              <div className="listing-image">
                <img
                  src={listing.photos[0] || "/Images/default-property.jpg"}
                  alt={listing.details.title}
                  className="listing-photo"
                />
                <div className="listing-price">
                  €{listing.details.rent}/month
                </div>
                <div className="listing-status">{listing.metadata.status}</div>
              </div>
              <div className="listing-info">
                <h3>{listing.details.title}</h3>
                <div className="listing-location">
                  <i className="fas fa-map-marker-alt"></i>
                  {listing.location.city}, {listing.location.country}
                </div>
                <div className="listing-details">
                  <span>
                    <i className="fas fa-bed"></i>
                    {listing.housing.totalRoommates} roommates
                  </span>
                  <span>
                    <i className="fas fa-bath"></i>
                    {listing.housing.bathrooms} baths
                  </span>
                  <span>
                    <i className="fas fa-ruler-combined"></i>
                    {listing.housing.privateArea}m²
                  </span>
                </div>
                <div className="listing-services">
                  {listing.services.wifi && (
                    <span className="service-tag">Wifi</span>
                  )}
                  {listing.services.washingMachine && (
                    <span className="service-tag">Washer</span>
                  )}
                  {listing.details.furnished && (
                    <span className="service-tag">Furnished</span>
                  )}
                </div>
                <div className="listing-available">
                  Available from:{" "}
                  {new Date(listing.details.availableDate).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyListings;