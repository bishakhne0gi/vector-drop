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
        background: "#0a0a0a",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* VectorDrop logo paths from vectordrop-logo.svg */}
      <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
        <path
          d="M6 9.32256L8.08064 8.13363L10.1613 9.32256L10.018 21.5092L12.1924 22.6517L16.4032 20.3202V17.8433L18.5829 16.5553L18.3848 2.08986L20.5645 1L22.8433 2.08986V16.7534L20.7131 17.8433V20.3202L18.5829 21.4811V23.788L12.2419 27.5529L9.96313 26.1784L7.98156 24.9832L6 23.788V9.32256Z"
          fill="white"
        />
      </svg>
    </div>,
    { ...size }
  );
}
