import { createContext, useEffect, useState, type ReactNode } from "react";
import type { SocketContextType } from "../types";
import type { Socket } from "socket.io-client";
import { useAuth } from "../hooks";
import { connect } from "../socket";

interface IProps {
  children: ReactNode;
}

export const SocketContext = createContext<SocketContextType | null>(null);

const SocketProvider: React.FC<IProps> = ({ children }: IProps) => {
  const { getToken } = useAuth();
  const [socket, setSocket] = useState<Socket>();

  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    getToken().then((t) => {
      if (t && !connecting) {
        try {
          setConnecting(true);
          return connect(t, setSocket, setConnecting);
        } catch (e) {
          console.log("Failed to connect to socket: ", e);
        }
      }
    });
  }, []);

  const useListener = (event: string, callback: (data: any) => void) => {
    if (socket) {
      useEffect(() => {
        socket.on(event, callback);
        return () => {
          socket.off(event, callback);
        };
      }, [event, callback]);
    }
  };

  const value: SocketContextType = {
    socket,
    connecting,
    useListener,
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

export default SocketProvider;
