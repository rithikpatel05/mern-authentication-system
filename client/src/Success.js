import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";

// ✅ AUTOMATIC URL SWITCHER
// Checks if the browser says "localhost". If not, it uses your Render Backend.
const API_URL = window.location.hostname === "localhost"
  ? "http://localhost:5000/api" 
  : "https://mern-authentication-system-rzru.onrender.com/api"; 
  // ⚠️ IMPORTANT: Double check the link above matches your Render URL exactly

const Success = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const sessionId = searchParams.get("session_id");
    const [status, setStatus] = useState("Verifying payment...");

    useEffect(() => {
        const verifyPayment = async () => {
            const userEmail = localStorage.getItem("userEmail");
            
            if (sessionId && userEmail) {
                try {
                    // 🟢 UPDATED: Using the dynamic API_URL here
                    const res = await axios.post(`${API_URL}/stripe/verify-payment`, {
                        sessionId,
                        email: userEmail
                    });

                    if (res.data.success) {
                        setStatus(`🎉 Success! You are now a ${res.data.plan} member.`);
                        
                        // Update Local Storage
                        localStorage.setItem("userPlan", res.data.plan);
                        localStorage.setItem("planUpdatedAt", Date.now().toString());
                    } else {
                        setStatus("Payment verification failed. Please contact support.");
                    }
                } catch (err) {
                    console.error("Verification Error:", err);
                    setStatus("Error verifying payment.");
                }
            }
        };

        verifyPayment();
    }, [sessionId]);

    const handleDashboardClick = () => {
        setTimeout(() => {
            navigate("/dashboard");
        }, 100);
    };

    return (
        <div style={{ textAlign: "center", marginTop: "50px", fontFamily: "Arial" }}>
            <h1>{status}</h1>
            <button 
                onClick={handleDashboardClick}
                style={{
                    padding: "10px 20px", 
                    fontSize: "16px", 
                    cursor: "pointer", 
                    backgroundColor: "#28a745", 
                    color: "white", 
                    border: "none", 
                    borderRadius: "5px",
                    marginTop: "20px"
                }}
            >
                Go to Dashboard
            </button>
        </div>
    );
};

export default Success;