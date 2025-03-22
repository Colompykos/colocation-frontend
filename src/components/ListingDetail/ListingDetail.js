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

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) return;
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        setIsAdmin(userDoc.exists() ? userDoc.data()?.isAdmin || false : false);
      } catch (error) {
        console.error("Error checking admin status:", error);
      }
    };

    checkAdminStatus();
  }, [user]);

  useEffect(() => {
    const fetchListing = async () => {
      try {
        setLoading(true);
        const listingSnap = await getDoc(doc(db, "listings", id));
        if (!listingSnap.exists()) {
          navigate("/not-found");
          return;
        }

        const listingData = { id: listingSnap.id, ...listingSnap.data() };
        if (listingData.status === "blocked" && !isAdmin) {
          navigate("/not-found");
          return;
        }

        setListing(listingData);
        setReported(checkIfReported(listingData));
      } catch (error) {
        console.error("Error fetching listing:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchListing();
  }, [id, navigate, isAdmin]);

  const checkIfReported = (listing) => {
    if (!user || !listing?.reports) return false;
    return listing.reports.some((report) => report.userId === user.uid);
  };

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
    return <div className={styles.loadingState}>Chargement...</div>;
  }

  if (!listing) {
    return <div className={styles.errorState}>Annonce introuvable</div>;
  }

  return (
    <div className={styles.detailContainer}>
      <GallerySection
        listing={listing}
        currentPhotoIndex={currentPhotoIndex}
        setCurrentPhotoIndex={setCurrentPhotoIndex}
        openModal={openModal}
        swipeHandlers={swipeHandlers}
      />
      <ContentSection
        listing={listing}
        user={user}
        isAdmin={isAdmin}
        reported={reported}
        handleReport={handleReport}
      />
      {isModalOpen && (
        <ImageModal
          selectedImage={selectedImage}
          closeModal={closeModal}
          handleSwipeLeft={handleSwipeLeft}
          handleSwipeRight={handleSwipeRight}
          photos={listing.photos}
        />
      )}
    </div>
  );
};

const GallerySection = ({
  listing,
  currentPhotoIndex,
  setCurrentPhotoIndex,
  openModal,
  swipeHandlers,
}) => (
  <div className={styles.gallerySection}>
    <div className={styles.mainPhotoContainer} {...swipeHandlers}>
      <img
        src={listing.photos[currentPhotoIndex] || "/Images/default-property.jpg"}
        alt={listing.details.title}
        className={styles.mainPhoto}
        onClick={() => openModal(listing.photos[currentPhotoIndex])}
      />
      <FavoriteButton listingId={listing.id} />
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
);

const ContentSection = ({ listing, user, isAdmin, reported, handleReport }) => (
  <div className={styles.contentSection}>
    <h1 className={styles.title}>{listing.details.title}</h1>
    <p className={styles.priceTag}>€{listing.details.rent}/mois</p>
    <p>{listing.details.description}</p>
    {!isAdmin && user && !reported && (
      <button onClick={handleReport} className={styles.reportButton}>
        Signaler cette annonce
      </button>
    )}
  </div>
);

const ImageModal = ({
  selectedImage,
  closeModal,
  handleSwipeLeft,
  handleSwipeRight,
  photos,
}) => (
  <div className={styles.modal} onClick={closeModal}>
    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
      <img src={selectedImage} alt="Full view" className={styles.fullImage} />
      <button className={styles.closeButton} onClick={closeModal}>
        ×
      </button>
      {photos.length > 1 && (
        <>
          <button onClick={handleSwipeRight} className={styles.prevButton}>
            ‹
          </button>
          <button onClick={handleSwipeLeft} className={styles.nextButton}>
            ›
          </button>
        </>
      )}
    </div>
  </div>
);

export default ListingDetail;