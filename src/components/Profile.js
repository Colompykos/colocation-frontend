import React, { useState, useEffect } from "react";
import { getAuth, updateProfile } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import axios from 'axios';
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
      formData.append('file', file);
      formData.append('upload_preset', process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET);
  
      const cloudinaryResponse = await fetch(process.env.REACT_APP_CLOUDINARY_URL, {
        method: 'POST',
        body: formData
      });
  
      const cloudinaryData = await cloudinaryResponse.json();
      if (!cloudinaryData.secure_url) {
        throw new Error('Failed to upload to Cloudinary');
      }
  
      await updateProfile(auth.currentUser, {
        photoURL: cloudinaryData.secure_url
      });
  
      setProfile(prev => ({ ...prev, photoURL: cloudinaryData.secure_url }));
      setError("");
  
    } catch (err) {
      console.error('Upload error:', err);
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
      const token = await auth.currentUser.getIdToken();
      const response = await axios.post('http://localhost:5000/api/profile', 
        { profile },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        navigate("/");
      } else {
        setError("Failed to update profile: " + response.data.error);
      }
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