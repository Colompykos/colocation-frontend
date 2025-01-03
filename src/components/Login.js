import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";
import {
  getAuth,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  FacebookAuthProvider,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
} from "firebase/auth";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const auth = getAuth();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/");
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const auth = getAuth();
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      await updateProfile(userCredential.user, {
        displayName: `${firstName} ${lastName}`,
      });
      navigate("/profile");
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    const auth = getAuth();
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      if (isSignUp) {
        await updateProfile(result.user, {
          displayName: `${firstName} ${lastName}`,
        });
        navigate("/profile"); 
      } else {
        navigate("/");
      }
    } catch (error) {
      setError(error.message);
    }
  };
  const handleFacebookLogin = async () => {
    const auth = getAuth();
    const provider = new FacebookAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      if (isSignUp) {
        await updateProfile(result.user, {
          displayName: `${firstName} ${lastName}`,
        });
        navigate("/profile"); 
      } else {
        navigate("/");
      }
    } catch (error) {
      setError(error.message);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError("Please enter your email address");
      return;
    }

    try {
      const auth = getAuth();
      await sendPasswordResetEmail(auth, email);
      setError("");
      alert("Password reset email sent. Please check your inbox.");
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="form-side">
          <div className="brand">
            <img src="/Images/LogoApp.png" alt="Logo" className="logo-app" />
          </div>

          <div className="form-content">
            <h1>{isSignUp ? "Sign Up" : "Welcome back"}</h1>
            <p className="subtitle">
              {isSignUp
                ? "Create a new account"
                : "Please sign in to your account"}
            </p>

            <form onSubmit={isSignUp ? handleSignUp : handleLogin}>
              {isSignUp && (
                <div className="name-fields">
                  <div className="form-group">
                    <label>First Name</label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Enter your first name"
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Last Name</label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Enter your last name"
                      className="form-input"
                    />
                  </div>
                </div>
              )}

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="form-input"
                />
              </div>

              {!isSignUp && (
                <div className="forgot-password">
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handleForgotPassword();
                    }}
                  >
                    Forgot Password?
                  </a>
                </div>
              )}

              {error && <div className="error-message">{error}</div>}

              <button
                type="submit"
                className="submit-button"
                disabled={isLoading}
              >
                {isLoading
                  ? isSignUp
                    ? "Signing up..."
                    : "Signing in..."
                  : isSignUp
                  ? "Sign up"
                  : "Sign in"}
              </button>

              <div className="social-login">
                <button
                  type="button"
                  className="social-button facebook"
                  onClick={handleFacebookLogin}
                >
                  <img
                    src="/images/facebookLogo.png"
                    alt="Facebook logo"
                    className="logo-login-facebook"
                  />{" "}
                  Facebook
                </button>
                <button
                  type="button"
                  className="social-button google"
                  onClick={handleGoogleLogin}
                >
                  <img
                    src="/images/Google.png"
                    alt="Google logo"
                    className="logo-login-google"
                  />{" "}
                  Google
                </button>
              </div>
            </form>

            <div className="login-footer">
              <p>
                {isSignUp
                  ? "Already have an account?"
                  : "Don't have an account?"}{" "}
                <a href="#" onClick={() => setIsSignUp(!isSignUp)}>
                  {isSignUp ? "Sign in" : "Sign up"}
                </a>
              </p>
              <a href="#" className="terms">
                Terms & Conditions
              </a>
            </div>
          </div>
        </div>

        <div className="image-side">
          <img src="/images/LoginPage.jpg" alt="Team collaboration" />
          <div className="overlay"></div>
        </div>
      </div>
    </div>
  );
};

export default Login;
