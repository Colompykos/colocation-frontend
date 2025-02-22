import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { doc, deleteDoc, getDoc } from "firebase/firestore";
import { db } from "../config/firebase";

export const useAdmin = () => {
  const [users, setUsers] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchUsers = async () => {
    if (!user) return;

    try {
      const token = await user.getIdToken();
      const response = await fetch("http://localhost:5000/api/admin/users", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch users");
      }

      const data = await response.json();
      if (data.success) {
        setUsers(data.users);
      } else {
        throw new Error(data.error || "Failed to fetch users");
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      throw error;
    }
  };

  const verifyUser = async (userId) => {
    try {
      const token = await user.getIdToken();
      const response = await fetch(
        `http://localhost:5000/api/admin/users/${userId}/verify`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to verify user");
      }

      setUsers((prev) =>
        prev.map((user) => {
          if (user.id === userId) {
            return { ...user, status: "active", isVerified: true };
          }
          return user;
        })
      );
    } catch (error) {
      console.error("Error verifying user:", error);
    }
  };

  const toggleBlock = async (userId, shouldBlock) => {
    try {
      const token = await user.getIdToken();
      const response = await fetch(
        `http://localhost:5000/api/admin/users/${userId}/toggle-block`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ blocked: shouldBlock }),
        }
      );

      if (!response.ok) {
        throw new Error("Erreur lors du changement de statut");
      }

      const data = await response.json();

      setUsers((prev) =>
        prev.map((user) => {
          if (user.id === userId) {
            return {
              ...user,
              status: shouldBlock ? "blocked" : "active",
              disabled: shouldBlock,
            };
          }
          return user;
        })
      );

      alert(data.message);
    } catch (error) {
      console.error("Error toggling user block status:", error);
      alert("Erreur : " + error.message);
    }
  };

  const deleteUser = async (userId) => {
    if (
      !window.confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ?")
    ) {
      return;
    }

    try {
      const token = await user.getIdToken();
      const response = await fetch(
        `http://localhost:5000/api/admin/users/${userId}/auth`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Erreur lors de la suppression du compte");
      }

      setUsers((prev) => prev.filter((user) => user.id !== userId));
      alert("Utilisateur supprimé avec succès");
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Erreur lors de la suppression de l'utilisateur: " + error.message);
    }
  };

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const isUserAdmin =
          userDoc.exists() && userDoc.data()?.isAdmin === true;
        setIsAdmin(isUserAdmin);

        if (isUserAdmin) {
          await fetchUsers();
        }
      } catch (error) {
        console.error("Error checking admin status:", error);
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, [user]);

  return {
    users,
    isAdmin,
    loading,
    verifyUser,
    toggleBlock,
    deleteUser,
    fetchUsers,
  };
};
