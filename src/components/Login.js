import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, FacebookAuthProvider } from 'firebase/auth';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const auth = getAuth();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      console.log('Logged in');
      console.log(auth.currentUser);
      navigate('/LoggedIn');
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    const auth = getAuth();
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      navigate('/LoggedIn');
    } catch (error) {
      setError(error.message);
    }
  };

  const handleFacebookLogin = async () => {
    const auth = getAuth();
    const provider = new FacebookAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      navigate('/LoggedIn');
      console.log(auth.currentUser);
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="form-side">
          <div className="brand">
            <img src="/Images/LogoApp.png" alt="Logo" className='logo-app' />
          </div>
          
          <div className="form-content">
            <h1>Welcome back</h1>
            <p className="subtitle">Please sign in to your account</p>

            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="form-input"
                />
              </div>

              {error && <div className="error-message">{error}</div>}

              <button type="submit" className="submit-button" disabled={isLoading}>
                {isLoading ? 'Signing in...' : 'Sign in'}
              </button>

              <div className="social-login">
                <button type="button" className="social-button facebook" onClick={handleFacebookLogin}>
                  <img src="/images/facebookLogo.png" alt="Facebook logo" className='logo-login-facebook' /> Facebook
                </button>
                <button type="button" className="social-button google" onClick={handleGoogleLogin}>
                  <img src="/images/Google.png" alt="Google logo" className='logo-login-google' /> Google
                </button>
              </div>
            </form>

            <div className="login-footer">
              <p>Don't have an account? <a href="#">Sign up</a></p>
              <a href="#" className="terms">Terms & Conditions</a>
            </div>
          </div>
        </div>

        <div className="image-side">
          <img src="/images/LoginPage.jpg" alt="Team collaboration" />
          <div className="overlay"></div>
        </div>
      </div>

      <style>{`
        .login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #f5f5f5;
          padding: 20px;
        }
        
        .logo-app {
          width: 210px;
        }

        .login-container {
          display: flex;
          width: 100%;
          max-width: 1200px;
          min-height: 600px;
          background: white;
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
        }

        .form-side {
          flex: 1;
          padding: 40px;
          background: linear-gradient(135deg, #fff 0%, #f8f8f8 100%);
        }

        .brand {
          font-size: 24px;
          font-weight: 600;
          color: #333;
          margin-bottom: 25px;
        }

        .form-content {
          max-width: 400px;
          margin: 0 auto;
        }

        h1 {
          font-size: 32px;
          font-weight: 600;
          color: #333;
          margin-bottom: 8px;
        }

        .subtitle {
          color: #666;
          margin-bottom: 40px;
        }

        .form-group {
          margin-bottom: 24px;
        }

        label {
          display: block;
          margin-bottom: 8px;
          color: #333;
          font-size: 14px;
        }

        .form-input {
          width: 92%;
          padding: 12px 16px;
          border: 1px solid #e1e1e1;
          border-radius: 12px;
          font-size: 15px;
          transition: all 0.3s ease;
          background: white;
        }

        .form-input:focus {
          outline: none;
          border-color: #007AFF;
          box-shadow: 0 0 0 4px rgba(0, 122, 255, 0.1);
        }

        .submit-button {
          width: 100%;
          padding: 14px;
          background: #FFD60A;
          border: none;
          border-radius: 12px;
          color: #000;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-bottom: 24px;
        }

        .submit-button:hover {
          background: #FFE44D;
        }

        .submit-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .social-login {
          display: flex;
          gap: 16px;
          margin-bottom: 24px;
        }

        .social-button {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px;
          border: 1px solid #e1e1e1;
          border-radius: 12px;
          background: white;
          color: #333;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .social-button:hover {
          background: #f5f5f5;
        }

        .login-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: #666;
          font-size: 14px;
        }

        .login-footer a {
          color: #333;
          text-decoration: none;
          font-weight: 500;
        }

        .image-side {
          flex: 1.2;
          position: relative;
          overflow: hidden;
        }

        .image-side img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0) 100%);
        }

        .logo-login-google {
          width: 25px; 
          height: 25px; 
          margin-right: 4px; 
        }
        
        .logo-login-facebook {
          width: 25px; 
          height: 25px; 
          margin-right: 4px; 
        }

        .error-message {
          background-color: #FFF2F0;
          border: 1px solid #FFCCC7;
          color: #FF4D4F;
          padding: 12px;
          border-radius: 12px;
          margin-bottom: 20px;
          font-size: 14px;
          text-align: center;
        }

        @media (max-width: 768px) {
          .image-side {
            display: none;
          }
          
          .login-container {
            max-width: 500px;
          }
        }
      `}</style>
    </div>
  );
};

export default Login;