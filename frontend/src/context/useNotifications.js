import { createContext, useContext } from "react";

// The provider for this context is in NotificationContext.jsx
export const NotificationContext = createContext(null);

export default function useNotifications() {
  return useContext(NotificationContext);
}
