import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: 180,
        height: 180,
        borderRadius: 40,
        background: "#0d9488",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg width="120" height="120" viewBox="4 6 20 16" fill="none">
        <path
          d="M6 20 C6 20 10 7 14 14 C18 21 22 8 22 8"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="6" cy="20" r="1.5" fill="white" />
        <circle cx="14" cy="14" r="1.5" fill="white" />
        <circle cx="22" cy="8" r="1.5" fill="white" />
      </svg>
    </div>,
    { ...size }
  );
}
