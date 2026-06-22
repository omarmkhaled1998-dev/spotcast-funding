export function InjazLogo({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-label="INJAZ Lebanon logo">
      {/* Upper-right large triangle */}
      <polygon points="55,8 92,8 92,45" fill="#1B7F8E" />
      {/* Upper-right small triangle (dark) */}
      <polygon points="55,8 92,45 55,45" fill="#0D5F6C" />
      {/* Lower-left large triangle */}
      <polygon points="8,55 45,55 8,92" fill="#1B7F8E" />
      {/* Lower-left small triangle (dark) */}
      <polygon points="45,55 45,92 8,92" fill="#0D5F6C" />
      {/* Center-right small triangle */}
      <polygon points="55,48 70,48 55,63" fill="#1B7F8E" />
      {/* Center-bottom small triangle */}
      <polygon points="48,55 48,70 63,55" fill="#0D5F6C" />
    </svg>
  );
}
