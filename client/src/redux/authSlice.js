import { createSlice } from '@reduxjs/toolkit';

// 1. STATE: The default starting data before anyone logs in
const initialState = {
  user: null, // Will hold { email, plan, cognitoId } later
  token: null,
  isAuthenticated: false,
};

// 2. REDUX TOOLKIT: createSlice automatically handles Actions and Reducers!
const authSlice = createSlice({
  name: 'auth',
  initialState,
  // 3. REDUCERS: The only functions allowed to change the State
  reducers: {
    loginSuccess: (state, action) => {
      // action.payload will hold the data we send from the login page
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
    },
    logout: (state) => {
      // Wipes the vault clean!
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
    }
  }
});

// 4. ACTIONS: RTK generated these automatically from the reducers above. We export them!
export const { loginSuccess, logout } = authSlice.actions;

export default authSlice.reducer;