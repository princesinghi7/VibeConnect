interface AvatarProps {
  src: string;
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
  return (
    <span
      style={{
        position: 'relative',
        display: 'inline-flex',
        width: size,
        height: size,
        flexShrink: 0,
      }}
    >
      <img
        src={src}
        alt={name}
        width={size}
        height={size}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          objectFit: 'cover',
          background: 'var(--surface)',
          border: ring ? '2px solid var(--bg)' : '1px solid var(--border)',
          boxShadow: ring ? '0 0 0 2px var(--accent)' : 'none',
          display: 'block',
        }}
      />
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
          }}
        />
      )}
    </span>
  );
}
