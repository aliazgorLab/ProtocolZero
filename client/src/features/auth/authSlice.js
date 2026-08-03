import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import axiosInstance from '../../api/axiosInstance';

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

      const checkRes = await axiosInstance.post(
        '/auth/login-check',
        {},
        { headers: { Authorization: `Bearer ${idToken}` } },
      );

      if (checkRes.data.requiresOtp) {
        return { token: idToken, requiresOtp: true, email: credentials.email };
      }

      return { token: idToken, user: checkRes.data.data, requiresOtp: false };
    } catch (error) {
      if (error.response) {
        return rejectWithValue(error.response.data.message || error.response.data.error?.message || 'Login failed.');
      }
      return rejectWithValue('Network error. Please check your connection.');
    }
  },
);

export const verifyOtp = createAsyncThunk(
  'auth/verifyOtp',
  async ({ otp, tempToken }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(
        '/auth/verify-otp',
        { otp },
        { headers: { Authorization: `Bearer ${tempToken}` } },
      );
      return { token: tempToken, user: response.data.data };
    } catch (error) {
      if (error.response) {
        return rejectWithValue(error.response.data.message || 'OTP verification failed.');
      }
      return rejectWithValue('Network error. Please check your connection.');
    }
  },
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      let idToken;
      try {
        const firebaseRes = await axios.post(
          `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${FIREBASE_API_KEY}`,
          {
            email: userData.email,
            password: userData.password,
            returnSecureToken: true,
          },
        );
        idToken = firebaseRes.data.idToken;
      } catch (fbError) {
        if (fbError.response?.data?.error?.message === 'EMAIL_EXISTS') {
          // Fallback: If Firebase user exists but MongoDB syncing failed previously,
          // login to get token and proceed with MongoDB syncing.
          const loginRes = await axios.post(
            `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`,
            {
              email: userData.email,
              password: userData.password,
              returnSecureToken: true,
            }
          );
          idToken = loginRes.data.idToken;
        } else {
          throw fbError;
        }
      }

      const backendRes = await axiosInstance.post(
        '/auth/register',
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
} catch { }

const initialState = {
  user,
  token,
  isAuthenticated: !!token,
  requiresOtp: false,
  tempToken: null,
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
      state.requiresOtp = false;
      state.tempToken = null;
      localStorage.setItem('token', action.payload.token);
      localStorage.setItem('user', JSON.stringify(action.payload.user));
    },
    logout(state) {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.requiresOtp = false;
      state.tempToken = null;
      state.error = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
    clearError(state) {
      state.error = null;
    },
    updateUser(state, action) {
      state.user = { ...state.user, ...action.payload };
      localStorage.setItem('user', JSON.stringify(state.user));
    },
    resetOtpState(state) {
      state.requiresOtp = false;
      state.tempToken = null;
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
        if (action.payload.requiresOtp) {
          state.requiresOtp = true;
          state.tempToken = action.payload.token;
          state.isAuthenticated = false;
        } else {
          state.user = action.payload.user;
          state.token = action.payload.token;
          state.isAuthenticated = true;
          state.requiresOtp = false;
          state.tempToken = null;
          localStorage.setItem('token', action.payload.token);
          localStorage.setItem('user', JSON.stringify(action.payload.user));
        }
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Login failed.';
      })
      .addCase(verifyOtp.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyOtp.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.requiresOtp = false;
        state.tempToken = null;
        localStorage.setItem('token', action.payload.token);
        localStorage.setItem('user', JSON.stringify(action.payload.user));
      })
      .addCase(verifyOtp.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Verification failed.';
      });
  },
});

export const { setCredentials, logout, clearError, updateUser, resetOtpState } = authSlice.actions;
export default authSlice.reducer;
