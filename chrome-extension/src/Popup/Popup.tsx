import React, { useEffect, useState } from "react";
import "./styles/Popup.css";

import LoadingSpinner from "./LoadingSpinner";
import ClaimList from "./ClaimList";
import PostPreview from "./PostPreview";
import UnsupportedNotice from "./UnsupportedNotice";
import type { Claim, Post } from "../types";
import Icon from "../assets/Icon";
import config from "../../config";

// Main popup component for the extension
const Popup: React.FC = () => {
  const [field, setField] = useState<Post>();
  const [isUnsupportedPlatform, setIsUnsupportedPlatform] = useState(false);
  const [isTweetNotFound, setIsTweetNotFound] = useState(false);
  const [includeAttachments, setIncludeAttachments] = useState(true);
  const [isRequestLoading, setIsRequestLoading] = useState(false);
  const [responseData, setResponseData] = useState<Claim[]>();
  const [isFieldLoading, setIsFieldLoading] = useState(true);

  // Initialize message listener to get post data from content script
  useEffect(() => {
    const port: chrome.runtime.Port = chrome.runtime.connect({ name: "popup" });
    port.postMessage("ON_POPUP_OPEN");
    setIsFieldLoading(true);

    port.onMessage.addListener((msg) => {
      setIsFieldLoading(false);
      switch (msg) {
        case "CONTENT_PORT_CLOSED":
          setIsUnsupportedPlatform(true);
          setIsTweetNotFound(false);
          setField(undefined);
          break;
        case "NO_TWEET_FOUND":
          setIsUnsupportedPlatform(false);
          setIsTweetNotFound(true);
          setField(undefined);
          break;
        default:
          setIsUnsupportedPlatform(false);
          setIsTweetNotFound(false);
          setField(msg);
          break;
      }
    });
  }, []);

  // Handle fact-check API request
  const factCheck = async () => {
    if (!field) return;
    setIsRequestLoading(true);

    try {
      const url = new URL(`http://${config.host}:${config.port}`);

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(field),
      });

      const data: Claim[] = await response.json();
      setResponseData(data);
    } catch (error) {
      console.error("Error fetching data from the server:", error);
    } finally {
      setIsRequestLoading(false);
    }
  };

  const hasAttachments = field && (field.images.length > 0 || field.videos.length > 0);

  return (
    <div className="container">
      {/* Header */}
      <div className="header">
        <div className="title-section-start">
          <Icon color="white"></Icon>
          <h1 className="title">debunc</h1>
        </div>
        <div className="title-section-end">
          Supports <img className="x-icon" src="x-icon.svg" alt="X icon" />
        </div>
      </div>

      {/* Loading state */}
      {isFieldLoading || isRequestLoading ? (
        <LoadingSpinner />
      ) : responseData ? (
        <ClaimList claims={responseData} />
      ) : field ? (
        <>
          <PostPreview post={field} includeAttachments={includeAttachments} setIncludeAttachments={setIncludeAttachments} hasAttachments={!!hasAttachments} />
          <button onClick={factCheck}>Generate</button>
        </>
      ) : (
        (isUnsupportedPlatform || isTweetNotFound) && <UnsupportedNotice type={isUnsupportedPlatform ? "unsupported" : "notfound"} />
      )}
    </div>
  );
};

export default Popup;
