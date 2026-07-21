export default function Crest({ src, alt = '', size = 28, className = '' }) {
  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={`crest ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className={`crest crest-empty ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    />
  );
}
