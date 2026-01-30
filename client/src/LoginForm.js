import React, { useState } from 'react';
// 1. Remove axios, Import Amplify Auth functions
import { signUp, confirmSignUp, signIn, signInWithRedirect } from 'aws-amplify/auth';

function LoginForm({ onLogin }) {
  // State for toggling views
  const [mode, setMode] = useState('login'); // 'login' or 'signup'
  const [step, setStep] = useState(1);       // 1 = Form, 2 = Verification Code

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  
  // UI State
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // ==========================================
  // 1. HANDLE SIGNUP (Create AWS Account)
  // ==========================================
  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setError(''); 
    setLoading(true);

    try {
      // AWS: Create the user
      const { userId } = await signUp({
        username: email,
        password,
        options: {
          userAttributes: {
            name: name, // We save the name in AWS
          },
        },
      });

      console.log("Signup Success, User ID:", userId);
      alert("Account created! Please check your email for the verification code.");
      
      // Move to Step 2: Enter Verification Code
      setStep(2); 

    } catch (err) {
      console.error("Signup Error:", err);
      setError(err.message || "Signup Failed");
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // 2. HANDLE VERIFICATION (Confirm Email)
  // ==========================================
  const handleVerificationSubmit = async (e) => {
    e.preventDefault();
    setError(''); 
    setLoading(true);

    try {
      // AWS: Confirm the email address using the code
      await confirmSignUp({
        username: email,
        confirmationCode: otp
      });

      alert("Email Verified! You can now sign in.");
      
      // Switch to Login Mode
      setMode('login'); 
      setStep(1); 
      setOtp('');

    } catch (err) {
      console.error("Verification Error:", err);
      setError(err.message || "Invalid Code");
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // 3. HANDLE LOGIN (Get Token)
  // ==========================================
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError(''); 
    setLoading(true);

    try {
      // AWS: Sign in
      const { isSignedIn, nextStep } = await signIn({ 
        username: email, 
        password 
      });

      if (isSignedIn) {
        // SUCCESS! AWS has stored the tokens in browser memory automatically.
        // We just tell the parent component "We are in!"
        onLogin();
      } else {
        // Handle edge cases (like if they created account but never verified email)
        if (nextStep.signInStep === 'CONFIRM_SIGN_UP') {
          alert("Please enter the verification code sent to your email.");
          setMode('signup');
          setStep(2);
        }
      }
    } catch (err) {
      console.error("Login Error:", err);
      setError(err.message || "Incorrect username or password");
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // 4. SOCIAL LOGIN HANDLER
  // ==========================================
  const handleSocialLogin = (provider) => {
    // This asks AWS to redirect the user to Facebook/Google/LinkedIn
    signInWithRedirect({ provider: provider });
  };

  // ==========================================
  // STYLES
  // ==========================================
  const styles = {
    form: { display: 'flex', flexDirection: 'column', gap: '15px', width: '100%' },
    input: { padding: '12px', borderRadius: '5px', border: '1px solid #ccc', fontSize: '16px' },
    button: { padding: '12px', backgroundColor: '#0a66c2', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' },
    socialBtn: { padding: '10px', width: '100%', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '15px', fontWeight: 'bold', color: 'white', marginTop: '10px' },
    error: { color: 'red', fontSize: '14px', textAlign: 'center' },
    linkBtn: { background: 'none', border: 'none', color: '#0a66c2', cursor: 'pointer', textDecoration: 'underline', marginTop: '10px', fontSize: '14px' },
    divider: { margin: '20px 0', borderTop: '1px solid #ddd', position: 'relative' },
    dividerText: { position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', backgroundColor: 'white', padding: '0 10px', color: '#666', fontSize: '12px' }
  };

  // ---------------- RENDER: SIGNUP FORM ----------------
  if (mode === 'signup') {
    return (
      <div>
        <h2 style={{ marginBottom: '10px' }}>{step === 1 ? "Create Account" : "Verify Email"}</h2>
        {error && <p style={styles.error}>{error}</p>}

        {/* STEP 1: Enter Details */}
        {step === 1 && (
          <form onSubmit={handleSignupSubmit} style={styles.form}>
            <input type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} required style={styles.input} />
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required style={styles.input} />
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required style={styles.input} />
            <button type="submit" disabled={loading} style={styles.button}>{loading ? "Creating..." : "Agree & Join"}</button>
            <button type="button" onClick={() => setMode('login')} style={styles.linkBtn}>Already have an account? Sign In</button>
          </form>
        )}

        {/* STEP 2: Enter OTP (Email Verification) */}
        {step === 2 && (
          <form onSubmit={handleVerificationSubmit} style={styles.form}>
            <p style={{textAlign: 'center', fontSize: '14px'}}>We sent a code to {email}</p>
            <input type="text" placeholder="Enter 6-digit code" value={otp} onChange={(e) => setOtp(e.target.value)} required maxLength="6" style={{ ...styles.input, textAlign: 'center', letterSpacing: '5px', fontSize: '20px' }} />
            <button type="submit" disabled={loading} style={styles.button}>{loading ? "Verifying..." : "Verify & Create"}</button>
            <button type="button" onClick={() => setStep(1)} style={styles.linkBtn}>Cancel / Go Back</button>
          </form>
        )}
      </div>
    );
  }

  // ---------------- RENDER: LOGIN FORM ----------------
  return (
    <div>
      <h2 style={{ marginBottom: '10px' }}>Sign In</h2>
      {error && <p style={styles.error}>{error}</p>}
      
      <form onSubmit={handleLoginSubmit} style={styles.form}>
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required style={styles.input} />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required style={styles.input} />
        <button type="submit" disabled={loading} style={styles.button}>{loading ? "Signing in..." : "Sign in"}</button>
      </form>
      
      <div style={styles.divider}>
        <span style={styles.dividerText}>OR</span>
      </div>

      {/* Social Buttons connected to AWS */}
      <button onClick={() => handleSocialLogin('Google')} style={{ ...styles.socialBtn, backgroundColor: '#DB4437' }}>
         Sign in with Google
      </button>
      
      <button onClick={() => handleSocialLogin('Facebook')} style={{ ...styles.socialBtn, backgroundColor: '#1877F2' }}>
         Sign in with Facebook
      </button>

      {/* Note: LinkedIn requires manual setup in AWS Console to work here */}
      <button onClick={() => handleSocialLogin('LinkedIn')} style={{ ...styles.socialBtn, backgroundColor: '#0077b5' }}>
         Sign in with LinkedIn
      </button>

      <div style={{textAlign: 'center', marginTop: '15px'}}>
        <button onClick={() => { setMode('signup'); setStep(1); }} style={styles.linkBtn}>
            New to LinkedIn? Join now
        </button>
      </div>
    </div>
  );
}

export default LoginForm;