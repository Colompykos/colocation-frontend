import React, { useState, useEffect } from "react";
import { db } from "../config/firebase";
import { collection, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import FavoriteButton from "./Favorites/FavoriteButton";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext";
import {
  GoogleMap,
  useLoadScript,
  Marker,
  InfoWindow,
} from "@react-google-maps/api";
import "./Search.css";

const libraries = ["places"];

const mapContainerStyle = {
  width: "100%",
  height: "700px",
  borderRadius: "16px",
  overflow: "hidden",
};

const Search = () => {
  const [listings, setListings] = useState([]);
  const [filteredListings, setFilteredListings] = useState([]);
  const [selectedListing, setSelectedListing] = useState(null);
  const navigate = useNavigate();
  const location = new URLSearchParams(window.location.search).get("location");
  const { user } = useAuth();
  const [infoWindowClosing, setInfoWindowClosing] = useState(false);

  const handleInfoWindowMouseLeave = () => {
    setInfoWindowClosing(true);

    setTimeout(() => {
      setSelectedListing(null);
      setInfoWindowClosing(false);
    }, 300);
  };

  const [viewMode, setViewMode] = useState("grid");
  const [mapCenter, setMapCenter] = useState({ lat: 43.7102, lng: 7.262 });

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  const [filters, setFilters] = useState({
    location: location || "",
    maxBudget: "",
    minPrice: "",
    maxPrice: "",
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

  const [alertSettings, setAlertSettings] = useState({
    enabled: false,
    minBudget: "",
    maxBudget: "",
    location: "",
  });

  useEffect(() => {
    const fetchAlertSettings = async () => {
      if (!user) return;

      try {
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          setAlertSettings({
            enabled: userData.alertsEnabled || false,
            minBudget: userData.alertsMinBudget || "",
            maxBudget: userData.alertsMaxBudget || "",
            location: userData.alertsLocation || "",
          });
        }
      } catch (error) {
        console.error("Error fetching alert settings:", error);
      }
    };

    fetchAlertSettings();
  }, [user]);

  const saveAlertSettings = async () => {
    if (!user) {
      alert("Veuillez vous connecter pour configurer des alertes");
      return;
    }

    try {
      if (!alertSettings.enabled) {
        console.log("Disabling alerts and resetting all settings");

        const userDocRef = doc(db, "users", user.uid);
        await updateDoc(userDocRef, {
          alertsEnabled: false,
          alertsMinBudget: 0,
          alertsMaxBudget: 0,
          alertsLocation: "",
          updatedAt: serverTimestamp(),
        });

        setAlertSettings({
          enabled: false,
          minBudget: "",
          maxBudget: "",
          location: "",
        });

        const event = new CustomEvent("alertSettingsChanged", {
          detail: { enabled: false },
        });
        window.dispatchEvent(event);

        alert("Alertes désactivées avec succès!");
        return;
      }

      const minBudget = alertSettings.minBudget
        ? parseFloat(alertSettings.minBudget)
        : 0;
      const maxBudget = alertSettings.maxBudget
        ? parseFloat(alertSettings.maxBudget)
        : filters.maxPrice
        ? parseFloat(filters.maxPrice)
        : 10000;

      console.log("Saving alert settings:", {
        enabled: true,
        minBudget,
        maxBudget,
        location: alertSettings.location || filters.location || "",
      });

      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, {
        alertsEnabled: true,
        alertsMinBudget: minBudget,
        alertsMaxBudget: maxBudget,
        alertsLocation: alertSettings.location || filters.location || "",
        updatedAt: serverTimestamp(),
      });

      const event = new CustomEvent("alertSettingsChanged", {
        detail: {
          enabled: true,
          minBudget,
          maxBudget,
          location: alertSettings.location || filters.location || "",
        },
      });
      window.dispatchEvent(event);

      alert("Paramètres d'alerte sauvegardés avec succès!");
    } catch (error) {
      console.error("Error saving alert settings:", error);
      alert("Erreur lors de la sauvegarde des paramètres d'alerte");
    }
  };


  useEffect(() => {
    const handleAlertToggle = (e) => {
      if (!e.target.checked) {
        saveAlertSettings();
      }
    };

    const alertToggle = document.querySelector(
      '.alert-toggle input[type="checkbox"]'
    );
    if (alertToggle) {
      alertToggle.addEventListener("change", handleAlertToggle);
    }

    return () => {
      if (alertToggle) {
        alertToggle.removeEventListener("change", handleAlertToggle);
      }
    };
  }, [alertSettings.enabled]);

  useEffect(() => {
    const initialize = async () => {
      console.log("Initializing search component");
      const listingsData = await fetchListings();

      if (listingsData.length > 0) {
        console.log("Listings loaded, applying filters");
        applyFilters(listingsData);
      }
    };

    initialize();
  }, []);

  useEffect(() => {
    if (location) {
      console.log("URL location parameter found:", location);
      setFilters((prev) => ({
        ...prev,
        location: location,
      }));
    }
  }, [location]);

  useEffect(() => {
    if (listings.length > 0) {
      applyFilters();
    }
  }, [filters]);

  useEffect(() => {
    if (filteredListings.length > 0) {
      const listingWithCoords = filteredListings.find(
        (listing) =>
          listing.location &&
          listing.location.coordinates &&
          listing.location.coordinates.lat &&
          listing.location.coordinates.lng
      );

      if (listingWithCoords && listingWithCoords.location.coordinates) {
        setMapCenter({
          lat: listingWithCoords.location.coordinates.lat,
          lng: listingWithCoords.location.coordinates.lng,
        });
      }
    }
  }, [filteredListings]);

  const geocodeAddress = async (address) => {
    if (!address || address.trim() === "") {
      console.warn("Empty address provided for geocoding");
      return null;
    }

    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      address
    )}&key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}`;

    try {
      const response = await fetch(geocodeUrl);
      const data = await response.json();

      if (data.status === "OK" && data.results && data.results.length > 0) {
        const { lat, lng } = data.results[0].geometry.location;
        return { lat, lng };
      } else {
        console.error(
          "Geocoding failed for address:",
          address,
          "Status:",
          data.status,
          "Error:",
          data.error_message || "Unknown error"
        );
        return null;
      }
    } catch (error) {
      console.error("Error during geocoding:", error);
      return null;
    }
  };

  const fetchListings = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "listings"));
      const listingsData = await Promise.all(
        querySnapshot.docs.map(async (doc, index) => {
          const data = doc.data();

          if (
            !data.location?.coordinates ||
            !data.location.coordinates.lat ||
            !data.location.coordinates.lng
          ) {
            await new Promise((resolve) => setTimeout(resolve, index * 200));

            const address = `${data.location?.street || ""}, ${
              data.location?.city || ""
            }, ${data.location?.country || ""}`;

            try {
              let coordinates = await geocodeAddress(address);

              if (!coordinates && data.location?.city) {
                const simplifiedAddress = `${data.location.city}, ${
                  data.location?.country || ""
                }`;
                coordinates = await geocodeAddress(simplifiedAddress);
              }

              // Use coordinates or default to Nice
              data.location = data.location || {};
              data.location.coordinates = coordinates || {
                lat: 43.7102,
                lng: 7.262,
              };
            } catch (error) {
              console.error("Error during geocoding in fetchListings:", error);
              data.location = data.location || {};
              data.location.coordinates = { lat: 48.8566, lng: 2.3522 };
            }
          }

          return {
            id: doc.id,
            ...data,
          };
        })
      );

      setListings(listingsData);
      return listingsData;
    } catch (error) {
      console.error("Error fetching listings:", error);
      return [];
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

  const applyFilters = (listingsToFilter = listings) => {
    console.log("Applying filters - Listings count:", listingsToFilter.length);
    console.log("Current location filter:", filters.location);

    let filtered = [...listingsToFilter];

    if (filters.location) {
      filtered = filtered.filter((listing) => {
        const cityMatch =
          listing.location?.city
            ?.toLowerCase()
            ?.includes(filters.location.toLowerCase()) || false;
        const countryMatch =
          listing.location?.country
            ?.toLowerCase()
            ?.includes(filters.location.toLowerCase()) || false;
        return cityMatch || countryMatch;
      });

      console.log("After location filtering - Results:", filtered.length);
    }

    if (filters.minPrice) {
      filtered = filtered.filter(
        (listing) => listing.details?.rent >= parseInt(filters.minPrice)
      );
    }

    if (filters.maxPrice) {
      filtered = filtered.filter(
        (listing) => listing.details?.rent <= parseInt(filters.maxPrice)
      );
    }

    if (filters.maxBudget) {
      filtered = filtered.filter(
        (listing) => listing.details?.rent <= parseInt(filters.maxBudget)
      );
    }

    if (filters.propertyType) {
      filtered = filtered.filter(
        (listing) => listing.details?.propertyType === filters.propertyType
      );
    }

    // Filtre par date de disponibilité
    if (filters.availableFrom) {
      filtered = filtered.filter(
        (listing) => listing.details?.availableDate >= filters.availableFrom
      );
    }

    // Filtre par amenités
    Object.entries(filters.amenities).forEach(([amenity, isRequired]) => {
      if (isRequired) {
        filtered = filtered.filter((listing) => listing.services?.[amenity]);
      }
    });

    // Tri
    switch (filters.sortBy) {
      case "priceAsc":
        filtered.sort(
          (a, b) => (a.details?.rent || 0) - (b.details?.rent || 0)
        );
        break;
      case "priceDesc":
        filtered.sort(
          (a, b) => (b.details?.rent || 0) - (a.details?.rent || 0)
        );
        break;
      case "newest":
        filtered.sort(
          (a, b) => (b.metadata?.createdAt || 0) - (a.metadata?.createdAt || 0)
        );
        break;
      default:
        break;
    }

    setFilteredListings(filtered);
  };

  const renderMarkers = () => {
    return filteredListings.map((listing) => {
      if (
        !listing.location?.coordinates ||
        !listing.location.coordinates.lat ||
        !listing.location.coordinates.lng
      ) {
        return null;
      }

      return (
        <Marker
          key={listing.id}
          position={{
            lat: listing.location.coordinates.lat,
            lng: listing.location.coordinates.lng,
          }}
          onClick={() => setSelectedListing(listing)}
        />
      );
    });
  };

  if (loadError)
    return <div className="map-error">Error loading Google Maps</div>;

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
            <h3>
              <i className="fas fa-filter"></i> Filters
            </h3>
            <div className="filter-group">
              <label>
                <i className="fas fa-map-marker-alt"></i> Location
              </label>
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
              <label>
                <i className="fas fa-euro-sign"></i> Price Range
              </label>
              <div className="price-inputs">
                <input
                  type="number"
                  name="minPrice"
                  value={filters.minPrice || ""}
                  onChange={handleFilterChange}
                  placeholder="Min"
                  className="filter-input"
                />
                <span>-</span>
                <input
                  type="number"
                  name="maxPrice"
                  value={filters.maxPrice || ""}
                  onChange={handleFilterChange}
                  placeholder="Max"
                  className="filter-input"
                />
              </div>
            </div>
            <div className="filter-group">
              <label>
                <i className="fas fa-calendar-alt"></i> Available From
              </label>
              <input
                type="date"
                name="availableFrom"
                value={filters.availableFrom}
                onChange={handleFilterChange}
                className="filter-input"
              />
            </div>
            <div className="filter-group">
              <label>
                <i className="fas fa-home"></i> Property Type
              </label>
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
              <h4>
                <i className="fas fa-concierge-bell"></i> Amenities
              </h4>
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
                <i className="fas fa-bolt"></i>
                <span className="toggle-label">Instant Booking</span>
              </label>
            </div>
            <div className="filters-section alerts-section">
              <h3>
                <i className="fas fa-bell"></i> Alertes
              </h3>
              {user ? (
                <>
                  <div className="alert-toggle">
                    <label className="toggle-label">
                      <input
                        type="checkbox"
                        checked={alertSettings.enabled}
                        onChange={(e) => {
                          const newEnabled = e.target.checked;
                          setAlertSettings((prev) => ({
                            ...prev,
                            enabled: newEnabled,
                          }));

                          if (!newEnabled) {
                            saveAlertSettings();
                          }
                        }}
                      />
                      <span className="toggle-switch"></span>
                      Recevoir des alertes
                    </label>
                  </div>

                  {alertSettings.enabled && (
                    <>
                      <button
                        onClick={() => {
                          setAlertSettings({
                            ...alertSettings,
                            enabled: true,
                            minBudget: filters.minPrice || "",
                            maxBudget:
                              filters.maxPrice || filters.maxBudget || "",
                            location: filters.location || "",
                          });
                        }}
                        className="secondary-button use-filters-button"
                      >
                        <i className="fas fa-filter"></i> Utiliser les filtres
                        actuels
                      </button>

                      <div className="filter-group">
                        <label>
                          <i className="fas fa-euro-sign"></i> Budget min-max
                          (€)
                        </label>
                        <div className="budget-inputs">
                          <input
                            type="number"
                            placeholder="Min"
                            value={alertSettings.minBudget}
                            onChange={(e) =>
                              setAlertSettings((prev) => ({
                                ...prev,
                                minBudget: e.target.value,
                              }))
                            }
                            className="form-input"
                          />
                          <input
                            type="number"
                            placeholder="Max"
                            value={alertSettings.maxBudget}
                            onChange={(e) =>
                              setAlertSettings((prev) => ({
                                ...prev,
                                maxBudget: e.target.value,
                              }))
                            }
                            className="form-input"
                          />
                        </div>
                      </div>

                      <div className="filter-group">
                        <label>
                          <i className="fas fa-map-marker-alt"></i> Ville
                        </label>
                        <input
                          type="text"
                          placeholder="Ville"
                          value={alertSettings.location}
                          onChange={(e) =>
                            setAlertSettings((prev) => ({
                              ...prev,
                              location: e.target.value,
                            }))
                          }
                          className="form-input"
                        />
                      </div>

                      <button
                        onClick={saveAlertSettings}
                        className="primary-button alert-save-button"
                      >
                        <i className="fas fa-save"></i> Enregistrer l'alerte
                      </button>

                      <p className="alert-info">
                        <i className="fas fa-info-circle"></i>
                        Vous serez alerté lorsque de nouvelles annonces
                        correspondant à vos critères seront publiées.
                      </p>
                    </>
                  )}
                </>
              ) : (
                <p className="alert-login-message">
                  <a href="/login" className="alert-login-link">
                    Connectez-vous
                  </a>{" "}
                  pour configurer des alertes
                </p>
              )}
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
                      src={
                        listing.photos?.[0] || "/Images/default-property.jpg"
                      }
                      alt={listing.details?.title || "Property"}
                      className="listing-photo"
                    />
                    <FavoriteButton listingId={listing.id} />
                    <div className="listing-price">
                      €{listing.details?.rent}/month
                    </div>
                  </div>
                  <div className="listing-info">
                    <h3>{listing.details?.title || "No title"}</h3>
                    <div className="listing-location">
                      <i className="fas fa-map-marker-alt"></i>
                      {listing.location?.city || "Unknown city"},{" "}
                      {listing.location?.country || "Unknown country"}
                    </div>
                    <div className="listing-details">
                      <span>
                        <i className="fas fa-bed"></i>
                        {listing.housing?.totalRoommates || 0} roommates
                      </span>
                      <span>
                        <i className="fas fa-bath"></i>
                        {listing.housing?.bathrooms || 0} baths
                      </span>
                      <span>
                        <i className="fas fa-ruler-combined"></i>
                        {listing.housing?.privateArea || 0}m²
                      </span>
                    </div>
                    <div className="listing-services">
                      {listing.services?.wifi && (
                        <span className="service-tag">
                          <i className={`fas fa-${getAmenityIcon("wifi")}`}></i>{" "}
                          Wifi
                        </span>
                      )}
                      {listing.services?.washingMachine && (
                        <span className="service-tag">
                          <i
                            className={`fas fa-${getAmenityIcon(
                              "washingMachine"
                            )}`}
                          ></i>{" "}
                          Washer
                        </span>
                      )}
                      {listing.services?.elevator && (
                        <span className="service-tag">
                          <i
                            className={`fas fa-${getAmenityIcon("elevator")}`}
                          ></i>{" "}
                          Elevator
                        </span>
                      )}
                    </div>
                    <div className="listing-available">
                      Available from:{" "}
                      {listing.details?.availableDate
                        ? new Date(
                            listing.details.availableDate
                          ).toLocaleDateString()
                        : "Unknown date"}
                    </div>
                    <div className="listing-author">
                      <img
                        src={
                          listing.contact?.photoURL ||
                          listing.metadata?.userPhotoURL ||
                          "/Images/default-avatar.png"
                        }
                        alt={`Posted by ${listing.contact?.name || "Unknown"}`}
                        className="author-avatar"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "/Images/default-avatar.png";
                        }}
                      />
                      <div className="author-info">
                        <span className="author-name">
                          {listing.contact?.name || "Unknown"}
                        </span>
                        <span className="post-date">
                          {listing.metadata?.createdAt?.toDate
                            ? new Date(
                                listing.metadata.createdAt.toDate()
                              ).toLocaleDateString()
                            : "Unknown date"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="listings-map">
              {!isLoaded ? (
                <div className="loading-map">Loading map...</div>
              ) : (
                <GoogleMap
                  mapContainerStyle={mapContainerStyle}
                  zoom={12}
                  center={mapCenter}
                  options={{
                    disableDefaultUI: false,
                    zoomControl: true,
                    streetViewControl: true,
                    mapTypeControl: false,
                  }}
                >
                  {renderMarkers()}

                  {selectedListing && selectedListing.location?.coordinates && (
                    <InfoWindow
                      position={{
                        lat: selectedListing.location.coordinates.lat,
                        lng: selectedListing.location.coordinates.lng,
                      }}
                      onCloseClick={() => setSelectedListing(null)}
                    >
                      <div
                        className={`map-info-window ${
                          infoWindowClosing ? "fade-out-animation" : ""
                        }`}
                        onMouseLeave={handleInfoWindowMouseLeave}
                      >
                        <img
                          src={
                            selectedListing.photos?.[0] ||
                            "/Images/default-property.jpg"
                          }
                          alt={selectedListing.details?.title || "Property"}
                          className="info-window-image"
                        />
                        <h4>{selectedListing.details?.title || "No title"}</h4>
                        <p className="info-price">
                          €{selectedListing.details?.rent || 0}/month
                        </p>
                        <p>
                          {selectedListing.location?.city || "Unknown city"},{" "}
                          {selectedListing.location?.country ||
                            "Unknown country"}
                        </p>
                        <button
                          className="view-listing-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/listing/${selectedListing.id}`);
                          }}
                        >
                          View Details
                        </button>
                      </div>
                    </InfoWindow>
                  )}
                </GoogleMap>
              )}
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
    washingMachine: "soap",
    parking: "parking",
    elevator: "door-open",
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