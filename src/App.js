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
import { AuthProvider } from "./contexts/AuthContext";
import Messages from "./components/Messages/Messages";

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <header className="App-header">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/search" element={<Search />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/create-listing" element={<CreateListing />} />
              <Route path="/listing/:id" element={<ListingDetail />} />
              <Route path="/my-listings" element={<MyListings />} />
              <Route path="/favorites" element={<Favorites />} />
              <Route
                path="/admin/*"
                element={
                  <PrivateAdminRoute>
                    <Admin />
                  </PrivateAdminRoute>
                }
              />
            </Routes>
          </header>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
