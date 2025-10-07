import React, { useEffect, useState, type JSX } from "react";
import "./Popup.css";
import LoadingSpinner from "./LoadingSpinner";

// import OpenAI from "openai";

// const client = new OpenAI();
// const promptId = "pmpt_68de89ee123c8194ac4d8bd452eafc810e2280cfde2ef08f";
// const version = "5";

const scoreLabels = [
  "Solid Fax 📠 (the claim checks out)",
  "Missing Pieces 🧩 (partly true, but lacking context)",
  "Stretched Truth 🪢 (exaggerated or cherry-picked)",
  "Twisted Story 🔀 (seriously misleading)",
  "Made-Up Myth 🐉 (completely fake and harmful)",
];

interface Video {
  src: string;
  thumbnail: string;
  alt: string;
}

interface Post {
  name: string;
  handle: string;
  text: string;
  images: string[];
  videos: Video[];
  id: string;
}

interface Claim {
  claim: string;
  summary: string;
  fakeness_score: number;
  sources: any[];
}

const Popup: React.FC = () => {
  const [field, setField] = useState<Post>();

  const [isUnsupportedPlatform, setIsUnsupportedPlatform] = useState(false);
  const [isTweetNotFound, setIsTweetNotFound] = useState(false);

  const [includeAttachments, setIncludeAttachments] = useState(true);

  const [isRequestLoading, setIsRequestLoading] = useState(false);
  const [responseData, setResponseData] = useState<Claim[]>();
  const [isFieldLoading, setIsFieldLoading] = useState(true);

  const renderMarkdownLinks: (input: string) => (string | JSX.Element)[] = (input: string) => {
    const regex = /\[([^\]]+)\]\(([^)\s]+)\)/g;
    const parts: (string | JSX.Element)[] = [];
    let lastIndex = 0;

    let match: RegExpExecArray | null;
    while ((match = regex.exec(input)) !== null) {
      const [fullMatch, text, url] = match;
      const before = input.slice(lastIndex, match.index);
      if (before) parts.push(before);

      parts.push(
        <a key={match.index} href={url} target="_blank" rel="noopener noreferrer">
          {text}
        </a>
      );

      lastIndex = match.index + fullMatch.length;
    }

    const remaining = input.slice(lastIndex);
    if (remaining) parts.push(remaining);

    return parts;
  };

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

  const factCheck = async () => {
    setIsRequestLoading(true);

    try {
      const url = new URL("http:///127.0.0.1");
      url.port = "5000";

      // const token = await chrome.identity.getAuthToken();

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Authorization: `Bearer ${token.token}`,
          Accept: "application/json",
        },
        body: JSON.stringify(field),
      });

      const data: Claim[] = await response.json();
      setIsRequestLoading(false);
      setResponseData(data);
      console.log(data);
    } catch (e) {
      console.log("Error fetching data from the server: ", e);
    }
  };

  const hasAttachments = field && (field.images.length > 0 || field.videos.length > 0);

  return (
    <div className="container">
      <div className="header">
        <div className="title-section-start">
          <img className="icon" src="icon.svg"></img>
          <h1 className="title">Debuncle</h1>
        </div>
        <div className="title-section-end">
          Supports <img className="x-icon" src="x-icon.svg"></img>
        </div>
      </div>
      {isFieldLoading || isRequestLoading ? (
        <LoadingSpinner />
      ) : responseData ? (
        <div className="claims-container">
          {responseData.map(
            (v) =>
              v && (
                <div className="claim-container" key={v.claim}>
                  <div className="claim">{v.claim}</div>
                  <div className="tweet-handle">{scoreLabels[v.fakeness_score - 1]}</div>
                  <div className="tweet-text">{renderMarkdownLinks(v.summary)}</div>
                </div>
              )
          )}
        </div>
      ) : field ? (
        <>
          <span className="post-preview-label">Post preview</span>
          <div className="post-preview-container">
            <div className="tweet-name-handle">
              <span className="tweet-name">{field.name}</span>
              <span className="tweet-handle">{field.handle}</span>
            </div>
            <div className="tweet-text">{field.text}</div>
            {includeAttachments && (
              <div className="tweet-images-container">
                {/* avoids the duplication of the thumbnail and "preview" image when the video is charging */}
                {field.images.map((v) => !field.videos.find((e) => e.thumbnail == v) && <img className="tweet-image" key={v} src={v}></img>)}
                {field.videos.map((v) => (
                  <div className="tweet-video" key={v.thumbnail}>
                    <div className="play-icon-container">
                      <img className="play-icon" src="play.svg"></img>
                    </div>
                    <img className="tweet-video-thumbnail" src={v.thumbnail}></img>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button onClick={factCheck}>Generate</button>

          <div className="include-attachments-container">
            <label className="include-attachments-label" style={{ color: hasAttachments ? "inherit" : "gray", cursor: hasAttachments ? "pointer" : "default" }} htmlFor="includeAttachments">
              Include attachments
            </label>
            <input
              className="include-attachments-checkbox"
              id="includeAttachments"
              type="checkbox"
              disabled={!hasAttachments}
              checked={includeAttachments}
              onChange={(_) => setIncludeAttachments(!includeAttachments)}
            ></input>
          </div>
        </>
      ) : isUnsupportedPlatform ? (
        <div className="unsupported-platform">
          <h2 style={{ marginTop: 0 }}>Unsupported Platform</h2>
          <p style={{ lineHeight: 0 }}>
            Sorry! This fact-checking extension currently only supports <strong>X</strong>.
          </p>
          <a href="https://x.com" target="_blank" rel="noopener noreferrer">
            Visit X
          </a>
        </div>
      ) : (
        isTweetNotFound && (
          <div className="unsupported-platform">
            <h2 style={{ marginTop: 0 }}>No Post Found</h2>
            <p style={{ lineHeight: 0 }}>
              No valid post was found on your X page. Try <strong>clicking</strong> on a post to open it.
            </p>
          </div>
        )
      )}
    </div>
  );
};

export default Popup;
