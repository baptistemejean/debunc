import React, { type JSX } from "react";

// Converts Markdown-style links [text](url) into clickable elements
const MarkdownRenderer: React.FC<{ input: string }> = ({ input }) => {
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

  return <>{parts}</>;
};

export default MarkdownRenderer;
