// Path: apps/web/src/components/ui/Avatar.tsx
// NOTE: New file. Avatar with image fallback block; used in nav/profile/list cards.
import Image from "next/image";

export function Avatar({
  src,
  alt,
  size = 32,
}: {
  src?: string | null;
  alt: string;
  size?: number;
}) {
  const radius = "rounded-full";
  const style = { width: size, height: size };
  return src ? (
    <Image
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={radius}
      style={style}
    />
  ) : (
    <div
      className={`bg-[rgb(var(--color-accent))] ${radius} flex items-center justify-center`}
      style={style}
      aria-hidden
    />
  );
}
