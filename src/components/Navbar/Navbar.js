import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";
import { db } from "../../config/firebase";
import { getAuth, signOut } from "firebase/auth";
import "./Navbar.css";

const Navbar = () => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isVerified, setIsVerified] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const userMenuRef = useRef(null); // Reference for the user menu
  const [alertsCount, setAlertsCount] = useState(0);

  const handleLogout = async () => {
    try {
      const auth = getAuth();
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const checkUserStatus = async () => {
      if (!user) {
        setIsVerified(null);
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setIsVerified(userData.isVerified || false);
          setIsAdmin(userData.isAdmin || false);
        }
      } catch (error) {
        console.error("Error checking user status:", error);
        setIsVerified(false);
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkUserStatus();
  }, [user]);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    const chatsQuery = query(
      collection(db, "chats"),
      where("participants", "array-contains", user.uid)
    );

    const unsubscribe = onSnapshot(chatsQuery, async (snapshot) => {
      try {
        let totalUnread = 0;

        const countPromises = snapshot.docs.map(async (chatDoc) => {
          const chatId = chatDoc.id;

          const unreadQuery = query(
            collection(db, "chats", chatId, "messages"),
            where("senderId", "!=", user.uid),
            where("read", "==", false)
          );

          const messagesSnap = await getDocs(unreadQuery);
          return messagesSnap.size;
        });

        const counts = await Promise.all(countPromises);
        totalUnread = counts.reduce((sum, count) => sum + count, 0);

        setUnreadCount(totalUnread);
      } catch (error) {
        console.error("Error counting unread messages:", error);
      }
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user) {
      setAlertsCount(0);
      return;
    }

    const checkAlerts = async () => {
      try {
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (!userDocSnap.exists() || !userDocSnap.data().alertsEnabled) {
          setAlertsCount(0);
          return;
        }

        const preferences = userDocSnap.data();
        const minBudget = parseFloat(preferences.alertsMinBudget) || 0;
        const maxBudget = parseFloat(preferences.alertsMaxBudget) || 10000;
        const location = preferences.alertsLocation || "";

        console.log("Checking alerts with preferences:", {
          minBudget,
          maxBudget,
          location,
        });

        const listingsRef = collection(db, "listings");
        const q = query(listingsRef);

        const querySnapshot = await getDocs(q);
        console.log(
          `Retrieved ${querySnapshot.size} total listings for alerts check`
        );

        let count = 0;
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        querySnapshot.forEach((doc) => {
          const listing = doc.data();

          if (listing.status !== "active") {
            return;
          }

          let creationDate;
          if (listing.metadata?.createdAt) {
            if (listing.metadata.createdAt.toDate) {
              creationDate = listing.metadata.createdAt.toDate();
            } else if (listing.metadata.createdAt.seconds) {
              creationDate = new Date(
                listing.metadata.createdAt.seconds * 1000
              );
            } else if (typeof listing.metadata.createdAt === "string") {
              creationDate = new Date(listing.metadata.createdAt);
            }
          }

          if (creationDate && creationDate < sevenDaysAgo) {
            return;
          }

          const rent = parseFloat(listing.details?.rent) || 0;
          if (minBudget > 0 && rent < minBudget) {
            return;
          }

          if (maxBudget > 0 && rent > maxBudget) {
            return;
          }

          if (location && listing.location?.city) {
            const listingCity = listing.location.city.toLowerCase();
            if (!listingCity.includes(location.toLowerCase())) {
              return;
            }
          }

          count++;
        });

        console.log(`Found ${count} listings matching alert criteria`);
        setAlertsCount(count);
      } catch (error) {
        console.error("Error checking alerts:", error);
      }
    };
    checkAlerts();

    const intervalId = setInterval(checkAlerts, 60 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [user]);

  return (
    <nav className="navbar">
      <div className="nav-brand">
        <img
          src="/Images/LogoApp.png"
          alt="Logo"
          className="nav-logo"
          onClick={() => navigate("/")}
          style={{ cursor: "pointer" }}
        />
      </div>
      <div className="nav-links">
        {user && (
          <button
            onClick={() => navigate("/alerts")}
            className="nav-button notification-button"
            aria-label="Alertes"
          >
            <i className="fas fa-bell"></i>
            {alertsCount > 0 && (
              <span className="nav-notification-badge">{alertsCount}</span>
            )}
          </button>
        )}
        <button onClick={() => navigate("/search")} className="nav-button">
          Trouver des Colocataires
        </button>

        {user && !isLoading ? (
          <>
            {isVerified ? (
              <button
                onClick={() => navigate("/create-listing")}
                className="nav-button create-listing"
              >
                Publier une Annonce
              </button>
            ) : (
              <div className="verification-pending">
                <i className="fas fa-clock"></i>
                En attente de vérification de votre carte étudiante
              </div>
            )}
            <div className="user-profile">
              <div
                className="avatar-container"
                onClick={() => setShowUserMenu(!showUserMenu)}
              >
                <img
                  src={user.photoURL || "/Images/default-avatar.png"}
                  alt="Profile"
                  className="avatar"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "/Images/default-avatar.png";
                  }}
                />
              </div>
              {showUserMenu && (
                <div className="user-menu" ref={userMenuRef}>
                  <div
                    className="user-menu-item"
                    onClick={() => navigate("/profile")}
                  >
                    <i className="fas fa-user"></i>
                    Mon Profil
                  </div>
                  <div
                    className="user-menu-item"
                    onClick={() => navigate("/my-listings")}
                  >
                    <i className="fas fa-list"></i>
                    Mes Annonces
                  </div>
                  <div
                    className="user-menu-item"
                    onClick={() => navigate("/favorites")}
                  >
                    <i className="fas fa-heart"></i>
                    Mes Favoris
                  </div>
                  <div
                    className="user-menu-item"
                    onClick={() => navigate("/alerts")}
                  >
                    <i className="fas fa-bell"></i>
                    Alertes
                    {alertsCount > 0 && (
                      <span className="notification-badge">{alertsCount}</span>
                    )}
                  </div>
                  <div
                    className="user-menu-item"
                    onClick={() => navigate("/messages")}
                  >
                    <i className="fas fa-envelope"></i>
                    Messagerie
                    {unreadCount > 0 && (
                      <span className="notification-badge">{unreadCount}</span>
                    )}
                  </div>
                  {isAdmin && (
                    <div
                      className="user-menu-item admin"
                      onClick={() => navigate("/admin")}
                    >
                      <i className="fas fa-shield-alt"></i>
                      Admin Dashboard
                    </div>
                  )}
                  <div className="user-menu-item logout" onClick={handleLogout}>
                    <i className="fas fa-sign-out-alt"></i>
                    Déconnexion
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <button
              onClick={() => navigate("/login")}
              className="nav-button login"
            >
              Connexion
            </button>
            <button
              onClick={() => navigate("/login?signup=true")}
              className="nav-button signup"
            >
              Inscription
            </button>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
