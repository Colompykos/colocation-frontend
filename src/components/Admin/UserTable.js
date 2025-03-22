import React from 'react';

const UserRow = ({ user, onVerify, onToggleBlock, onDelete, onViewCard }) => (
  <tr>
    <td>{user.displayName || "N/A"}</td>
    <td>{user.email}</td>
    <td>
      <span className={`status-badge ${user.status || "active"}`}>
        {user.status === "blocked" 
          ? "Bloqué" 
          : user.status === "pending" 
          ? "En attente" 
          : "Actif"}
      </span>
    </td>
    <td>
      {user.studentCardURL ? (
        <button
          className="view-card-button"
          onClick={() => onViewCard(user.studentCardURL)}
        >
          <i className="fas fa-id-card"></i>
          Voir la carte
        </button>
      ) : (
        <span className="no-card">Non fournie</span>
      )}
    </td>
    <td className="actions-cell">
      {user.status === "pending" && (
        <button
          onClick={() => onVerify(user.id)}
          className="verify-button"
        >
          <i className="fas fa-check"></i>
          Vérifier
        </button>
      )}
      <button
        onClick={() => onToggleBlock(user.id, user.status !== "blocked")}
        className={`block-button ${user.status === "blocked" ? "unblock" : ""}`}
      >
        <i className={`fas fa-${user.status === "blocked" ? "unlock" : "lock"}`}></i>
        {user.status === "blocked" ? "Débloquer" : "Bloquer"}
      </button>
      <button
        onClick={() => onDelete(user.id)}
        className="delete-button"
      >
        <i className="fas fa-trash"></i>
        Supprimer
      </button>
    </td>
  </tr>
);

const UserTable = ({
  users,
  pendingUsers,
  onVerify,
  onToggleBlock,
  onDelete,
  onViewCard,
}) => {
  return (
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
          {[...pendingUsers, ...users].map((user) => (
            <UserRow
              key={user.id}
              user={user}
              onVerify={onVerify}
              onToggleBlock={onToggleBlock}
              onDelete={onDelete}
              onViewCard={onViewCard}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UserTable;