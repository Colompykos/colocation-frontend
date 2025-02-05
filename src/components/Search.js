import React, { useState, useEffect } from "react";
import { db } from "../config/firebase";
import { collection, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import "./Search.css";

const Search = () => {
  const [listings, setListings] = useState([]);
  const [filteredListings, setFilteredListings] = useState([]);
  const navigate = useNavigate();
  const location = new URLSearchParams(window.location.search).get("location");
  const [filters, setFilters] = useState({
    location: location || "",
    maxBudget: "",
    propertyType: "",
    roommates: "",
    furnished: false,
    minArea: "",
    maxArea: "",
    availableFrom: "",
    amenities: {
      wifi: false,
      washingMachine: false,
      parking: false,
      elevator: false,
      tv: false,
      bikeParking: false,
      kitchenware: false,
    },
    sortBy: "newest",
    priceRange: [0, 5000],
    instant: false,
  });

  useEffect(() => {
    const initialize = async () => {
      await fetchListings();
      if (location) {
        setFilters((prev) => ({
          ...prev,
          location: location,
        }));
      }
    };
    initialize();
  }, [location]);

  const [viewMode, setViewMode] = useState("grid"); // grid ou map
  const [mapCenter, setMapCenter] = useState([48.8566, 2.3522]); // Paris par défaut

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "listings"));
      const listingsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setListings(listingsData);
      setFilteredListings(listingsData);
    } catch (error) {
      console.error("Error fetching listings:", error);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
      if (name.startsWith("amenities.")) {
        const amenityName = name.split(".")[1];
        setFilters((prev) => ({
          ...prev,
          amenities: {
            ...prev.amenities,
            [amenityName]: checked,
          },
        }));
      } else {
        setFilters((prev) => ({
          ...prev,
          [name]: checked,
        }));
      }
    } else {
      setFilters((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  useEffect(() => {
    applyFilters();
  }, [filters]);

  const applyFilters = () => {
    let filtered = [...listings];

    // Filtre par localisation
    if (filters.location) {
      filtered = filtered.filter((listing) => {
        const cityMatch = listing.location.city
          .toLowerCase()
          .includes(filters.location.toLowerCase());
        const countryMatch = listing.location.country
          .toLowerCase()
          .includes(filters.location.toLowerCase());
        return cityMatch || countryMatch;
      });
    }

    // Filtre par budget
    if (filters.maxBudget) {
      filtered = filtered.filter(
        (listing) => listing.details.rent <= parseInt(filters.maxBudget)
      );
    }

    // Filtre par date de disponibilité
    if (filters.availableFrom) {
      filtered = filtered.filter(
        (listing) => listing.details.availableDate >= filters.availableFrom
      );
    }

    // Filtre par amenités
    Object.entries(filters.amenities).forEach(([amenity, isRequired]) => {
      if (isRequired) {
        filtered = filtered.filter((listing) => listing.services[amenity]);
      }
    });

    // Tri
    switch (filters.sortBy) {
      case "priceAsc":
        filtered.sort((a, b) => a.details.rent - b.details.rent);
        break;
      case "priceDesc":
        filtered.sort((a, b) => b.details.rent - a.details.rent);
        break;
      case "newest":
        filtered.sort((a, b) => b.metadata.createdAt - a.metadata.createdAt);
        break;
      default:
        break;
    }

    setFilteredListings(filtered);
  };

  return (
    <div className="search-container">
      <header className="search-header">
        <h1>Find Your Perfect Room</h1>
        <p>
          {filteredListings.length} properties available in{" "}
          {filters.location || "all locations"}
        </p>
        <div className="view-toggle">
          <button
            className={`view-button ${viewMode === "grid" ? "active" : ""}`}
            onClick={() => setViewMode("grid")}
          >
            <i className="fas fa-th"></i> Grid
          </button>
          <button
            className={`view-button ${viewMode === "map" ? "active" : ""}`}
            onClick={() => setViewMode("map")}
          >
            <i className="fas fa-map-marker-alt"></i> Map
          </button>
        </div>
      </header>

      <div className="search-content">
        <aside className="filters-sidebar">
          <div className="filters-section">
            <h3>Filters</h3>

            <div className="filter-group">
              <label>Location</label>
              <input
                type="text"
                name="location"
                value={filters.location}
                onChange={handleFilterChange}
                placeholder="City, neighborhood..."
                className="filter-input"
              />
            </div>

            <div className="filter-group">
              <label>Price Range</label>
              <div className="price-inputs">
                <input
                  type="number"
                  name="minPrice"
                  placeholder="Min"
                  className="filter-input"
                />
                <span>-</span>
                <input
                  type="number"
                  name="maxPrice"
                  placeholder="Max"
                  className="filter-input"
                />
              </div>
            </div>

            <div className="filter-group">
              <label>Available From</label>
              <input
                type="date"
                name="availableFrom"
                value={filters.availableFrom}
                onChange={handleFilterChange}
                className="filter-input"
              />
            </div>

            <div className="filter-group">
              <label>Property Type</label>
              <select
                name="propertyType"
                value={filters.propertyType}
                onChange={handleFilterChange}
                className="filter-input"
              >
                <option value="">All types</option>
                <option value="apartment">Apartment</option>
                <option value="house">House</option>
                <option value="studio">Studio</option>
              </select>
            </div>

            <div className="amenities-section">
              <h4>Amenities</h4>
              <div className="amenities-grid">
                {Object.entries(filters.amenities).map(([key, value]) => (
                  <label key={key} className="amenity-checkbox">
                    <input
                      type="checkbox"
                      name={`amenities.${key}`}
                      checked={value}
                      onChange={handleFilterChange}
                    />
                    <i className={`fas fa-${getAmenityIcon(key)}`}></i>
                    {formatAmenityName(key)}
                  </label>
                ))}
              </div>
            </div>

            <div className="additional-filters">
              <label className="toggle-filter">
                <input
                  type="checkbox"
                  name="instant"
                  checked={filters.instant}
                  onChange={handleFilterChange}
                />
                <span className="toggle-label">Instant Booking</span>
              </label>
            </div>
          </div>
        </aside>

        <main className="listings-main">
          <div className="listings-header">
            <div className="listings-count">
              {filteredListings.length} results found
            </div>
            <div className="listings-sort">
              <select
                name="sortBy"
                value={filters.sortBy}
                onChange={handleFilterChange}
                className="sort-select"
              >
                <option value="newest">Newest first</option>
                <option value="priceAsc">Price: Low to High</option>
                <option value="priceDesc">Price: High to Low</option>
              </select>
            </div>
          </div>

          {viewMode === "grid" ? (
            <div className="listings-grid">
              {filteredListings.map((listing) => (
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
                      {new Date(
                        listing.details.availableDate
                      ).toLocaleDateString()}
                    </div>

                    <div className="listing-author">
                      <img
                        src={
                          listing.contact.photoURL ||
                          listing.metadata.userPhotoURL ||
                          "/Images/default-avatar.png"
                        }
                        alt={`Posted by ${listing.contact.name}`}
                        className="author-avatar"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "/Images/default-avatar.png";
                        }}
                      />
                      <div className="author-info">
                        <span className="author-name">
                          {listing.contact.name}
                        </span>
                        <span className="post-date">
                          {new Date(
                            listing.metadata.createdAt?.toDate()
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="listings-map">
              {/* Intégration de la carte ici */}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

const getAmenityIcon = (amenity) => {
  const icons = {
    wifi: "wifi",
    washingMachine: "washer",
    parking: "parking",
    elevator: "elevator",
    tv: "tv",
    bikeParking: "bicycle",
    kitchenware: "utensils",
  };
  return icons[amenity] || "check";
};

const formatAmenityName = (key) => {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase());
};

export default Search;
