import { useEffect, useState } from 'react';

interface AvatarProps {
  src?: string;
  name: string;
  size?: number;
  status?: 'online' | 'building' | 'offline';
  ring?: boolean;
}

const statusColor: Record<string, string> = {
  online: '#6ee7d8',
  building: '#fbbf78',
  offline: '#5e6478',
};

export default function Avatar({ src, name, size = 40, status, ring = false }: AvatarProps) {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [src]);

  const initials = name
    ? name
        .split(' ')
        .filter(Boolean)
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'U';

  const showFallback = !src || imgError;

  return (
    <span
      style={{
        position: 'relative',
        display: 'inline-flex',
        width: size,
        height: size,
        flexShrink: 0,
        borderRadius: '50%',
        boxShadow: ring ? '0 0 0 2px var(--bg), 0 0 0 4px var(--accent)' : 'none',
      }}
    >
      {showFallback ? (
        <span
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--accent-2) 0%, var(--accent) 100%)',
            color: '#07080c',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: Math.max(11, size * 0.36),
            fontFamily: 'var(--display)',
            border: '1px solid var(--border)',
            userSelect: 'none',
          }}
        >
          {initials}
        </span>
      ) : (
        <img
          src={src}
          alt={name}
          onError={() => setImgError(true)}
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            objectFit: 'cover',
            objectPosition: 'center',
            background: 'linear-gradient(135deg, var(--accent), var(--surface))',
            border: '1px solid var(--border)',
            display: 'block',
          }}
        />
      )}
      {status && (
        <span
          title={status}
          style={{
            position: 'absolute',
            bottom: -1,
            right: -1,
            width: Math.max(9, size * 0.26),
            height: Math.max(9, size * 0.26),
            borderRadius: '50%',
            background: statusColor[status],
            border: '2px solid var(--bg)',
            zIndex: 2,
          }}
        />
      )}
    </span>
  );
}
