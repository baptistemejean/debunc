import React from "react";
import MarkdownRenderer from "./MarkdownRenderer";
import type { Claim } from "../../types";

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
      <div className="claim-container" key={claim.label}>
        {claim.label && <div className="claim">{claim.label}</div>}
        {claim.score && <div className="tweet-handle">{scoreLabels[claim.score - 1]}</div>}
        {claim.summary && (
          <div className="tweet-text">
            <MarkdownRenderer input={claim.summary} />
          </div>
        )}
      </div>
    ))}
  </div>
);

export default ClaimList;
