import './config/firebase.js';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'; // Remove 'Router' if not used
import Login from './components/Login';
import LoggedIn from './components/LoggedIn';
import Profile from './components/Profile';

function App() {
  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/LoggedIn" element={<LoggedIn />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </header>
      </div>
    </Router>
  );
}

export default App;