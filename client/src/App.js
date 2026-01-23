import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';
import api from './api'; 
import Dashboard from './Dashboard';
import LoginForm from './LoginForm';

function App() {
  return (
    <Router>
      <Routes>
        {/* Route 1: The Login Page (Public) */}
        <Route path="/" element={<LoginPage />} />

        {/* Route 2: The Dashboard (Protected) */}
        {/* We wrap the Dashboard inside "ProtectedRoute" to secure it */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Router>
  );
}

// =========================================
// 1. LOGIN PAGE COMPONENT
// =========================================
function LoginPage() {
  const navigate = useNavigate();

  // Handler for Manual Login (Email/Password)
  const handleManualLogin = () => {
    // If the LoginForm says "Success", we just go to the dashboard.
    // The cookies are already set by the server.
    navigate('/dashboard');
  };

  // Handler for Social Login (LinkedIn/Facebook)
  const handleSocialLogin = async (provider) => {
    try {
      // Get the provider URL from our Backend
      const res = await axios.get(`http://localhost:5000/auth/${provider}/url`);
      // Redirect the browser to that URL
      window.location.href = res.data.url;
    } catch (err) {
      console.error("Social login error", err);
    }
  };

  // Check if user is ALREADY logged in when they visit "/"
  useEffect(() => {
    const checkSession = async () => {
      try {
        await api.get('/auth/me'); // Ask server if we have a cookie
        navigate('/dashboard');    // If yes, go straight to dashboard
      } catch (err) {
        // If error, do nothing (stay on login page)
      }
    };
    checkSession();
  }, [navigate]);

  // STYLES
  const styles = {
    container: { fontFamily: 'Arial, sans-serif', backgroundColor: '#f3f2ef', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
    card: { backgroundColor: 'white', padding: '30px', borderRadius: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', textAlign: 'center', width: '350px' },
    socialBtn: { padding: '10px', width: '100%', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '15px', fontWeight: 'bold', color: 'white', marginTop: '10px' },
    divider: { margin: '20px 0', borderTop: '1px solid #ddd', position: 'relative' },
    dividerText: { position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', backgroundColor: 'white', padding: '0 10px', color: '#666', fontSize: '12px' }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Manual Form */}
        <LoginForm onLogin={handleManualLogin} />

        {/* Divider */}
        <div style={styles.divider}>
          <span style={styles.dividerText}>OR</span>
        </div>

        {/* Social Buttons */}
        <button onClick={() => handleSocialLogin('linkedin')} style={{ ...styles.socialBtn, backgroundColor: '#0077b5' }}>
          Sign in with LinkedIn
        </button>
        
        <button onClick={() => handleSocialLogin('facebook')} style={{ ...styles.socialBtn, backgroundColor: '#1877F2' }}>
          Sign in with Facebook
        </button>
      </div>
    </div>
  );
}

// =========================================
// 2. PROTECTED ROUTE WRAPPER (The Security Guard)
// =========================================
function ProtectedRoute({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // As soon as this route loads, check the Server for a valid Cookie
    api.get('/auth/me')
      .then(res => {
        setUser(res.data); // Success! We know who the user is.
        setLoading(false);
      })
      .catch((err) => {
        console.error("Not authenticated", err);
        setLoading(false); // Failed. User is null.
      });
  }, []);

  if (loading) return <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading...</div>;
  
  // If no user, kick them back to Login Page ("/")
  if (!user) return <Navigate to="/" />; 

  // If user exists, render the Dashboard and pass the user data to it
  return React.cloneElement(children, { user }); 
}

// =========================================
// 3. DASHBOARD PAGE
// =========================================
function DashboardPage({ user }) {
  const navigate = useNavigate();
  
  const handleLogout = async () => {
    try {
      // Call Logout Endpoint (Clears Cookies)
      await api.post('/auth/logout');
      // Send user back to Login Page
      navigate('/');
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  return <Dashboard user={user} onLogout={handleLogout} />;
}

export default App;