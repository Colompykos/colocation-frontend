import "./config/firebase.js";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom"; // Remove 'Router' if not used
import Home from "./components/Home";
import Login from "./components/Login";
import LoggedIn from "./components/LoggedIn";
import Profile from "./components/Profile";
import Search from "./components/Search";
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
            </Routes>
          </header>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
