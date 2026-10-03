import Image from 'next/image';

export default function Thumb({ src, size = 64 }: { src?: string; size?: number }) {
  return (
    <div className="thumb" style={{ width: size, height: size }}>
      {src ? <Image src={src} alt="" width={size} height={size} unoptimized loading="lazy" decoding="async" /> : <span aria-hidden="true">📦</span>}
    </div>
  );
}