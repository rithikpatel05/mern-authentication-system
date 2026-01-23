import React, { useState } from 'react';
import axios from 'axios';

// NOTE: We used to pass (userData, token) to onLogin.
// Now we just pass () because cookies handle the data.
function LoginForm({ onLogin }) {
  const [mode, setMode] = useState('login'); 
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // --- 1. HANDLE SIGNUP ---
  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await axios.post('http://localhost:5000/auth/signup', { name, email, password });
      alert("Account Created! Please Sign In.");
      setMode('login'); setStep(1);
    } catch (err) { setError(err.response?.data?.error || "Signup Failed"); } 
    finally { setLoading(false); }
  };

  // --- 2. HANDLE LOGIN (STEP 1) ---
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    // Important: Add withCredentials here too just in case
    try {
      const res = await axios.post('http://localhost:5000/auth/signin', 
        { email, password }, 
        { withCredentials: true } 
      );
      if (res.data.mfaRequired) {
        setStep(2);
        alert("Code sent to your email!");
      }
    } catch (err) { setError(err.response?.data?.error || "Login Failed"); } 
    finally { setLoading(false); }
  };

  // --- 3. HANDLE OTP (STEP 2 - UPDATED) ---
  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);

    try {
      // The Server will set the Cookie upon success
      const res = await axios.post('http://localhost:5000/auth/verify-mfa', 
        { email, otp }, 
        { withCredentials: true }
      );

      if (res.data.success) {
        // --- CHANGED ---
        // We DO NOT save to localStorage anymore.
        // We just tell the parent "Success!"
        onLogin(); 
      }
    } catch (err) { setError(err.response?.data?.error || "Invalid Code"); } 
    finally { setLoading(false); }
  };

  // --- STYLES (Kept Simple) ---
  const styles = {
    form: { display: 'flex', flexDirection: 'column', gap: '15px', width: '100%' },
    input: { padding: '12px', borderRadius: '5px', border: '1px solid #ccc', fontSize: '16px' },
    button: { padding: '12px', backgroundColor: '#0a66c2', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' },
    error: { color: 'red', fontSize: '14px', textAlign: 'center' },
    linkBtn: { background: 'none', border: 'none', color: '#0a66c2', cursor: 'pointer', textDecoration: 'underline', marginTop: '10px', fontSize: '14px' }
  };

  if (mode === 'signup') {
    return (
      <div>
        <h2>Create Account</h2>
        {error && <p style={styles.error}>{error}</p>}
        <form onSubmit={handleSignupSubmit} style={styles.form}>
          <input type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} required style={styles.input} />
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required style={styles.input} />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required style={styles.input} />
          <button type="submit" disabled={loading} style={styles.button}>{loading ? "Creating..." : "Agree & Join"}</button>
        </form>
        <button onClick={() => setMode('login')} style={styles.linkBtn}>Already have an account? Sign In</button>
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ marginBottom: '10px' }}>{step === 1 ? "Sign In" : "Enter Code"}</h2>
      {error && <p style={styles.error}>{error}</p>}
      
      {step === 1 && (
        <>
          <form onSubmit={handleLoginSubmit} style={styles.form}>
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required style={styles.input} />
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required style={styles.input} />
            <button type="submit" disabled={loading} style={styles.button}>{loading ? "Sending..." : "Sign in"}</button>
          </form>
          <button onClick={() => setMode('signup')} style={styles.linkBtn}>Don't have an account? Create one</button>
        </>
      )}

      {step === 2 && (
        <form onSubmit={handleOtpSubmit} style={styles.form}>
          <input type="text" placeholder="Enter 6-digit code" value={otp} onChange={(e) => setOtp(e.target.value)} required maxLength="6" style={{ ...styles.input, textAlign: 'center', letterSpacing: '5px', fontSize: '20px' }} />
          <button type="submit" disabled={loading} style={styles.button}>{loading ? "Verifying..." : "Verify Code"}</button>
          <button type="button" onClick={() => setStep(1)} style={styles.linkBtn}>Cancel / Go Back</button>
        </form>
      )}
    </div>
  );
}

export default LoginForm;