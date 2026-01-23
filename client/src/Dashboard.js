import React, { useState, useEffect } from 'react';
import api from './api'; // Imports the new Smart Caller with Cookies

function Dashboard({ user, onLogout }) {
    const [files, setFiles] = useState([]);

    // --- 1. FETCH FILES (Updated URL) ---
    useEffect(() => {
        // The route in server.js is '/files' and in files.js is '/'
        // So the full URL is now '/files/'
        api.get('/files/')
            .then(res => setFiles(res.data))
            .catch(err => console.error("Error fetching files:", err));
    }, []);

    const styles = {
        dashboard: { padding: '40px', maxWidth: '800px', margin: '0 auto', fontFamily: 'Arial, sans-serif' },
        navbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: '15px 30px', boxShadow: '0 2px 4px rgba(0,0,0,0.08)', marginBottom: '30px', borderRadius: '8px' },
        logoutBtn: { padding: '8px 15px', backgroundColor: '#ff4d4f', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' },
        card: { backgroundColor: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', marginBottom: '20px' },
        uploadBtn: { marginTop: '10px', padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '15px' },
        fileItem: { border: '1px solid #ddd', padding: '15px', marginBottom: '10px', borderRadius: '5px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff' },
        downloadLink: { textDecoration: 'none', color: '#0077b5', fontWeight: 'bold', border: '1px solid #0077b5', padding: '5px 10px', borderRadius: '4px' }
    };

    // --- 2. UPLOAD FILE (Updated URL) ---
    const handleUpload = async (event) => {
        event.preventDefault(); 
        const fileInput = document.querySelector('input[type="file"]');
        if (!fileInput.files[0]) return alert("Please select a file first");

        const formData = new FormData();
        formData.append('document', fileInput.files[0]);

        try {
            // FIX: Updated endpoint from '/upload' to '/files/upload'
            await api.post('/files/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' } 
            });

            alert("Upload Successful!");
            window.location.reload();
        } catch (error) {
            console.error("Upload failed", error);
            alert("Upload Failed: " + (error.response?.data?.error || "Server Error"));
        }
    };

    return (
        <div style={styles.dashboard}>
            {/* Top Bar with Logout */}
            <div style={styles.navbar}>
                <h2>Welcome, {user.name}</h2>
                <button onClick={onLogout} style={styles.logoutBtn}>Logout</button>
            </div>

            {/* User Profile Card */}
            <div style={styles.card}>
                <h3>Your Profile</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    {user.picture && <img src={user.picture} alt="Profile" style={{ width: '80px', borderRadius: '50%' }} />}
                    <div>
                        <p><strong>Email:</strong> {user.email || "Not Provided"}</p>
                        <p><strong>Provider:</strong> {user.provider || "LinkedIn/Facebook"}</p>
                    </div>
                </div>
            </div>

            {/* Upload Section */}
            <div style={styles.card}>
                <h3>📂 Upload a File</h3>
                <form onSubmit={handleUpload}>
                    <input type="file" name="document" required style={{ marginBottom: '10px' }} />
                    <br />
                    <button type="submit" style={styles.uploadBtn}>Upload to AWS S3</button>
                </form>
            </div>

            {/* File List Section */}
            <h3>📄 Shared Files</h3>
            {files.length === 0 ? <p>No files uploaded yet.</p> : (
                files.map(file => (
                    <div key={file._id} style={styles.fileItem}>
                        <div>
                            <strong>{file.filename}</strong><br />
                            <small style={{ color: '#666' }}>Uploaded by: {file.uploadedBy}</small>
                        </div>
                        <a href={file.fileUrl} target="_blank" rel="noopener noreferrer" style={styles.downloadLink}>
                            ⬇ Download
                        </a>
                    </div>
                ))
            )}
        </div>
    );
}

export default Dashboard;