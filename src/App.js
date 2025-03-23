import "./config/firebase.js";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Home from "./components/Home";
import Login from "./components/Login";
import Profile from "./components/Profile";
import Search from "./components/Search";
import CreateListing from "./components/CreateListing/CreateListing";
import ListingDetail from "./components/ListingDetail/ListingDetail";
import MyListings from "./components/MyListings/MyListings";
import Favorites from "./components/Favorites/Favorites";
import Admin from "./components/Admin/Admin";
import PrivateAdminRoute from './components/Routes/PrivateAdminRoute';
import Layout from "./components/Layout/Layout";
import { AuthProvider } from "./contexts/AuthContext";
import Messages from "./components/Messages/Messages";
 {/*import Applo from "./components/Applications/Applications";*/}

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
            <Route path="/" element={<Layout><Home /></Layout>} />
            <Route path="/profile" element={<Layout><Profile /></Layout>} />
            <Route path="/search" element={<Layout><Search /></Layout>} />
            <Route path="/messages" element={<Layout><Messages /></Layout>} />
            <Route path="/create-listing" element={<Layout><CreateListing /></Layout>} />
            <Route path="/listing/:id" element={<Layout><ListingDetail /></Layout>} />
            <Route path="/my-listings" element={<Layout><MyListings /></Layout>} />
            <Route path="/favorites" element={<Layout><Favorites /></Layout>} />
 {/*
           <Route path="/applications" element={<Layout><Applications/></Layout>} />*/}

          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;