import { ImageResponse } from "next/og";

export const alt = "VectorDrop — Free Image to SVG Converter Online";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0a",
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Subtle grid */}
        <div
          style={{
            display: "flex",
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        {/* Orange glow top-left */}
        <div
          style={{
            display: "flex",
            position: "absolute",
            top: -100,
            left: -100,
            width: 500,
            height: 500,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(249,115,22,0.15) 0%, transparent 70%)",
          }}
        />

        {/* Purple glow bottom-right */}
        <div
          style={{
            display: "flex",
            position: "absolute",
            bottom: -100,
            right: -100,
            width: 500,
            height: 500,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(168,85,247,0.15) 0%, transparent 70%)",
          }}
        />

        {/* Logo mark */}
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: 18,
            background: "#161616",
            border: "1px solid rgba(255,255,255,0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 32,
          }}
        >
          <svg width="52" height="52" viewBox="0 0 28 28" fill="none">
            <path
              d="M6 9.32256L8.08064 8.13363L10.1613 9.32256L10.018 21.5092L12.1924 22.6517L16.4032 20.3202V17.8433L18.5829 16.5553L18.3848 2.08986L20.5645 1L22.8433 2.08986V16.7534L20.7131 17.8433V20.3202L18.5829 21.4811V23.788L12.2419 27.5529L9.96313 26.1784L7.98156 24.9832L6 23.788V9.32256Z"
              fill="white"
            />
          </svg>
        </div>

        {/* Title */}
        <div
          style={{
            display: "flex",
            fontSize: 72,
            fontWeight: 700,
            color: "#ffffff",
            letterSpacing: "-3px",
            lineHeight: 1,
            marginBottom: 20,
          }}
        >
          Vector
          <span style={{ color: "#f97316" }}>Drop</span>
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 28,
            color: "#a1a1aa",
            fontWeight: 400,
            letterSpacing: "-0.5px",
            textAlign: "center",
            maxWidth: 700,
            marginBottom: 40,
          }}
        >
          Convert any image to clean, editable SVG — free &amp; instant
        </div>

        {/* Pills */}
        <div style={{ display: "flex", gap: 12 }}>
          {[
            { label: "PNG → SVG", color: "#f97316" },
            { label: "JPG → SVG", color: "#a855f7" },
            { label: "No login needed", color: "#38bdf8" },
            { label: "Free forever", color: "#a3e635" },
          ].map(({ label, color }) => (
            <div
              key={label}
              style={{
                padding: "10px 22px",
                borderRadius: 999,
                border: `1px solid ${color}40`,
                background: `${color}18`,
                color: color,
                fontSize: 18,
                fontWeight: 500,
              }}
            >
              {label}
            </div>
          ))}
        </div>

        {/* Domain */}
        <div
          style={{
            position: "absolute",
            bottom: 36,
            color: "#3f3f46",
            fontSize: 18,
            letterSpacing: "0.5px",
          }}
        >
          vectordrop.co.in
        </div>
      </div>
    ),
    { ...size }
  );
}
