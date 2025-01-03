import React, { useState, useEffect } from "react";
import { db } from "../config/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import "./Search.css";

const Search = () => {
  const [listings, setListings] = useState([]);
  const [filteredListings, setFilteredListings] = useState([]);
  const [searchParams, setSearchParams] = useState({
    location: "",
    maxBudget: "",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "users"));
        const listingsData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setListings(listingsData);
        setFilteredListings(listingsData);
      } catch (error) {
        console.error("Error fetching listings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();

    let filtered = listings;

    if (searchParams.location) {
      filtered = filtered.filter((listing) =>
        listing.location
          .toLowerCase()
          .includes(searchParams.location.toLowerCase())
      );
    }

    if (searchParams.maxBudget) {
      filtered = filtered.filter(
        (listing) => listing.budget <= parseInt(searchParams.maxBudget)
      );
    }

    setFilteredListings(filtered);
  };

  return (
    <div className="search-container">
      <h1>Find Your Perfect Roommate</h1>

      <form onSubmit={handleSearch} className="search-form">
        <div className="search-inputs">
          <input
            type="text"
            placeholder="Location"
            value={searchParams.location}
            onChange={(e) =>
              setSearchParams({ ...searchParams, location: e.target.value })
            }
            className="search-input"
          />
          <input
            type="number"
            placeholder="Max Budget"
            value={searchParams.maxBudget}
            onChange={(e) =>
              setSearchParams({ ...searchParams, maxBudget: e.target.value })
            }
            className="search-input"
          />
          <button type="submit" className="search-button">
            Search
          </button>
        </div>
      </form>

      {loading ? (
        <div className="loading">Loading...</div>
      ) : (
        <div className="listings-grid">
          {filteredListings.length > 0 ? (
            filteredListings.map((listing) => (
              <div key={listing.id} className="listing-card">
                <img
                  src={listing.photoURL || "/images/default-avatar.png"}
                  alt="Profile"
                  className="listing-photo"
                />
                <div className="listing-info">
                  <h3>{listing.location}</h3>
                  <p className="listing-budget">€{listing.budget}/month</p>
                  <p className="listing-type">{listing.housingType}</p>
                  <p className="listing-description">{listing.description}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="no-results">
              No listings found matching your criteria
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Search;
