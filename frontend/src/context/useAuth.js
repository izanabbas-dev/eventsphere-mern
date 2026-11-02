import { createContext, useContext } from "react";

// The provider for this context is in AuthContext.jsx
export const AuthContext = createContext(null);

export default function useAuth() {
  return useContext(AuthContext);
}
