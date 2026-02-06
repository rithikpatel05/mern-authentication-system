const router = require("express").Router();
const User = require("../models/User");
// Ensure this matches your .env file variable name
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

router.post("/create-checkout-session", async (req, res) => {
    const { planName, amount } = req.body;

    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: [
                {
                    price_data: {
                        currency: "inr",
                        product_data: {
                            name: planName,
                        },
                        unit_amount: amount * 100, // Amount in Paisa
                    },
                    quantity: 1,
                },
            ],
            mode: "payment",
            // 🟢 UPDATED: Redirect URLs
            success_url: "http://localhost:3000/success?session_id={CHECKOUT_SESSION_ID}",
            cancel_url: "http://localhost:3000/pricing",
        });

        // 🟢 UPDATED: Send the full URL to the frontend
        res.json({ url: session.url });

    } catch (error) {
        console.error("Stripe Error:", error);
        res.status(500).json({ error: "Failed to create session" });
    }
});

// New Route to Verify Payment and Update User Plan
router.post("/verify-payment", async (req, res) => {
    const { sessionId, email } = req.body;

    try {
        // 1. Ask Stripe if this session is paid
        const session = await stripe.checkout.sessions.retrieve(sessionId);

        if (session.payment_status === "paid") {
            // 2. Determine which plan they bought (based on amount)
            let newPlan = "FREE";
            if (session.amount_total === 19900) newPlan = "SILVER";
            if (session.amount_total === 49900) newPlan = "GOLD";
            if (session.amount_total === 99900) newPlan = "PLATINUM";

            // 3. Update Database
            // (Assuming you have a User model imported)
           
            await User.findOneAndUpdate({ email: email }, { plan: newPlan });

            res.json({ success: true, plan: newPlan });
        } else {
            res.json({ success: false });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Verification failed" });
    }
});


// New Route to Cancel Plan (Downgrade to FREE)
router.post("/cancel-plan", async (req, res) => {
    const { email } = req.body;
    
    try {
        const User = require("../models/User"); // Ensure path is correct
        
        // Find user and force update plan to FREE
        await User.findOneAndUpdate(
            { email: email },
            { plan: "FREE" }
        );

        res.json({ success: true, message: "Plan has been cancelled" });

    } catch (error) {
        console.error("Cancel Error:", error);
        res.status(500).json({ error: "Failed to cancel plan" });
    }
});


module.exports = router;