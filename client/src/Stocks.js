import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

function Stocks() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [selectedStock, setSelectedStock] = useState(null);
    const [loading, setLoading] = useState(false);
    const [detailLoading, setDetailLoading] = useState(false);
    const navigate = useNavigate();

    // 1. SEARCH (Yahoo - Fast & Unlimited)
    useEffect(() => {
        const delaySearch = setTimeout(() => {
            if (query.length > 1) {
                fetchStocks();
            } else {
                setResults([]);
            }
        }, 500); 
        return () => clearTimeout(delaySearch);
    }, [query]);

    const fetchStocks = async () => {
        setLoading(true);
        setSelectedStock(null);
        try {
            const token = localStorage.getItem("token");
            const res = await axios.get(`${API_URL}/stocks/search?symbol=${query}`, {
                headers: { Authorization: token }
            });
            setResults(res.data);
        } catch (err) {
            console.error("Search failed");
        } finally {
            setLoading(false);
        }
    };

    // 2. CLICK (Twelve Data - 1 Credit)
    // 🟢 Updated: Passes 'exchange' so backend knows where to look
    const handleStockClick = async (item) => {
        setDetailLoading(true);
        try {
            const token = localStorage.getItem("token");
            // Pass SYMBOL and EXCHANGE
            const res = await axios.get(`${API_URL}/stocks/quote?symbol=${item.symbol}&exchange=${item.exchange}`, {
                headers: { Authorization: token }
            });
            setSelectedStock(res.data);
            setResults([]); 
        } catch (err) {
            if (err.response && err.response.status === 429) {
                alert("⚠️ Speed Limit (8 clicks/min). Please wait.");
            } else {
                alert("Could not load details. This stock might not be supported.");
            }
        } finally {
            setDetailLoading(false);
        }
    };

    const goBack = () => {
        setSelectedStock(null);
        setResults([]);
        setQuery("");
    };

    const renderSearchList = () => (
        <div style={styles.listContainer}>
            {loading && <p style={styles.centerText}>Searching...</p>}
            
            {!loading && results.length === 0 && query.length > 1 && (
                 <p style={styles.centerText}>No stocks found for "{query}"</p>
            )}

            {!loading && results.map((item, index) => (
                // 🟢 Pass the WHOLE item, not just symbol
                <div key={index} style={styles.listItem} onClick={() => handleStockClick(item)}>
                    <div style={styles.iconBox}>🔍</div>
                    <div style={styles.info}>
                        <div style={styles.symbol}>{item.name}</div>
                        <div style={styles.subText}>{item.symbol} • {item.exchange}</div>
                    </div>
                    <div style={styles.arrow}>›</div>
                </div>
            ))}
        </div>
    );

    const renderDetailView = () => {
        if (detailLoading) return <p style={styles.centerText}>Loading Price...</p>;
        if (!selectedStock) return null;

        const isPos = selectedStock.change >= 0;
        const color = isPos ? '#00c853' : '#ff3d00';
        // 🟢 Dynamic Currency Symbol
        const currencySymbol = selectedStock.currency === 'INR' ? '₹' : '$';

        return (
            <div style={styles.detailCard}>
                <h2 style={{margin: '0 0 5px 0'}}>{selectedStock.name}</h2>
                <span style={styles.chip}>{selectedStock.symbol}</span>

                <div style={{marginTop: '30px', textAlign: 'center'}}>
                    <div style={{fontSize: '48px', fontWeight: 'bold'}}>
                        {currencySymbol}{selectedStock.price ? selectedStock.price.toLocaleString() : "N/A"}
                    </div>
                    
                    {selectedStock.price && (
                        <div style={{fontSize: '18px', color: color, fontWeight: '600'}}>
                            {isPos ? '▲' : '▼'} {selectedStock.change?.toFixed(2)} ({selectedStock.changePercent?.toFixed(2)}%)
                        </div>
                    )}
                </div>

                <div style={styles.grid}>
                    <div style={styles.gridItem}>
                        <span style={styles.label}>Day High</span>
                        <strong>{selectedStock.dayHigh?.toLocaleString() || "-"}</strong>
                    </div>
                    <div style={styles.gridItem}>
                        <span style={styles.label}>Day Low</span>
                        <strong>{selectedStock.dayLow?.toLocaleString() || "-"}</strong>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <button onClick={selectedStock ? goBack : () => navigate("/dashboard")} style={styles.backBtn}>
                    {selectedStock ? "← Back" : "← Home"}
                </button>
                {!selectedStock && (
                    <input 
                        type="text" 
                        placeholder="Search (e.g., TATA)..." 
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        style={styles.searchInput}
                        autoFocus
                    />
                )}
            </div>
            {selectedStock ? renderDetailView() : renderSearchList()}
        </div>
    );
}

const styles = {
    container: { backgroundColor: '#f5f5f5', minHeight: '100vh', fontFamily: 'Arial' },
    header: { display: 'flex', alignItems: 'center', padding: '15px', backgroundColor: '#fff', borderBottom: '1px solid #ddd' },
    backBtn: { border: 'none', background: 'none', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginRight: '15px' },
    searchInput: { flex: 1, padding: '10px', fontSize: '16px', borderRadius: '8px', border: '1px solid #ddd', outline: 'none' },
    listContainer: { padding: '10px' },
    centerText: { textAlign: 'center', marginTop: '40px', color: '#666' },
    listItem: { display: 'flex', alignItems: 'center', padding: '15px', backgroundColor: '#fff', marginBottom: '10px', borderRadius: '10px', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' },
    iconBox: { width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#e3f2fd', color: '#007bff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '15px' },
    info: { flex: 1 },
    symbol: { fontWeight: 'bold', fontSize: '16px', color: '#333' },
    subText: { fontSize: '13px', color: '#777' },
    arrow: { fontSize: '24px', color: '#ccc' },
    detailCard: { margin: '20px', padding: '30px', backgroundColor: '#fff', borderRadius: '15px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', textAlign: 'center' },
    chip: { backgroundColor: '#eee', padding: '5px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' },
    grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '40px', textAlign: 'left' },
    gridItem: { padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '8px', display: 'flex', flexDirection: 'column' },
    label: { fontSize: '12px', color: '#888', marginBottom: '5px', textTransform: 'uppercase' }
};

export default Stocks;