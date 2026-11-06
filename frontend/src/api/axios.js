import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// These routes send 401 for a wrong password, which is not an expired login
const passwordRoutes = ["/auth/login", "/auth/update-password"];

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || "";
    const isPasswordRoute = passwordRoutes.some((route) => url.includes(route));

    if (error.response?.status === 401 && !isPasswordRoute && localStorage.getItem("token")) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default api;
