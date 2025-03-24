import "./config/firebase.js";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import Home from "./components/Home";
import Login from "./components/Login";
import Profile from "./components/Profile";
import Search from "./components/Search";
import CreateListing from "./components/CreateListing/CreateListing";
import ListingDetail from "./components/ListingDetail/ListingDetail";
import MyListings from "./components/MyListings/MyListings";
import Favorites from "./components/Favorites/Favorites";
import Admin from "./components/Admin/Admin";
import PrivateAdminRoute from "./components/Routes/PrivateAdminRoute";
import Layout from "./components/Layout/Layout";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Messages from "./components/Messages/Messages";
import Alerts from "./components/Alerts/Alerts";
{
  /*import Applo from "./components/Applications/Applications";*/
}

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <div className="loading">Loading...</div>;

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <Routes>
            {/* Routes that don't use the common layout */}
            <Route path="/login" element={<Login />} />
            <Route
              path="/admin/*"
              element={
                <PrivateAdminRoute>
                  <Admin />
                </PrivateAdminRoute>
              }
            />

            {/* Routes with the common layout */}
            <Route
              path="/"
              element={
                <Layout>
                  <Home />
                </Layout>
              }
            />

            {/* Protected routes */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Profile />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/search"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Search />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/messages"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Messages />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/create-listing"
              element={
                <ProtectedRoute>
                  <Layout>
                    <CreateListing />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/listing/:id"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ListingDetail />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-listings"
              element={
                <ProtectedRoute>
                  <Layout>
                    <MyListings />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/favorites"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Favorites />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/alerts"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Alerts />
                  </Layout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
