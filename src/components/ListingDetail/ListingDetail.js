import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../config/firebase";
import { useSwipeable } from "react-swipeable";
import FavoriteButton from '../Favorites/FavoriteButton';
import styles from './ListingDetail.module.css';

const ListingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    const fetchListing = async () => {
      try {
        const listingRef = doc(db, "listings", id);
        const listingSnap = await getDoc(listingRef);

        if (listingSnap.exists()) {
          setListing({ id: listingSnap.id, ...listingSnap.data() });
        } else {
          navigate("/not-found");
        }
      } catch (error) {
        console.error("Error fetching listing:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchListing();
  }, [id, navigate]);

  const openModal = (image) => {
    setSelectedImage(image);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedImage(null);
  };

  const handleSwipeLeft = () => {
    setCurrentPhotoIndex((prev) => (prev < listing.photos.length - 1 ? prev + 1 : 0));
  };

  const handleSwipeRight = () => {
    setCurrentPhotoIndex((prev) => (prev > 0 ? prev - 1 : listing.photos.length - 1));
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

  if (!listing) {
    return <div className={styles.errorState}>Listing not found</div>;
  }

  return (
    <div className={styles.detailContainer}>
      <div className={styles.gallerySection}>
        <div className={styles.mainPhotoContainer}>
          <img
            src={listing.photos[currentPhotoIndex] || "/Images/default-property.jpg"}
            alt={listing.details.title}
            className={styles.mainPhoto}
            onClick={() => openModal(listing.photos[currentPhotoIndex])}
          />
          <FavoriteButton listingId={listing.id} />
          {listing.photos.length > 1 && (
            <div className={styles.photoNav}>
              <button
                onClick={() => setCurrentPhotoIndex(prev => 
                  prev > 0 ? prev - 1 : listing.photos.length - 1
                )}
                className={styles.navButton}
              >
                ‹
              </button>
              <button
                onClick={() => setCurrentPhotoIndex(prev => 
                  prev < listing.photos.length - 1 ? prev + 1 : 0
                )}
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
                currentPhotoIndex === index ? styles.activeThumbnail : ''
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
          <p>{listing.location.postalCode} {listing.location.city}, {listing.location.country}</p>
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
              <span>{listing.details.floor || 'Ground'}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.label}>Furnished:</span>
              <span>{listing.details.furnished ? 'Yes' : 'No'}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.label}>Available From:</span>
              <span>{new Date(listing.details.availableDate).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        <div className={styles.amenitiesSection}>
          <h3>Amenities</h3>
          <div className={styles.amenitiesGrid}>
            {Object.entries(listing.services).map(([key, value]) => 
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
          <div className={styles.contactGrid}>
            <p><i className="fas fa-user"></i> {listing.contact.name}</p>
            <p><i className="fas fa-phone"></i> {listing.contact.phone}</p>
            <p><i className="fas fa-envelope"></i> {listing.contact.email}</p>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className={styles.modal} onClick={closeModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <img src={selectedImage} alt="Full view" className={styles.fullImage} />
            <button className={styles.closeButton} onClick={closeModal}>×</button>
            {listing.photos.length > 1 && (
              <>
                <button
                  onClick={handleSwipeRight}
                  className={styles.prevButton}
                >
                  ‹
                </button>
                <button
                  onClick={handleSwipeLeft}
                  className={styles.nextButton}
                >
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
    wifi: 'wifi',
    handicapAccess: 'wheelchair',
    kitchenware: 'utensils',
    microwave: 'microwave',
    laundry: 'washing-machine',
    bikeParking: 'bicycle',
    linens: 'bed',
    washingMachine: 'washing-machine',
    tv: 'tv',
    doubleBed: 'bed',
    elevator: 'elevator',
    parking: 'parking'
  };
  return icons[amenity] || 'check';
};

const formatAmenityName = (key) => {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
};

export default ListingDetail;