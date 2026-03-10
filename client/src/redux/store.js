import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';

// 1. STORE: Creating the giant centralized vault
export const store = configureStore({
  reducer: {
    auth: authReducer, // We plug the Auth Slice into the vault
    // Later, we will add file: fileReducer here!
  },
});