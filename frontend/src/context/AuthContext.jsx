import { useEffect, useState } from "react";
import api from "../api/axios";
import { AuthContext } from "./useAuth";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  // Only wait for /auth/me if there is a saved token
  const [loading, setLoading] = useState(Boolean(localStorage.getItem("token")));

  useEffect(() => {
    if (!localStorage.getItem("token")) return;

    api
      .get("/auth/me")
      .then((res) => setUser(res.data.user))
      .catch(() => {
        localStorage.removeItem("token");
        setToken(null);
      })
      .finally(() => setLoading(false));
  }, []);

  function saveSession(newToken, newUser) {
    localStorage.setItem("token", newToken);
    setToken(newToken);
    setUser(newUser);
  }

  async function login(email, password) {
    const res = await api.post("/auth/login", { email, password });
    saveSession(res.data.token, res.data.user);
    return res.data.user;
  }

  async function register(formData) {
    const res = await api.post("/auth/register", formData);
    saveSession(res.data.token, res.data.user);
    return res.data.user;
  }

  function logout() {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
