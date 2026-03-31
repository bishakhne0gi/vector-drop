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
        {/* Background grid */}
        <div
          style={{
            display: "flex",
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(13,148,136,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(13,148,136,0.08) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        {/* Glow */}
        <div
          style={{
            display: "flex",
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 600,
            height: 600,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(13,148,136,0.18) 0%, transparent 70%)",
          }}
        />

        {/* Logo mark */}
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: 16,
            background: "#0d9488",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 28,
          }}
        >
          <svg width="48" height="48" viewBox="4 6 20 16" fill="none">
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
        </div>

        {/* Title */}
        <div
          style={{
            display: "flex",
            fontSize: 64,
            fontWeight: 700,
            color: "#ffffff",
            letterSpacing: "-2px",
            lineHeight: 1,
            marginBottom: 16,
          }}
        >
          Vector
          <span style={{ color: "#0d9488" }}>Drop</span>
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 26,
            color: "#a1a1aa",
            fontWeight: 400,
            letterSpacing: "-0.5px",
            textAlign: "center",
            maxWidth: 700,
          }}
        >
          Free Image to SVG Converter Online
        </div>

        {/* Pills */}
        <div
          style={{
            display: "flex",
            gap: 12,
            marginTop: 36,
          }}
        >
          {["PNG → SVG", "JPG → SVG", "Free & Fast"].map((label) => (
            <div
              key={label}
              style={{
                padding: "8px 20px",
                borderRadius: 999,
                border: "1px solid rgba(13,148,136,0.4)",
                background: "rgba(13,148,136,0.1)",
                color: "#5eead4",
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
            color: "#52525b",
            fontSize: 18,
          }}
        >
          vectordrop.co.in
        </div>
      </div>
    ),
    { ...size }
  );
}
