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
import { AuthProvider } from "./contexts/AuthContext";

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
              <Route path="/create-listing" element={<CreateListing />} />
              <Route path="/listing/:id" element={<ListingDetail />} />
              <Route path="/my-listings" element={<MyListings />} />
              <Route path="/favorites" element={<Favorites />} />
            </Routes>
          </header>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
