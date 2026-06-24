import React from "react";

export default function LogoFavicon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="select-none"
    >
      {/* Obsidian square canvas backdrop */}
      <rect width="100" height="100" rx="10" fill="#000000" />
      
      {/* Two parallel vertical lines in Bone-White */}
      <rect x="35" y="15" width="3" height="70" fill="#e2e3e9" rx="1" />
      <rect x="47" y="15" width="3" height="70" fill="#e2e3e9" rx="1" />
      
      {/* The razor-sharp diagonal Golden Slash */}
      <line
        x1="20"
        y1="72"
        x2="80"
        y2="28"
        stroke="#cc9166"
        strokeWidth="8"
        strokeLinecap="square"
      />
    </svg>
  );
}