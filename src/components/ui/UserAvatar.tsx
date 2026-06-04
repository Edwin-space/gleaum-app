import type { CSSProperties } from 'react';

type UserAvatarProps = {
  avatar?: string | null;
  name?: string | null;
  size?: number;
  radius?: number;
  fontSize?: number;
  style?: CSSProperties;
};

function isImageAvatar(value?: string | null): value is string {
  return !!value && (/^https?:\/\//.test(value) || value.startsWith('data:') || value.startsWith('blob:'));
}

export function UserAvatar({ avatar, name, size = 52, radius = 18, fontSize = 26, style }: UserAvatarProps) {
  const baseStyle: CSSProperties = {
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: `${radius}px`,
    background: 'var(--theme-surface-muted)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: `${fontSize}px`,
    flexShrink: 0,
    overflow: 'hidden',
    lineHeight: 1,
    ...style,
  };

  if (isImageAvatar(avatar)) {
    return (
      <div style={baseStyle}>
        <img
          src={avatar}
          alt={name ?? '사용자'}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  return <div style={baseStyle}>{avatar || '👤'}</div>;
}
