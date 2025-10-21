import { io, Socket } from "socket.io-client";
import config from "../config";
import type React from "react";
import type { Dispatch, SetStateAction } from "react";

export const connect = (token: string, setSocket: Dispatch<SetStateAction<Socket | undefined>>, setConnecting: Dispatch<SetStateAction<boolean>>) => {
  const url = `http://${config.host}:${config.port}`;

  const socket = io(url, {
    autoConnect: false,
    transports: ["websocket"],
    withCredentials: false,
    auth: {
      token,
    },
  });

  socket.connect();

  const interval = setInterval(() => {
    console.log();
    setConnecting(false);
    setSocket(undefined);
    clearInterval(interval);
  }, 20000);

  socket.on("accepted", () => {
    setConnecting(false);
    clearInterval(interval);
  });

  setSocket(socket);

  return () => clearInterval(interval);
};

export const send = (socket: Socket, data: Object) => {
  socket.send("json", data);
};
