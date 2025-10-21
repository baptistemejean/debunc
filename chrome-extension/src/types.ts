import type { ReactNode } from "react";
import type { Socket } from "socket.io-client";

export interface Video {
  src: string;
  thumbnail: string;
  alt: string;
}

export interface Post {
  name: string;
  handle: string;
  text: string;
  images: string[];
  videos: Video[];
  id: string;
}

export interface Claim {
  label?: string;
  summary?: string;
  score?: number;
  sources?: any[];
  id?: number;
}

export interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  error?: string;
  getToken: () => Promise<string | undefined>;
  checkAuth: () => Promise<boolean>;
  login: () => Promise<boolean>;
  logout: () => Promise<boolean>;
  getEmail: () => Promise<string>;
}

export interface SocketContextType {
  socket?: Socket;
  connecting: boolean;
  useListener: (event: string, callback: (data: any) => void) => void;
}

export interface UserInfo {
  name: string;
  email: string;
  picture?: string;
}
