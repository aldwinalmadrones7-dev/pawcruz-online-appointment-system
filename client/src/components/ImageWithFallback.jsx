/**
 * ImageWithFallback — An <img> that swaps to a light-blue gradient with a centered
 * icon when the file is missing or fails to load, so the UI never looks broken.
 */
import { useState } from 'react';
import { FaPaw } from 'react-icons/fa';

export default function ImageWithFallback({ src, alt, icon: Icon = FaPaw, className = '', ratio, loading = 'lazy', ...imgProps }) {
  const [failedSrc, setFailedSrc] = useState(null);
  const failed = !src || failedSrc === src; // resets by itself when `src` changes
  const style = ratio ? { aspectRatio: ratio } : undefined;

  if (failed) {
    return (
      <div className={`img-fallback ${className}`.trim()} style={style} role="img" aria-label={alt}>
        <Icon aria-hidden="true" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={style}
      loading={loading}
      decoding="async"
      onError={() => setFailedSrc(src)}
      {...imgProps}
    />
  );
}
