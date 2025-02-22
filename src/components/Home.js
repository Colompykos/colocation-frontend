import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../config/firebase";
import { getAuth, signOut } from "firebase/auth";
import axios from "axios";
import "./Home.css";

const Home = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [listings, setListings] = useState([]);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isVerified, setIsVerified] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

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

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/search?location=${encodeURIComponent(searchQuery)}`);
  };

  useEffect(() => {
    const checkUserStatus = async () => {
      if (!user) {
        setIsVerified(null);
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setIsVerified(userData.isVerified || false);
          setIsAdmin(userData.isAdmin || false);
        }
      } catch (error) {
        console.error("Error checking user status:", error);
        setIsVerified(false);
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkUserStatus();
  }, [user, navigate]);

  return (
    <div className="home-container">
      <nav className="navbar">
        <div className="nav-brand">
          <img src="/Images/LogoApp.png" alt="Logo" className="nav-logo" />
        </div>
        <div className="nav-links">
          <button onClick={() => navigate("/search")} className="nav-button">
            Trouver des Colocataires
          </button>

          {user && !isLoading ? (
            <>
              {isVerified ? (
                <button
                  onClick={() => navigate("/create-listing")}
                  className="nav-button create-listing"
                >
                  Publier une Annonce
                </button>
              ) : (
                <div className="verification-pending">
                  <i className="fas fa-clock"></i>
                  En attente de vérification de votre carte étudiante
                </div>
              )}
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
                      onClick={() => navigate("/favorites")}
                    >
                      <i className="fas fa-heart"></i>
                      Mes Favoris
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
                Connexion
              </button>
              <button
                onClick={() => navigate("/login?signup=true")}
                className="nav-button signup"
              >
                Inscription
              </button>
            </>
          )}
        </div>
      </nav>

      <main className="hero-section">
        <h1>Trouvez Votre Colocation Étudiante Idéale</h1>
        <p className="hero-subtitle">
          Connectez-vous avec des étudiants, partagez des expériences et trouvez
          votre espace de coliving idéal
        </p>

        <div className="search-preview">
          <input
            type="text"
            placeholder="Entrez votre ville ou université"
            className="search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSearch(e)}
          />
          <button onClick={handleSearch} className="search-button">
            Rechercher
          </button>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <img
              src="/images/verified.png"
              alt="Vérifié"
              className="feature-icon"
            />
            <h3>Profils Vérifiés</h3>
            <p>Tous les colocataires sont des étudiants vérifiés</p>
          </div>
          <div className="feature-card">
            <img
              src="/images/matching.png"
              alt="Matching"
              className="feature-icon"
            />
            <h3>Matching Intelligent</h3>
            <p>Trouvez des colocataires compatibles selon votre style de vie</p>
          </div>
          <div className="feature-card">
            <img
              src="/images/secure.png"
              alt="Sécurisé"
              className="feature-icon"
            />
            <h3>Plateforme Sécurisée</h3>
            <p>Communication sûre et sécurisée</p>
          </div>
        </div>
      </main>

      <section className="listings-section">
        <h2>Annonces Disponibles</h2>
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
        <h2>Comment Ça Marche</h2>
        <div className="steps-container">
          <div className="step-home">
            <div className="step-home-number">1</div>
            <h3>Créez votre Profil</h3>
            <p>Inscrivez-vous et créez votre profil détaillé</p>
          </div>
          <div className="step-home">
            <div className="step-home-number">2</div>
            <h3>Trouvez des Correspondances</h3>
            <p>Parcourez et connectez-vous avec des colocataires potentiels</p>
          </div>
          <div className="step-home">
            <div className="step-home-number">3</div>
            <h3>Connectez-vous</h3>
            <p>Chattez et organisez des rencontres avec vos correspondances</p>
          </div>
        </div>
      </section>

      <footer className="home-footer">
        <div className="footer-content">
          <div className="footer-section">
            <h4>À Propos</h4>
            <p>
              Nous aidons les étudiants à trouver leurs colocataires parfaits
              depuis 2024
            </p>
          </div>
          <div className="footer-section">
            <h4>Contact</h4>
            <p>Email: support@miagecoloc.com</p>
            <p>Téléphone: (123) 456-7890</p>
          </div>
          <div className="footer-section">
            <h4>Suivez-nous</h4>
            <div className="social-links">
              <a href="#">Facebook</a>
              <a href="#">Twitter</a>
              <a href="#">Instagram</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2024 Votre Plateforme. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;