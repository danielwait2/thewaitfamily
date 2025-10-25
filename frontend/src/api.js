import axios from "axios";

const envApiUrl = (process.env.REACT_APP_API_URL || "").trim();

const defaultApiUrl =
  typeof window !== "undefined"
    ? `${window.location.origin.replace(/\/$/, "")}/api`
    : "http://localhost:3000/api";

export const API_BASE_URL = envApiUrl || defaultApiUrl;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

let authToken = null;

export const setAuthToken = (token) => {
  authToken = token;
  if (token) {
    apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common.Authorization;
  }
};

export const getAuthToken = () => authToken;

if (typeof window !== "undefined") {
  const storedToken = window.localStorage.getItem("adminToken");
  if (storedToken) {
    setAuthToken(storedToken);
  }
}

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      typeof window !== "undefined" &&
      error.response?.status === 401 &&
      window.localStorage.getItem("adminToken")
    ) {
      window.localStorage.removeItem("adminToken");
      setAuthToken(null);
    }
    return Promise.reject(error);
  }
);

export default apiClient;
