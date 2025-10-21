import React, { useEffect, useState } from "react";
import "./styles/Popup.css";
import Layout from "./Layout";
import { useAuth } from "../hooks";
import LoadingSpinner from "./Home/LoadingSpinner";
import Home from "./Home/Home";

const Popup: React.FC = () => {
  const { isAuthenticated, isLoading, checkAuth, login, error } = useAuth();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    console.log(error);
  }, [error]);

  const LoginComponent = (
    <div className="unsupported-platform">
      <h2>Please log in</h2>
      <p>For security reasons, the debunc needs you to be logged in to your Google account. </p>
      <button onClick={() => login()}>Log in</button>
    </div>
  );

  return <Layout>{isLoading ? <LoadingSpinner /> : isAuthenticated ? <Home /> : LoginComponent}</Layout>;
};

export default Popup;
