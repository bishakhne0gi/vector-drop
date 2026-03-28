import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: 32,
        height: 32,
        borderRadius: 7,
        background: "#0d9488",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg
        width="22"
        height="22"
        viewBox="4 6 20 16"
        fill="none"
      >
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
