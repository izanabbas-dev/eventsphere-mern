import { createContext, useContext, useEffect } from "react";

// The provider for this context is in SocketContext.jsx
export const SocketContext = createContext(null);

// The socket, or null while not connected
export default function useSocket() {
  return useContext(SocketContext);
}

// Join the live room of an expo while the page is open
export function useExpoRoom(expoId) {
  const socket = useSocket();

  useEffect(() => {
    if (!socket || !expoId) return;

    const join = () => socket.emit("join_expo", expoId);
    join();
    // After a reconnect the server forgets the rooms, so join again
    socket.on("connect", join);

    return () => {
      socket.off("connect", join);
      socket.emit("leave_expo", expoId);
    };
  }, [socket, expoId]);
}

// Run "handler" every time the server sends "event". Wrap handler in useCallback.
export function useSocketEvent(event, handler) {
  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;
    socket.on(event, handler);
    return () => socket.off(event, handler);
  }, [socket, event, handler]);
}
