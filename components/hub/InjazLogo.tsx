export function InjazLogo({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-label="INJAZ Lebanon logo">
      {/* Upper-right block — bright teal outer face */}
      <polygon points="48,8 92,8 92,52" fill="#1A8FA0" />
      {/* Upper-right block — dark teal shadow face */}
      <polygon points="48,8 92,52 48,52" fill="#0A5F6E" />
      {/* Lower-left block — bright teal outer face */}
      <polygon points="8,48 52,48 8,92" fill="#1A8FA0" />
      {/* Lower-left block — dark teal shadow face */}
      <polygon points="52,48 52,92 8,92" fill="#0A5F6E" />
      {/* Thin centre bridge so the two blocks read as one mark */}
      <polygon points="48,48 52,48 52,52 48,52" fill="#147880" />
    </svg>
  );
}
