import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Home.css";

const Home = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [listings, setListings] = useState([]);
  const navigate = useNavigate();

  const fetchListings = useCallback(async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/listings");
      setListings(response.data.listings);
    } catch (error) {
      console.error("Error fetching listings:", error);
    }
  }, []);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/search?location=${encodeURIComponent(searchQuery)}`);
  };

  return (
    <div className="home-container">
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
        </div>
          <button onClick={handleSearch} className="search-button">
            Rechercher
          </button>

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
              <a href="https://www.facebook.com/miagecoloc" target="_blank" rel="noopener noreferrer">Facebook</a>
              <a href="https://www.twitter.com/miagecoloc" target="_blank" rel="noopener noreferrer">Twitter</a>
              <a href="https://www.instagram.com/miagecoloc" target="_blank" rel="noopener noreferrer">Instagram</a>
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