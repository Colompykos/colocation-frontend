import React, { useState, useEffect } from "react";
import { db } from "../../config/firebase";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import ListingCard from "../ListingCard/ListingCard";
import "./AdminListings.css";

const AdminListings = () => {
  const [listings, setListings] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    reported: 0,
    pending: 0,
    blocked: 0,
  });

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "listings"));
      const listingsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        status: doc.data().status || "pending",
      }));

      const sortedListings = sortListingsByStatus(listingsData);
      setListings(sortedListings);
      updateStats(listingsData);
    } catch (error) {
      console.error("Error fetching listings:", error);
    }
  };

  const sortListingsByStatus = (listings) => {
    const statusOrder = { pending: 1, active: 2, blocked: 3 };
    return listings.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);
  };

  const updateStats = (listings) => {
    setStats({
      total: listings.length,
      active: listings.filter((l) => l.status === "active").length,
      reported: listings.filter((l) => l.reports?.length > 0).length,
      pending: listings.filter((l) => l.status === "pending" || !l.status).length,
      blocked: listings.filter((l) => l.status === "blocked").length,
    });
  };

  const handleModerate = async (listingId, action) => {
    try {
      const listingRef = doc(db, "listings", listingId);
      const timestamp = new Date();

      const actionsMap = {
        approve: {
          status: "active",
          isVisible: true,
          approvedAt: timestamp,
          updatedAt: timestamp,
        },
        block: {
          status: "blocked",
          isVisible: false,
          blockedAt: timestamp,
          updatedAt: timestamp,
        },
        unblock: {
          status: "active",
          isVisible: true,
          blockedAt: null,
          updatedAt: timestamp,
        },
      };

      if (action === "delete") {
        if (window.confirm("Êtes-vous sûr de vouloir supprimer cette annonce ?")) {
          await deleteDoc(listingRef);
        }
      } else {
        await updateDoc(listingRef, actionsMap[action]);
      }

      fetchListings();
    } catch (error) {
      console.error("Error moderating listing:", error);
    }
  };

  const renderStatCard = (title, value) => (
    <div className="stat-card">
      <h3>{title}</h3>
      <div className="number">{value}</div>
    </div>
  );

  return (
    <div className="admin-listings">
      <div className="stats-grid">
        {renderStatCard("Total Annonces", stats.total)}
        {renderStatCard("Annonces Actives", stats.active)}
        {renderStatCard("En attente", stats.pending)}
        {renderStatCard("Bloquées", stats.blocked)}
        {renderStatCard("Signalements", stats.reported)}
      </div>

      <div className="listings-section">
        <h2>Toutes les Annonces</h2>
        <div className="listings-grid">
          {listings.map((listing) => (
            <div key={listing.id} className="listing-card-container">
              <div className="listing-status-badge">
                <span className={`status-indicator ${listing.status || "pending"}`}>
                  {listing.status === "active"
                    ? "Active"
                    : listing.status === "blocked"
                    ? "Bloquée"
                    : "En attente"}
                </span>
              </div>
              <ListingCard
                listing={listing}
                showFavorite={false}
                showStatus={true}
              />
              <div className="listing-admin-actions">
                {listing.status !== "active" && (
                  <button
                    onClick={() => handleModerate(listing.id, "approve")}
                    className="approve-button"
                    data-tooltip="Approuver"
                  >
                    <i className="fas fa-check"></i>
                  </button>
                )}
                <button
                  onClick={() =>
                    handleModerate(
                      listing.id,
                      listing.status === "blocked" ? "unblock" : "block"
                    )
                  }
                  className={`block-button ${
                    listing.status === "blocked" ? "unblock" : ""
                  }`}
                  data-tooltip={
                    listing.status === "blocked" ? "Débloquer" : "Bloquer"
                  }
                >
                  <i
                    className={`fas fa-${
                      listing.status === "blocked" ? "unlock" : "lock"
                    }`}
                  ></i>
                </button>
                <button
                  onClick={() => handleModerate(listing.id, "delete")}
                  className="delete-button"
                  data-tooltip="Supprimer"
                >
                  <i className="fas fa-trash"></i>
                </button>
              </div>
              {listing.reports?.length > 0 && (
                <div className="reports-badge">
                  <i className="fas fa-flag"></i>
                  {listing.reports.length} signalement(s)
                  <div className="reports-details">
                    {listing.reports.map((report, index) => (
                      <div key={index} className="report-item">
                        <span className="reporter">{report.userName}</span>
                        <span className="report-date">
                          {report.date
                            ? new Date(report.date).toLocaleDateString("fr-FR")
                            : "Date inconnue"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminListings;