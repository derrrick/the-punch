import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'The Punch — A curated directory of independent type foundries';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#171717',
          padding: '80px',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
          }}
        >
          <h1
            style={{
              fontSize: '80px',
              fontWeight: 500,
              color: '#EDEDED',
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
              marginBottom: '24px',
            }}
          >
            The Punch
          </h1>
          <p
            style={{
              fontSize: '36px',
              fontWeight: 400,
              color: '#EDEDED',
              opacity: 0.6,
              lineHeight: 1.4,
              maxWidth: '800px',
            }}
          >
            A curated directory of independent type foundries
          </p>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
