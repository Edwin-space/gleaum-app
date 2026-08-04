import React from 'react';

type BadgeProps = {
  height?: number;
  className?: string;
  href: string;
  target?: string;
  rel?: string;
};

/**
 * Google Play Official Store Badge
 * Adheres to Google Play Brand Guidelines
 */
export function GooglePlayBadgeButton({
  height = 44,
  className,
  href,
  target = '_blank',
  rel = 'noreferrer',
}: BadgeProps) {
  const width = Math.round(height * 3.37);

  return (
    <a
      href={href}
      target={target}
      rel={rel}
      aria-label="GET IT ON Google Play에서 글리움 받기"
      style={{ display: 'inline-block', lineHeight: 0, textDecoration: 'none', transition: 'transform 0.18s ease, opacity 0.18s ease' }}
      className={className}
    >
      <svg
        width={width}
        height={height}
        viewBox="0 0 135 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ borderRadius: '6px', display: 'block' }}
      >
        <rect width="135" height="40" rx="6" fill="#000000" stroke="#3A3B3E" strokeWidth="0.8" />
        {/* Google Play Official Tri-color Logo */}
        <g transform="translate(10, 8)">
          <path d="M1.2 0.8C0.8 1.2 0.5 1.9 0.5 2.7V21.3C0.5 22.1 0.8 22.8 1.2 23.2L1.3 23.3L13.1 11.5L1.3 0.7L1.2 0.8Z" fill="#00E676"/>
          <path d="M17.0 15.4L13.1 11.5L1.2 23.3C1.6 23.7 2.3 23.9 3.0 23.5L17.0 15.4Z" fill="#FF3D00"/>
          <path d="M17.0 8.6L3.0 0.5C2.3 0.1 1.6 0.3 1.2 0.7L13.1 12.5L17.0 8.6Z" fill="#FFD600"/>
          <path d="M17.0 8.6L13.1 12.5L17.0 15.4L20.8 13.2C21.9 12.5 21.9 11.4 20.8 10.8L17.0 8.6Z" fill="#40C4FF"/>
        </g>
        {/* Official "GET IT ON Google Play" text */}
        <text x="42" y="14" fill="#FFFFFF" fontSize="7.5" fontWeight="500" fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" letterSpacing="0.4">GET IT ON</text>
        <text x="42" y="27.5" fill="#FFFFFF" fontSize="13" fontWeight="600" fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" letterSpacing="0.1">Google Play</text>
      </svg>
    </a>
  );
}

/**
 * Apple App Store Official Store Badge
 * Adheres to Apple Identity Guidelines
 */
export function AppStoreBadgeButton({
  height = 44,
  className,
  href,
  target = '_blank',
  rel = 'noreferrer',
}: BadgeProps) {
  const width = Math.round(height * 3.0);

  return (
    <a
      href={href}
      target={target}
      rel={rel}
      aria-label="Download on the App Store에서 글리움 받기"
      style={{ display: 'inline-block', lineHeight: 0, textDecoration: 'none', transition: 'transform 0.18s ease, opacity 0.18s ease' }}
      className={className}
    >
      <svg
        width={width}
        height={height}
        viewBox="0 0 120 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ borderRadius: '6px', display: 'block' }}
      >
        <rect width="120" height="40" rx="6" fill="#000000" stroke="#3A3B3E" strokeWidth="0.8" />
        {/* Apple Official Vector Logo */}
        <g transform="translate(10, 8)">
          <path d="M15.2 13.4C15.2 10.6 17.5 9.2 17.6 9.1C16.3 7.2 14.3 6.9 13.6 6.8C11.9 6.6 10.2 7.8 9.3 7.8C8.4 7.8 7.0 6.8 5.6 6.8C3.8 6.8 2.1 7.9 1.2 9.5C-0.7 12.8 0.7 17.6 2.5 20.2C3.4 21.5 4.4 22.9 5.8 22.8C7.2 22.7 7.7 21.9 9.3 21.9C10.9 21.9 11.4 22.8 12.8 22.8C14.3 22.8 15.2 21.5 16.1 20.2C17.1 18.7 17.5 17.3 17.6 17.2C17.5 17.1 15.2 16.2 15.2 13.4Z" fill="#FFFFFF"/>
          <path d="M11.9 4.6C12.7 3.6 13.2 2.2 13.0 0.8C11.8 0.8 10.3 1.6 9.5 2.5C8.8 3.3 8.2 4.7 8.4 6.1C9.8 6.2 11.2 5.4 11.9 4.6Z" fill="#FFFFFF"/>
        </g>
        {/* Official "Download on the App Store" text */}
        <text x="36" y="14" fill="#FFFFFF" fontSize="7" fontWeight="400" fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" letterSpacing="0.2">Download on the</text>
        <text x="36" y="27.5" fill="#FFFFFF" fontSize="12.5" fontWeight="600" fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" letterSpacing="0.1">App Store</text>
      </svg>
    </a>
  );
}
