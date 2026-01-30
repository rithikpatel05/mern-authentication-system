const express = require('express');
const router = express.Router();
const axios = require('axios');
const cheerio = require('cheerio'); 
const verifyToken = require('../middleware/verifyToken');

// 1. SEARCH ROUTE (Keep using Yahoo for search names, it's usually unblocked)
router.get('/search', verifyToken, async (req, res) => {
    const query = req.query.symbol;
    if (!query) return res.status(400).json({ error: "Search term is required" });

    try {
        const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${query}&quotesCount=10`;
        const response = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });

        const simpleList = (response.data.quotes || [])
            .filter(q => q.symbol && (q.quoteType === 'EQUITY' || q.quoteType === 'INDEX'))
            .map(q => ({
                symbol: q.symbol, // Yahoo Symbol (e.g., TCS.NS)
                name: q.shortname || q.longname || q.symbol,
                exchange: q.exchange
            }));

        res.json(simpleList);
    } catch (error) {
        console.error("Search Error:", error.message);
        res.json([]);
    }
});

// 2. PRICE ROUTE (Google Finance Scraper) 🟢
router.get('/quote', verifyToken, async (req, res) => {
    let symbol = req.query.symbol; // e.g., "TCS.NS"
    if (!symbol) return res.status(400).json({ error: "Symbol is required" });

    // 🔄 MAPPING: Convert Yahoo Symbol (.NS) to Google Symbol (:NSE)
    let googleSymbol = symbol;
    if (symbol.endsWith('.NS')) {
        googleSymbol = symbol.replace('.NS', ':NSE'); // TCS.NS -> TCS:NSE
    } else if (symbol.endsWith('.BO')) {
        googleSymbol = symbol.replace('.BO', ':BOM'); // TCS.BO -> TCS:BOM
    } else {
        // Fallback for US stocks
        googleSymbol = symbol + ':NASDAQ'; 
    }

    try {
        const url = `https://www.google.com/finance/quote/${googleSymbol}`;
        console.log(`🕵️‍♂️ Scraping Google: ${url}`);

        const { data } = await axios.get(url, {
            headers: {
                // Mimic a real Chrome browser to avoid 403 Forbidden
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9',
            }
        });

        const $ = cheerio.load(data);

        // 🟢 GOOGLE FINANCE CLASS NAMES (Stable as of 2026)
        // .YMlKec = The Big Price Number
        // .zzDege = The Company Name
        // .JwB6zf = The Change %
        
        const priceText = $('.YMlKec.fxKbKc').first().text(); // e.g. "₹3,980.50"
        const nameText = $('.zzDege').first().text();         // e.g. "Tata Consultancy Services"
        const changeText = $('.JwB6zf').first().text();       // e.g. "0.45%"

        if (!priceText) {
            console.log("❌ Failed to find price. Google might have shown a CAPTCHA.");
            return res.status(404).json({ error: "Stock data not found on Google" });
        }

        // Clean the price string (remove '₹', '$', and ',')
        const price = parseFloat(priceText.replace(/[₹$,]/g, ''));
        const change = parseFloat(changeText.replace(/[%+]/g, '')) || 0;

        res.json({
            symbol: symbol, // Return original Yahoo symbol to keep frontend happy
            name: nameText || symbol,
            price: price,
            currency: priceText.includes('₹') ? "INR" : "USD",
            change: 0, // Google makes it hard to separate Change vs Change%, so we simplify
            changePercent: change, 
            dayHigh: 0, // Hard to scrape dynamically, leaving as 0
            dayLow: 0,
            open: 0,
            prevClose: 0
        });

    } catch (error) {
        console.error("Google Scraper Error:", error.message);
        res.status(500).json({ error: "Failed to scrape Google Finance" });
    }
});

module.exports = router;