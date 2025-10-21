import { createContext, useEffect, useState, type ReactNode } from "react";
import type { AuthContextType, UserInfo } from "../types";

interface IProps {
  children: ReactNode;
}

export const AuthContext = createContext<AuthContextType | null>(null);

const AuthProvider: React.FC<IProps> = ({ children }: IProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>();

  const checkAuth = async (): Promise<boolean> => {
    setIsLoading(true);
    setError(undefined);

    if (!chrome?.identity) {
      setError("Chrome identity API not available");
      setIsLoading(false);
      return false;
    }

    return new Promise((resolve) => {
      chrome.identity.getAuthToken({ interactive: false }, (token: chrome.identity.GetAuthTokenResult) => {
        if (chrome.runtime.lastError || !token) {
          setIsAuthenticated(false);
          setIsLoading(false);
          setError(chrome.runtime.lastError?.message || "Failed to fetch token");
          resolve(false);
          return;
        }

        setIsAuthenticated(true);
        setError(undefined);
        setIsLoading(false);
        resolve(true);
      });
    });
  };

  const login = async (): Promise<boolean> => {
    setIsLoading(true);
    setError(undefined);

    if (!chrome?.identity) {
      setError("Chrome identity API not available");
      setIsLoading(false);
      return false;
    }

    return new Promise((resolve) => {
      chrome.identity.getAuthToken({ interactive: true }, (token: chrome.identity.GetAuthTokenResult) => {
        if (chrome.runtime.lastError) {
          setError(chrome.runtime.lastError.message || "Authentication failed");
          setIsAuthenticated(false);
          setIsLoading(false);
          resolve(false);
          return;
        }

        if (!token) {
          setError("No token received");
          setIsAuthenticated(false);
          setIsLoading(false);
          resolve(false);
          return;
        }

        setIsAuthenticated(true);
        setIsLoading(false);
        resolve(true);
      });
    });
  };

  const logout = async (): Promise<boolean> => {
    return new Promise((resolve) => {
      chrome.identity.clearAllCachedAuthTokens(() => {
        setIsAuthenticated(false);
        resolve(true);
      });
    });
  };

  const getToken = async (): Promise<string | undefined> => {
    return new Promise((resolve, reject) => {
      chrome.identity.getAuthToken({ interactive: false }, (token: chrome.identity.GetAuthTokenResult) => {
        if (chrome.runtime.lastError || !token) {
          reject(new Error("No token available"));
          return;
        }
        resolve(token as string);
      });
    });
  };

  // const getToken = async (): Promise<string | undefined> => {
  //   return new Promise((resolve, reject) => {
  //     if (!chrome?.identity) {
  //       reject(new Error("Chrome identity API not available"));
  //       return;
  //     }

  //     var manifest = chrome.runtime.getManifest();

  //     if (manifest.oauth2 && manifest.oauth2.scopes) {
  //       var clientId = encodeURIComponent(manifest.oauth2.client_id);
  //       var scopes = encodeURIComponent(manifest.oauth2.scopes.join(" "));
  //       var redirectUri = chrome.identity.getRedirectURL();

  //       var url = "https://accounts.google.com/o/oauth2/auth" + "?client_id=" + clientId + "&response_type=id_token" + "&access_type=offline" + "&redirect_uri=" + redirectUri + "&scope=" + scopes;
  //       console.log(redirectUri);

  //       chrome.identity.launchWebAuthFlow({ url: url, interactive: false }, (redirectResponse) => {
  //         if (chrome.runtime.lastError || !redirectResponse) {
  //           reject(new Error(chrome.runtime.lastError?.message || "No response from auth flow"));
  //           return;
  //         }

  //         const fragment = redirectResponse.split("#")[1];
  //         if (!fragment) {
  //           reject(new Error("No token fragment in response"));
  //           return;
  //         }

  //         const params = new URLSearchParams(fragment);
  //         const idToken = params.get("id_token");

  //         if (!idToken) {
  //           reject(new Error("No ID token found"));
  //           return;
  //         }

  //         resolve(idToken);
  //       });
  //     }
  //   });
  // };

  const getEmail = async (): Promise<string> => {
    return new Promise((resolve, reject) => {
      chrome.identity.getProfileUserInfo({}, (info: chrome.identity.ProfileUserInfo) => {
        if (chrome.runtime.lastError || !info) {
          reject(new Error("No info available"));
          return;
        }
        resolve(info.email);
      });
    });
  };

  // const withAuthToken = (interactive: boolean, callback?: (token: string) => void) => {
  //   setStatus("loading");
  //   setError(undefined);

  //   chrome.identity.getAuthToken({ interactive }, (t) => {
  //     if (chrome.runtime.lastError) {
  //       setStatus("error");
  //       setError(chrome.runtime.lastError.message || "Failed to get authentication token");
  //       return;
  //     }

  //     if (!t) {
  //       setStatus("error");
  //       setError("No token received. User may not be logged into Chrome.");
  //       return;
  //     }

  //     setStatus("success");

  //     if (callback && t.token) callback(t.token);
  //   });
  // };

  // const handleRetry = () => {
  //   withAuthToken(true);
  // };

  useEffect(() => {
    checkAuth();
  }, []);

  const value: AuthContextType = {
    isAuthenticated,
    isLoading,
    error,
    getToken,
    login,
    logout,
    checkAuth,
    getEmail,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
