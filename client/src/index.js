import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// 1. Import Amplify
import { Amplify } from 'aws-amplify';

// 2. Configure the Connection to AWS
Amplify.configure({
  Auth: {
    Cognito: {
      // Found in your screenshot "Overview: User pool - ffbcp0"
      userPoolId: 'ap-south-1_5uGUkSbPX', 
      
      // Found in your screenshot "App client: mern-auth-client"
      userPoolClientId: '73kdt77qvad8do4j3fqetu8k86', 

      // OPTIONAL: Only needed if you use Google/Facebook/LinkedIn
      loginWith: {
        oauth: {
          // You need to find your "Cognito Domain" in App Integration -> Domain Name
          // It looks like: "your-app-name.auth.ap-south-1.amazoncognito.com"
         domain: 'ap-south-15uguksbpx.auth.ap-south-1.amazoncognito.com', 
          
          scopes: ['email', 'openid', 'phone'],
          redirectSignIn: ['http://localhost:3000'],
          redirectSignOut: ['http://localhost:3000'],
          responseType: 'code',
        }
      }
    }
  }
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

reportWebVitals();