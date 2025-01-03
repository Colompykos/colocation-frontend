import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { getAuth, signOut } from "firebase/auth";
import "./Home.css";

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

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
                onClick={() => navigate("/profile")}
                className="nav-button profile"
              >
                My Profile
              </button>
              <button onClick={handleLogout} className="nav-button logout">
                Logout
              </button>
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

      <section className="how-it-works">
        <h2>How It Works</h2>
        <div className="steps-container">
          <div className="step">
            <div className="step-number">1</div>
            <h3>Create Profile</h3>
            <p>Sign up and create your detailed profile</p>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <h3>Find Matches</h3>
            <p>Browse and connect with potential roommates</p>
          </div>
          <div className="step">
            <div className="step-number">3</div>
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
