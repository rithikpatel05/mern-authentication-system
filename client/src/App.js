import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom"; 
import { Amplify } from 'aws-amplify';
import { signUp, confirmSignUp } from 'aws-amplify/auth';
import axios from "axios";
import Stocks from "./Stocks";
import Pricing from "./Pricing";
import Success from "./Success";
import DebugRedux from './DebugRedux';
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from 'react-redux';
import { loginSuccess, logout } from './redux/authSlice';
import { io } from "socket.io-client";

// AWS Config
Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: "ap-south-1_5uGUkSbPX", 
      userPoolClientId: "73kdt77qvad8do4j3fqetu8k86", 
    }
  }
});

axios.defaults.withCredentials = true;
axios.defaults.headers.common['ngrok-skip-browser-warning'] = 'true';

// Automatically switch between Localhost and Render
const API_URL = window.location.hostname === "localhost"
  ? "http://localhost:5000"  // 🏠 Your Laptop
  : "https://mern-authentication-system-rzru.onrender.com"; // ☁️ Your Live Backend

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
      {process.env.NODE_ENV !== 'production' && <DebugRedux />}
    </BrowserRouter>
  );
}

function AppRoutes() {
  // 🟢 2. REMOVE the old useState for user. Read from Redux instead!
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const dispatch = useDispatch(); 
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const token = localStorage.getItem("token");
    if (token) {
        axios.defaults.headers.common['Authorization'] = token;
    }

    try {
      const res = await axios.get(`${API_URL}/auth/me`);
      
      // 🟢 3. DISPATCH the user to the vault instead of setUser()
      dispatch(loginSuccess({ token: token, user: res.data.user })); 
      
    } catch (err) {
      localStorage.removeItem("token");
      delete axios.defaults.headers.common['Authorization'];
      
      // 🟢 4. DISPATCH logout if the token is invalid
      dispatch(logout()); 
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{textAlign:'center', marginTop:'50px'}}>Loading...</div>;

  return (
    <Routes>
      {/* Notice we don't need to pass setUser down as a prop anymore! */}
      <Route path="/" element={!isAuthenticated ? <LoginPage /> : <Navigate to="/dashboard" />} />
      <Route path="/dashboard" element={isAuthenticated ? <Dashboard /> : <Navigate to="/" />} />
      <Route path="/stocks" element={isAuthenticated ? <Stocks /> : <Navigate to="/" />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/success" element={<Success />} />
    </Routes>
  );
}

// import { useForm } from "react-hook-form";
// import { useNavigate } from "react-router-dom";
// import axios from "axios";
// import { signUp, confirmSignUp } from "@aws-amplify/auth";

// 🟢 1. Removed { setUser } from the props!
function LoginPage() {
  const [view, setView] = useState("login");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // 🟢 2. Grab the Redux mailman
  const dispatch = useDispatch(); 

  // RHF forms
  const loginForm = useForm();
  const signupForm = useForm();
  const confirmForm = useForm();

  const handleLogin = async (data) => {
    setError("");

    try {
      const res = await axios.post(`${API_URL}/auth/login`, {
        email: data.email,
        password: data.password,
      });

      const token = res.data.token;
      if (token) {
        localStorage.setItem("token", token);
        localStorage.setItem("userEmail", data.email);
        axios.defaults.headers.common["Authorization"] = token;
      }

      // 🟢 3. DISPATCH the user and token directly to the Redux vault!
      dispatch(loginSuccess({ token: token, user: res.data.user }));
      
      navigate("/dashboard");
    } catch (err) {
      setError(
        "Login failed: " + (err.response?.data?.error || "Invalid credentials")
      );
    }
  };

  // ... (Keep your handleSignUp, handleConfirm, and the entire return() exactly the same!) ...

  const handleSignUp = async (data) => {
    setError("");

    try {
      const { nextStep } = await signUp({
        username: data.email,
        password: data.password,
        options: { userAttributes: { email: data.email, name: data.name } },
      });

      if (nextStep.signUpStep === "CONFIRM_SIGN_UP") setView("confirm");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleConfirm = async (data) => {
    setError("");

    try {
      await confirmSignUp({
        username: data.email,
        confirmationCode: data.code,
      });

      alert("Verified! Please Login.");
      setView("login");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>

        {/* ---------------- LOGIN ---------------- */}
        {view === "login" && (
          <>
            <h1>Welcome Back</h1>
            <form onSubmit={loginForm.handleSubmit(handleLogin)} style={styles.form}>
              <input
                type="email"
                placeholder="Email"
                {...loginForm.register("email")}
                style={styles.input}
                required
              />

              <input
                type="password"
                placeholder="Password"
                {...loginForm.register("password")}
                style={styles.input}
                required
              />

              <button type="submit" style={styles.primaryBtn}>
                Sign In
              </button>
            </form>

            <p style={{ marginTop: "15px" }}>
              <span onClick={() => setView("signup")} style={styles.link}>
                Create Account
              </span>
            </p>
          </>
        )}

        {/* ---------------- SIGNUP ---------------- */}
        {view === "signup" && (
          <>
            <h1>Create Account</h1>
            <form onSubmit={signupForm.handleSubmit(handleSignUp)} style={styles.form}>
              <input
                type="text"
                placeholder="Name"
                {...signupForm.register("name")}
                style={styles.input}
                required
              />

              <input
                type="email"
                placeholder="Email"
                {...signupForm.register("email")}
                style={styles.input}
                required
              />

              <input
                type="password"
                placeholder="Password"
                {...signupForm.register("password")}
                style={styles.input}
                required
              />

              <button type="submit" style={styles.successBtn}>
                Create Account
              </button>
            </form>

            <p style={{ marginTop: "15px" }}>
              <span onClick={() => setView("login")} style={styles.link}>
                Back to Login
              </span>
            </p>
          </>
        )}

        {/* ---------------- CONFIRM ---------------- */}
        {view === "confirm" && (
          <>
            <h1>Verify Email</h1>
            <form onSubmit={confirmForm.handleSubmit(handleConfirm)} style={styles.form}>
              <input
                placeholder="Email"
                {...confirmForm.register("email")}
                style={styles.input}
                required
              />

              <input
                placeholder="Enter Code"
                {...confirmForm.register("code")}
                style={styles.input}
                required
              />

              <button type="submit" style={styles.primaryBtn}>
                Verify
              </button>
            </form>
          </>
        )}

        {error && <p style={{ color: "red", marginTop: "10px" }}>{error}</p>}
      </div>
    </div>
  );
}

// --- DASHBOARD ---
// import React, { useState, useEffect } from "react";
// import axios from "axios";
// import { useSelector, useDispatch } from "react-redux";
// import { useNavigate } from "react-router-dom";
// import { logout } from "./redux/authSlice"; // Ensure this path matches your project!

// 🟢 1. IMPORT AND CONNECT THE SOCKET
// import { io } from "socket.io-client";
const socket = io("http://localhost:5000"); // Make sure this matches your Node server's URL!

// const API_URL = window.location.hostname === "localhost"
//   ? "http://localhost:5000"
//   : "https://mern-authentication-system-rzru.onrender.com";

function Dashboard() {
  // --- EXISTING STATE ---
  const [file, setFile] = useState(null);
  const [allFiles, setAllFiles] = useState([]);
  const [status, setStatus] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  
  // State to track the User's Plan & Search
  const [userPlan, setUserPlan] = useState("FREE");
  const [searchTerm, setSearchTerm] = useState("");

  const navigate = useNavigate();

  // 🟢 2. THE WEBSOCKET LISTENER
  useEffect(() => {
    // When the backend shouts "files_changed", run fetchFiles() silently!
    socket.on("files_changed", () => {
      console.log("🔄 Real-time update detected: Fetching fresh files!");
      fetchFiles(); 
    });

    // Clean up the listener if the user logs out or leaves the page
    return () => {
      socket.off("files_changed");
    };
  }, []); // Empty array means this listener is set up once when the page loads

  // --- EXISTING USE EFFECT (User Plan) ---
  useEffect(() => {
    fetchFiles();

    const fetchUserPlan = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_URL}/auth/me`, {
          headers: { 'Authorization': token }
        });
        
        if (res.data.user && res.data.user.plan) {
          setUserPlan(res.data.user.plan);
          localStorage.setItem("userPlan", res.data.user.plan);
        } else {
          const savedPlan = localStorage.getItem("userPlan");
          if (savedPlan) setUserPlan(savedPlan);
        }
      } catch (err) {
        console.error("Error fetching user plan:", err);
        const savedPlan = localStorage.getItem("userPlan");
        if (savedPlan) setUserPlan(savedPlan);
      }
    };

    fetchUserPlan();

    const planUpdatedAt = localStorage.getItem("planUpdatedAt");
    if (planUpdatedAt) {
      fetchUserPlan();
      localStorage.removeItem("planUpdatedAt"); 
    }
  }, [user]);

  const fetchFiles = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/files/all-files`, {
          headers: { 'Authorization': token }
      });
      setAllFiles(res.data);
    } catch (err) {
      console.error("Fetch error", err);
    }
  };

  const handleUpload = async () => {
    if (!file) return alert("Select a file first!");

    // SECURITY CHECK: File Type
    const forbiddenExtensions = /(\.exe|\.sh|\.bat|\.php|\.pl|\.vb|\.vbs|\.cmd|\.msi)$/i;
    if (forbiddenExtensions.test(file.name)) {
      alert("⚠️ Security Warning: You cannot upload executable files!");
      return;
    }

    // SECURITY CHECK: File Size (10MB Limit)
    const MAX_SIZE = 10 * 1024 * 1024; 
    if (file.size > MAX_SIZE) {
        alert("⚠️ File too large! Maximum allowed size is 10MB.");
        return;
    }

    setStatus("Uploading...");
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('userEmail', user?.email || "unknown"); 

    const token = localStorage.getItem("token");
    if (!token) return alert("Session lost. Please Login again.");

    try {
      await axios.post(`${API_URL}/files/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data', 'Authorization': token },
        onUploadProgress: (progressEvent) => {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percent);
        }
      });

      setStatus("✅ Upload Success!");
      setUploadProgress(100);
      setFile(null); 
      document.querySelector('input[type="file"]').value = "";
      
      // 🟢 NOTE: We don't strictly need to call fetchFiles() here anymore because 
      // the WebSocket will do it automatically, but leaving it doesn't hurt!
      fetchFiles(); 
      
      setTimeout(() => setUploadProgress(0), 2000);

    } catch (err) {
      console.error(err);
      setStatus("❌ Upload Failed: " + (err.response?.data?.message || err.message));
      setUploadProgress(0);
    }
  };

  const handleDelete = async (fileId) => {
    if (!window.confirm("Are you sure? This will permanently delete the file.")) return;

    try {
        const token = localStorage.getItem("token");
        await axios.delete(`${API_URL}/files/${fileId}`, {
            headers: { 'Authorization': token }
        });

        // 🟢 NOTE: We can remove the manual filter below if we want, 
        // because the WebSocket will automatically refresh the whole list for us!
        setAllFiles(allFiles.filter(f => f._id !== fileId));
        alert("File Deleted!");
    } catch (err) {
        alert("Delete failed: " + (err.response?.data?.message || "Server Error"));
    }
  };

  const handleSignOut = async () => {
    try { await axios.post(`${API_URL}/auth/logout`); } catch (err) {}
    localStorage.removeItem("token");
    localStorage.removeItem("userPlan"); 
    delete axios.defaults.headers.common['Authorization'];
    
    dispatch(logout());
    navigate("/");
  };

  // Plan Colors Configuration
  const planColors = {
    FREE: "#6c757d",      
    SILVER: "#ced4da",    
    GOLD: "#ffc107",      
    PLATINUM: "#007bff"   
  };

  // Filter Logic
  const filteredFiles = allFiles.filter((f) => 
    f.filename.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', fontFamily: 'Arial' }}>
      
      {/* --- HEADER START --- */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom:'20px' }}>
        
        <div style={{
            backgroundColor: planColors[userPlan] || "#6c757d", 
            color: (userPlan === "GOLD" || userPlan === "SILVER") ? "black" : "white", 
            width: "200px",            
            padding: "15px",            
            borderRadius: "4px",        
            textAlign: "center",        
            fontWeight: "bold",         
            fontSize: "18px",           
            marginTop: "10px",          
            border: "1px solid rgba(0,0,0,0.1)" 
        }}>
            {userPlan} PLAN
        </div>
        
        <div>
            <button onClick={() => navigate("/stocks")} style={styles.stockBtn}>
                📈 Stocks
            </button>
            
            {userPlan !== "none" && (
                <button onClick={() => navigate("/pricing")} style={styles.upgradeBtn}>
                    💎 Upgrade
                </button>
            )}

            <button onClick={handleSignOut} style={styles.logoutBtn}>Sign Out</button>
        </div>
      </div>
      {/* --- HEADER END --- */}
      
      <p>Logged in as: <strong>{user?.email}</strong></p>

      {/* UPLOAD BOX */}
      <div style={styles.uploadBox}>
        <h3>Upload New File</h3>
        <input type="file" onChange={(e) => setFile(e.target.files[0])} />
        <button onClick={handleUpload} style={styles.uploadBtn}>Upload</button>
        <p style={{ marginTop: '10px', fontWeight: 'bold' }}>{status}</p>

        {uploadProgress > 0 && (
            <div style={{ width: '100%', backgroundColor: '#e0e0e0', borderRadius: '5px', marginTop: '15px' }}>
                <div style={{ width: `${uploadProgress}%`, height: '10px', backgroundColor: '#28a745', borderRadius: '5px', transition: 'width 0.3s ease-in-out' }} />
                <p style={{ textAlign: 'center', fontSize: '12px', margin: '5px 0' }}>{uploadProgress}%</p>
            </div>
        )}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
          <h3>All Uploaded Files:</h3>
          
          <input 
            type="text" 
            placeholder="🔍 Search files..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
                padding: "8px 12px",
                borderRadius: "5px",
                border: "1px solid #ccc",
                fontSize: "14px",
                width: "250px"
            }}
          />
      </div>

      <ul style={styles.list}>
        {filteredFiles.length === 0 && <p style={{color: '#999', fontStyle: 'italic'}}>No files found matching "{searchTerm}"</p>}
        
        {filteredFiles.map(f => (
          <li key={f._id} style={styles.listItem}>
            <div>
              <span style={{ fontWeight: 'bold' }}>📄 {f.filename}</span><br/>
              <small>By: {f.ownerEmail}</small>
            </div>
            <div>
                {/* DOWNLOAD: Available for SILVER, GOLD, PLATINUM */}
                {(userPlan === "SILVER" || userPlan === "GOLD" || userPlan === "PLATINUM") ? (
                  <a href={f.downloadUrl} style={styles.downloadLink}>Download ⬇️</a>
                ) : (
                  <button disabled style={{ ...styles.downloadLink, opacity: 0.5, cursor: 'not-allowed', backgroundColor: '#ccc' }}>
                    Download ⬇️ 
                  </button>
                )}

                {/* DELETE: Available only for GOLD, PLATINUM */}
                {(userPlan === "GOLD" || userPlan === "PLATINUM") ? (
                  <button onClick={() => handleDelete(f._id)} style={styles.deleteBtn}>
                    Delete 🗑️
                  </button>
                ) : (
                  <button 
                    disabled
                    style={{ ...styles.deleteBtn, backgroundColor: '#ccc', cursor: 'not-allowed', color: '#666' }}
                    title="Only Gold/Platinum members can delete files"
                  >
                    Delete 🗑️ (Gold+ only)
                  </button>
                )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

const styles = {
  container: { display: 'flex', justifyContent: 'center', marginTop: '100px', fontFamily: 'Arial' },
  card: { padding: '40px', border: '1px solid #ccc', borderRadius: '10px', textAlign: 'center', width: '300px' },
  input: { padding: '10px', fontSize: '16px', borderRadius: '5px', border: '1px solid #ccc', width: '90%' },
  primaryBtn: { padding: '12px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', fontSize: '16px', cursor: 'pointer', width: '100%' },
  successBtn: { padding: '12px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', fontSize: '16px', cursor: 'pointer', width: '100%' },
  
  stockBtn: { marginRight: '15px', padding: '8px 16px', backgroundColor: '#343a40', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' },
  upgradeBtn: { backgroundColor: "#ffc107", color: "black", padding: "8px 15px", marginRight: "10px", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "bold", fontSize: "14px" },
  logoutBtn: { padding: '8px 16px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' },
  uploadBtn: { padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', marginLeft: '10px', cursor: 'pointer' },
  deleteBtn: { marginLeft: '15px', padding: '6px 12px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' },
  
  uploadBox: { padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '30px' },
  list: { listStyle: 'none', padding: 0 },
  listItem: { padding: '15px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  downloadLink: { color: '#007bff', textDecoration: 'none', fontWeight: 'bold', border: '1px solid #007bff', padding: '5px 10px', borderRadius: '5px' },
  link: { color: '#007bff', cursor: 'pointer', fontWeight: 'bold', textDecoration: 'underline' },
  form: { display: 'flex', flexDirection: 'column', gap: '15px' },
  featureCard: { padding: '15px', border: '1px solid #ddd', borderRadius: '8px', marginBottom: '10px', backgroundColor: 'white', boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }
};

export default App;