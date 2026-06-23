import Image from "next/image";

export function InjazLogo({ size = 48 }: { size?: number }) {
  return (
    <Image
      src="/injaz-lebanon.png"
      alt="INJAZ Lebanon"
      width={size}
      height={size}
      style={{ objectFit: "contain" }}
    />
  );
}
