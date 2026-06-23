export function InjazLogo({ size = 48 }: { size?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/injaz-lebanon.png"
      alt="INJAZ Lebanon"
      width={size}
      height={size}
      style={{ objectFit: "contain", display: "block" }}
    />
  );
}
