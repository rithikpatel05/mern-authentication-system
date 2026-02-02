import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom"; 
import { Amplify } from 'aws-amplify';
import { signUp, confirmSignUp } from 'aws-amplify/auth';
import axios from "axios";
import Stocks from "./Stocks";
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
    </BrowserRouter>
  );
}

function AppRoutes() {
  const [user, setUser] = useState(null);
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
      setUser(res.data.user); 
    } catch (err) {
      localStorage.removeItem("token");
      delete axios.defaults.headers.common['Authorization'];
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{textAlign:'center', marginTop:'50px'}}>Loading...</div>;

  return (
    <Routes>
      <Route path="/" element={!user ? <LoginPage setUser={setUser} /> : <Navigate to="/dashboard" />} />
      <Route path="/dashboard" element={user ? <Dashboard user={user} setUser={setUser} /> : <Navigate to="/" />} />
      <Route path="/stocks" element={user ? <Stocks /> : <Navigate to="/" />} />
    </Routes>
  );
}

// --- LOGIN PAGE ---
function LoginPage({ setUser }) {
  const [view, setView] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState(""); 
  const [name, setName] = useState(""); 
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { email, password });
      
      const token = res.data.token;
      if (token) {
        localStorage.setItem("token", token);
        axios.defaults.headers.common['Authorization'] = token;
      }

      setUser(res.data.user); 
      navigate("/dashboard");
    } catch (err) {
      setError("Login failed: " + (err.response?.data?.error || "Invalid credentials"));
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    try {
      const { nextStep } = await signUp({
        username: email,
        password,
        options: { userAttributes: { email, name } }
      });
      if (nextStep.signUpStep === 'CONFIRM_SIGN_UP') setView("confirm");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleConfirm = async (e) => {
    e.preventDefault();
    try {
      await confirmSignUp({ username: email, confirmationCode: code });
      alert("Verified! Please Login.");
      setView("login");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {view === "login" && (
          <>
            <h1>Welcome Back</h1>
            <form onSubmit={handleLogin} style={styles.form}>
              <input type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} style={styles.input} required />
              <input type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} style={styles.input} required />
              <button type="submit" style={styles.primaryBtn}>Sign In</button>
            </form>
            <p style={{marginTop: '15px'}}><span onClick={() => setView("signup")} style={styles.link}>Create Account</span></p>
          </>
        )}
        {view === "signup" && (
           <>
            <h1>Create Account</h1>
            <form onSubmit={handleSignUp} style={styles.form}>
              <input type="text" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} style={styles.input} required />
              <input type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} style={styles.input} required />
              <input type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} style={styles.input} required />
              <button type="submit" style={styles.successBtn}>Create Account</button>
            </form>
            <p style={{marginTop: '15px'}}><span onClick={() => setView("login")} style={styles.link}>Back to Login</span></p>
           </>
        )}
        {view === "confirm" && (
           <>
             <h1>Verify Email</h1>
             <form onSubmit={handleConfirm} style={styles.form}>
               <input placeholder="Enter Code" value={code} onChange={e=>setCode(e.target.value)} style={styles.input} required />
               <button type="submit" style={styles.primaryBtn}>Verify</button>
             </form>
           </>
        )}
        {error && <p style={{color:'red', marginTop:'10px'}}>{error}</p>}
      </div>
    </div>
  );
}

// --- DASHBOARD ---
function Dashboard({ user, setUser }) {
  const [file, setFile] = useState(null);
  const [allFiles, setAllFiles] = useState([]);
  const [status, setStatus] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    fetchFiles();
  }, []);

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

    // 1. SECURITY CHECK: File Type
    const forbiddenExtensions = /(\.exe|\.sh|\.bat|\.php|\.pl|\.vb|\.vbs|\.cmd|\.msi)$/i;
    if (forbiddenExtensions.test(file.name)) {
      alert("⚠️ Security Warning: You cannot upload executable files!");
      return;
    }

    // 2. SECURITY CHECK: File Size (10MB Limit)
    const MAX_SIZE = 10 * 1024 * 1024; 
    if (file.size > MAX_SIZE) {
        alert("⚠️ File too large! Maximum allowed size is 10MB.");
        return;
    }

    setStatus("Uploading...");
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('userEmail', user.email || "unknown"); 

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

        setAllFiles(allFiles.filter(f => f._id !== fileId));
        alert("File Deleted!");
    } catch (err) {
        alert("Delete failed: " + (err.response?.data?.message || "Server Error"));
    }
  };

  const handleSignOut = async () => {
    try { await axios.post(`${API_URL}/auth/logout`); } catch (err) {}
    localStorage.removeItem("token");
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    navigate("/");
  };

  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', fontFamily: 'Arial' }}>
      {/* --- HEADER START --- */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom:'20px' }}>
        <h2>Dashboard</h2>
        
        {/* 🟢 NEW: Button Group Wrapper */}
        <div>
            <button 
                onClick={() => navigate("/stocks")} 
                style={{ 
                    marginRight: '15px', 
                    padding: '8px 16px', 
                    backgroundColor: '#343a40', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '5px', 
                    cursor: 'pointer',
                    fontWeight: 'bold'
                }}
            >
                📈 Stocks
            </button>

            <button onClick={handleSignOut} style={styles.logoutBtn}>Sign Out</button>
        </div>
      </div>
      {/* --- HEADER END --- */}
      
      <p>Logged in as: <strong>{user?.email}</strong></p>

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

      <h3>All Uploaded Files:</h3>
      <ul style={styles.list}>
        {allFiles.map(f => (
          <li key={f._id} style={styles.listItem}>
            <div>
              <span style={{ fontWeight: 'bold' }}>📄 {f.filename}</span><br/>
              <small>By: {f.ownerEmail}</small>
            </div>
            <div>
                <a href={f.downloadUrl} style={styles.downloadLink}>Download ⬇️</a>
                <button 
                    onClick={() => handleDelete(f._id)}
                    style={{
                        marginLeft: '15px',
                        padding: '6px 12px',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                    }}
                >
                    Delete 🗑️
                </button>
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
  uploadBtn: { padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', marginLeft: '10px', cursor: 'pointer' },
  logoutBtn: { padding: '8px 16px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' },
  uploadBox: { padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '30px' },
  list: { listStyle: 'none', padding: 0 },
  listItem: { padding: '15px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  downloadLink: { color: '#007bff', textDecoration: 'none', fontWeight: 'bold', border: '1px solid #007bff', padding: '5px 10px', borderRadius: '5px' },
  link: { color: '#007bff', cursor: 'pointer', fontWeight: 'bold', textDecoration: 'underline' },
  form: { display: 'flex', flexDirection: 'column', gap: '15px' },
};

export default App;