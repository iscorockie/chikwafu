import { createContext, useContext, useEffect, useState } from "react";
import api from "../lib/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("chikwafu_admin_token");
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get("/auth/me")
      .then((res) => {
        if (res.data.role !== "admin") throw new Error("Not admin");
        setUser(res.data);
      })
      .catch(() => localStorage.removeItem("chikwafu_admin_token"))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    if (data.role !== "admin") throw new Error("This account does not have admin access");
    localStorage.setItem("chikwafu_admin_token", data.token);
    setUser(data);
    return data;
  };

  const logout = () => {
    localStorage.removeItem("chikwafu_admin_token");
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
