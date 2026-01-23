import axios from 'axios';

// 1. Create Axios Instance with Cookie Support
const api = axios.create({
  baseURL: 'http://localhost:5000',
  withCredentials: true // <--- IMPORTANT: Sends the HttpOnly Cookies automatically
});

// 2. Response Interceptor (Auto-Retry on 403)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If server says "Forbidden" (403) and we haven't retried yet...
    if (error.response?.status === 403 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        console.log("Token expired. Attempting refresh via Cookie...");
        
        // Call Refresh Endpoint (Browser sends the Refresh Cookie automatically)
        await axios.post('http://localhost:5000/auth/refresh', {}, { withCredentials: true });
        
        console.log("Refresh success! Retrying original request.");
        
        // Retry the original failed request
        return api(originalRequest);
        
      } catch (err) {
        console.error("Refresh failed. Session expired.");
        // If refresh fails, the user is truly logged out.
        // We will handle the redirect in App.js
        return Promise.reject(err);
      }
    }
    return Promise.reject(error);
  }
);

export default api;