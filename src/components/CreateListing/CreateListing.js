import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../config/firebase";
import axios from "axios";
import "./CreateListing.css";

import LocationStep from "./steps/LocationStep";
import HousingStep from "./steps/HousingStep";
import DetailsStep from "./steps/DetailsStep";
import PhotosStep from "./steps/PhotosStep";
import ServicesStep from "./steps/ServicesStep";
import ContactStep from "./steps/ContactStep";

const stepLabels = {
  1: "Localisation",
  2: "Logement",
  3: "Détails",
  4: "Photos",
  5: "Services",
  6: "Contact",
};

const CreateListing = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [isVerified, setIsVerified] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const searchParams = new URLSearchParams(location.search);
  const editId = searchParams.get("edit");
  const [isEditing, setIsEditing] = useState(!!editId);

  const [formData, setFormData] = useState({
    street: "",
    postalCode: "",
    city: "",
    country: "",
    totalRoommates: "",
    bathrooms: "",
    privateArea: "",
    propertyType: "",
    totalArea: "",
    rooms: "",
    floor: "",
    furnished: false,
    availableDate: "",
    rent: "",
    title: "",
    description: "",
    photos: [],
    services: {
      wifi: false,
      handicapAccess: false,
      kitchenware: false,
      microwave: false,
      laundry: false,
      bikeParking: false,
      linens: false,
      washingMachine: false,
      tv: false,
      doubleBed: false,
      elevator: false,
      parking: false,
    },
    contactName: "",
    contactPhone: "",
    contactEmail: "",
    acceptTerms: false,
  });

  useEffect(() => {
    const checkVerification = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (!userDoc.exists() || !userDoc.data().isVerified) {
        navigate("/profile");
      } else {
        setIsVerified(true);
        setIsLoading(false);
      }
    };

    checkVerification();
  }, [user, navigate]);

  useEffect(() => {
    const fetchListingData = async () => {
      if (!isEditing || !user) return;

      try {
        setIsLoading(true);
        const listingDoc = await getDoc(doc(db, "listings", editId));

        if (!listingDoc.exists()) {
          setError("L'annonce que vous essayez de modifier n'existe pas.");
          setIsLoading(false);
          return;
        }

        const listingData = listingDoc.data();

        if (listingData.metadata?.userId !== user.uid) {
          setError("Vous n'êtes pas autorisé à modifier cette annonce.");
          setIsLoading(false);
          return;
        }

        const preparedPhotos =
          listingData.photos?.map((photoUrl) => ({
            preview: photoUrl,
            isExisting: true,
            url: photoUrl,
            name: photoUrl.split("/").pop(),
          })) || [];

        // Remplir le formulaire avec les données existantes
        setFormData({
          // Localisation
          street: listingData.location?.street || "",
          postalCode: listingData.location?.postalCode || "",
          city: listingData.location?.city || "",
          country: listingData.location?.country || "",
          coordinates: listingData.location?.coordinates || null,

          // Logement
          totalRoommates: listingData.housing?.totalRoommates || "",
          bathrooms: listingData.housing?.bathrooms || "",
          privateArea: listingData.housing?.privateArea || "",

          // Détails
          propertyType: listingData.details?.propertyType || "",
          totalArea: listingData.details?.totalArea || "",
          rooms: listingData.details?.rooms || "",
          floor: listingData.details?.floor || "",
          furnished: listingData.details?.furnished || false,
          availableDate: listingData.details?.availableDate || "",
          rent: listingData.details?.rent || "",
          title: listingData.details?.title || "",
          description: listingData.details?.description || "",

          // Photos
          photos: preparedPhotos,

          // Services
          services: listingData.services || {
            wifi: false,
            handicapAccess: false,
            kitchenware: false,
            microwave: false,
            laundry: false,
            bikeParking: false,
            linens: false,
            washingMachine: false,
            tv: false,
            doubleBed: false,
            elevator: false,
            parking: false,
          },

          // Contact
          contactName: listingData.contact?.name || user?.displayName || "",
          contactPhone: listingData.contact?.phone || "",
          contactEmail: listingData.contact?.email || user?.email || "",
          acceptTerms: true,
        });

        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching listing data:", error);
        setError("Une erreur s'est produite lors du chargement de l'annonce.");
        setIsLoading(false);
      }
    };

    fetchListingData();
  }, [isEditing, editId, user]);

  if (isLoading) {
    return (
      <div className="create-listing-container">
        <div className="loading-spinner"></div>
        <p className="loading-text">Chargement en cours...</p>
      </div>
    );
  }

  if (!user || !isVerified) {
    return (
      <div className="create-listing-container">
        <h2>Accès non autorisé</h2>
        <p>Votre compte doit être vérifié pour publier une annonce.</p>
        <button onClick={() => navigate("/profile")} className="primary-button">
          Retour au profil
        </button>
      </div>
    );
  }

  const validateStep = (step) => {
    setError("");
    switch (step) {
      case 1:
        if (
          !formData.street ||
          !formData.postalCode ||
          !formData.city ||
          !formData.country
        ) {
          setError("Veuillez remplir tous les champs de localisation");
          return false;
        }
        break;
      case 2:
        if (
          !formData.totalRoommates ||
          !formData.bathrooms ||
          !formData.privateArea
        ) {
          setError("Veuillez remplir tous les champs concernant le logement");
          return false;
        }
        break;
      case 3:
        if (
          !formData.propertyType ||
          !formData.totalArea ||
          !formData.rooms ||
          !formData.availableDate ||
          !formData.rent ||
          !formData.title ||
          !formData.description
        ) {
          setError("Veuillez remplir tous les champs obligatoires des détails");
          return false;
        }
        break;
      case 4:
        if (formData.photos.length === 0) {
          setError("Veuillez ajouter au moins une photo");
          return false;
        }
        break;
      case 6:
        if (
          !formData.contactName ||
          !formData.contactPhone ||
          !formData.contactEmail ||
          !formData.acceptTerms
        ) {
          setError(
            "Veuillez remplir tous les champs de contact et accepter les conditions"
          );
          return false;
        }
        break;
      default:
        return true;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => prev - 1);
  };

  const uploadPhotosToCloudinary = async (photos) => {
    const newPhotos = photos.filter((photo) => !photo.isExisting);

    if (newPhotos.length === 0) {
      return photos.map((photo) => photo.url || photo.preview);
    }

    const uploadedUrls = [];
    const cloudinaryUrl = process.env.REACT_APP_CLOUDINARY_URL;
    const uploadPreset = process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET;
    const cloudinaryApiKey = process.env.REACT_APP_CLOUDINARY_API_KEY;

    try {
      for (const photo of newPhotos) {
        const formData = new FormData();
        formData.append("file", photo);
        formData.append("upload_preset", uploadPreset);
        formData.append("api_key", cloudinaryApiKey);
        formData.append("timestamp", Math.floor(Date.now() / 1000));

        const response = await axios.post(cloudinaryUrl, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        if (response.data && response.data.secure_url) {
          uploadedUrls.push(response.data.secure_url);
        } else {
          throw new Error("Invalid response from Cloudinary");
        }
      }

      const existingUrls = photos
        .filter((photo) => photo.isExisting)
        .map((photo) => photo.url || photo.preview);

      return [...existingUrls, ...uploadedUrls];
    } catch (error) {
      console.error("Cloudinary upload error:", error);
      throw new Error(
        "Erreur lors du téléchargement des photos: " +
          (error.response?.data?.error?.message || error.message)
      );
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(6)) return;

    try {
      setIsLoading(true);
      const photoUrls = await uploadPhotosToCloudinary(formData.photos);

      const listingData = {
        location: {
          street: formData.street,
          postalCode: formData.postalCode,
          city: formData.city,
          country: formData.country,
          coordinates: formData.coordinates || { lat: 0, lng: 0 },
        },
        housing: {
          totalRoommates: parseInt(formData.totalRoommates) || 0,
          bathrooms: parseInt(formData.bathrooms) || 0,
          privateArea: parseFloat(formData.privateArea) || 0,
        },
        details: {
          propertyType: formData.propertyType,
          totalArea: parseFloat(formData.totalArea) || 0,
          rooms: parseInt(formData.rooms) || 0,
          floor: formData.floor ? parseInt(formData.floor) : 0,
          furnished: formData.furnished || false,
          availableDate: formData.availableDate,
          rent: parseFloat(formData.rent) || 0,
          title: formData.title,
          description: formData.description,
        },
        photos: photoUrls,
        services: formData.services,
        contact: {
          name: formData.contactName,
          phone: formData.contactPhone,
          email: formData.contactEmail,
        },
      };

      const token = await user.getIdToken();

      if (isEditing) {
        try {
          console.log("Sending PUT request to update listing:", editId);

          const response = await fetch(
            `http://localhost:5000/api/listings/${editId}`,
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ listing: listingData }),
            }
          );

          if (!response.ok) {
            const errorText = await response.text();
            console.error("Server error response:", errorText);
            throw new Error(`HTTP error ${response.status}: ${errorText}`);
          }

          const data = await response.json();

          if (data.success) {
            navigate("/my-listings");
            alert("Annonce mise à jour avec succès!");
          } else {
            throw new Error(
              data.error || "Erreur lors de la mise à jour de l'annonce"
            );
          }
        } catch (error) {
          console.error("Error updating listing:", error);
          setError(
            `Erreur lors de la mise à jour de l'annonce: ${error.message}`
          );
        }
      } else {
        try {
          if (user.uid) {
            const newListingData = {
              ...listingData,
              status: "pending",
              isVisible: true,
              metadata: {
                userId: user.uid,
                userName: user.displayName || formData.contactName,
                userPhotoURL: user.photoURL || null,
                createdAt: new Date().toISOString(),
              },
            };

            console.log("Sending POST request to create listing");

            const response = await fetch("http://localhost:5000/api/listings", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ listing: newListingData }),
            });

            if (!response.ok) {
              const errorText = await response.text();
              console.error("Server error response:", errorText);
              throw new Error(`HTTP error ${response.status}: ${errorText}`);
            }

            const data = await response.json();

            if (data.success) {
              navigate("/my-listings");
              alert(
                "Votre annonce a été créée avec succès et sera visible après validation par un administrateur"
              );
            } else {
              throw new Error(
                data.error || "Erreur lors de la création de l'annonce"
              );
            }
          } else {
            throw new Error("User ID is undefined. Please log in again.");
          }
        } catch (error) {
          console.error("Error creating listing:", error);
          setError(`Erreur lors de la création de l'annonce: ${error.message}`);
        }
      }
    } catch (error) {
      console.error("Error in form submission:", error);
      setError(`Une erreur s'est produite: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <LocationStep formData={formData} setFormData={setFormData} />;
      case 2:
        return <HousingStep formData={formData} setFormData={setFormData} />;
      case 3:
        return <DetailsStep formData={formData} setFormData={setFormData} />;
      case 4:
        return <PhotosStep formData={formData} setFormData={setFormData} />;
      case 5:
        return <ServicesStep formData={formData} setFormData={setFormData} />;
      case 6:
        return <ContactStep formData={formData} setFormData={setFormData} />;
      default:
        return null;
    }
  };

  return (
    <div className="create-listing-container">
      <h1 className="page-title">
        {isEditing ? "Modifier l'annonce" : "Créer une annonce"}
      </h1>

      <div className="steps-indicator">
        {[1, 2, 3, 4, 5, 6].map((step) => (
          <div
            key={step}
            className={`step ${currentStep === step ? "active" : ""} 
                       ${currentStep > step ? "completed" : ""}`}
          >
            <div className="step-circle">{step}</div>
            <span className="step-label">{stepLabels[step]}</span>
          </div>
        ))}
      </div>

      {error && <div className="error-message">{error}</div>}

      {renderStep()}

      <div className="navigation-buttons">
        {currentStep > 1 && (
          <button
            onClick={handlePrevious}
            className="secondary-button"
            disabled={isLoading}
          >
            Précédent
          </button>
        )}
        {currentStep < 6 ? (
          <button
            onClick={handleNext}
            className="primary-button"
            disabled={isLoading}
          >
            Suivant
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            className="primary-button"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="button-spinner"></div>
            ) : isEditing ? (
              "Enregistrer les modifications"
            ) : (
              "Publier l'annonce"
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default CreateListing;
