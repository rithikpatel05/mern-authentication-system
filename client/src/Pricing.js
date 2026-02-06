import React, { useEffect, useState } from "react";
import axios from "axios";

// Ensure this matches your backend URL
// ✅ This tells React: "Use the Vercel setting if available, otherwise use localhost"
// ✅ AUTOMATIC URL SWITCHER
// If running on your laptop -> uses localhost:5000/api
// If running on Vercel -> uses your Render backend/api

const API_URL = window.location.hostname === "localhost"
  ? "http://localhost:5000/api" 
  : "https://mern-authentication-system-rzru.onrender.com/api";

const Pricing = () => {
    const [currentPlan, setCurrentPlan] = useState("FREE");
    const [email, setEmail] = useState("");

    useEffect(() => {
        // 1. Get User details from storage
        const savedPlan = localStorage.getItem("userPlan");
        const savedEmail = localStorage.getItem("userEmail");
        
        if (savedPlan) setCurrentPlan(savedPlan);
        if (savedEmail) setEmail(savedEmail);
    }, []);

    const plans = [
        { id: "SILVER", name: "Silver Plan", price: 199, color: "#6c757d" },
        { id: "GOLD", name: "Gold Plan", price: 499, color: "#ffc107", recommended: true },
        { id: "PLATINUM", name: "Platinum Plan", price: 999, color: "#007bff" }
    ];

    // --- HANDLE PAYMENT (SWITCH/UPGRADE) ---
    const handlePayment = async (planName, amount) => {
        try {
            const response = await axios.post(`${API_URL}/stripe/create-checkout-session`, {
                planName,
                amount
            });
            if (response.data.url) window.location.href = response.data.url;
        } catch (error) {
            console.error("Payment Error:", error);
            alert("Payment failed.");
        }
    };

    // --- 🔴 HANDLE CANCEL (DOWNGRADE TO FREE) ---
    const handleCancel = async () => {
        if (!window.confirm("Are you sure you want to cancel your plan? You will lose premium features immediately.")) {
            return;
        }

        try {
            const res = await axios.post(`${API_URL}/stripe/cancel-plan`, { email });
            
            if (res.data.success) {
                alert("Subscription Cancelled. You are now on the Free Plan.");
                
                // Update Local Storage and State immediately
                localStorage.setItem("userPlan", "FREE");
                setCurrentPlan("FREE");
            }
        } catch (error) {
            console.error(error);
            alert("Failed to cancel plan.");
        }
    };

    return (
        <div style={{ textAlign: "center", padding: "50px", fontFamily: "Arial, sans-serif" }}>
            <h1>Manage Your Plan 💎</h1>
            <p>Current Status: <strong>{currentPlan}</strong></p>

            {/* Plan Benefits Panel */}
            <div style={{ maxWidth: 760, margin: '20px auto', textAlign: 'left' }}>
                <div style={{ border: '1px solid #b6d9e8', backgroundColor: '#e8f4f8', padding: '18px', borderRadius: 8 }}>
                    <h3 style={{ marginTop: 0 }}>📋 Plan Benefits</h3>
                    <div style={{ fontSize: 14, lineHeight: 1.7 }}>
                        <p><strong>FREE Plan:</strong>  Upload files</p>
                        <p><strong>SILVER Plan:</strong> Upload files •  Download files</p>
                        <p><strong>GOLD Plan:</strong> Upload files •  Download files •  Delete files</p>
                        <p><strong>PLATINUM Plan:</strong> Upload files •  Download files •  Delete files</p>
                        <p style={{ marginTop: 8 }}>Your current plan: <strong>{currentPlan}</strong></p>
                    </div>
                </div>
            </div>
            
            <div style={{ display: "flex", justifyContent: "center", gap: "20px", marginTop: "30px", flexWrap: "wrap" }}>
                {plans.map((plan) => {
                    const isCurrentPlan = currentPlan === plan.id;

                    return (
                        <div key={plan.id} style={{
                            border: `3px solid ${plan.color}`,
                            borderRadius: "10px",
                            padding: "20px",
                            width: "250px",
                            transform: plan.recommended ? "scale(1.05)" : "scale(1)",
                            backgroundColor: "white",
                            boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
                            position: "relative"
                        }}>
                            {/* Header Badge */}
                            {plan.recommended && !isCurrentPlan && (
                                <div style={styles.badge}>MOST POPULAR</div>
                            )}
                            {isCurrentPlan && (
                                <div style={{...styles.badge, backgroundColor: "green", color: "white"}}>
                                    ACTIVE PLAN
                                </div>
                            )}

                            <h2 style={{ margin: "10px 0", color: "#333" }}>{plan.name}</h2>
                            <h1 style={{ fontSize: "40px", margin: "10px 0" }}>₹{plan.price}</h1>
                            
                            {/* --- BUTTON LOGIC --- */}
                            {isCurrentPlan ? (
                                <div>
                                    <button disabled style={styles.currentBtn}>
                                        ✅ Current Plan
                                    </button>
                                    
                                    {/* 🔴 THE CANCEL BUTTON (Only shows if active) */}
                                    <button 
                                        onClick={handleCancel}
                                        style={styles.cancelBtn}
                                    >
                                        ❌ Cancel Plan
                                    </button>
                                </div>
                            ) : (
                                <button 
                                    onClick={() => handlePayment(plan.name, plan.price)}
                                    style={{...styles.payBtn, backgroundColor: plan.color}}
                                >
                                    Switch to {plan.name}
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// Styles for cleaner code
const styles = {
    badge: {
        backgroundColor: "#ffc107", 
        color: "#000", 
        fontSize: "12px", 
        fontWeight: "bold", 
        padding: "5px", 
        borderRadius: "5px", 
        marginBottom: "10px",
        display: "inline-block"
    },
    currentBtn: {
        backgroundColor: "#e9ecef",
        color: "#333", 
        border: "1px solid #ccc", 
        padding: "12px 20px", 
        fontSize: "16px", 
        fontWeight: "bold", 
        borderRadius: "5px", 
        width: "100%", 
        marginTop: "15px", 
        cursor: "not-allowed"
    },
    cancelBtn: {
        backgroundColor: "transparent",
        color: "#dc3545",
        border: "2px solid #dc3545",
        padding: "10px 20px", 
        fontSize: "14px", 
        fontWeight: "bold", 
        borderRadius: "5px", 
        width: "100%", 
        marginTop: "10px", 
        cursor: "pointer"
    },
    payBtn: {
        color: "white", 
        border: "none", 
        padding: "12px 20px", 
        fontSize: "16px", 
        fontWeight: "bold", 
        cursor: "pointer", 
        borderRadius: "5px", 
        width: "100%", 
        marginTop: "15px"
    }
};

export default Pricing;