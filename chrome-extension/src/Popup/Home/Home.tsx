import React, { useEffect, useState } from "react";
import "./../styles/Popup.css";

import LoadingSpinner from "./LoadingSpinner";
import ClaimList from "./ClaimList";
import PostPreview from "./PostPreview";
import UnsupportedNotice from "./UnsupportedNotice";
import type { Claim, Post } from "../../types";
import { useSocket } from "../../hooks";
import NotConnected from "./NotConnected";

const Home: React.FC = () => {
  const [post, setPost] = useState<Post>();
  const [isUnsupportedPlatform, setIsUnsupportedPlatform] = useState(false);
  const [isTweetNotFound, setIsTweetNotFound] = useState(false);
  const [includeAttachments, setIncludeAttachments] = useState(true);
  const [isRequestLoading, setIsRequestLoading] = useState(false);
  const [claims, setClaims] = useState<Claim[]>();
  const [ispostLoading, setIspostLoading] = useState(true);

  const { socket, connecting, useListener } = useSocket();

  const handleClientMessages = () => {
    const port: chrome.runtime.Port = chrome.runtime.connect({ name: "popup" });
    port.postMessage("ON_POPUP_OPEN");
    setIspostLoading(true);

    port.onMessage.addListener((msg) => {
      setIspostLoading(false);
      switch (msg) {
        case "CONTENT_PORT_CLOSED":
          setIsUnsupportedPlatform(true);
          setIsTweetNotFound(false);
          setPost(undefined);
          break;
        case "NO_TWEET_FOUND":
          setIsUnsupportedPlatform(false);
          setIsTweetNotFound(true);
          setPost(undefined);
          break;
        default:
          setIsUnsupportedPlatform(false);
          setIsTweetNotFound(false);
          setPost(msg);
          break;
      }
    });
  };

  // Initialize message listener to get post data from content script
  useEffect(() => {
    handleClientMessages();
  }, []);

  // Handle API request
  const onGenerate = async () => {
    if (!post || !socket) return;
    setIsRequestLoading(true);

    var data = post;

    if (!includeAttachments) {
      data.images = [];
      data.videos = [];
    }

    try {
      socket.emit("generate", data);
    } catch (error) {
      console.error("Error fetching data from the server:", error);
    }
  };

  useListener("label_delta", (data) => {
    setIsRequestLoading(false);
    setClaims((prevClaims) => {
      if (prevClaims && prevClaims.length > 0) {
        return prevClaims.map((v) => (v.id == data.id ? { ...v, label: v.label + data.token } : v));
      } else {
        return [{ label: data.token, id: data.id }];
      }
    });
  });

  useListener("label_new", (data) => {
    setClaims((prevClaims) => {
      if (prevClaims && prevClaims.length > 0) {
        return [...prevClaims, { label: "", id: data.id }];
      } else {
        return [{ label: "", id: data.id }];
      }
    });
  });

  useListener("summary_delta", (data) => {
    setClaims((prevClaims) => {
      if (prevClaims && prevClaims.length > 0) {
        return prevClaims.map((v) => (v.id == data.id ? { ...v, summary: (v.summary || "") + data.token } : v));
      }
    });
  });

  const hasAttachments = post && (post.images.length > 0 || post.videos.length > 0);

  return !connecting ? (
    socket ? (
      <>
        {ispostLoading || isRequestLoading ? (
          <LoadingSpinner />
        ) : claims ? (
          <ClaimList claims={claims} />
        ) : post ? (
          <>
            <PostPreview post={post} includeAttachments={includeAttachments} setIncludeAttachments={setIncludeAttachments} hasAttachments={!!hasAttachments} />
            <button onClick={onGenerate}>Generate</button>
          </>
        ) : (
          (isUnsupportedPlatform || isTweetNotFound) && <UnsupportedNotice type={isUnsupportedPlatform ? "unsupported" : "notfound"} />
        )}
      </>
    ) : (
      <NotConnected />
    )
  ) : (
    <LoadingSpinner />
  );
};

export default Home;
