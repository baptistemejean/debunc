import { useContext } from "react";
import type { AuthContextType, SocketContextType } from "./types";
import { AuthContext } from "./Popup/AuthProvider";
import { SocketContext } from "./Popup/SocketProvider";

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function useSocket(): SocketContextType {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within an AuthProvider");
  }
  return context;
}
