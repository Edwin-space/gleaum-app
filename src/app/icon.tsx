import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const dynamic = 'force-static';
export const size = { width: 512, height: 512 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #2EE895 0%, #0084CC 100%)',
          borderRadius: '128px', // rounded-[128px]
        }}
      >
        <div
          style={{
            width: '240px',
            height: '240px',
            background: 'white',
            transform: 'rotate(45deg)',
            borderRadius: '40px',
          }}
        />
      </div>
    ),
    { ...size }
  );
}
