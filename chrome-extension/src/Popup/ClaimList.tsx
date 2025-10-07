import React from "react";
import MarkdownRenderer from "./MarkdownRenderer";
import type { Claim } from "../types";

const scoreLabels = [
  "Solid Fax 📠 (the claim checks out)",
  "Missing Pieces 🧩 (partly true, but lacking context)",
  "Stretched Truth 🪢 (exaggerated or cherry-picked)",
  "Twisted Story 🔀 (seriously misleading)",
  "Made-Up Myth 🐉 (completely fake and harmful)",
];

interface ClaimListProps {
  claims: Claim[];
}

const ClaimList: React.FC<ClaimListProps> = ({ claims }) => (
  <div className="claims-container">
    {claims.map((claim) => (
      <div className="claim-container" key={claim.claim}>
        <div className="claim">{claim.claim}</div>
        <div className="tweet-handle">{scoreLabels[claim.fakeness_score - 1]}</div>
        <div className="tweet-text">
          <MarkdownRenderer input={claim.summary} />
        </div>
      </div>
    ))}
  </div>
);

export default ClaimList;
