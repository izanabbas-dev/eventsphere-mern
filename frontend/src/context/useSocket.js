import { createContext, useContext, useEffect } from "react";

export const SocketContext = createContext(null);

export default function useSocket() {
  return useContext(SocketContext);
}

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

export function useSocketEvent(event, handler) {
  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;
    socket.on(event, handler);
    return () => socket.off(event, handler);
  }, [socket, event, handler]);
}
