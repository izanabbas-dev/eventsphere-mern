import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import useAuth from "./useAuth";
import { SocketContext } from "./useSocket";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:3000";

// One live connection for the whole app, only while the user is logged in
export function SocketProvider({ children }) {
  const { token } = useAuth();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!token) return;

    const newSocket = io(SOCKET_URL, { auth: { token } });
    newSocket.on("connect", () => setSocket(newSocket));
    newSocket.on("connect_error", (error) => console.log("Socket error:", error.message));

    return () => {
      newSocket.disconnect();
      setSocket(null);
    };
  }, [token]);

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
}
