export default function Thumb({ src, size = 64 }: { src?: string; size?: number }) {
  return (
    <div className="thumb" style={{ width: size, height: size }}>
      {src ? <img src={src} alt="" /> : <span aria-hidden="true">📦</span>}
    </div>
  );
}