import React from 'react';
import { useNavigate } from 'react-router-dom';
import FavoriteButton from '../Favorites/FavoriteButton';
import './ListingCard.css';

const ListingCard = ({ listing, showFavorite = true, showStatus = false }) => {
  const navigate = useNavigate();

  if (listing.status === 'blocked' && !showStatus) {
    return null;
  }

  const handleClick = () => {
    if (listing.status === 'blocked' && !showStatus) {
      return;
    }
    navigate(`/listing/${listing.id}`);
  };

  return (
    <div
      className="listing-card"
      onClick={handleClick}
    >
      <div className="listing-image">
        <img
          src={listing.photos[0] || "/Images/default-property.jpg"}
          alt={listing.details.title}
          className="listing-photo"
        />
        {showFavorite && <FavoriteButton listingId={listing.id} />}
        <div className="listing-price">
          €{listing.details.rent}/month
        </div>
        {showStatus && (
          <div className={`listing-status ${listing.status || 'pending'}`}>
            {listing.status === 'active' ? 'Active' :
             listing.status === 'blocked' ? 'Bloquée' :
             listing.status === 'pending' ? 'En attente' : 'En attente'}
          </div>
        )}
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
          {listing.details.furnished && (
            <span className="service-tag">Furnished</span>
          )}
        </div>
        <div className="listing-available">
          Available from:{" "}
          {new Date(listing.details.availableDate).toLocaleDateString()}
        </div>

        <div className="listing-author">
          <img
            src={listing.contact.photoURL || listing.metadata.userPhotoURL || "/Images/default-avatar.png"}
            alt={`Posted by ${listing.contact.name}`}
            className="author-avatar"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "/Images/default-avatar.png";
            }}
          />
          <div className="author-info">
            <span className="author-name">{listing.contact.name}</span>
            <span className="post-date">
              {new Date(listing.metadata.createdAt?.toDate()).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListingCard;