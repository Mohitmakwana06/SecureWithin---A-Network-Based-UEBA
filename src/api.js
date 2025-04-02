import axios from "axios";

const BASE_URL = "http://localhost:8000"; // Change this if backend is deployed

const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// 🚀 Signup: Send OTP
export const sendSignupOTP = async (userData) => {
  return api.post("/signup/", userData);
};

// 🚀 Verify Signup & Create Organization
export const verifySignup = async (otpData) => {
  return api.post("/verify-signup/", otpData);
};

// 🚀 Join Organization: Send OTP
export const sendJoinOTP = async (userData) => {
  return api.post("/join-organization/", userData);
};

// 🚀 Verify & Join Organization
export const verifyJoinOrg = async (otpData) => {
  return api.post("/verify-join-organization/", otpData);
};

// 🚀 User Login
export const loginUser = async (userData) => {
  return api.post("/login/", userData);
};

// 🚀 Protected Route Example
export const getProtectedData = async (token) => {
  return api.get("/protected-route/", {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export default api;
