import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../config/firebase";
import ListingCard from '../ListingCard/ListingCard';
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
            <ListingCard
              key={listing.id}
              listing={listing}
              showFavorite={false}
              showStatus={true}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MyListings;
