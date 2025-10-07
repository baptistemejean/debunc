import React from "react";
import type { Post } from "../types";

interface PostPreviewProps {
  post: Post;
  includeAttachments: boolean;
  setIncludeAttachments: React.Dispatch<React.SetStateAction<boolean>>;
  hasAttachments: boolean;
}

const PostPreview: React.FC<PostPreviewProps> = ({ post, includeAttachments, setIncludeAttachments, hasAttachments }) => (
  <>
    <span className="post-preview-label">Post preview</span>
    <div className="post-preview-container">
      <div className="tweet-name-handle">
        <span className="tweet-name">{post.name}</span>
        <span className="tweet-handle">{post.handle}</span>
      </div>
      <div className="tweet-text">{post.text}</div>

      {includeAttachments && (
        <div className="tweet-images-container">
          {/* Filter out duplicate thumbnails */}
          {post.images.map((img) => !post.videos.find((v) => v.thumbnail === img) && <img className="tweet-image" key={img} src={img} />)}
          {post.videos.map((v) => (
            <div className="tweet-video" key={v.thumbnail}>
              <div className="play-icon-container">
                <img className="play-icon" src="play.svg" />
              </div>
              <img className="tweet-video-thumbnail" src={v.thumbnail} />
            </div>
          ))}
        </div>
      )}
    </div>

    {/* Attachment toggle */}
    <div className="include-attachments-container">
      <label
        className="include-attachments-label"
        style={{
          color: hasAttachments ? "inherit" : "gray",
          cursor: hasAttachments ? "pointer" : "default",
        }}
        htmlFor="includeAttachments"
      >
        Include attachments
      </label>
      <input id="includeAttachments" type="checkbox" disabled={!hasAttachments} checked={includeAttachments} onChange={() => setIncludeAttachments(!includeAttachments)} />
    </div>
  </>
);

export default PostPreview;
