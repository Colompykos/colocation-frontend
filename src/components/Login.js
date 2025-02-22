import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../config/firebase";
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
    setError("");
  
    try {
      const auth = getAuth();
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
  
      // Vérifier le statut du compte
      const token = await user.getIdToken();
      const response = await fetch("http://localhost:5000/api/auth/check-status", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        if (data.code === "account-blocked") {
          await auth.signOut();
          throw new Error("Votre compte a été bloqué. Veuillez contacter l'administrateur.");
        }
        throw new Error(data.error || "Erreur de connexion");
      }
  
      // Vérifier si l'utilisateur est admin
      const userDoc = await getDoc(doc(db, "users", user.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.isAdmin) {
          // Si admin, rediriger vers le panneau d'administration
          navigate("/admin");
          return;
        }
      }
      
      // Si non admin, rediriger vers la page d'accueil
      navigate("/");
  
    } catch (error) {
      console.error("Login error:", error);
      setError(error.message);
  
      if (error.message.includes("bloqué")) {
        const auth = getAuth();
        await auth.signOut();
      }
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

      const token = await result.user.getIdToken();
      const response = await fetch(
        "http://localhost:5000/api/auth/check-status",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (data.code === "account-blocked") {
          await auth.signOut();
          throw new Error(
            "Votre compte a été bloqué. Veuillez contacter l'administrateur."
          );
        }
        throw new Error(data.error || "Erreur de connexion");
      }

      if (result.user.photoURL) {
        try {
          const cloudinaryUrl = await uploadAvatarToCloudinary(
            result.user.photoURL
          );
          await updateProfile(result.user, {
            photoURL: cloudinaryUrl,
          });
        } catch (uploadError) {
          console.error("Failed to upload avatar:", uploadError);
        }
      }

      if (isSignUp) {
        await setDoc(doc(db, "users", result.user.uid), {
          displayName: result.user.displayName,
          email: result.user.email,
          photoURL: result.user.photoURL,
          status: "pending",
          isVerified: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
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

      if (result.user.photoURL) {
        try {
          const cloudinaryUrl = await uploadAvatarToCloudinary(
            result.user.photoURL
          );
          await updateProfile(result.user, {
            photoURL: cloudinaryUrl,
          });
        } catch (uploadError) {
          console.error("Failed to upload avatar:", uploadError);
        }
      }

      if (isSignUp) {
        await setDoc(doc(db, "users", result.user.uid), {
          displayName: result.user.displayName,
          email: result.user.email,
          photoURL: result.user.photoURL,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
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

  const uploadAvatarToCloudinary = async (imageUrl) => {
    const auth = getAuth();
    try {
      const formData = new FormData();
      formData.append("file", imageUrl);
      formData.append(
        "upload_preset",
        process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET
      );

      const response = await fetch(process.env.REACT_APP_CLOUDINARY_URL, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (!data.secure_url) {
        throw new Error("Failed to upload avatar to Cloudinary");
      }

      // Sauvegarde dans Firebase
      const userRef = doc(db, "users", auth.currentUser.uid);
      await setDoc(
        userRef,
        {
          photoURL: data.secure_url,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      return data.secure_url;
    } catch (error) {
      console.error("Error uploading avatar:", error);
      throw error;
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
