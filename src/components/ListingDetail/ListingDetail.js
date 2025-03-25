import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "../../config/firebase";
import { useSwipeable } from "react-swipeable";
import { useAuth } from "../../contexts/AuthContext";
import FavoriteButton from "../Favorites/FavoriteButton";
import styles from "./ListingDetail.module.css";

const ListingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [reported, setReported] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) return;
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          setIsAdmin(userDoc.data()?.isAdmin || false);
        }
      } catch (error) {
        console.error("Error checking admin status:", error);
      }
    };

    checkAdminStatus();
  }, [user]);

  const checkIfReported = (listing) => {
    if (!user || !listing?.reports) return false;
    return listing.reports.some((report) => report.userId === user.uid);
  };

  useEffect(() => {
    const fetchListing = async () => {
      try {
        setLoading(true);
        const listingSnap = await getDoc(doc(db, "listings", id));

        if (listingSnap.exists()) {
          const listingData = { id: listingSnap.id, ...listingSnap.data() };

          if (listingData.status === "blocked") {
            setListing(null);
            setError(
              "Cette annonce a été bloquée par un administrateur. Veuillez contacter l'équipe de support à support@miagecoloc.com."
            );
            return;
          }

          if (listingData.status === "pending" && !isAdmin) {
            setListing(null);
            setError(
              "Cette annonce est en cours de vérification par nos équipes."
            );
            return;
          }

          setListing(listingData);
          setReported(checkIfReported(listingData));
        } else {
          setListing(null);
          setError(
            "L'annonce que vous recherchez n'existe pas ou a été supprimée."
          );
        }
      } catch (error) {
        console.error("Error fetching listing:", error);
        setError("Une erreur est survenue lors du chargement de l'annonce.");
      } finally {
        setLoading(false);
      }
    };

    fetchListing();
  }, [id, navigate, isAdmin]);

  const handleReport = async () => {
    if (!user) {
      navigate("/login");
      return;
    }

    if (reported || checkIfReported(listing)) {
      alert("Vous avez déjà signalé cette annonce");
      return;
    }

    try {
      const listingRef = doc(db, "listings", id);

      await updateDoc(listingRef, {
        reports: arrayUnion({
          userId: user.uid,
          userName: user.displayName || user.email,
          date: new Date().toISOString(),
          reason: "Contenu inapproprié",
          reportedAt: new Date().toISOString(),
        }),
      });

      setReported(true);
      alert("Annonce signalée avec succès");
    } catch (error) {
      console.error("Error reporting listing:", error);
      alert("Erreur lors du signalement");
    }
  };

  const openModal = (image) => {
    setSelectedImage(image);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedImage(null);
  };

  const handleSwipeLeft = () => {
    setCurrentPhotoIndex((prev) =>
      prev < listing.photos.length - 1 ? prev + 1 : 0
    );
  };

  const handleSwipeRight = () => {
    setCurrentPhotoIndex((prev) =>
      prev > 0 ? prev - 1 : listing.photos.length - 1
    );
  };

  const swipeHandlers = useSwipeable({
    onSwipedLeft: handleSwipeLeft,
    onSwipedRight: handleSwipeRight,
  });

  useEffect(() => {
    if (listing) {
      setSelectedImage(listing.photos[currentPhotoIndex]);
    }
  }, [currentPhotoIndex, listing]);

  if (loading) {
    return <div className={styles.loadingState}>Loading...</div>;
  }
  if (error) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorBox}>
          <i className="fas fa-exclamation-circle"></i>
          <h2>Annonce non disponible</h2>
          <p>{error}</p>
          <button onClick={() => navigate("/search")} className={styles.returnButton}>
            <i className="fas fa-arrow-left"></i> Retour aux annonces
          </button>
          {error.includes("bloquée") && (
            <a href="mailto:support@miagecoloc.com" className={styles.contactLink}>
              <i className="fas fa-envelope"></i> Contacter l'administrateur
            </a>
          )}
        </div>
      </div>
    );
  }

  if (!listing) {
    return <div className={styles.errorState}>Listing not found</div>;
  }

  return (
    <div className={styles.detailContainer}>
      <div className={styles.gallerySection}>
        <div className={styles.mainPhotoContainer}>
          <img
            src={
              listing.photos[currentPhotoIndex] ||
              "/Images/default-property.jpg"
            }
            alt={listing.details.title}
            className={styles.mainPhoto}
            onClick={() => openModal(listing.photos[currentPhotoIndex])}
          />
          <FavoriteButton listingId={listing.id} />
          {listing.photos.length > 1 && (
            <div className={styles.photoNav}>
              <button
                onClick={() =>
                  setCurrentPhotoIndex((prev) =>
                    prev > 0 ? prev - 1 : listing.photos.length - 1
                  )
                }
                className={styles.navButton}
              >
                ‹
              </button>
              <button
                onClick={() =>
                  setCurrentPhotoIndex((prev) =>
                    prev < listing.photos.length - 1 ? prev + 1 : 0
                  )
                }
                className={styles.navButton}
              >
                ›
              </button>
            </div>
          )}
        </div>
        <div className={styles.thumbnailGrid}>
          {listing.photos.map((photo, index) => (
            <img
              key={index}
              src={photo}
              alt={`Thumbnail ${index + 1}`}
              className={`${styles.thumbnail} ${
                currentPhotoIndex === index ? styles.activeThumbnail : ""
              }`}
              onClick={() => setCurrentPhotoIndex(index)}
            />
          ))}
        </div>
      </div>

      <div className={styles.contentSection}>
        <div className={styles.headerSection}>
          <h1 className={styles.title}>{listing.details.title}</h1>
          <div className={styles.priceTag}>€{listing.details.rent}/month</div>
        </div>

        <div className={styles.locationSection}>
          <h3>Location</h3>
          <p>{listing.location.street}</p>
          <p>
            {listing.location.postalCode} {listing.location.city},{" "}
            {listing.location.country}
          </p>
        </div>

        <div className={styles.featuresGrid}>
          <div className={styles.featureItem}>
            <i className="fas fa-users"></i>
            <span>{listing.housing.totalRoommates} roommates</span>
          </div>
          <div className={styles.featureItem}>
            <i className="fas fa-bath"></i>
            <span>{listing.housing.bathrooms} bathrooms</span>
          </div>
          <div className={styles.featureItem}>
            <i className="fas fa-ruler-combined"></i>
            <span>{listing.housing.privateArea}m² private area</span>
          </div>
          <div className={styles.featureItem}>
            <i className="fas fa-home"></i>
            <span>{listing.details.propertyType}</span>
          </div>
        </div>

        <div className={styles.propertySection}>
          <h3>Property Details</h3>
          <div className={styles.detailsGrid}>
            <div className={styles.detailItem}>
              <span className={styles.label}>Total Area:</span>
              <span>{listing.details.totalArea}m²</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.label}>Rooms:</span>
              <span>{listing.details.rooms}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.label}>Floor:</span>
              <span>{listing.details.floor || "Ground"}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.label}>Furnished:</span>
              <span>{listing.details.furnished ? "Yes" : "No"}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.label}>Available From:</span>
              <span>
                {new Date(listing.details.availableDate).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        <div className={styles.amenitiesSection}>
          <h3>Amenities</h3>
          <div className={styles.amenitiesGrid}>
            {Object.entries(listing.services).map(
              ([key, value]) =>
                value && (
                  <div key={key} className={styles.amenityItem}>
                    <i className={`fas fa-${getAmenityIcon(key)}`}></i>
                    <span>{formatAmenityName(key)}</span>
                  </div>
                )
            )}
          </div>
        </div>

        <div className={styles.descriptionSection}>
          <h3>Description</h3>
          <p>{listing.details.description}</p>
        </div>
        <div className={styles.contactSection}>
          <h3>Contact</h3>
          <div className={styles.contactInfo}>
            <p>
              <i className="fas fa-user"></i> {listing.contact.name}
            </p>
            <p>
              <i className="fas fa-phone"></i> {listing.contact.phone}
            </p>
            <p>
              <i className="fas fa-envelope"></i> {listing.contact.email}
            </p>
          </div>
        </div>

        {user && user.uid !== listing.metadata.userId && (
          <div className={styles.floatingMessageButton}>
            <button
              className={styles.chatButton}
              onClick={() =>
                navigate(`/messages?recipientId=${listing.metadata.userId}`)
              }
            >
              <i className="fas fa-comments"></i> Message
            </button>
          </div>
        )}
      </div>

      <div className={styles.reportSection}>
        {user && !isAdmin && !reported && !checkIfReported(listing) && (
          <button onClick={handleReport} className={styles.reportButton}>
            <i className="fas fa-flag"></i>
            Signaler cette annonce
          </button>
        )}
      </div>

      {isModalOpen && (
        <div className={styles.modal} onClick={closeModal}>
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selectedImage}
              alt="Full view"
              className={styles.fullImage}
            />
            <button className={styles.closeButton} onClick={closeModal}>
              ×
            </button>
            {listing.photos.length > 1 && (
              <>
                <button
                  onClick={handleSwipeRight}
                  className={styles.prevButton}
                >
                  ‹
                </button>
                <button onClick={handleSwipeLeft} className={styles.nextButton}>
                  ›
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const getAmenityIcon = (amenity) => {
  const icons = {
    wifi: "wifi",
    handicapAccess: "wheelchair",
    kitchenware: "utensils",
    microwave: "microwave",
    laundry: "soap",
    bikeParking: "bicycle",
    linens: "bed",
    washingMachine: "soap",
    tv: "tv",
    doubleBed: "bed",
    elevator: "door-open",
    parking: "parking",
  };
  return icons[amenity] || "check";
};

const formatAmenityName = (key) => {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase());
};

export default ListingDetail;
