import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const FIREBASE_API_KEY = import.meta.env.VITE_FIREBASE_API_KEY;

export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const firebaseRes = await axios.post(
        `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`,
        {
          email: credentials.email,
          password: credentials.password,
          returnSecureToken: true,
        },
      );

      const idToken = firebaseRes.data.idToken;

      const meRes = await axios.get(
        'http://localhost:5000/api/auth/me',
        { headers: { Authorization: `Bearer ${idToken}` } },
      );

      return { token: idToken, user: meRes.data.data };
    } catch (error) {
      if (error.response) {
        return rejectWithValue(error.response.data.message || error.response.data.error?.message || 'Login failed.');
      }
      return rejectWithValue('Network error. Please check your connection.');
    }
  },
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const firebaseRes = await axios.post(
        `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${FIREBASE_API_KEY}`,
        {
          email: userData.email,
          password: userData.password,
          returnSecureToken: true,
        },
      );

      const idToken = firebaseRes.data.idToken;

      const backendRes = await axios.post(
        'http://localhost:5000/api/auth/register',
        {
          name: userData.name,
          phone: userData.phone,
          email: userData.email,
          accountType: userData.accountType,
          currentAddress: userData.currentAddress,
          homeAddress: userData.homeAddress,
        },
        {
          headers: { Authorization: `Bearer ${idToken}` },
        },
      );

      return { token: idToken, user: backendRes.data.data };
    } catch (error) {
      if (error.response) {
        return rejectWithValue(error.response.data.message || error.response.data.error?.message || 'Registration failed');
      }
      return rejectWithValue('Network error. Please check your connection.');
    }
  },
);

const token = localStorage.getItem('token');
let user = null;
try {
  const stored = localStorage.getItem('user');
  if (stored) user = JSON.parse(stored);
} catch {}

const initialState = {
  user,
  token,
  isAuthenticated: !!token,
  isLoading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action) {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      localStorage.setItem('token', action.payload.token);
      localStorage.setItem('user', JSON.stringify(action.payload.user));
    },
    logout(state) {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        localStorage.setItem('token', action.payload.token);
        localStorage.setItem('user', JSON.stringify(action.payload.user));
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Registration failed.';
      })
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        localStorage.setItem('token', action.payload.token);
        localStorage.setItem('user', JSON.stringify(action.payload.user));
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Login failed.';
      });
  },
});

export const { setCredentials, logout, clearError } = authSlice.actions;
export default authSlice.reducer;
