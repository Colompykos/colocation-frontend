import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, signOut } from "firebase/auth";
import { useAdmin } from "../../hooks/useAdmin";
import AdminListings from "./AdminListings";
import "./Admin.css";

const Admin = () => {
  const navigate = useNavigate();
  const { users, verifyUser, toggleBlock, deleteUser } = useAdmin();
  const [activeSection, setActiveSection] = useState("users");
  const [showCardModal, setShowCardModal] = useState(false);
  const [selectedCardURL, setSelectedCardURL] = useState(null);

  const handleLogout = async () => {
    try {
      const auth = getAuth();
      await signOut(auth);
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const pendingUsers = users.filter((u) => !u.isVerified);
  const activeUsers = users.filter((u) => u.isVerified);

  return (
    <div className="admin-container">
      <div className="admin-sidebar">
        <div className="admin-logo">
          <img src="/Images/LogoApp.png" alt="Logo" />
          <h2>Admin Panel</h2>
        </div>
        <nav className="admin-nav">
          <div
            className={`admin-nav-item ${
              activeSection === "users" ? "active" : ""
            }`}
            onClick={() => setActiveSection("users")}
          >
            <i className="fas fa-users"></i>
            <span>Utilisateurs</span>
          </div>
          <div
            className={`admin-nav-item ${
              activeSection === "listings" ? "active" : ""
            }`}
            onClick={() => setActiveSection("listings")}
          >
            <i className="fas fa-home"></i>
            <span>Annonces</span>
          </div>
        </nav>
      </div>

      <div className="admin-content">
        <div className="admin-header">
          <h1 className="admin-title">
            {activeSection === "users"
              ? "Gestion des Utilisateurs"
              : "Gestion des Annonces"}
          </h1>
          <button onClick={handleLogout} className="logout-button">
            <i className="fas fa-sign-out-alt"></i>
            Déconnexion
          </button>
        </div>

        {activeSection === "users" ? (
          <>
            <div className="stats-grid">
              <div className="stat-card">
                <h3>Total Utilisateurs</h3>
                <div className="number">{users.length}</div>
              </div>
              <div className="stat-card">
                <h3>En attente</h3>
                <div className="number">{pendingUsers.length}</div>
              </div>
              <div className="stat-card">
                <h3>Utilisateurs actifs</h3>
                <div className="number">{activeUsers.length}</div>
              </div>
            </div>

            <div className="users-section">
              <div className="users-table">
                <table>
                  <thead>
                    <tr>
                      <th>Nom</th>
                      <th>Email</th>
                      <th>Status</th>
                      <th>Carte Étudiante</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td>{user.displayName || "N/A"}</td>
                        <td>{user.email}</td>
                        <td>
                          <span
                            className={`status-badge ${
                              user.status || "active"
                            }`}
                          >
                            {user.status === "blocked"
                              ? "Bloqué"
                              : user.isVerified
                              ? "Actif"
                              : "En attente"}
                          </span>
                        </td>
                        <td>
                          {user.studentCardURL ? (
                            <button
                              className="view-card-button"
                              onClick={() => {
                                setSelectedCardURL(user.studentCardURL);
                                setShowCardModal(true);
                              }}
                            >
                              <i className="fas fa-id-card"></i>
                              Voir la carte
                            </button>
                          ) : (
                            <span className="no-card">Non fournie</span>
                          )}
                        </td>
                        <td className="actions-cell">
                          {!user.isVerified && (
                            <button
                              onClick={() => verifyUser(user.id)}
                              className="verify-button"
                              data-tooltip="Vérifier"
                            >
                              <i className="fas fa-check"></i>
                            </button>
                          )}
                          <button
                            onClick={() =>
                              toggleBlock(user.id, user.status !== "blocked")
                            }
                            className={`block-button ${
                              user.status === "blocked" ? "unblock" : ""
                            }`}
                            data-tooltip={
                              user.status === "blocked"
                                ? "Débloquer"
                                : "Bloquer"
                            }
                          >
                            <i
                              className={`fas fa-${
                                user.status === "blocked" ? "unlock" : "lock"
                              }`}
                            ></i>
                          </button>
                          <button
                            onClick={() => deleteUser(user.id)}
                            className="delete-button"
                            data-tooltip="Supprimer"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <AdminListings />
        )}

        {showCardModal && (
          <div
            className="modal-overlay"
            onClick={() => setShowCardModal(false)}
          >
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <button
                className="modal-close"
                onClick={() => setShowCardModal(false)}
              >
                <i className="fas fa-times"></i>
              </button>
              <img
                src={selectedCardURL}
                alt="Carte étudiante"
                className="student-card-image"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
