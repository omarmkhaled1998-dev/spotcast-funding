export function SpotCastLogo({
  size = 40,
  variant = "color",
}: {
  size?: number;
  variant?: "color" | "white" | "dark";
}) {
  const cx = 50;
  const cy = 50;

  function arcPath(r: number, centerAngleDeg: number, halfSpanDeg: number) {
    const s = ((centerAngleDeg - halfSpanDeg) * Math.PI) / 180;
    const e = ((centerAngleDeg + halfSpanDeg) * Math.PI) / 180;
    const x1 = (cx + r * Math.cos(s)).toFixed(2);
    const y1 = (cy + r * Math.sin(s)).toFixed(2);
    const x2 = (cx + r * Math.cos(e)).toFixed(2);
    const y2 = (cy + r * Math.sin(e)).toFixed(2);
    return `M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`;
  }

  const pink = variant === "white" ? "#ffffff" : "#dd7c99";
  const gray = variant === "white" ? "rgba(255,255,255,0.65)" : "#839ba3";

  const pinkAngles = [0, 60, 120, 180, 240, 300];
  const grayAngles = [30, 90, 150, 210, 270, 330];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="SpotCast logo"
    >
      {grayAngles.map((a, i) => (
        <path
          key={`g${i}`}
          d={arcPath(22, a, 20)}
          stroke={gray}
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
        />
      ))}
      {pinkAngles.map((a, i) => (
        <path
          key={`p${i}`}
          d={arcPath(34, a, 24)}
          stroke={pink}
          strokeWidth="11"
          fill="none"
          strokeLinecap="round"
        />
      ))}
    </svg>
  );
}
