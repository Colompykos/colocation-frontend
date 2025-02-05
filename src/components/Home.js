import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { getAuth, signOut } from "firebase/auth";
import axios from "axios";
import "./Home.css";

const Home = () => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [listings, setListings] = useState([]);

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/listings");
        setListings(response.data.listings);
      } catch (error) {
        console.error("Error fetching listings:", error);
      }
    };

    fetchListings();
  }, []);

  const handleLogout = async () => {
    try {
      const auth = getAuth();
      await signOut(auth);
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <div className="home-container">
      <nav className="navbar">
        <div className="nav-brand">
          <img src="/Images/LogoApp.png" alt="Logo" className="nav-logo" />
        </div>
        <div className="nav-links">
          <button onClick={() => navigate("/search")} className="nav-button">
            Find Roommates
          </button>

          {user ? (
            <>
              <button
                onClick={() => navigate("/create-listing")}
                className="nav-button create-listing"
              >
                Post Listing
              </button>
              <div className="user-profile">
                <div
                  className="avatar-container"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                >
                  <img
                    src={user.photoURL || "/Images/default-avatar.png"}
                    alt="Profile"
                    className="avatar"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "/Images/default-avatar.png";
                    }}
                  />
                </div>
                {showUserMenu && (
                  <div className="user-menu">
                    <div
                      className="user-menu-item"
                      onClick={() => navigate("/profile")}
                    >
                      <i className="fas fa-user"></i>
                      Mon Profil
                    </div>
                    <div
                      className="user-menu-item"
                      onClick={() => navigate("/my-listings")}
                    >
                      <i className="fas fa-list"></i>
                      Mes Annonces
                    </div>
                    <div
                      className="user-menu-item"
                      onClick={() => navigate("/applications")}
                    >
                      <i className="fas fa-clipboard-list"></i>
                      Mes Candidatures
                    </div>
                    <div
                      className="user-menu-item"
                      onClick={() => navigate("/messages")}
                    >
                      <i className="fas fa-envelope"></i>
                      Messagerie
                    </div>
                    <div
                      className="user-menu-item logout"
                      onClick={handleLogout}
                    >
                      <i className="fas fa-sign-out-alt"></i>
                      Déconnexion
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <button
                onClick={() => navigate("/login")}
                className="nav-button login"
              >
                Login
              </button>
              <button
                onClick={() => navigate("/login?signup=true")}
                className="nav-button signup"
              >
                Sign Up
              </button>
            </>
          )}
        </div>
      </nav>

      <main className="hero-section">
        <h1>Find Your Perfect Student Housing Match</h1>
        <p className="hero-subtitle">
          Connect with students, share experiences, and find your ideal coliving
          space
        </p>

        <div className="search-preview">
          <input
            type="text"
            placeholder="Enter your city or university"
            className="search-input"
          />
          <button onClick={() => navigate("/search")} className="search-button">
            Search
          </button>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <img
              src="/images/verified.png"
              alt="Verified"
              className="feature-icon"
            />
            <h3>Verified Profiles</h3>
            <p>All roommates are verified students</p>
          </div>
          <div className="feature-card">
            <img
              src="/images/matching.png"
              alt="Matching"
              className="feature-icon"
            />
            <h3>Smart Matching</h3>
            <p>Find compatible roommates based on your lifestyle</p>
          </div>
          <div className="feature-card">
            <img
              src="/images/secure.png"
              alt="Secure"
              className="feature-icon"
            />
            <h3>Secure Platform</h3>
            <p>Safe and secure communication</p>
          </div>
        </div>
      </main>

      <section className="listings-section">
        <h2>Available Listings</h2>
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
                  {listing.furnished && (
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
      </section>

      <section className="how-it-works">
        <h2>How It Works</h2>
        <div className="steps-container">
          <div className="step-home">
            <div className="step-home-number">1</div>
            <h3>Create Profile</h3>
            <p>Sign up and create your detailed profile</p>
          </div>
          <div className="step-home">
            <div className="step-home-number">2</div>
            <h3>Find Matches</h3>
            <p>Browse and connect with potential roommates</p>
          </div>
          <div className="step-home">
            <div className="step-home-number">3</div>
            <h3>Connect</h3>
            <p>Chat and arrange meetups with your matches</p>
          </div>
        </div>
      </section>

      <footer className="home-footer">
        <div className="footer-content">
          <div className="footer-section">
            <h4>About Us</h4>
            <p>Helping students find their perfect roommates since 2024</p>
          </div>
          <div className="footer-section">
            <h4>Contact</h4>
            <p>Email: support@miagecoloc.com</p>
            <p>Phone: (123) 456-7890</p>
          </div>
          <div className="footer-section">
            <h4>Follow Us</h4>
            <div className="social-links">
              <a href="#">Facebook</a>
              <a href="#">Twitter</a>
              <a href="#">Instagram</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2024 Your Platform. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
