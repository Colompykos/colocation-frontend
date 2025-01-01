import React, { useState, useEffect } from "react";
import { getAuth, updateProfile } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../config/firebase";
import { useNavigate } from "react-router-dom";
import "./Profile.css";

const Profile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({
    photoURL: "",
    budget: "",
    location: "",
    housingType: "",
    description: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const auth = getAuth();
  const storage = getStorage();

  useEffect(() => {
    if (auth.currentUser) {
      setProfile((prev) => ({
        ...prev,
        photoURL: auth.currentUser.photoURL || "/images/default-avatar.png",
      }));
    }
  }, []);

  const handlePhotoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setIsLoading(true);
      const formData = new FormData();
      formData.append("photo", file);

      const response = await fetch("http://localhost:5000/api/upload/profile", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (!data.success) throw new Error(data.error);

      // Construire l'URL complète
      const photoURL = `http://localhost:5000${data.photoURL}`;

      // Mettre à jour le profil Firebase
      await updateProfile(auth.currentUser, { photoURL });

      // Mettre à jour l'état local
      setProfile((prev) => ({ ...prev, photoURL }));
      setError("");
    } catch (err) {
      setError("Failed to upload photo: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!profile.budget) {
      setError("Please enter your budget");
      return;
    }
    if (!profile.location) {
      setError("Please enter your preferred location");
      return;
    }
    if (!profile.housingType) {
      setError("Please select a housing type");
      return;
    }
    if (!profile.description) {
      setError("Please enter a description about yourself");
      return;
    }

    setIsLoading(true);

    try {
      const userRef = doc(db, "users", auth.currentUser.uid);
      await setDoc(userRef, {
        ...profile,
        updatedAt: serverTimestamp(),
      });
      setError("");
      navigate("/LoggedIn");
    } catch (err) {
      setError("Failed to update profile: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="profile-container">
      <h1>Edit Profile</h1>
      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="photo-upload">
          <img
            src={profile.photoURL || "/images/default-avatar.png"}
            alt="Profile"
            className="profile-photo"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "/images/default-avatar.png";
            }}
          />
          <input
            type="file"
            accept="image/*"
            onChange={handlePhotoUpload}
            id="photo-upload"
            style={{ display: "none" }}
          />
          <label
            htmlFor="photo-upload"
            className="upload-button"
            style={{ pointerEvents: isLoading ? "none" : "auto" }}
          >
            {isLoading ? "Uploading..." : "Change Photo"}
          </label>
        </div>

        <div className="form-group">
          <label>Budget (€/month)</label>
          <input
            type="number"
            value={profile.budget}
            onChange={(e) =>
              setProfile((prev) => ({ ...prev, budget: e.target.value }))
            }
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label>Preferred Location</label>
          <input
            type="text"
            value={profile.location}
            onChange={(e) =>
              setProfile((prev) => ({ ...prev, location: e.target.value }))
            }
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label>Housing Type</label>
          <select
            value={profile.housingType}
            onChange={(e) =>
              setProfile((prev) => ({ ...prev, housingType: e.target.value }))
            }
            className="form-input"
          >
            <option value="">Select housing type</option>
            <option value="apartment">Apartment</option>
            <option value="house">House</option>
            <option value="studio">Studio</option>
          </select>
        </div>

        <div className="form-group">
          <label>About Me</label>
          <textarea
            value={profile.description}
            onChange={(e) =>
              setProfile((prev) => ({ ...prev, description: e.target.value }))
            }
            className="form-input"
            rows="4"
            placeholder="Tell us about your hobbies, lifestyle..."
          />
        </div>

        <button type="submit" className="submit-button" disabled={isLoading}>
          {isLoading ? "Saving..." : "Save Profile"}
        </button>
      </form>
    </div>
  );
};

export default Profile;
