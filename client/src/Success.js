import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";

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
                    const res = await axios.post("http://localhost:5000/api/stripe/verify-payment", {
                        sessionId,
                        email: userEmail
                    });

                    if (res.data.success) {
                        setStatus(`🎉 Success! You are now a ${res.data.plan} member.`);
                        // 🟢 UPDATED: Store plan and add timestamp to force Dashboard refresh
                        localStorage.setItem("userPlan", res.data.plan);
                        localStorage.setItem("planUpdatedAt", Date.now().toString());
                    } else {
                        setStatus("Payment verification failed.");
                    }
                } catch (err) {
                    console.error(err);
                    setStatus("Error verifying payment.");
                }
            }
        };

        verifyPayment();
    }, [sessionId]);

    const handleDashboardClick = () => {
        // Force a small delay to ensure localStorage is set before navigating
        setTimeout(() => {
            navigate("/dashboard");
        }, 500);
    };

    return (
        <div style={{ textAlign: "center", marginTop: "50px" }}>
            <h1>{status}</h1>
            <button onClick={handleDashboardClick}>Go to Dashboard</button>
        </div>
    );
};

export default Success;