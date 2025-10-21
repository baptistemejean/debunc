import React from "react";

interface UnsupportedNoticeProps {
  type: "unsupported" | "notfound";
}

const UnsupportedNotice: React.FC<UnsupportedNoticeProps> = ({ type }) => (
  <div className="unsupported-platform">
    {type === "unsupported" ? (
      <>
        <h2>Unsupported Platform</h2>
        <p>
          Sorry! This fact-checking extension currently only supports <strong>X</strong>.
        </p>
        <a href="https://x.com" target="_blank" rel="noopener noreferrer">
          Visit X
        </a>
      </>
    ) : (
      <>
        <h2>No Post Found</h2>
        <p>
          No valid post was found. Try <strong>clicking</strong> on a post to open it.
        </p>
      </>
    )}
  </div>
);

export default UnsupportedNotice;
