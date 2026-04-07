/**
 * LegoStud — reusable mini LEGO 1×1 brick with a raised circular stud.
 *
 * Usage:  <LegoStud color="#f97316" />          ← default 18px
 *         <LegoStud color="#22d3ee" size={14} /> ← custom size
 */
export function LegoStud({ color, size = 18 }: { color: string; size?: number }) {
  const cx = size / 2;
  const cy = size / 2;
  const r  = size * 0.30;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="flex-shrink-0"
      style={{ display: "block" }}
    >
      {/* ── Base brick plate ── */}
      <rect width={size} height={size} fill={color} />
      {/* Right-edge shadow */}
      <rect x={size - size * 0.09} y={0} width={size * 0.09} height={size} fill="rgba(0,0,0,0.38)" />
      {/* Bottom-edge shadow */}
      <rect x={0} y={size - size * 0.09} width={size} height={size * 0.09} fill="rgba(0,0,0,0.32)" />
      {/* Top-edge highlight */}
      <rect x={0} y={0} width={size} height={size * 0.07} fill="rgba(255,255,255,0.14)" />
      {/* Left-edge highlight */}
      <rect x={0} y={0} width={size * 0.07} height={size} fill="rgba(255,255,255,0.10)" />

      {/* ── Stud raised cylinder ── */}
      {/* Drop shadow behind stud */}
      <circle cx={cx} cy={cy + r * 0.38} r={r + size * 0.06} fill="rgba(0,0,0,0.45)" />
      {/* Outer rim */}
      <circle cx={cx} cy={cy} r={r + size * 0.04} fill="rgba(0,0,0,0.30)" />
      {/* Main stud surface */}
      <circle cx={cx} cy={cy} r={r} fill={color} />
      {/* Upper highlight */}
      <circle cx={cx} cy={cy - r * 0.08} r={r * 0.82} fill="rgba(255,255,255,0.18)" />
      {/* Mid recession */}
      <circle cx={cx} cy={cy} r={r * 0.60} fill="rgba(0,0,0,0.18)" />
      {/* Inner dark ring */}
      <circle cx={cx} cy={cy} r={r * 0.44} fill="rgba(0,0,0,0.26)" />
      {/* Center filled */}
      <circle cx={cx} cy={cy} r={r * 0.30} fill="rgba(255,255,255,0.06)" />
      {/* Arc inset highlight */}
      <path
        d={`M ${cx - r * 0.42} ${cy - r * 0.52} A ${r * 0.58} ${r * 0.58} 0 0 1 ${cx + r * 0.42} ${cy - r * 0.52}`}
        stroke="rgba(255,255,255,0.28)"
        strokeWidth={size * 0.045}
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}
